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
import { getDefaultExamDate } from '../lib/packetSyncService';
import { SyllabusVelocityHud } from './SyllabusVelocityHud';
import { soundFx } from '../lib/soundEffects';
import { AspirantMascot } from './duolingo/AspirantMascot';
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
      examDate: getDefaultExamDate(selectedExam || 'JEE_MAIN'),
      targetSyllabusCompletionDate: targetDateInput && !isNaN(new Date(targetDateInput).getTime()) ? targetDateInput : getDefaultExamDate(selectedExam || 'JEE_MAIN'),
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
      
      // Client-side XP guard: deduplicate per subtopic id
      const xpKey = `aspirantx_awarded_subtopic_xp_${userId || 'guest'}_${selectedExam}`;
      let awardedIds: string[] = [];
      try {
        const raw = localStorage.getItem(xpKey);
        if (raw) awardedIds = JSON.parse(raw);
      } catch {}
      if (!awardedIds.includes(subId)) {
        awardedIds.push(subId);
        try {
          localStorage.setItem(xpKey, JSON.stringify(awardedIds));
        } catch {}
        awardXPAndCoins(10, 2, 'Completed Syllabus Subtopic', userId);
      }

      soundFx.playCorrect();
      triggerConfetti({ particleCount: 25, spread: 45 });
      setRecentlyCheckedSubId(subId);
      setTimeout(() => setRecentlyCheckedSubId(null), 1000);
    } else {
      newCompleted.delete(subId);
      soundFx.playTap();
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
      // Client-side XP guard: only award for previously unawarded subtopics
      const xpKey = `aspirantx_awarded_subtopic_xp_${userId || 'guest'}_${selectedExam}`;
      let awardedIds: string[] = [];
      try {
        const raw = localStorage.getItem(xpKey);
        if (raw) awardedIds = JSON.parse(raw);
      } catch {}

      const newSubsToAward = topic.subtopics.filter(s => !awardedIds.includes(s.id));
      if (newSubsToAward.length > 0) {
        newSubsToAward.forEach(s => awardedIds.push(s.id));
        try {
          localStorage.setItem(xpKey, JSON.stringify(awardedIds));
        } catch {}
        awardXPAndCoins(newSubsToAward.length * 10, newSubsToAward.length * 2, 'Completed Syllabus Topic', userId);
      }

      soundFx.playVictory();
      triggerConfetti({ particleCount: 50, spread: 65 });
    } else {
      soundFx.playTap();
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
    soundFx.playTap();
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

      {/* ── NOTIFICATION BANNER ────────────────────────────────────────────── */}
      {importNotification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-[#58CC02]/10 border border-[#58CC02]/30 text-[#58CC02] text-xs font-bold flex items-center gap-2.5 shadow-md"
        >
          <Sparkles className="w-4 h-4 shrink-0 text-[#58CC02]" />
          <span>{importNotification}</span>
        </motion.div>
      )}

      {/* ── SYLLABUS SOURCE TABS: OFFICIAL vs MY SYLLABUS vs DIRECTORY ──────── */}
      <div className="p-2 rounded-2xl bg-[var(--sr-surface)] border border-[var(--sr-line-strong)] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-auto flex-1 max-w-full">
          <div className="flex items-center gap-1.5 p-1 bg-[var(--sr-surface-2)] rounded-xl border border-[var(--sr-line)] overflow-x-auto scrollbar-none w-full pr-8">
            <button
              onClick={() => setActiveTab('official')}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'official'
                  ? 'bg-[var(--sr-primary)] text-[var(--sr-on-primary)] shadow-sm font-extrabold'
                  : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] hover:bg-[var(--sr-surface-3)]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Official Syllabus</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--sr-line)] text-[var(--sr-text)]">
                {officialTopics.filter(t => t.completed).length}/{officialTopics.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('personal')}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'personal'
                  ? 'bg-[var(--sr-blue)] text-white shadow-sm font-extrabold'
                  : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] hover:bg-[var(--sr-surface-3)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Plan</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--sr-line)] text-[var(--sr-text)]">
                {personalTopics.filter(t => t.completed).length}/{personalTopics.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'directory'
                  ? 'bg-[var(--sr-surface)] text-[var(--sr-text)] border border-[var(--sr-line-strong)] font-extrabold shadow-sm'
                  : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] hover:bg-[var(--sr-surface-3)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>48 Exams</span>
            </button>
          </div>
          {/* Scroll fade gradient on right edge */}
          <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-[var(--sr-surface-2)] to-transparent rounded-r-xl" />
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setIsGlobalSearchOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] border border-[var(--sr-line)] text-xs font-bold text-[var(--sr-blue)] flex items-center gap-1.5 cursor-pointer"
            title="Global syllabus keyword search"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#0F1115] hover:bg-[#1A1D24] border border-[#2A2F3A] text-xs font-bold text-[#58CC02] flex items-center gap-1.5 cursor-pointer"
            title="Import syllabus from spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          <button
            onClick={handleResetProgress}
            className="p-2 rounded-xl bg-[#0F1115] hover:bg-rose-500/10 text-[#9CA3AF] hover:text-rose-400 border border-[#2A2F3A] transition cursor-pointer"
            title="Reset All Progress"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── VIEW ROUTING: DIRECTORY OR TOPIC CHECKLIST ─────────────────────── */}
      {activeTab === 'directory' ? (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#15181F] border border-[#2A2F3A] flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF] font-semibold">
              Browsing all 48 national & state examinations curriculum archive.
            </span>
            <button
              onClick={() => setActiveTab('official')}
              className="text-xs text-[#1CB0F6] font-bold hover:underline cursor-pointer"
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
          <div className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1CB0F6]" /> Custom Student Learning Path
              </h4>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                Drag, rearrange, add custom chapters, or import directly from official exam benchmarks.
              </p>
            </div>
            <button
              onClick={() => {
                setTargetSubject('');
                setIsAddCustomTopicOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#1CB0F6] hover:bg-[#1899D6] text-[#052840] font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md border-b-2 border-[#1899D6]"
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
        /* ── OFFICIAL SYLLABUS TOPIC CHECKLIST ── */
        <div className="space-y-3.5">
          {/* Playful Veer Mascot Study Motivation Banner */}
          <div 
            onClick={() => { soundFx.playChestOpen(); triggerConfetti({ particleCount: 35, spread: 50 }); }}
            className="p-3 sm:p-3.5 rounded-2xl bg-[var(--sr-surface)] border border-[var(--sr-line-strong)] flex items-center justify-between gap-3 shadow-sm cursor-pointer hover:border-[var(--sr-primary)] transition-all select-none active:scale-[0.99] text-[var(--sr-text)]"
          >
            <div className="flex items-center gap-3">
              <AspirantMascot size="sm" state="encouraging" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] border border-[var(--sr-primary)]/30">
                    Syllabus Mastery
                  </span>
                  <span className="text-xs text-[var(--sr-amber)] font-extrabold flex items-center gap-1">
                    🎯 +10 XP per subtopic
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-[var(--sr-text)] mt-0.5">
                  Roz 2 chapters mark off karo. Consistency hi AIR-1 banati hai! Tap Veer for power!
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1.5 rounded-xl bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] border border-[var(--sr-primary)]/30 text-xs font-black">
              Tap Mascot 🪶
            </span>
          </div>

          {/* 1. Primary Subject Switcher Pills (Physics, Chemistry, Maths, etc.) */}
          {availableSubjects.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => { soundFx.playTap(); setSelectedSubjectFilter('ALL'); }}
                className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 active:translate-y-0.5 ${
                  selectedSubjectFilter === 'ALL'
                    ? 'bg-[var(--sr-primary)] text-[var(--sr-on-primary)] shadow-md border-b-[4px] border-[var(--sr-primary-depth)] active:border-b-0'
                    : 'bg-[var(--sr-surface)] border border-[var(--sr-line-strong)] text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] hover:bg-[var(--sr-surface-2)]'
                }`}
              >
                <span>All Subjects</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                  {currentTopics.length}
                </span>
              </button>
              {availableSubjects.map((subj) => (
                <button
                  key={subj.name}
                  onClick={() => { soundFx.playTap(); setSelectedSubjectFilter(subj.name); }}
                  className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 active:translate-y-0.5 ${
                    selectedSubjectFilter === subj.name
                      ? 'bg-[var(--sr-blue)] text-white shadow-md border-b-[4px] border-[var(--sr-blue-depth)] active:border-b-0'
                      : 'bg-[var(--sr-surface)] border border-[var(--sr-line-strong)] text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] hover:bg-[var(--sr-surface-2)]'
                  }`}
                >
                  <span>{subj.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                    {subj.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 2. Compact Search & Filter Toolbar */}
          <div className="p-3 rounded-2xl bg-[#15181F] border-2 border-[#2A2F3A] border-b-[4px] border-b-[#1A1D24] flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-md">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search chapters or topics..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-7 py-2 rounded-xl bg-[#0F1115] border border-[#2A2F3A] text-xs text-white placeholder-[#6B7280] outline-none focus:border-[#1CB0F6] transition"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Dropdowns & Quick Action */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto justify-end">
              {stages.length > 2 && (
                <select
                  value={activeStageFilter}
                  onChange={e => setActiveStageFilter(e.target.value)}
                  className="bg-[#0F1115] border border-[#2A2F3A] text-xs font-bold text-[#F3F4F6] rounded-xl px-2.5 py-2 outline-none cursor-pointer"
                >
                  {stages.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              )}

              <select
                value={masteryFilter}
                onChange={e => setMasteryFilter(e.target.value as any)}
                className="bg-[#0F1115] border border-[#2A2F3A] text-xs font-bold text-[#F3F4F6] rounded-xl px-2.5 py-2 outline-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending Only</option>
                <option value="Completed">Completed Only</option>
                <option value="HighWeightage">High Weightage</option>
                <option value="NeedsRevision">Needs Revision</option>
                <option value="Weak">Weak (≤2★)</option>
              </select>

              <button
                onClick={() => toggleExpandAll(filteredTopics)}
                className="p-2.5 rounded-xl bg-[#0F1115] border border-[#2A2F3A] text-[#9CA3AF] hover:text-white text-xs font-bold shrink-0 cursor-pointer"
                title="Expand or collapse all chapters"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsAddCustomTopicOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#1CB0F6] hover:bg-[#1899D6] text-xs font-black text-[#052840] shrink-0 cursor-pointer flex items-center gap-1 shadow-sm border-b-[3px] border-[#137BAE] active:border-b-0 active:translate-y-0.5"
                title="Add your own custom chapter or topic"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Topic</span>
              </button>
            </div>
          </div>

          {/* 3. CLEAN & CLEAR CHAPTER TOPIC CARDS ── */}
          <div className="space-y-3">
            {filteredTopics.length === 0 ? (
              <div className="p-10 text-center rounded-3xl bg-[#15181F] border border-[#2A2F3A]">
                <BookOpen className="w-10 h-10 text-[#6B7280] mx-auto mb-2" />
                <p className="text-[#F3F4F6] font-bold text-sm">No chapters match your filter</p>
                <p className="text-[#9CA3AF] text-xs mt-1">Try resetting the search query or status filter.</p>
              </div>
            ) : (() => {
                const firstIncompleteId = filteredTopics.find(t => {
                  const p = taskProgressMap.get(t.id);
                  return !t.completed && p?.learningStatus !== 'completed';
                })?.id;

                return filteredTopics.map((topic, topicIdx) => {
                  const effectiveGuestLimit = guestLimit ?? Number(localStorage.getItem('aspirantx_guest_syllabus_limit') || 5);
                  const isLockedForGuest = isGuest && topicIdx >= effectiveGuestLimit;

                  if (isLockedForGuest) {
                    return (
                      <div
                        key={topic.id}
                        className="p-4 rounded-3xl bg-[#15181F] border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <LockIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#F3F4F6] blur-[2px] select-none">
                              {topic.title}
                            </h4>
                            <p className="text-[11px] text-[#9CA3AF]">
                              Login or Register to unlock complete syllabus.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={onRequireLogin}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" /> Unlock Full Syllabus
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
                  const isNextUp = topic.id === firstIncompleteId;

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
                      className={`rounded-3xl border-2 transition-all duration-150 overflow-hidden ${
                        isFullyCompleted
                          ? 'bg-[#15181F]/80 border-[#58CC02]/30 border-b-[5px] border-b-[#2A4D10]'
                          : isNextUp
                          ? 'bg-[#1A1D24] border-[#58CC02] border-b-[6px] border-b-[#3C8801] shadow-xl shadow-[#58CC02]/10 ring-2 ring-[#58CC02]/30'
                          : isExpanded
                          ? 'bg-[#1A1D24] border-[#1CB0F6]/50 border-b-[6px] border-b-[#137BAE] shadow-md'
                          : 'bg-[#15181F] border-[#2A2F3A] border-b-[5px] border-b-[#1A1D24] hover:border-[#3A404F]'
                      }`}
                    >
                      {/* ── CARD HEADER (CLEAN DUOLINGO QUEST UNIT) ── */}
                      <div
                        onClick={() => toggleAccordion(topic.id)}
                        className="p-4 sm:p-5 cursor-pointer select-none space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Tactile 3D Master Completion Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleParentTopicCompletion(topic.id);
                              }}
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shrink-0 cursor-pointer shadow-md active:translate-y-0.5 ${
                                isFullyCompleted
                                  ? 'bg-[#58CC02] text-[#0B2300] border-b-[3px] border-[#3C8801]'
                                  : 'bg-[#0F1115] text-[#9CA3AF] border-2 border-[#2A2F3A] border-b-[3px] hover:border-[#58CC02]'
                              }`}
                              title={isFullyCompleted ? 'Mark topic as incomplete' : 'Mark topic as complete'}
                            >
                              {isFullyCompleted ? (
                                <CheckCircle2 className="w-6 h-6 stroke-[3]" />
                              ) : (
                                <Circle className="w-5 h-5 text-[#4B5563]" />
                              )}
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`text-sm sm:text-base font-black tracking-tight ${isFullyCompleted ? 'line-through text-[#9CA3AF]' : 'text-white'}`}>
                                  {topic.title}
                                </h4>

                                {isNextUp && !isFullyCompleted && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#58CC02] text-[#0B2300] shadow-sm">
                                    Active Quest ⚡
                                  </span>
                                )}

                                {topic.weightage === 'High' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    High Weightage 🔥
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-[#9CA3AF] mt-1 flex items-center gap-1.5 flex-wrap font-medium">
                                <span className="font-bold text-[#1CB0F6]">{topic.category}</span>
                                <span>•</span>
                                <span>{subCount} Subtopics</span>
                                {completedCount > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[#58CC02] font-black">{completedCount} Completed</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Right: Compact Percent Chip & Chevron */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl border ${
                              isFullyCompleted 
                                ? 'bg-[#58CC02]/20 text-[#58CC02] border-[#58CC02]/40' 
                                : 'bg-[#0F1115] text-white border-[#2A2F3A]'
                            }`}>
                              {topicPercentage}%
                            </span>

                            <div className="p-1.5 rounded-xl text-[#9CA3AF] bg-[#0F1115] border border-[#2A2F3A]">
                              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#1CB0F6]' : ''}`} />
                            </div>
                          </div>
                        </div>

                        {/* Duolingo Progress Bar */}
                        <div className="w-full bg-[#0F1115] h-2 rounded-full overflow-hidden border border-[#2A2F3A]">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFullyCompleted ? 'bg-[#58CC02]' : 'bg-[#1CB0F6]'
                            }`}
                            style={{ width: `${topicPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* ── EXPANDED ACCORDION: MASTERY TOOLBAR + SUBTOPICS ── */}
                      <AccordionTransition isOpen={isExpanded} className="border-t-2 border-[#2A2F3A] bg-[#0F1115]/95 p-4 sm:p-5 space-y-4">
                        {/* 5-Dimension Mastery Row with Tactile Buttons */}
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="p-3 rounded-2xl bg-[#15181F] border border-[#2A2F3A] flex items-center justify-between flex-wrap gap-2 text-xs shadow-inner"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* 1. Learning Pill */}
                            <button
                              onClick={() => toggleLearning(topic.id)}
                              className={`px-2.5 py-1.5 rounded-xl font-black text-[10px] transition flex items-center gap-1 cursor-pointer border-b-[2px] active:border-b-0 active:translate-y-0.5 ${
                                progress.learningStatus === 'completed'
                                  ? 'bg-[#58CC02] text-[#0B2300] border-[#3C8801]'
                                  : 'bg-[#0F1115] text-[#9CA3AF] border-[#2A2F3A] hover:text-white'
                              }`}
                              title="Concept understanding"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>Concept: {progress.learningStatus === 'completed' ? 'Done' : 'Pending'}</span>
                            </button>

                            {/* 2. Practice Pill */}
                            <button
                              onClick={() => cyclePractice(topic.id)}
                              className={`px-2.5 py-1.5 rounded-xl font-black text-[10px] transition flex items-center gap-1 cursor-pointer border-b-[2px] active:border-b-0 active:translate-y-0.5 ${
                                progress.practiceStatus === 'completed'
                                  ? 'bg-[#1CB0F6] text-[#052840] border-[#137BAE]'
                                  : progress.practiceStatus === 'in_progress'
                                  ? 'bg-[#FF9600] text-[#0B2300] border-[#B86800]'
                                  : 'bg-[#0F1115] text-[#9CA3AF] border-[#2A2F3A] hover:text-white'
                              }`}
                              title="Question solving practice"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Practice: {progress.practiceStatus === 'completed' ? 'Done' : progress.practiceStatus === 'in_progress' ? 'Active' : 'Pending'}</span>
                            </button>

                            {/* 3. PYQ % Button */}
                            <button
                              onClick={() => cyclePyq(topic.id)}
                              className="px-2.5 py-1.5 rounded-xl font-black text-[10px] bg-[#0F1115] hover:bg-[#1A1D24] text-[#9CA3AF] border border-[#2A2F3A] border-b-[2px] transition flex items-center gap-1 cursor-pointer active:translate-y-0.5"
                              title="Cycle PYQ coverage"
                            >
                              <Zap className="w-3 h-3 text-[#FF9600]" />
                              <span>PYQ: <strong className="text-white">{progress.pyqPercentage}%</strong></span>
                            </button>

                            {/* 4. Spaced Revision Cycle */}
                            <button
                              onClick={() => cycleRevision(topic.id)}
                              className={`px-2.5 py-1.5 rounded-xl font-black text-[10px] transition flex items-center gap-1 cursor-pointer border-b-[2px] active:border-b-0 active:translate-y-0.5 ${
                                progress.revisionCycle > 0
                                  ? 'bg-purple-500 text-slate-950 border-purple-800'
                                  : 'bg-[#0F1115] text-[#9CA3AF] border-[#2A2F3A] hover:text-white'
                              }`}
                              title="Advance revision cycle"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{progress.revisionCycle === 0 ? 'Rev 0' : `Rev ${progress.revisionCycle}`}</span>
                            </button>
                          </div>

                          {/* 5. Mastery 1 to 5 Stars Rating */}
                          <div className="flex items-center gap-1 bg-[#0F1115] px-2.5 py-1 rounded-xl border border-[#2A2F3A]">
                            <span className="text-[10px] text-[#9CA3AF] font-bold mr-0.5">Rating:</span>
                            {([1, 2, 3, 4, 5] as MasteryRating[]).map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setMasteryRating(topic.id, star)}
                                className="cursor-pointer text-[#4B5563] hover:text-[#FF9600] transition active:scale-125"
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    star <= progress.masteryLevel
                                      ? 'text-[#FF9600] fill-[#FF9600]'
                                      : 'text-[#3A404F]'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Duolingo Gamified Subtopics Checklist */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-black uppercase tracking-wider text-[#9CA3AF]">
                              Lesson Checkpoints ({subList.length})
                            </span>
                            <span className="text-[10px] font-bold text-[#58CC02]">
                              +10 XP each
                            </span>
                          </div>

                          {subList.map((sub, sIdx) => {
                            const isSubDone = completedSubtopicIds.has(sub.id) || sub.completed;
                            return (
                              <div
                                key={sub.id || sIdx}
                                onClick={() => toggleSubtopicCompletion(sub.id)}
                                className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer active:translate-y-0.5 ${
                                  isSubDone
                                    ? 'bg-[#58CC02]/15 border-[#58CC02]/40 border-b-[3px] border-b-[#3C8801] text-white'
                                    : 'bg-[#15181F] border-[#2A2F3A] border-b-[3px] border-b-[#1A1D24] text-[#F3F4F6] hover:border-[#1CB0F6]/50'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSubtopicCompletion(sub.id);
                                    }}
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition shrink-0 ${
                                      isSubDone 
                                        ? 'bg-[#58CC02] text-[#0B2300] shadow-sm' 
                                        : 'bg-[#0F1115] border border-[#3A404F] text-[#4B5563]'
                                    }`}
                                  >
                                    {isSubDone ? (
                                      <Check className="w-4 h-4 stroke-[3]" />
                                    ) : (
                                      <div className="w-2 h-2 rounded-full bg-[#3A404F]" />
                                    )}
                                  </button>
                                  <span className={`text-xs font-bold leading-snug ${isSubDone ? 'line-through text-[#9CA3AF]' : 'text-white'}`}>
                                    {sub.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isSubDone && (
                                    <span className="text-[10px] font-black text-[#58CC02] bg-[#58CC02]/20 px-2 py-0.5 rounded-full font-mono">
                                      +10 XP ✓
                                    </span>
                                  )}
                                  <div className="text-[10px] text-[#9CA3AF] font-mono">
                                    ~{sub.estimatedHours || 2.5}h
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionTransition>
                    </div>
                  );
                });
              })()}
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
