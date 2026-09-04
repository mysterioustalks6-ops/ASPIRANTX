import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useDroppable,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PersonalSyllabusNode, saveAllPersonalSyllabusNodes } from '../lib/personalSyllabus';
import { SyllabusTimeSummary } from '../lib/unifiedSyllabus';
import {
  GripVertical,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Layers,
  Clock,
  Tag,
  Undo2,
  Sparkles,
  Check,
  FolderOpen
} from 'lucide-react';

interface MySyllabusDndTreeProps {
  rawNodes: PersonalSyllabusNode[];
  selectedExam: string;
  userId?: string;
  completedSubtopicIds: Set<string>;
  timeSummary: SyllabusTimeSummary;
  searchQuery?: string;
  activeStageFilter?: string;
  onToggleSubtopic: (subtopicId: string) => void;
  onToggleTopic: (nodes: PersonalSyllabusNode[], topicTitle: string) => void;
  onOpenAddSubject: () => void;
  onOpenAddTopic: (subjectName: string) => void;
  onOpenAddSubtopic: (subjectName: string, chapterName: string) => void;
  onDeleteSubject: (subjectName: string) => void;
  onDeleteNode: (subjectName: string, nodeId: string) => void;
  onNodesChanged: (nodes: PersonalSyllabusNode[]) => void;
}

function formatStudiedTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  if (seconds < 60) return `${seconds}s studied`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m studied`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours}h ${remMinutes}m studied` : `${hours}h studied`;
}

interface ToastState {
  id: string;
  message: string;
  undoNodes: PersonalSyllabusNode[];
}

// ==========================================
// SUBTOPIC SORTABLE ITEM COMPONENT
// ==========================================
interface SubtopicItemProps {
  node: PersonalSyllabusNode;
  isDone: boolean;
  timeText: string;
  onToggle: (id: string) => void;
  onDelete: (subject: string, id: string) => void;
}

function SubtopicItem({ node, isDone, timeText, onToggle, onDelete }: SubtopicItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `subtopic:${node.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-2.5 group ${
        isDone
          ? 'bg-sky-500/10 border-sky-500/30 text-slate-200 shadow-sm'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 text-slate-500 hover:text-white cursor-grab active:cursor-grabbing shrink-0 touch-none"
          title="Drag to reorder or move to another chapter/subject"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Checkbox */}
        <div
          onClick={() => onToggle(node.id)}
          className="shrink-0 cursor-pointer"
        >
          {isDone ? (
            <div className="w-5 h-5 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-lg border-2 border-slate-600 group-hover:border-sky-500 transition-colors" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
          <span
            onClick={() => onToggle(node.id)}
            className={`text-xs font-semibold cursor-pointer ${
              isDone ? 'line-through text-slate-400' : 'text-slate-100'
            }`}
          >
            {node.subtopic || node.topic || 'Subtopic'}
          </span>

          {node.origin_official_id && (
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-sky-400 border border-slate-700 flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" /> Imported
            </span>
          )}

          {timeText && (
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              {timeText}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onDelete(node.subject, node.id)}
          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          title="Delete subtopic"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// CHAPTER/TOPIC CONTAINER COMPONENT
// ==========================================
interface ChapterGroupProps {
  subjectName: string;
  chapterName: string;
  nodes: PersonalSyllabusNode[];
  completedSubtopicIds: Set<string>;
  timeSummary: SyllabusTimeSummary;
  onToggleSubtopic: (id: string) => void;
  onToggleTopic: (nodes: PersonalSyllabusNode[], topicTitle: string) => void;
  onOpenAddSubtopic: (subjectName: string, chapterName: string) => void;
  onDeleteNode: (subject: string, id: string) => void;
}

function ChapterGroup({
  subjectName,
  chapterName,
  nodes,
  completedSubtopicIds,
  timeSummary,
  onToggleSubtopic,
  onToggleTopic,
  onOpenAddSubtopic,
  onDeleteNode,
}: ChapterGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const topicId = `topic:${subjectName}:::${chapterName}`;
  const {
    attributes: topicAttrs,
    listeners: topicListeners,
    setNodeRef: setTopicNodeRef,
    transform: topicTransform,
    transition: topicTransition,
    isDragging: isTopicDragging
  } = useSortable({ id: topicId });

  const chapterDroppableId = `chapter:${subjectName}:::${chapterName}`;
  const { setNodeRef: setChapterDropRef, isOver: isChapterOver } = useDroppable({
    id: chapterDroppableId,
  });

  const subCount = nodes.length;
  const completedCount = nodes.filter(
    (n) => completedSubtopicIds.has(n.id)
  ).length;
  const topicPercentage = subCount > 0 ? Math.round((completedCount / subCount) * 100) : 0;
  const isFullyCompleted = subCount > 0 && completedCount === subCount;

  const topicStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(topicTransform),
    transition: topicTransition,
    opacity: isTopicDragging ? 0.35 : 1,
  };

  const subtopicIds = useMemo(
    () => nodes.map((n) => `subtopic:${n.id}`),
    [nodes]
  );

  return (
    <div
      ref={(node) => {
        setTopicNodeRef(node);
        setChapterDropRef(node);
      }}
      style={topicStyle}
      className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
        isChapterOver
          ? 'bg-sky-500/10 border-sky-400 ring-2 ring-sky-400/50'
          : isFullyCompleted
          ? 'bg-sky-500/5 border-sky-500/20 shadow-sm'
          : isExpanded
          ? 'bg-slate-900 border-slate-700 shadow-md'
          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Chapter Accordion Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 cursor-pointer flex items-center justify-between gap-3 select-none"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Chapter Drag Handle */}
          <button
            type="button"
            {...topicAttrs}
            {...topicListeners}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 cursor-grab active:cursor-grabbing shrink-0 touch-none"
            title="Drag topic & all its subtopics to another subject"
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Toggle All Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleTopic(nodes, chapterName);
            }}
            className="text-slate-400 hover:text-sky-400 transition-colors shrink-0 cursor-pointer"
            title={isFullyCompleted ? 'Uncheck all subtopics' : 'Check all subtopics'}
          >
            {isFullyCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-sky-400 fill-sky-400/20 shadow-sm" />
            ) : (
              <Circle className="w-5 h-5 text-slate-600 hover:text-sky-400" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`text-sm font-extrabold tracking-tight ${
                  isFullyCompleted ? 'line-through text-slate-400' : 'text-white'
                }`}
              >
                {chapterName}
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-sky-300 border border-slate-800">
                {subCount} subtopic{subCount === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>{subjectName}</span>
              <span>•</span>
              <span className="text-sky-400 font-semibold">
                {completedCount} of {subCount} completed
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-black text-white">{topicPercentage}%</span>
            <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isFullyCompleted ? 'bg-sky-500' : 'bg-sky-600'
                }`}
                style={{ width: `${topicPercentage}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddSubtopic(subjectName, chapterName);
            }}
            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> <span className="hidden sm:inline">Subtopic</span>
          </button>

          <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            {isExpanded ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
          </div>
        </div>
      </div>

      {/* Subtopics List */}
      {isExpanded && (
        <div className="border-t border-white/10 bg-black/60 p-4 sm:p-5 space-y-2">
          <SortableContext items={subtopicIds} strategy={verticalListSortingStrategy}>
            {nodes.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-2 text-center">
                No subtopics yet. Drop a subtopic here or click "+ Subtopic".
              </p>
            ) : (
              nodes.map((node) => {
                const isDone = completedSubtopicIds.has(node.id);
                const key = `${subjectName}|||${chapterName}|||${node.subtopic || node.topic}`;
                const studiedSecs = timeSummary[node.id] || node.time_studied_seconds || timeSummary[key] || 0;
                const timeText = formatStudiedTime(studiedSecs);

                return (
                  <SubtopicItem
                    key={node.id}
                    node={node}
                    isDone={isDone}
                    timeText={timeText}
                    onToggle={onToggleSubtopic}
                    onDelete={onDeleteNode}
                  />
                );
              })
            )}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SUBJECT CONTAINER COMPONENT
// ==========================================
interface SubjectContainerProps {
  subjectName: string;
  chapterMap: Record<string, PersonalSyllabusNode[]>;
  completedSubtopicIds: Set<string>;
  timeSummary: SyllabusTimeSummary;
  onToggleSubtopic: (id: string) => void;
  onToggleTopic: (nodes: PersonalSyllabusNode[], topicTitle: string) => void;
  onOpenAddTopic: (subjectName: string) => void;
  onOpenAddSubtopic: (subjectName: string, chapterName: string) => void;
  onDeleteSubject: (subjectName: string) => void;
  onDeleteNode: (subject: string, id: string) => void;
}

function SubjectContainer({
  subjectName,
  chapterMap,
  completedSubtopicIds,
  timeSummary,
  onToggleSubtopic,
  onToggleTopic,
  onOpenAddTopic,
  onOpenAddSubtopic,
  onDeleteSubject,
  onDeleteNode,
}: SubjectContainerProps) {
  const subjectDroppableId = `subject:${subjectName}`;
  const { setNodeRef, isOver } = useDroppable({
    id: subjectDroppableId,
  });

  const chapters = Object.keys(chapterMap);
  const totalSubtopics = Object.values(chapterMap).reduce((acc, list) => acc + list.length, 0);
  const completedSubtopics = Object.values(chapterMap)
    .flat()
    .filter((n) => completedSubtopicIds.has(n.id)).length;
  const coveragePercent = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;

  const topicIds = useMemo(
    () => chapters.map((chap) => `topic:${subjectName}:::${chap}`),
    [chapters, subjectName]
  );

  return (
    <div
      ref={setNodeRef}
      className={`p-4 sm:p-6 rounded-3xl border transition-all duration-300 space-y-4 ${
        isOver
          ? 'bg-purple-950/50 border-purple-400 ring-2 ring-purple-400/60 shadow-[0_0_30px_rgba(168,85,247,0.35)]'
          : 'bg-black/40 border-purple-500/20 hover:border-purple-500/30 shadow-xl'
      }`}
    >
      {/* Subject Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 font-black">
            <FolderOpen className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-black text-white tracking-tight">{subjectName}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {coveragePercent}% Covered
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {chapters.length} topic{chapters.length === 1 ? '' : 's'} • {completedSubtopics}/{totalSubtopics} subtopics completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => onOpenAddTopic(subjectName)}
            className="px-3 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Topic
          </button>
          <button
            type="button"
            onClick={() => onDeleteSubject(subjectName)}
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
            title="Delete Subject"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chapters / Topics Sortable List */}
      <SortableContext items={topicIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {chapters.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-white/10 rounded-2xl text-slate-500 text-xs">
              No topics in "{subjectName}" yet. Drag a topic here or click "+ Add Topic".
            </div>
          ) : (
            chapters.map((chapName) => (
              <ChapterGroup
                key={chapName}
                subjectName={subjectName}
                chapterName={chapName}
                nodes={chapterMap[chapName]}
                completedSubtopicIds={completedSubtopicIds}
                timeSummary={timeSummary}
                onToggleSubtopic={onToggleSubtopic}
                onToggleTopic={onToggleTopic}
                onOpenAddSubtopic={onOpenAddSubtopic}
                onDeleteNode={onDeleteNode}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ==========================================
// MAIN MY SYLLABUS DND TREE COMPONENT
// ==========================================
export const MySyllabusDndTree: React.FC<MySyllabusDndTreeProps> = ({
  rawNodes,
  selectedExam,
  userId,
  completedSubtopicIds,
  timeSummary,
  searchQuery = '',
  activeStageFilter = 'All',
  onToggleSubtopic,
  onToggleTopic,
  onOpenAddSubject,
  onOpenAddTopic,
  onOpenAddSubtopic,
  onDeleteSubject,
  onDeleteNode,
  onNodesChanged,
}) => {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configure Sensors with TouchSensor long-press and PointerSensor
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag threshold
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms long press for touch devices to avoid scroll conflict
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter rawNodes based on search and stage filter
  const filteredNodes = useMemo(() => {
    return rawNodes.filter((node) => {
      const matchesStage = activeStageFilter === 'All' || !node.stage || node.stage === activeStageFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        (node.subject && node.subject.toLowerCase().includes(q)) ||
        (node.chapter && node.chapter.toLowerCase().includes(q)) ||
        (node.topic && node.topic.toLowerCase().includes(q)) ||
        (node.subtopic && node.subtopic.toLowerCase().includes(q));
      return matchesStage && matchesQuery;
    });
  }, [rawNodes, searchQuery, activeStageFilter]);

  // Group nodes by subject -> chapter/topic
  const subjectMap = useMemo(() => {
    const map: Record<string, Record<string, PersonalSyllabusNode[]>> = {};

    filteredNodes.forEach((node) => {
      const subj = (node.subject || 'Custom Subject').trim();
      const chap = (node.chapter || node.topic || 'General Topic').trim();

      if (!map[subj]) map[subj] = {};
      if (!map[subj][chap]) map[subj][chap] = [];
      map[subj][chap].push(node);
    });

    return map;
  }, [filteredNodes]);

  const subjectNames = useMemo(() => Object.keys(subjectMap), [subjectMap]);
  const allSubjectIds = useMemo(
    () => subjectNames.map((s) => `subject:${s}`),
    [subjectNames]
  );

  // Handle Drag Start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  // Trigger Toast Notification with Undo option
  const showToast = (message: string, undoNodes: PersonalSyllabusNode[]) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    const toastObj: ToastState = {
      id: Date.now().toString(),
      message,
      undoNodes,
    };
    setToast(toastObj);

    toastTimeoutRef.current = setTimeout(() => {
      setToast((current) => (current?.id === toastObj.id ? null : current));
    }, 5000);
  };

  // Undo Move Action
  const handleUndo = async () => {
    if (!toast) return;
    const undoList = toast.undoNodes;
    setToast(null);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

    await saveAllPersonalSyllabusNodes(userId, selectedExam, undoList);
    onNodesChanged(undoList);
  };

  // Handle Drag End
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const snapshotNodes = [...rawNodes];
    let newNodes = [...rawNodes];
    let toastMessage = '';

    // ==========================================
    // CASE A: DRAGGING A SUBTOPIC
    // ==========================================
    if (activeId.startsWith('subtopic:')) {
      const movedNodeId = activeId.replace('subtopic:', '');
      const movedNodeIndex = newNodes.findIndex((n) => n.id === movedNodeId);
      if (movedNodeIndex === -1) return;

      const movedNode = { ...newNodes[movedNodeIndex] };
      let targetSubject = movedNode.subject;
      let targetChapter = movedNode.chapter || 'General Topic';

      if (overId.startsWith('subtopic:')) {
        const targetNodeId = overId.replace('subtopic:', '');
        const targetNode = newNodes.find((n) => n.id === targetNodeId);
        if (targetNode) {
          targetSubject = targetNode.subject;
          targetChapter = targetNode.chapter || 'General Topic';
        }
      } else if (overId.startsWith('chapter:') || overId.startsWith('topic:')) {
        const rawTarget = overId.replace('chapter:', '').replace('topic:', '');
        const [sName, cName] = rawTarget.split(':::');
        targetSubject = sName;
        targetChapter = cName || 'General Topic';
      } else if (overId.startsWith('subject:')) {
        targetSubject = overId.replace('subject:', '');
        targetChapter = 'Uncategorized'; // Auto-create Uncategorized chapter as per spec
      }

      const subjectChanged = movedNode.subject !== targetSubject;
      const chapterChanged = movedNode.chapter !== targetChapter;

      // Update node fields
      movedNode.subject = targetSubject;
      movedNode.chapter = targetChapter;
      movedNode.topic = targetChapter;

      // Remove from old position and insert at new target
      newNodes.splice(movedNodeIndex, 1);

      if (overId.startsWith('subtopic:')) {
        const targetNodeId = overId.replace('subtopic:', '');
        const targetIdx = newNodes.findIndex((n) => n.id === targetNodeId);
        if (targetIdx !== -1) {
          newNodes.splice(targetIdx, 0, movedNode);
        } else {
          newNodes.push(movedNode);
        }
      } else {
        // Append to the target subject + chapter group
        let groupLastIndex = -1;
        for (let i = newNodes.length - 1; i >= 0; i--) {
          if (newNodes[i].subject === targetSubject && newNodes[i].chapter === targetChapter) {
            groupLastIndex = i;
            break;
          }
        }
        if (groupLastIndex !== -1) {
          newNodes.splice(groupLastIndex + 1, 0, movedNode);
        } else {
          newNodes.push(movedNode);
        }
      }

      // Reassign order
      newNodes = newNodes.map((n, idx) => ({ ...n, order: idx }));

      if (subjectChanged) {
        toastMessage = `Moved "${movedNode.subtopic || 'Subtopic'}" to "${targetSubject}"`;
      } else if (chapterChanged) {
        toastMessage = `Moved "${movedNode.subtopic || 'Subtopic'}" to chapter "${targetChapter}"`;
      } else {
        toastMessage = `Reordered "${movedNode.subtopic || 'Subtopic'}"`;
      }
    }

    // ==========================================
    // CASE B: DRAGGING A TOPIC / CHAPTER
    // ==========================================
    else if (activeId.startsWith('topic:')) {
      const [sourceSubject, sourceChapter] = activeId.replace('topic:', '').split(':::');

      let targetSubject = sourceSubject;

      if (overId.startsWith('subject:')) {
        targetSubject = overId.replace('subject:', '');
      } else if (overId.startsWith('topic:') || overId.startsWith('chapter:')) {
        const rawTarget = overId.replace('topic:', '').replace('chapter:', '');
        const [sName] = rawTarget.split(':::');
        targetSubject = sName;
      }

      const topicNodes = newNodes.filter(
        (n) => n.subject === sourceSubject && (n.chapter === sourceChapter || n.topic === sourceChapter)
      );

      if (topicNodes.length === 0) return;

      if (targetSubject !== sourceSubject) {
        // Move entire subtree together
        newNodes = newNodes.map((n) => {
          if (n.subject === sourceSubject && (n.chapter === sourceChapter || n.topic === sourceChapter)) {
            return { ...n, subject: targetSubject };
          }
          return n;
        });

        toastMessage = `Moved '${sourceChapter}' and its ${topicNodes.length} subtopic${
          topicNodes.length === 1 ? '' : 's'
        } to '${targetSubject}'`;
      } else {
        toastMessage = `Reordered topic "${sourceChapter}"`;
      }

      // Reassign order
      newNodes = newNodes.map((n, idx) => ({ ...n, order: idx }));
    }

    if (toastMessage) {
      await saveAllPersonalSyllabusNodes(userId, selectedExam, newNodes);
      onNodesChanged(newNodes);
      showToast(toastMessage, snapshotNodes);
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  // Determine active item for DragOverlay ghost preview
  const activeSubtopicNode = useMemo(() => {
    if (activeDragId && activeDragId.startsWith('subtopic:')) {
      const id = activeDragId.replace('subtopic:', '');
      return rawNodes.find((n) => n.id === id);
    }
    return null;
  }, [activeDragId, rawNodes]);

  const activeTopicInfo = useMemo(() => {
    if (activeDragId && activeDragId.startsWith('topic:')) {
      const [sName, cName] = activeDragId.replace('topic:', '').split(':::');
      const count = rawNodes.filter((n) => n.subject === sName && n.chapter === cName).length;
      return { subject: sName, chapter: cName, count };
    }
    return null;
  }, [activeDragId, rawNodes]);

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification with Undo (5-second window) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 border border-sky-500/40 shadow-2xl text-white text-xs font-bold flex items-center gap-4 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{toast.message}</span>
          </div>

          <button
            type="button"
            onClick={handleUndo}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </button>
        </div>
      )}

      {/* Main Drag-and-Drop Tree */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="space-y-6">
          {subjectNames.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <FolderOpen className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-bold">No custom subjects in My Syllabus yet</p>
              <p className="text-slate-500 text-xs">
                Click "+ Add New Subject" or import topics from the Official Syllabus tab!
              </p>
              <button
                type="button"
                onClick={onOpenAddSubject}
                className="mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Subject
              </button>
            </div>
          ) : (
            subjectNames.map((subjName) => (
              <SubjectContainer
                key={subjName}
                subjectName={subjName}
                chapterMap={subjectMap[subjName]}
                completedSubtopicIds={completedSubtopicIds}
                timeSummary={timeSummary}
                onToggleSubtopic={onToggleSubtopic}
                onToggleTopic={onToggleTopic}
                onOpenAddTopic={onOpenAddTopic}
                onOpenAddSubtopic={onOpenAddSubtopic}
                onDeleteSubject={onDeleteSubject}
                onDeleteNode={onDeleteNode}
              />
            ))
          )}
        </div>

        {/* Drag Overlay Ghost Preview */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeSubtopicNode ? (
            <div className="p-3.5 rounded-2xl bg-slate-900 border-2 border-sky-400 text-white text-xs font-bold shadow-xl opacity-95 flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-sky-400" />
              <span>{activeSubtopicNode.subtopic || activeSubtopicNode.topic || 'Subtopic'}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-sky-300 border border-slate-700">
                Moving Subtopic
              </span>
            </div>
          ) : activeTopicInfo ? (
            <div className="p-4 rounded-3xl bg-slate-900 border-2 border-sky-400 text-white text-sm font-bold shadow-2xl opacity-95 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <GripVertical className="w-5 h-5 text-sky-400" />
                <div>
                  <h4>{activeTopicInfo.chapter}</h4>
                  <p className="text-xs text-slate-400">
                    Moving Topic with {activeTopicInfo.count} subtopic{activeTopicInfo.count === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-600 text-white shadow-md">
                {activeTopicInfo.subject}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
