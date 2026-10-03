import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SlideUp, 
  Stagger, 
  StaggerItem, 
  PressFeedback, 
  ProgressAnimation, 
  CountUp, 
  triggerConfetti, 
  AccordionTransition, 
  ModalTransition,
  CheckmarkPop
} from '../lib/animations';
import { SyllabusTopic, SubTopic, ExamType, PredictorSettings } from '../types';
import { INITIAL_SYLLABUS_HIERARCHY } from '../data/academicData';
import { EXAM_LIST } from '../lib/examList';
import { getCustomExamsFromStorage } from '../lib/customExamStore';
import { GoogleSheetImportModal } from './GoogleSheetImportModal';
import { PremiumGate, FeatureFlagsMap } from './PremiumGate';
import { AcademicBulkImportModal } from './AcademicBulkImportModal';
import { GlobalSearchModal } from './GlobalSearchModal';
import { MySyllabusUploadModal } from './MySyllabusUploadModal';
import { 
  loadCompletedSubtopicIds, 
  saveCompletedSubtopicIds, 
  loadPredictorSettings, 
  SyncState 
} from '../lib/syllabusStorage';
import { awardXPAndCoins } from '../lib/gamification';
import {
  fetchOfficialSyllabus,
  fetchPersonalSyllabus,
  importFromOfficial,
  fetchSyllabusTimeSummary,
  savePersonalSubjectSyllabus,
  saveAllPersonalSyllabusNodes,
  removePersonalSubject
} from '../lib/unifiedSyllabus';
import { PersonalSyllabusNode } from '../lib/personalSyllabus';
import { MySyllabusDndTree } from './MySyllabusDndTree';
import { OpenKoshExamDirectory } from './OpenKoshExamDirectory';
import { convertOpenKoshToSyllabusNodes } from '../data/openkoshData';
import { getExamConfig } from '../lib/examRegistry';
import { SyllabusVelocityHud } from './SyllabusVelocityHud';
import { AddCustomTopicModal } from './AddCustomTopicModal';
import { useExam } from '../context/ExamContext';

// ── Exam Forecasting Engine Domain Imports ──────────────────────────────────
import {
  ExamDefinition,
  ExamTask,
  StudentTaskProgress,
  StudySessionLog,
  TestRecord,
  CalendarAvailability,
  ForecastResult,
  WhatIfConfig,
  TaskStatus,
  RevisionCycle,
  MasteryRating
} from '../lib/forecast/types';
import { generateExamForecast } from '../lib/forecast/forecastingEngine';
import {
  DEFAULT_JEE_EXAM,
  DEFAULT_STUDY_LOGS,
  DEFAULT_TEST_RECORDS,
  DEFAULT_CALENDAR_AVAILABILITY
} from '../data/forecastDefaultData';

import { 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Filter, 
  Search, 
  FileSpreadsheet, 
  CloudCheck, 
  RotateCcw, 
  Layers, 
  Check, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  User, 
  Tag, 
  Info, 
  Lock as LockIcon, 
  X,
  Flame,
  Target,
  Award,
  Sliders,
  Play,
  Pause,
  Calendar,
  AlertTriangle,
  Star,
  Zap,
  TrendingUp,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface SyllabusTrackerProps {
  exam: ExamType;
  userId?: string;
  isGuest?: boolean;
  guestLimit?: number;
  onRequireLogin?: () => void;
  isUserPremium?: boolean;
  featureFlags?: FeatureFlagsMap;
  onOpenPremium?: () => void;
}

function formatNiceDate(isoDateStr: string): string {
  if (!isoDateStr) return 'TBD';
  const d = new Date(isoDateStr);
  if (isNaN(d.getTime())) return isoDateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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

export const SyllabusTracker: React.FC<SyllabusTrackerProps> = ({ 
  exam: initialExam, 
  userId,
  isGuest = false,
  guestLimit,
  onRequireLogin,
  isUserPremium = false,
  featureFlags = {},
  onOpenPremium
}) => {
  const { selectedExamId, setSelectedExamId } = useExam();
  // Universal exam state: automatically syncs with central ExamContext, header, and all modules
  const selectedExam = (selectedExamId || initialExam || 'JEE_MAIN') as ExamType;

  const handleUniversalExamChange = (newExam: string) => {
    setSelectedExamId(newExam, { persist: true, syncUser: true, userId });
  };

  const [activeTab, setActiveTab] = useState<'official' | 'personal' | 'directory'>('official');

  // Raw syllabus nodes and derived topics for both tabs
  const [officialRawNodes, setOfficialRawNodes] = useState<any[]>([]);
  const [personalRawNodes, setPersonalRawNodes] = useState<PersonalSyllabusNode[]>([]);
  const [timeSummary, setTimeSummary] = useState<Record<string, number>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Filtering & Search
  const [activeStageFilter, setActiveStageFilter] = useState<string>('All');
  const [masteryFilter, setMasteryFilter] = useState<'All' | 'NeedsRevision' | 'Weak' | 'HighWeightage' | 'Completed' | 'Pending'>('All');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Completed subtopics set
  const [completedSubtopicIds, setCompletedSubtopicIds] = useState<Set<string>>(new Set());
  const [recentlyCheckedSubId, setRecentlyCheckedSubId] = useState<string | null>(null);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);

  // Hierarchy Builder Modal
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState<boolean>(false);
  const [builderMode, setBuilderMode] = useState<'subject' | 'topic' | 'subtopic' | 'edit'>('subject');
  const [targetSubject, setTargetSubject] = useState<string>('');
  const [targetChapter, setTargetChapter] = useState<string>('');
  const [inputSubject, setInputSubject] = useState<string>('');
  const [inputChapter, setInputChapter] = useState<string>('');
  const [inputTopic, setInputTopic] = useState<string>('');
  const [inputSubtopic, setInputSubtopic] = useState<string>('');
  const [inputStage, setInputStage] = useState<string>('Prelims');
  const [inputWeightage, setInputWeightage] = useState<string>('Medium');
  const [isAddCustomTopicOpen, setIsAddCustomTopicOpen] = useState<boolean>(false);

  const handleAddCustomTopic = async (newNode: PersonalSyllabusNode) => {
    // 1. Add to personalRawNodes
    const updatedPersonal = [...personalRawNodes, newNode];
    setPersonalRawNodes(updatedPersonal);

    // 2. Also add to officialRawNodes so it immediately appears in the active checklist
    const updatedOfficial = [...officialRawNodes, {
      id: newNode.id,
      exam: selectedExam,
      subject: newNode.subject,
      chapter: newNode.chapter || newNode.subject,
      topic: newNode.topic || newNode.chapter,
      subtopic: newNode.subtopic || newNode.topic,
      title: newNode.topic || newNode.chapter,
      stage: newNode.stage || 'Prelims',
      weightage: newNode.weightage || 'Medium',
      estimatedHours: 4,
      completed: false,
      description: `${newNode.subject} - ${newNode.topic}`,
      difficulty: 'Medium'
    }];
    setOfficialRawNodes(updatedOfficial);

    // 3. Persist to storage & cloud
    try {
      await saveAllPersonalSyllabusNodes(userId, selectedExam, updatedPersonal);
    } catch (e) {
      console.warn('Failed to save custom syllabus node:', e);
    }

    awardXPAndCoins(25, 5, 'Added Custom Syllabus Topic', userId);
    triggerConfetti();
    setImportNotification(`✨ Topic "${newNode.chapter || newNode.topic}" added! Total workload & target days recalculated.`);
    setTimeout(() => setImportNotification(null), 5000);
  };

  // ── FORECASTING & MASTERY STATE ───────────────────────────────────────────
  const progressStorageKey = `studyride_forecast_mastery_${userId || 'guest'}_${selectedExam}`;
  const [taskProgressMap, setTaskProgressMap] = useState<Map<string, StudentTaskProgress>>(() => {
    try {
      const saved = localStorage.getItem(progressStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Map(Array.isArray(parsed) ? parsed : Object.entries(parsed));
      }
    } catch {}
    return new Map();
  });

  // Save progress changes
  useEffect(() => {
    try {
      localStorage.setItem(progressStorageKey, JSON.stringify(Array.from(taskProgressMap.entries())));
    } catch {}
  }, [taskProgressMap, progressStorageKey]);

  // Forecast Interactive Drawers (Timer removed as Pomodoro is already dedicated)
  const [activeForecastDrawer, setActiveForecastDrawer] = useState<'none' | 'simulator' | 'target'>('none');

  // What-If Simulator configuration state
  const [whatIfConfig, setWhatIfConfig] = useState<WhatIfConfig>({
    dailyHourDelta: 0,
    removeSundayStudy: false,
    weeklyTestCount: 0,
    extraRestDaysPerMonth: 0,
    missedDaysToSimulate: 0,
    revisionMultiplier: 1.0
  });

  // Target Date Calculator state
  const [targetDateInput, setTargetDateInput] = useState<string>('');

  // Study Session Logs
  const [studyLogs, setStudyLogs] = useState<StudySessionLog[]>(() => {
    try {
      const saved = localStorage.getItem(`studyride_study_logs_${userId || 'guest'}`);
      return saved ? JSON.parse(saved) : DEFAULT_STUDY_LOGS;
    } catch {
      return DEFAULT_STUDY_LOGS;
    }
  });

  const [calendarMap] = useState<Map<string, CalendarAvailability>>(() => {
    const map = new Map<string, CalendarAvailability>();
    DEFAULT_CALENDAR_AVAILABILITY.forEach(c => map.set(c.date, c));
    return map;
  });

  // Grouping helper for hierarchy
  const groupHierarchyNodes = (nodes: any[], completedSet: Set<string> = completedSubtopicIds) => {
    const topicsMap: Record<string, SyllabusTopic> = {};
    
    nodes.forEach((node) => {
      if (Array.isArray(node.subtopics)) {
        const topicKey = node.id || `topic_${node.title}`;
        const subList: SubTopic[] = node.subtopics.map((sub: any, idx: number) => ({
          id: sub.id || `sub_${topicKey}_${idx}`,
          topicId: topicKey,
          title: typeof sub === 'string' ? sub : (sub.title || sub.name || `Subtopic ${idx + 1}`),
          completed: Boolean(sub.completed) || completedSet.has(sub.id),
          estimatedHours: sub.estimatedHours || 2.5,
          weightage: sub.weightage || node.weightage || 'Medium',
          notes: sub.notes || '',
          origin_official_id: sub.origin_official_id || node.origin_official_id,
          time_studied_seconds: sub.time_studied_seconds || node.time_studied_seconds || 0
        }));

        topicsMap[topicKey] = {
          id: topicKey,
          exam: node.exam,
          title: node.title || node.chapter || 'Topic',
          category: node.category || node.subject || 'General Subject',
          stage: (['Prelims','Mains','Tier-1','Tier-2','Interview','Board Exam','Written Exam','Annual Exam','Main Exam','Main Test','Full Test','Paper 1','Paper 1 & 2','Board + NEET','Semester Exams','Phase 1','Paper 2'] as const).includes(node.stage as any) ? node.stage : 'Prelims',
          completed: subList.length > 0 && subList.every((s) => completedSet.has(s.id) || s.completed),
          subtopicsCount: subList.length,
          completedSubtopics: subList.filter((s) => completedSet.has(s.id) || s.completed).length,
          weightage: node.weightage || 'Medium',
          notes: node.notes || node.description || '',
          subtopics: subList,
        };
        return;
      }

      const key = `${node.subject || node.category || 'General'}::${node.chapter || node.topic || 'General Chapter'}`;
      if (!topicsMap[key]) {
        topicsMap[key] = {
          id: `topic_${node.id || Math.random().toString(36).substring(2, 6)}`,
          exam: node.exam,
          title: node.chapter || node.topic || 'General Chapter',
          category: node.subject || node.category || 'General Subject',
          stage: (['Prelims','Mains','Tier-1','Tier-2','Interview','Board Exam','Written Exam','Annual Exam','Main Exam','Main Test','Full Test','Paper 1','Paper 1 & 2','Board + NEET','Semester Exams','Phase 1','Paper 2'] as const).includes(node.stage as any) ? node.stage : 'Prelims',
          completed: false,
          subtopicsCount: 0,
          completedSubtopics: 0,
          weightage: node.weightage || 'Medium',
          notes: node.description || '',
          subtopics: [],
        };
      }
      
      const subId = node.id || `sub_${key}_${topicsMap[key].subtopics!.length}`;
      topicsMap[key].subtopics!.push({
        id: subId,
        topicId: topicsMap[key].id,
        title: node.subtopic || node.topic || node.title || 'Subtopic',
        completed: completedSet.has(subId),
        estimatedHours: node.estimatedHours || 2.5,
        weightage: node.weightage,
        notes: node.description,
        origin_official_id: node.origin_official_id,
        time_studied_seconds: Number(node.time_studied_seconds) || 0
      });
      topicsMap[key].subtopicsCount++;
      if (completedSet.has(subId)) {
        topicsMap[key].completedSubtopics++;
      }
    });
    
    const result = Object.values(topicsMap);
    result.forEach((t) => {
      t.completed = t.subtopicsCount > 0 && t.completedSubtopics === t.subtopicsCount;
    });
    return result;
  };

  const officialTopics = useMemo(
    () => groupHierarchyNodes(officialRawNodes, completedSubtopicIds),
    [officialRawNodes, completedSubtopicIds]
  );

  const personalTopics = useMemo(
    () => groupHierarchyNodes(personalRawNodes, completedSubtopicIds),
    [personalRawNodes, completedSubtopicIds]
  );

  // Load completion state from storage
  useEffect(() => {
    async function init() {
      const savedIds = await loadCompletedSubtopicIds(userId, selectedExam);
      setCompletedSubtopicIds(savedIds);
    }
    init();
  }, [userId, selectedExam]);

  // Load syllabus nodes and time summary
  const loadData = useCallback(async () => {
    const openkoshNodes = convertOpenKoshToSyllabusNodes(selectedExam);
    let offNodes: any[] = openkoshNodes && openkoshNodes.length > 0 ? openkoshNodes : [];

    if (offNodes.length === 0) {
      offNodes = await fetchOfficialSyllabus(selectedExam);
    }

    if (offNodes.length === 0) {
      const customExams = getCustomExamsFromStorage();
      const customMatch = customExams.find(c => c.id === selectedExam || c.id.toLowerCase() === (selectedExam || '').toLowerCase());
      if (customMatch && Array.isArray(customMatch.syllabus) && customMatch.syllabus.length > 0) {
        offNodes = customMatch.syllabus;
      } else {
        const normalizeKey = (e: string) => {
          const s = (e || '').toLowerCase().replace(/[\s\-_]/g, '');
          if (s.includes('nda') || s.includes('defence')) return 'nda';
          if (s.includes('neet') || s.includes('medical')) return 'neet';
          if (s.includes('upsc') || s.includes('cse')) return 'upsc';
          if (s.includes('ssc') || s.includes('cgl')) return 'ssc';
          return s;
        };
        offNodes = INITIAL_SYLLABUS_HIERARCHY.filter(
          n => normalizeKey(n.exam || '') === normalizeKey(selectedExam)
        );
      }
    }

    if (offNodes.length === 0) {
      const config = getExamConfig(selectedExam);
      if (config && config.syllabusTree) {
        const synthesized: any[] = [];
        Object.entries(config.syllabusTree).forEach(([subj, data], sIdx) => {
          (data.topics || []).forEach((top, tIdx) => {
            const subtopicsList = data.subtopics && data.subtopics[top] ? data.subtopics[top] : [top];
            subtopicsList.forEach((sub, subIdx) => {
              synthesized.push({
                id: `${config.examId}_${sIdx}_${tIdx}_${subIdx}`,
                exam: config.examId,
                paper: config.papers?.[0] || 'Paper 1',
                subject: subj,
                chapter: top,
                topic: top,
                subtopic: sub,
                title: sub,
                stage: config.stages?.[0] || 'Prelims',
                weightage: 'High',
                estimatedHours: 2.5,
                completed: false,
                description: `${subj} - ${top}`,
                difficulty: 'Medium'
              });
            });
          });
        });
        offNodes = synthesized;
      }
    }

    setOfficialRawNodes(offNodes);

    try {
      const persNodes = await fetchPersonalSyllabus(selectedExam, userId);
      setPersonalRawNodes(persNodes);
    } catch {
      setPersonalRawNodes([]);
    }

    try {
      const timeMap = await fetchSyllabusTimeSummary(userId, activeTab === 'personal' ? 'personal' : 'official');
      setTimeSummary(timeMap);
    } catch {
      setTimeSummary({});
    }
  }, [selectedExam, userId, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate current active topics
  const currentTopics = useMemo(() => {
    return activeTab === 'official' ? officialTopics : personalTopics;
  }, [activeTab, officialTopics, personalTopics]);

  // Convert current topics into ExamTask for forecasting
  const examTasks: ExamTask[] = useMemo(() => {
    if (!currentTopics || currentTopics.length === 0) return [];
    return currentTopics.map((t, idx) => {
      const estHours = t.subtopics && t.subtopics.length > 0
        ? t.subtopics.reduce((acc, s) => acc + (s.estimatedHours || 2.5), 0)
        : (t.weightage === 'High' ? 18 : (t.weightage === 'Low' ? 8 : 12));

      const difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard' = 
        t.weightage === 'High' ? 'Hard' : (t.weightage === 'Low' ? 'Easy' : 'Medium');

      return {
        id: t.id,
        examId: selectedExam,
        subject: t.category || 'General',
        title: t.title,
        categoryType: 'Chapter',
        estimatedHours: Math.round(estHours),
        difficulty,
        weightagePercentage: t.weightage === 'High' ? 8 : (t.weightage === 'Low' ? 3 : 5),
        orderIndex: idx
      };
    });
  }, [currentTopics, selectedExam]);

  // Canonical Exam Definition
  const examDefinition: ExamDefinition = useMemo(() => {
    const config = getExamConfig(selectedExam);
    const selectedItem = EXAM_LIST.find(e => e.id.toLowerCase() === (selectedExam || '').toLowerCase());
    return {
      id: selectedExam || 'JEE_MAIN',
      name: config?.displayName || config?.name || selectedItem?.label || (selectedExam ? String(selectedExam).replace(/_/g, ' ') : 'Exam'),
      category: 'Engineering',
      examDate: '2027-01-24',
      targetSyllabusCompletionDate: targetDateInput && !isNaN(new Date(targetDateInput).getTime()) ? targetDateInput : '2027-01-24',
      defaultDailyProductiveHours: 5.5,
      minRevisionBufferDays: 14,
      subjects: Array.from(new Set(examTasks.map(t => t.subject)))
    };
  }, [selectedExam, examTasks, targetDateInput]);

  // Generate live mathematical forecast
  const currentForecast: ForecastResult = useMemo(() => {
    if (examTasks.length === 0) {
      return generateExamForecast(
        DEFAULT_JEE_EXAM,
        [],
        new Map(),
        studyLogs,
        calendarMap,
        [],
        whatIfConfig
      );
    }

    // Synthesize progress map combining completedSubtopicIds and taskProgressMap
    const synthesizedProgress = new Map<string, StudentTaskProgress>();
    examTasks.forEach(task => {
      const existing = taskProgressMap.get(task.id);
      const topic = currentTopics.find(t => t.id === task.id);
      const isCompletedInClassic = topic?.completed || false;

      if (existing) {
        synthesizedProgress.set(task.id, {
          ...existing,
          learningStatus: isCompletedInClassic ? 'completed' : existing.learningStatus,
          practiceStatus: isCompletedInClassic ? (existing.practiceStatus === 'pending' ? 'completed' : existing.practiceStatus) : existing.practiceStatus
        });
      } else {
        synthesizedProgress.set(task.id, {
          taskId: task.id,
          learningStatus: isCompletedInClassic ? 'completed' : 'pending',
          practiceStatus: isCompletedInClassic ? 'completed' : 'pending',
          pyqPercentage: isCompletedInClassic ? 80 : 0,
          revisionCycle: (isCompletedInClassic ? 1 : 0) as RevisionCycle,
          masteryLevel: isCompletedInClassic ? 4 : 1,
          plannedHours: 10,
          actualHoursSpent: 0
        });
      }
    });

    return generateExamForecast(
      examDefinition,
      examTasks,
      synthesizedProgress,
      studyLogs,
      calendarMap,
      [],
      whatIfConfig
    );
  }, [examDefinition, examTasks, taskProgressMap, currentTopics, studyLogs, calendarMap, whatIfConfig]);

  // Topic mastery update helpers
  const updateTaskProgress = (taskId: string, updater: (prev: StudentTaskProgress) => StudentTaskProgress) => {
    setTaskProgressMap(prev => {
      const next = new Map(prev);
      const current = next.get(taskId) || {
        taskId,
        learningStatus: 'pending' as TaskStatus,
        practiceStatus: 'pending' as TaskStatus,
        pyqPercentage: 0,
        revisionCycle: 0 as RevisionCycle,
        masteryLevel: 1 as MasteryRating,
        plannedHours: 10,
        actualHoursSpent: 0
      };
      next.set(taskId, updater(current));
      return next;
    });
  };

  const toggleLearning = (taskId: string) => {
    updateTaskProgress(taskId, p => ({
      ...p,
      learningStatus: (p.learningStatus === 'completed' ? 'pending' : 'completed') as TaskStatus
    }));
  };

  const cyclePractice = (taskId: string) => {
    updateTaskProgress(taskId, p => {
      const nextStatus: TaskStatus = p.practiceStatus === 'completed' ? 'pending' : p.practiceStatus === 'in_progress' ? 'completed' : 'in_progress';
      return { ...p, practiceStatus: nextStatus };
    });
  };

  const cyclePyq = (taskId: string) => {
    updateTaskProgress(taskId, p => {
      const steps = [0, 50, 80, 100];
      const currentIdx = steps.indexOf(p.pyqPercentage);
      const nextPyq = currentIdx >= 0 && currentIdx < steps.length - 1 ? steps[currentIdx + 1] : 0;
      return { ...p, pyqPercentage: nextPyq };
    });
  };

  const cycleRevision = (taskId: string) => {
    updateTaskProgress(taskId, p => {
      const nextCycle = ((p.revisionCycle + 1) % 4) as RevisionCycle;
      return { ...p, revisionCycle: nextCycle };
    });
  };

  const setMasteryRating = (taskId: string, stars: MasteryRating) => {
    updateTaskProgress(taskId, p => ({ ...p, masteryLevel: stars }));
  };

  // Toggle subtopic completion
  const toggleSubtopicCompletion = async (subId: string) => {
    const newCompleted = new Set(completedSubtopicIds);
    const isNowDone = !newCompleted.has(subId);

    if (isNowDone) {
      newCompleted.add(subId);
      awardXPAndCoins(10, 2, 'Completed Syllabus Subtopic', userId);
      setRecentlyCheckedSubId(subId);
      setTimeout(() => setRecentlyCheckedSubId(null), 1000);
    } else {
      newCompleted.delete(subId);
    }

    setCompletedSubtopicIds(newCompleted);
    await saveCompletedSubtopicIds(newCompleted, userId, selectedExam);
  };

  // Toggle entire parent topic completion
  const toggleParentTopicCompletion = async (topicId: string) => {
    const topic = currentTopics.find(t => t.id === topicId);
    if (!topic || !topic.subtopics) return;

    const newCompleted = new Set(completedSubtopicIds);
    const shouldCompleteAll = !topic.completed;

    topic.subtopics.forEach(sub => {
      if (shouldCompleteAll) {
        newCompleted.add(sub.id);
      } else {
        newCompleted.delete(sub.id);
      }
    });

    if (shouldCompleteAll) {
      awardXPAndCoins(topic.subtopics.length * 10, topic.subtopics.length * 2, 'Completed Syllabus Topic', userId);
      triggerConfetti();
    }

    setCompletedSubtopicIds(newCompleted);
    await saveCompletedSubtopicIds(newCompleted, userId, selectedExam);

    // Sync to forecasting mastery state
    updateTaskProgress(topicId, p => ({
      ...p,
      learningStatus: (shouldCompleteAll ? 'completed' : 'pending') as TaskStatus,
      practiceStatus: (shouldCompleteAll ? 'completed' : 'pending') as TaskStatus,
      pyqPercentage: shouldCompleteAll ? Math.max(p.pyqPercentage, 80) : p.pyqPercentage,
      masteryLevel: (shouldCompleteAll ? (p.masteryLevel < 3 ? 4 : p.masteryLevel) : 1) as MasteryRating
    }));
  };

  // Accordion toggle
  const toggleAccordion = (topicId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const toggleExpandAll = (topicsToToggle: SyllabusTopic[]) => {
    const allExpanded = topicsToToggle.every(t => expandedTopics[t.id]);
    const newState: Record<string, boolean> = {};
    topicsToToggle.forEach(t => {
      newState[t.id] = !allExpanded;
    });
    setExpandedTopics(newState);
  };

  // Available subjects
  const availableSubjects = useMemo(() => {
    const subjectsMap: Record<string, number> = {};
    currentTopics.forEach((t) => {
      const s = t.category || 'General';
      subjectsMap[s] = (subjectsMap[s] || 0) + 1;
    });
    return Object.entries(subjectsMap).map(([name, count]) => ({ name, count }));
  }, [currentTopics]);

  // Stages
  const stages = useMemo(() => {
    const set = new Set<string>();
    currentTopics.forEach(t => {
      if (t.stage) set.add(t.stage);
    });
    return ['All', ...Array.from(set)];
  }, [currentTopics]);

  // Filtered topics
  const filteredTopics = useMemo(() => {
    return currentTopics.filter(t => {
      // Stage filter
      if (activeStageFilter !== 'All' && t.stage !== activeStageFilter) return false;
      // Subject filter
      if (selectedSubjectFilter !== 'ALL' && (t.category || 'General') !== selectedSubjectFilter) return false;
      
      // Mastery filter
      const p = taskProgressMap.get(t.id);
      if (masteryFilter === 'Completed' && !t.completed && p?.learningStatus !== 'completed') return false;
      if (masteryFilter === 'Pending' && (t.completed || p?.learningStatus === 'completed')) return false;
      if (masteryFilter === 'NeedsRevision' && (p?.revisionCycle || 0) > 0) return false;
      if (masteryFilter === 'Weak' && (p?.masteryLevel || 1) > 2) return false;
      if (masteryFilter === 'HighWeightage' && t.weightage !== 'High') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchCategory = (t.category || '').toLowerCase().includes(q);
        const matchSubtopics = (t.subtopics || []).some(s => s.title.toLowerCase().includes(q));
        if (!matchTitle && !matchCategory && !matchSubtopics) return false;
      }

      return true;
    });
  }, [currentTopics, activeStageFilter, selectedSubjectFilter, masteryFilter, searchQuery, taskProgressMap]);

  // Reset progress confirmation
  const handleResetProgress = async () => {
    if (window.confirm(`Are you sure you want to reset all progress for ${selectedExam}?`)) {
      setCompletedSubtopicIds(new Set());
      setTaskProgressMap(new Map());
      await saveCompletedSubtopicIds(new Set(), userId, selectedExam);
      localStorage.removeItem(progressStorageKey);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 px-2 sm:px-4">
      {/* ── TOP HERO: UNIFIED EXAM FORECAST HUD WITH ANIMATED VELOCITY RADAR ── */}
      <SyllabusVelocityHud
        forecast={currentForecast}
        whatIfConfig={whatIfConfig}
        onUpdateWhatIf={(updater) => setWhatIfConfig(updater)}
        defaultDailyHours={examDefinition.defaultDailyProductiveHours}
        examDateStr={examDefinition.examDate}
        selectedExam={selectedExam}
        setSelectedExam={handleUniversalExamChange}
        examName={examDefinition.name}
        onOpenSimulatorDrawer={() => setActiveForecastDrawer(d => d === 'simulator' ? 'none' : 'simulator')}
        isSimulatorOpen={activeForecastDrawer === 'simulator'}
        onOpenTargetDrawer={() => setActiveForecastDrawer(d => d === 'target' ? 'none' : 'target')}
        isTargetOpen={activeForecastDrawer === 'target'}
        onOpenAddCustomTopic={() => setIsAddCustomTopicOpen(true)}
      />

      {/* ── EXPANDABLE TOOL DRAWERS (WHAT-IF, TARGET DATE, FOCUS TIMER) ── */}
      <AnimatePresence>
        {activeForecastDrawer !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl p-5 sm:p-6 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-xs">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>
                  {activeForecastDrawer === 'simulator'
                    ? 'What-If Schedule Simulator'
                    : activeForecastDrawer === 'target'
                    ? 'Target Date Feasibility Calculator'
                    : 'Live Study Focus Stopwatch'}
                </span>
              </span>
              <button
                onClick={() => setActiveForecastDrawer('none')}
                className="text-slate-400 hover:text-white px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold cursor-pointer transition"
              >
                Close Drawer ✕
              </button>
            </div>

            {/* Drawer 1: Simulator */}
            {activeForecastDrawer === 'simulator' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Interactive Schedule Simulator</h3>
                  </div>
                  <button
                    onClick={() => setWhatIfConfig({
                      dailyHourDelta: 0,
                      removeSundayStudy: false,
                      weeklyTestCount: 0,
                      extraRestDaysPerMonth: 0,
                      missedDaysToSimulate: 0,
                      revisionMultiplier: 1.0
                    })}
                    className="text-xs text-amber-400 hover:underline cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between font-semibold mb-1 text-slate-300">
                      <span>Daily Study Adjustment:</span>
                      <strong className="text-amber-400">{whatIfConfig.dailyHourDelta > 0 ? `+${whatIfConfig.dailyHourDelta}h` : `${whatIfConfig.dailyHourDelta}h`} / day</strong>
                    </div>
                    <input
                      type="range"
                      min="-3"
                      max="4"
                      step="0.5"
                      value={whatIfConfig.dailyHourDelta}
                      onChange={e => setWhatIfConfig(c => ({ ...c, dailyHourDelta: parseFloat(e.target.value) }))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between font-semibold mb-1 text-slate-300">
                      <span>Simulate Missed Days:</span>
                      <strong className="text-rose-400">{whatIfConfig.missedDaysToSimulate} days</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="14"
                      step="1"
                      value={whatIfConfig.missedDaysToSimulate}
                      onChange={e => setWhatIfConfig(c => ({ ...c, missedDaysToSimulate: parseInt(e.target.value, 10) }))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-around gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={whatIfConfig.removeSundayStudy}
                        onChange={e => setWhatIfConfig(c => ({ ...c, removeSundayStudy: e.target.checked }))}
                        className="rounded accent-amber-500"
                      />
                      <span>Remove Sunday Study (Rest Day)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={whatIfConfig.weeklyTestCount > 0}
                        onChange={e => setWhatIfConfig(c => ({ ...c, weeklyTestCount: e.target.checked ? 1 : 0 }))}
                        className="rounded accent-amber-500"
                      />
                      <span>Reserve 1 Day / Week for Mock Test</span>
                    </label>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center justify-between">
                  <span>
                    Simulated Realistic Finish: <strong className="text-white font-bold">{formatNiceDate(currentForecast.realisticDate)}</strong>
                  </span>
                  <span className="text-[11px] text-amber-300/80">
                    Live calculated based on remaining {currentForecast.remainingWorkloadHours}h workload
                  </span>
                </div>
              </div>
            )}

            {/* Drawer 2: Target Date */}
            {activeForecastDrawer === 'target' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">Target Date Feasibility Calculator</h3>
                  </div>
                  <span className="text-xs text-slate-400">Test if your desired completion deadline is possible</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="date"
                    value={targetDateInput}
                    onChange={e => setTargetDateInput(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
                  />
                  <div className="text-xs text-slate-300">
                    Select the target date by which you want all syllabus and first revision done.
                  </div>
                </div>

                {currentForecast.targetCalculation && (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    currentForecast.targetCalculation.isFeasible 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}>
                    <div className="font-bold flex items-center justify-between">
                      <span>Target: {formatNiceDate(currentForecast.targetCalculation.targetDate)}</span>
                      <span>{currentForecast.targetCalculation.isFeasible ? '✓ Mathematically Feasible' : '⚠️ Requires Pace Acceleration'}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">
                      {currentForecast.targetCalculation.explanation}
                    </p>
                    <div className="pt-1 flex items-center gap-4 text-[11px] text-slate-400">
                      <span>Current: <strong>{currentForecast.currentPaceHoursPerWeek}h/wk</strong></span>
                      <span>Required: <strong className="text-white">{currentForecast.targetCalculation.requiredWeeklyHours}h/wk</strong></span>
                      <span>Gap: <strong className={currentForecast.targetCalculation.gapWeeklyHours > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        {currentForecast.targetCalculation.gapWeeklyHours > 0 ? `+${currentForecast.targetCalculation.gapWeeklyHours}h/wk` : 'None'}
                      </strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NOTIFICATION BANNER ────────────────────────────────────────────── */}
      {importNotification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-3 shadow-md"
        >
          <Sparkles className="w-5 h-5 shrink-0 text-sky-400" />
          <span>{importNotification}</span>
        </motion.div>
      )}

      {/* ── SYLLABUS SOURCE TABS: OFFICIAL vs MY SYLLABUS vs DIRECTORY ──────── */}
      <div className="p-2 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('official')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'official'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Official Syllabus</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/25 text-white">
              {officialTopics.filter(t => t.completed).length}/{officialTopics.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Custom Plan</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/25 text-white">
              {personalTopics.filter(t => t.completed).length}/{personalTopics.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>48 Exams Directory</span>
          </button>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsGlobalSearchOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-sky-400 flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import</span>
          </button>

          <button
            onClick={handleResetProgress}
            className="p-2 rounded-xl bg-slate-950 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 transition cursor-pointer"
            title="Reset All Progress"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── VIEW ROUTING: DIRECTORY OR TOPIC CHECKLIST ─────────────────────── */}
      {activeTab === 'directory' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-semibold">
              Browsing all 48 national & state examinations curriculum archive.
            </span>
            <button
              onClick={() => setActiveTab('official')}
              className="text-xs text-sky-400 font-bold hover:underline"
            >
              Back to Active Tracker →
            </button>
          </div>
          <OpenKoshExamDirectory 
            selectedExamId={selectedExam}
            onSelectExam={(e) => {
              handleUniversalExamChange(e);
              setActiveTab('official');
            }}
          />
        </div>
      ) : activeTab === 'personal' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" /> Custom Student Learning Path
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Drag, rearrange, add custom chapters, or import directly from official exam benchmarks.
              </p>
            </div>
            <button
              onClick={() => {
                setTargetSubject('');
                setIsAddCustomTopicOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/25"
            >
              <Plus className="w-4 h-4" /> Add Subject / Chapter
            </button>
          </div>

          <MySyllabusDndTree
            rawNodes={personalRawNodes}
            selectedExam={selectedExam}
            userId={userId}
            completedSubtopicIds={completedSubtopicIds}
            timeSummary={timeSummary}
            searchQuery={searchQuery}
            activeStageFilter={activeStageFilter}
            onToggleSubtopic={toggleSubtopicCompletion}
            onToggleTopic={async (nodes) => {
              const newSet = new Set(completedSubtopicIds);
              const allDone = nodes.every(n => newSet.has(n.id));
              nodes.forEach(n => {
                if (allDone) newSet.delete(n.id);
                else newSet.add(n.id);
              });
              setCompletedSubtopicIds(newSet);
              await saveCompletedSubtopicIds(newSet, userId, selectedExam);
            }}
            onOpenAddSubject={() => {
              setTargetSubject('');
              setIsAddCustomTopicOpen(true);
            }}
            onOpenAddTopic={(subj) => {
              setTargetSubject(subj);
              setIsAddCustomTopicOpen(true);
            }}
            onOpenAddSubtopic={(subj, chap) => {
              setTargetSubject(subj);
              setTargetChapter(chap);
              setIsAddCustomTopicOpen(true);
            }}
            onDeleteSubject={async (subj) => {
              await removePersonalSubject(selectedExam, subj, userId);
              loadData();
            }}
            onDeleteNode={() => {}}
            onNodesChanged={(newNodes) => setPersonalRawNodes(newNodes)}
          />
        </div>
      ) : (
        /* ── OFFICIAL SYLLABUS TOPIC CHECKLIST WITH 5-DIMENSION MASTERY ── */
        <div className="space-y-4">
          {/* Filters Bar: Stages, Mastery Status, and Search */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            {/* Stage filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <span className="text-xs font-bold text-slate-400 mr-1 shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-sky-400" /> Stage:
              </span>
              {stages.map((stage) => (
                <button
                  key={stage}
                  onClick={() => setActiveStageFilter(stage)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    activeStageFilter === stage
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>

            {/* Preparation Mastery Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={masteryFilter}
                onChange={e => setMasteryFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="All">All Topics</option>
                <option value="Pending">Pending Topics</option>
                <option value="Completed">Completed Topics</option>
                <option value="NeedsRevision">Needs Revision Cycle</option>
                <option value="Weak">Weak Mastery (≤2★)</option>
                <option value="HighWeightage">High Weightage</option>
              </select>

              {/* Search input */}
              <div className="relative flex-1 md:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search chapters..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                />
              </div>

              <button
                onClick={() => toggleExpandAll(filteredTopics)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white shrink-0 cursor-pointer"
              >
                Expand/Collapse
              </button>

              <button
                onClick={() => setIsAddCustomTopicOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white shrink-0 cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                title="Add your own custom chapter or topic"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Custom Topic</span>
              </button>
            </div>
          </div>

          {/* Subject Pills (Physics, Chemistry, Maths, etc.) */}
          {availableSubjects.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedSubjectFilter('ALL')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedSubjectFilter === 'ALL'
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Subjects ({currentTopics.length})
              </button>
              {availableSubjects.map((subj) => (
                <button
                  key={subj.name}
                  onClick={() => setSelectedSubjectFilter(subj.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedSubjectFilter === subj.name
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {subj.name} ({subj.count})
                </button>
              ))}
            </div>
          )}

          {/* ── TOPIC CARDS: MERGED CHECKLIST + 5-DIMENSION MASTERY TOOLBAR ── */}
          <div className="space-y-3">
            {filteredTopics.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-300 font-bold">No topics match your current filter</p>
                <p className="text-slate-500 text-xs mt-1">Try resetting the stage or search query.</p>
              </div>
            ) : (
              filteredTopics.map((topic, topicIdx) => {
                const effectiveGuestLimit = guestLimit ?? Number(localStorage.getItem('aspirantx_guest_syllabus_limit') || 5);
                const isLockedForGuest = isGuest && topicIdx >= effectiveGuestLimit;

                if (isLockedForGuest) {
                  return (
                    <div
                      key={topic.id}
                      className="p-5 rounded-3xl bg-slate-900 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                          <LockIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-300 blur-[2px] select-none">
                              {topic.title}
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 uppercase">
                              Demo Mode Locked
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Login or Register to unlock complete syllabus.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={onRequireLogin}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Login to Unlock Full Syllabus
                      </button>
                    </div>
                  );
                }

                const isExpanded = Boolean(expandedTopics[topic.id]);
                const subList = topic.subtopics || [];
                const subCount = subList.length || topic.subtopicsCount || 0;
                const completedCount = subList.filter((s) => completedSubtopicIds.has(s.id) || s.completed).length;
                const topicPercentage = subCount > 0 ? Math.round((completedCount / subCount) * 100) : 0;
                const isFullyCompleted = topic.completed || (subCount > 0 && completedCount === subCount);

                // Progress state from forecasting map
                const progress: StudentTaskProgress = taskProgressMap.get(topic.id) || {
                  taskId: topic.id,
                  learningStatus: (isFullyCompleted ? 'completed' : 'pending') as TaskStatus,
                  practiceStatus: (isFullyCompleted ? 'completed' : 'pending') as TaskStatus,
                  pyqPercentage: isFullyCompleted ? 80 : 0,
                  revisionCycle: (isFullyCompleted ? 1 : 0) as RevisionCycle,
                  masteryLevel: (isFullyCompleted ? 4 : 1) as MasteryRating,
                  plannedHours: 10,
                  actualHoursSpent: 0
                };

                return (
                  <div
                    key={topic.id}
                    id={`topic-card-${topic.id}`}
                    className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                      isFullyCompleted
                        ? 'bg-sky-500/5 border-sky-500/25 shadow-sm'
                        : isExpanded
                        ? 'bg-slate-900 border-slate-700 shadow-md'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Header: Checkbox, Title, Stage, Weightage & Expand Button */}
                    <div
                      onClick={() => toggleAccordion(topic.id)}
                      className="p-4 sm:p-5 cursor-pointer select-none"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0">
                          {/* Master Completion Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleParentTopicCompletion(topic.id);
                            }}
                            className="mt-0.5 text-slate-400 hover:text-sky-400 transition shrink-0 cursor-pointer"
                            title={isFullyCompleted ? 'Mark topic as incomplete' : 'Mark topic as complete'}
                          >
                            {isFullyCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-sky-400 fill-sky-400/20" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-600 hover:text-sky-400" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`text-sm sm:text-base font-bold tracking-tight ${isFullyCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                                {topic.title}
                              </h4>

                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                topic.weightage === 'High'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : topic.weightage === 'Medium'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {topic.weightage} Weightage
                              </span>

                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
                                {topic.stage}
                              </span>

                              {timeSummary[topic.id] ? (
                                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                  {formatStudiedTime(timeSummary[topic.id])}
                                </span>
                              ) : null}
                            </div>

                            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sky-400">{topic.category}</span>
                              <span>•</span>
                              <span>{subCount} Subtopics ({completedCount} Done)</span>
                              <span>•</span>
                              <span>Est. Workload: ~{topic.subtopics?.reduce((a, b) => a + (b.estimatedHours || 2.5), 0) || 12}h</span>
                            </p>
                          </div>
                        </div>

                        {/* Right: Percent & Accordion Toggle */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs font-black text-white">{topicPercentage}%</span>
                            <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1 border border-slate-800">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isFullyCompleted ? 'bg-sky-400' : 'bg-sky-600'
                                }`}
                                style={{ width: `${topicPercentage}%` }}
                              />
                            </div>
                          </div>

                          <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                            <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-sky-400' : ''}`} />
                          </div>
                        </div>
                      </div>

                      {/* ── 5-DIMENSION MASTERY TOOLBAR (THE CORE PRINCIPLE) ── */}
                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* 1. Learning Pill */}
                          <button
                            onClick={() => toggleLearning(topic.id)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer ${
                              progress.learningStatus === 'completed'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                            title="Concept understanding & theory"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Concept: {progress.learningStatus === 'completed' ? 'Done ✓' : 'Pending'}</span>
                          </button>

                          {/* 2. Practice Pill */}
                          <button
                            onClick={() => cyclePractice(topic.id)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer ${
                              progress.practiceStatus === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : progress.practiceStatus === 'in_progress'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                            title="Question solving practice"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Practice: {progress.practiceStatus === 'completed' ? 'Done ✓' : progress.practiceStatus === 'in_progress' ? 'In Progress' : 'Pending'}</span>
                          </button>

                          {/* 3. PYQ % Button */}
                          <button
                            onClick={() => cyclePyq(topic.id)}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition flex items-center gap-1 cursor-pointer"
                            title="Click to cycle PYQ coverage (0% -> 50% -> 80% -> 100%)"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>PYQ: <strong className="text-white">{progress.pyqPercentage}%</strong></span>
                          </button>

                          {/* 4. Spaced Revision Cycle */}
                          <button
                            onClick={() => cycleRevision(topic.id)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer ${
                              progress.revisionCycle > 0
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                            title="Click to advance revision cycle (Rev 1 -> Rev 2 -> Rev 3)"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{progress.revisionCycle === 0 ? 'Rev Pending' : `Rev ${progress.revisionCycle} Done`}</span>
                          </button>
                        </div>

                        {/* 5. Mastery 1 to 5 Stars Rating */}
                        <div className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-semibold mr-1">Mastery:</span>
                          {([1, 2, 3, 4, 5] as MasteryRating[]).map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setMasteryRating(topic.id, star)}
                              className="cursor-pointer text-slate-600 hover:text-amber-400 transition"
                              title={`Rate mastery as ${star}/5 stars`}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  star <= progress.masteryLevel
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-700'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Subtopics Accordion Drawer */}
                    <AccordionTransition isOpen={isExpanded} className="border-t border-slate-800/80 bg-slate-950/80 p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1 px-0.5">
                        <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 text-[11px]">
                          <Layers className="w-3.5 h-3.5 text-sky-400" /> Sub-topics Breakdown ({subList.length})
                        </span>
                      </div>

                      <div className="space-y-2">
                        {subList.map((sub, sIdx) => {
                          const isSubDone = completedSubtopicIds.has(sub.id) || sub.completed;
                          return (
                            <div
                              key={sub.id || sIdx}
                              onClick={() => toggleSubtopicCompletion(sub.id)}
                              className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                                isSubDone
                                  ? 'bg-sky-500/10 border-sky-500/30 text-slate-200'
                                  : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSubtopicCompletion(sub.id);
                                  }}
                                  className="text-slate-400 hover:text-sky-400 shrink-0"
                                >
                                  {isSubDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400/20" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-slate-600" />
                                  )}
                                </button>
                                <span className={`text-xs font-medium ${isSubDone ? 'line-through text-slate-400' : 'text-white'}`}>
                                  {sub.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
                                <span>~{sub.estimatedHours || 2.5}h</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionTransition>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── MODALS (IMPORT / SEARCH) ────────────────────────────────────────── */}
      {isImportModalOpen && (
        <GoogleSheetImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={(_importedTopics, msg) => {
            setIsImportModalOpen(false);
            setImportNotification(msg);
            loadData();
          }}
        />
      )}

      {isGlobalSearchOpen && (
        <GlobalSearchModal
          isOpen={isGlobalSearchOpen}
          onClose={() => setIsGlobalSearchOpen(false)}
        />
      )}

      {/* ── ADD CUSTOM SYLLABUS TOPIC MODAL (APNE HISAAB SE SYLLABUS DALEIN) ── */}
      <AddCustomTopicModal
        isOpen={isAddCustomTopicOpen}
        onClose={() => setIsAddCustomTopicOpen(false)}
        selectedExam={selectedExam}
        availableSubjects={availableSubjects.map(s => s.name)}
        initialSubject={targetSubject}
        initialChapter={targetChapter}
        onAddCustomTopic={handleAddCustomTopic}
      />
    </div>
  );
};
