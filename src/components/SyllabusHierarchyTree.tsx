import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SyllabusHierarchyNode, ExamType } from '../types';
import { INITIAL_SYLLABUS_HIERARCHY } from '../data/academicData';
import { EXAM_LIST } from '../lib/examList';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  Circle, 
  Search, 
  Filter, 
  Clock, 
  Layers, 
  FileSpreadsheet,
  Zap,
  Info
} from 'lucide-react';

interface SyllabusHierarchyTreeProps {
  currentExam: ExamType;
  completedSubtopicIds: Set<string>;
  onToggleSubtopic: (id: string) => void;
  onOpenBulkImport?: () => void;
  onExamChange?: (exam: ExamType) => void;
}

export const SyllabusHierarchyTree: React.FC<SyllabusHierarchyTreeProps> = ({
  currentExam,
  completedSubtopicIds,
  onToggleSubtopic,
  onOpenBulkImport,
  onExamChange,
}) => {
  const [selectedExam, setSelectedExam] = useState<string>(currentExam || 'UPSC_CSE');
  const [hierarchyData, setHierarchyData] = useState<SyllabusHierarchyNode[]>(INITIAL_SYLLABUS_HIERARCHY);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'GS Paper 2': true,
    'GS Paper 1': true,
    'Indian Polity & Governance': true,
    'Constitutional Framework': true,
  });

  useEffect(() => {
    if (currentExam) {
      setSelectedExam(currentExam);
    }
  }, [currentExam]);

  // Fetch live API syllabus nodes
  useEffect(() => {
    async function fetchSyllabus() {
      try {
        const res = await fetch(`/api/academic/syllabus?exam=${selectedExam}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.syllabus) && data.syllabus.length > 0) {
            setHierarchyData(data.syllabus);
          }
        }
      } catch (e) {
        console.warn('Using initial syllabus hierarchy data');
      }
    }
    fetchSyllabus();
  }, [selectedExam]);

  const toggleExpand = (key: string) => {
    setExpandedNodes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Group nodes by Paper -> Subject -> Chapter -> Topic
  const filteredData = hierarchyData.filter((node) => {
    const matchesExam = !selectedExam || node.exam === selectedExam || selectedExam === 'ALL';
    const matchesStage = stageFilter === 'All' || node.stage === stageFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      node.title.toLowerCase().includes(q) ||
      node.subject.toLowerCase().includes(q) ||
      node.chapter.toLowerCase().includes(q) ||
      node.topic.toLowerCase().includes(q) ||
      node.subtopic.toLowerCase().includes(q);

    return matchesExam && matchesStage && matchesSearch;
  });

  // Organize into tree dictionary
  const treeMap: Record<string, Record<string, Record<string, SyllabusHierarchyNode[]>>> = {};

  filteredData.forEach((node) => {
    const paperKey = node.paper || 'General Paper';
    const subjectKey = node.subject || 'General Subject';
    const chapterKey = node.chapter || 'Core Chapter';

    if (!treeMap[paperKey]) treeMap[paperKey] = {};
    if (!treeMap[paperKey][subjectKey]) treeMap[paperKey][subjectKey] = {};
    if (!treeMap[paperKey][subjectKey][chapterKey]) treeMap[paperKey][subjectKey][chapterKey] = [];

    treeMap[paperKey][subjectKey][chapterKey].push(node);
  });

  const availableExams = EXAM_LIST;

  return (
    <div className="space-y-6">
      {/* Top Header & Exam Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              Enterprise Syllabus Hierarchy Engine
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Unlimited Exams
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Exam → Paper → Subject → Chapter → Topic → Subtopic Structural Tree
            </p>
          </div>
        </div>

        {/* Read-Only Active Exam Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs font-bold text-cyan-200 flex items-center gap-2">
            <span>{availableExams.find(ex => ex.id === selectedExam)?.label || selectedExam}</span>
            <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-1.5 py-0.5 rounded uppercase">Profile Context</span>
          </div>
          {onOpenBulkImport && (
            <button
              onClick={onOpenBulkImport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-300 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk CSV Import</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search syllabus paper, subject, chapter, or subtopic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Stage:</span>
          {['All', 'Prelims', 'Mains', 'Tier-1', 'Tier-2'].map((stg) => (
            <button
              key={stg}
              onClick={() => setStageFilter(stg)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                stageFilter === stg
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {stg}
            </button>
          ))}
        </div>
      </div>

      {/* Tree Structure List */}
      <div className="space-y-4">
        {Object.keys(treeMap).length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-black/30 border border-white/5">
            <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No syllabus topics found for criteria.</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting search filters or selecting another exam.</p>
          </div>
        ) : (
          Object.entries(treeMap).map(([paperName, subjects]) => {
            const isPaperExpanded = expandedNodes[paperName] !== false;

            return (
              <div key={paperName} className="rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
                {/* Paper Level Header */}
                <button
                  onClick={() => toggleExpand(paperName)}
                  className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left border-b border-white/5"
                >
                  <div className="flex items-center gap-3">
                    {isPaperExpanded ? (
                      <ChevronDown className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="font-extrabold text-sm text-white tracking-wide">{paperName}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {Object.keys(subjects).length} Subjects
                  </span>
                </button>

                {/* Subjects under Paper */}
                <AnimatePresence>
                  {isPaperExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 space-y-4"
                    >
                      {Object.entries(subjects).map(([subjectName, chapters]) => {
                        const isSubjectExpanded = expandedNodes[subjectName] !== false;

                        return (
                          <div
                            key={subjectName}
                            className="rounded-xl bg-slate-900/50 border border-white/10 overflow-hidden"
                          >
                            {/* Subject Header */}
                            <button
                              onClick={() => toggleExpand(subjectName)}
                              className="w-full flex items-center justify-between p-3.5 bg-black/30 hover:bg-black/50 transition-all text-left"
                            >
                              <div className="flex items-center gap-2.5">
                                {isSubjectExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                <span className="font-bold text-xs text-purple-300">{subjectName}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {Object.keys(chapters).length} Chapters
                              </span>
                            </button>

                            {/* Chapters under Subject */}
                            {isSubjectExpanded && (
                              <div className="p-3 space-y-3 border-t border-white/5 bg-black/20">
                                {Object.entries(chapters).map(([chapterName, nodes]) => {
                                  const isChapterExpanded = expandedNodes[chapterName] !== false;

                                  return (
                                    <div
                                      key={chapterName}
                                      className="rounded-lg bg-black/40 border border-white/5 p-3 space-y-2"
                                    >
                                      <button
                                        onClick={() => toggleExpand(chapterName)}
                                        className="w-full flex items-center justify-between text-left"
                                      >
                                        <div className="flex items-center gap-2">
                                          {isChapterExpanded ? (
                                            <ChevronDown className="w-3 h-3 text-emerald-400" />
                                          ) : (
                                            <ChevronRight className="w-3 h-3 text-slate-400" />
                                          )}
                                          <span className="font-semibold text-xs text-emerald-300">
                                            {chapterName}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-500">
                                          {nodes.length} Topics
                                        </span>
                                      </button>

                                      {/* Topic/Subtopic List Items */}
                                      {isChapterExpanded && (
                                        <div className="pl-4 pt-2 space-y-2 border-l border-white/10">
                                          {nodes.map((node) => {
                                            const isDone = completedSubtopicIds.has(node.id);

                                            return (
                                              <div
                                                key={node.id}
                                                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-all space-y-2"
                                              >
                                                <div className="flex items-start justify-between gap-3">
                                                  <div className="flex items-start gap-3">
                                                    <button
                                                      onClick={() => onToggleSubtopic(node.id)}
                                                      className="mt-0.5 text-slate-400 hover:text-cyan-400 transition-colors shrink-0"
                                                    >
                                                      {isDone ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-500" />
                                                      )}
                                                    </button>
                                                    <div>
                                                      <span
                                                        className={`text-xs font-bold block ${
                                                          isDone
                                                            ? 'text-slate-400 line-through'
                                                            : 'text-slate-200'
                                                        }`}
                                                      >
                                                        {node.title}
                                                      </span>
                                                      {node.description && (
                                                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                                                          {node.description}
                                                        </p>
                                                      )}
                                                      <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10">
                                                          {node.stage}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                                                          <Clock className="w-2.5 h-2.5 text-cyan-400" />
                                                          {node.estimatedHours} hrs
                                                        </span>
                                                        {node.difficulty && (
                                                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                                            {node.difficulty}
                                                          </span>
                                                        )}
                                                        {node.weightage && (
                                                          <span
                                                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                                              node.weightage === 'High'
                                                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                            }`}
                                                          >
                                                            {node.weightage} Weightage
                                                          </span>
                                                        )}
                                                        {node.pyqCount && (
                                                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20">
                                                            {node.pyqCount} PYQs
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Recommended Books & Prerequisites */}
                                                {((node.recommendedBooks && node.recommendedBooks.length > 0) || (node.prerequisites && node.prerequisites.length > 0)) && (
                                                  <div className="pt-2 border-t border-white/5 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px]">
                                                    {node.recommendedBooks && node.recommendedBooks.length > 0 && (
                                                      <div className="flex items-center gap-1 text-slate-400">
                                                        <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
                                                        <span className="font-semibold text-slate-300">Books:</span>
                                                        <span className="text-slate-400 truncate max-w-xs">{node.recommendedBooks.join(', ')}</span>
                                                      </div>
                                                    )}
                                                    {node.prerequisites && node.prerequisites.length > 0 && (
                                                      <div className="flex items-center gap-1 text-slate-400">
                                                        <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
                                                        <span className="font-semibold text-slate-300">Prereqs:</span>
                                                        <span className="text-slate-400">{node.prerequisites.join(' • ')}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
