import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SyllabusTopic, SubTopic, ExamType, PredictorSettings } from '../types';
import { INITIAL_SYLLABUS_HIERARCHY } from '../data/academicData';
import { EXAM_LIST } from '../lib/examList';
import { getCustomExamsFromStorage } from '../lib/customExamStore';
import { PredictorEngineWidget } from './PredictorEngineWidget';
import { GoogleSheetImportModal } from './GoogleSheetImportModal';
import { PremiumGate, FeatureFlagsMap } from './PremiumGate';
import { AcademicBulkImportModal } from './AcademicBulkImportModal';
import { AcademicGlobalSearchModal } from './AcademicGlobalSearchModal';
import { MySyllabusUploadModal } from './MySyllabusUploadModal';
import { 
  loadCompletedSubtopicIds, 
  saveCompletedSubtopicIds, 
  loadPredictorSettings, 
  calculatePredictorStats,
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
  X
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
  const [selectedExam, setSelectedExam] = useState<ExamType>(initialExam || 'UPSC_CSE');

  useEffect(() => {
    if (initialExam) {
      setSelectedExam(initialExam);
    }
  }, [initialExam]);

  // Tab State: 'official' vs 'personal'
  const [activeTab, setActiveTab] = useState<'official' | 'personal'>('official');

  // Raw syllabus nodes and derived topics for both tabs
  const [officialRawNodes, setOfficialRawNodes] = useState<any[]>([]);
  const [personalRawNodes, setPersonalRawNodes] = useState<PersonalSyllabusNode[]>([]);
  
  // Time summary map (nodeId or key -> seconds)
  const [timeSummary, setTimeSummary] = useState<Record<string, number>>({});

  // Expanded topics state
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  const [activeStageFilter, setActiveStageFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchBothTabs, setSearchBothTabs] = useState<boolean>(false);

  const [completedSubtopicIds, setCompletedSubtopicIds] = useState<Set<string>>(new Set());
  const [predictorSettings, setPredictorSettings] = useState<PredictorSettings>(() => loadPredictorSettings(userId));
  const [syncState, setSyncState] = useState<SyncState>({ status: 'synced', message: 'Ready' });
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Modals
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);
  const [isMySyllabusModalOpen, setIsMySyllabusModalOpen] = useState<boolean>(false);

  // Hierarchy Builder Modal / Form State for My Syllabus Tab
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState<boolean>(false);
  const [builderMode, setBuilderMode] = useState<'subject' | 'topic' | 'subtopic' | 'edit'>('subject');
  const [targetSubject, setTargetSubject] = useState<string>('');
  const [targetChapter, setTargetChapter] = useState<string>('');
  const [editNodeId, setEditNodeId] = useState<string | null>(null);
  
  // Builder form inputs
  const [inputSubject, setInputSubject] = useState<string>('');
  const [inputChapter, setInputChapter] = useState<string>('');
  const [inputTopic, setInputTopic] = useState<string>('');
  const [inputSubtopic, setInputSubtopic] = useState<string>('');
  const [inputStage, setInputStage] = useState<string>('Prelims');
  const [inputWeightage, setInputWeightage] = useState<string>('Medium');

  // Importing state
  const [importingNodeId, setImportingNodeId] = useState<string | null>(null);

  // Grouping helper
  const groupHierarchyNodes = (nodes: any[], completedSet: Set<string> = completedSubtopicIds) => {
    const topicsMap: Record<string, SyllabusTopic> = {};
    
    nodes.forEach((node) => {
      // Array subtopics
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
          stage: (node.stage === 'Prelims' || node.stage === 'Mains' || node.stage === 'Tier-1' || node.stage === 'Tier-2') ? node.stage : 'Prelims',
          completed: subList.length > 0 && subList.every((s) => completedSet.has(s.id) || s.completed),
          subtopicsCount: subList.length,
          completedSubtopics: subList.filter((s) => completedSet.has(s.id) || s.completed).length,
          weightage: node.weightage || 'Medium',
          notes: node.notes || node.description || '',
          subtopics: subList,
        };
        return;
      }

      // Flat node handling
      const key = `${node.subject || node.category || 'General'}::${node.chapter || node.topic || 'General Chapter'}`;
      if (!topicsMap[key]) {
        topicsMap[key] = {
          id: `topic_${node.id || Math.random().toString(36).substring(2, 6)}`,
          exam: node.exam,
          title: node.chapter || node.topic || 'General Chapter',
          category: node.subject || node.category || 'General Subject',
          stage: (node.stage === 'Prelims' || node.stage === 'Mains' || node.stage === 'Tier-1' || node.stage === 'Tier-2') ? node.stage : 'Prelims',
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

  // Derived topics via useMemo
  const officialTopics = useMemo(
    () => groupHierarchyNodes(officialRawNodes, completedSubtopicIds),
    [officialRawNodes, completedSubtopicIds]
  );

  const personalTopics = useMemo(
    () => groupHierarchyNodes(personalRawNodes, completedSubtopicIds),
    [personalRawNodes, completedSubtopicIds]
  );

  // Load completion state
  useEffect(() => {
    async function init() {
      const savedIds = await loadCompletedSubtopicIds(userId);
      setCompletedSubtopicIds(savedIds);
      setPredictorSettings(loadPredictorSettings(userId));
    }
    init();
  }, [userId]);

  // Load syllabus nodes and time summary
  const loadData = async () => {
    // 1. Fetch Official Syllabus
    let offNodes: any[] = await fetchOfficialSyllabus(selectedExam);
    if (offNodes.length === 0) {
      const customExams = getCustomExamsFromStorage();
      const customMatch = customExams.find(c => c.id === selectedExam || c.id.toLowerCase() === (selectedExam || '').toLowerCase());
      if (customMatch && Array.isArray(customMatch.syllabus) && customMatch.syllabus.length > 0) {
        offNodes = customMatch.syllabus;
      } else {
        const normalizeKey = (e: string) => {
          const s = (e || '').toLowerCase().replace(/[\s\-_]/g, '');
          if (s.includes('nda') || s.includes('defence') || s.includes('naval')) return 'nda';
          if (s.includes('neet') || s.includes('medical') || s.includes('eligibilitycum')) return 'neet';
          if (s.includes('upsc') || s.includes('civil') || s.includes('cse')) return 'upsc';
          if (s.includes('ssc') || s.includes('cgl') || s.includes('staffselection')) return 'ssc';
          return s;
        };
        offNodes = INITIAL_SYLLABUS_HIERARCHY.filter(
          n => normalizeKey(n.exam || '') === normalizeKey(selectedExam)
        );
      }
    }
    setOfficialRawNodes(offNodes);

    // 2. Fetch Personal Syllabus
    const pNodes = await fetchPersonalSyllabus(userId, selectedExam);
    setPersonalRawNodes(pNodes);

    // 3. Fetch Time Summary
    const summary = await fetchSyllabusTimeSummary(userId);
    setTimeSummary(summary);
  };

  // Auto-expand top topics when syllabus raw nodes change
  useEffect(() => {
    const initExpanded: Record<string, boolean> = {};
    if (officialTopics.length > 0) {
      initExpanded[officialTopics[0].id] = true;
      if (officialTopics[1]) initExpanded[officialTopics[1].id] = true;
    }
    if (personalTopics.length > 0) {
      initExpanded[personalTopics[0].id] = true;
    }
    if (Object.keys(initExpanded).length > 0) {
      setExpandedTopics((prev) => ({ ...initExpanded, ...prev }));
    }
  }, [officialRawNodes, personalRawNodes]);

  useEffect(() => {
    loadData();

    const handleSyllabusUpdate = () => {
      loadData();
    };

    const handleTimeUpdate = (e: CustomEvent) => {
      if (e.detail) {
        const { nodeId, secondsLogged, subject, topic, subtopic } = e.detail;
        setTimeSummary((prev) => {
          const next = { ...prev };
          if (nodeId) {
            next[nodeId] = (next[nodeId] || 0) + secondsLogged;
          }
          const key = `${subject}|||${topic}|||${subtopic}`;
          next[key] = (next[key] || 0) + secondsLogged;
          return next;
        });
      }
    };

    window.addEventListener('aspirantx_personal_syllabus_updated', handleSyllabusUpdate);
    window.addEventListener('aspirantx_syllabus_time_updated', handleTimeUpdate as EventListener);
    return () => {
      window.removeEventListener('aspirantx_personal_syllabus_updated', handleSyllabusUpdate);
      window.removeEventListener('aspirantx_syllabus_time_updated', handleTimeUpdate as EventListener);
    };
  }, [selectedExam, userId]);

  // Set of imported official IDs
  const importedOfficialIds = new Set(
    personalRawNodes.map((n) => n.origin_official_id).filter(Boolean) as string[]
  );

  // Toggle completion
  const toggleSubtopicCompletion = async (subtopicId: string) => {
    const nextSet = new Set<string>(completedSubtopicIds);
    const isNowChecking = !nextSet.has(subtopicId);

    if (nextSet.has(subtopicId)) {
      nextSet.delete(subtopicId);
    } else {
      nextSet.add(subtopicId);
    }

    setCompletedSubtopicIds(nextSet);
    
    setSyncState({ status: 'saving', message: 'Syncing progress...' });
    const res = await saveCompletedSubtopicIds(nextSet, userId);
    setSyncState(res);

    if (isNowChecking) {
      await awardXPAndCoins(30, 10, 'Checked off Syllabus Sub-topic', userId);
    }
  };

  const toggleParentTopicNodes = async (subtopicNodes: PersonalSyllabusNode[]) => {
    if (!subtopicNodes || subtopicNodes.length === 0) return;
    const allCurrentlyDone = subtopicNodes.every((n) => completedSubtopicIds.has(n.id));
    const nextSet = new Set<string>(completedSubtopicIds);
    subtopicNodes.forEach((n) => {
      if (allCurrentlyDone) nextSet.delete(n.id);
      else nextSet.add(n.id);
    });
    setCompletedSubtopicIds(nextSet);
    setSyncState({ status: 'saving', message: 'Syncing progress...' });
    const res = await saveCompletedSubtopicIds(nextSet, userId);
    setSyncState(res);
    if (!allCurrentlyDone) {
      await awardXPAndCoins(30, 10, 'Checked off Syllabus Topic', userId);
    }
  };

  const toggleParentTopicCompletion = async (topicList: SyllabusTopic[], topicId: string) => {
    const targetTopic = topicList.find((t) => t.id === topicId);
    if (!targetTopic || !targetTopic.subtopics) return;

    const allCurrentlyDone = targetTopic.subtopics.every((s) => completedSubtopicIds.has(s.id));
    const nextSet = new Set<string>(completedSubtopicIds);

    targetTopic.subtopics.forEach((s) => {
      if (allCurrentlyDone) {
        nextSet.delete(s.id);
      } else {
        nextSet.add(s.id);
      }
    });

    setCompletedSubtopicIds(nextSet);
    setSyncState({ status: 'saving', message: 'Syncing progress...' });
    const res = await saveCompletedSubtopicIds(nextSet, userId);
    setSyncState(res);
  };

  const toggleAccordion = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const toggleExpandAll = (currentTopics: SyllabusTopic[]) => {
    const allExpanded = currentTopics.every((t) => expandedTopics[t.id]);
    const nextState: Record<string, boolean> = {};
    currentTopics.forEach((t) => {
      nextState[t.id] = !allExpanded;
    });
    setExpandedTopics(nextState);
  };

  const handleResetProgress = async () => {
    if (window.confirm('Are you sure you want to reset all checked progress for this syllabus?')) {
      const emptySet = new Set<string>();
      setCompletedSubtopicIds(emptySet);
      setSyncState({ status: 'saving', message: 'Resetting...' });
      const res = await saveCompletedSubtopicIds(emptySet, userId);
      setSyncState(res);
    }
  };

  // Import handler for Official Syllabus Tab
  const handleImportNode = async (
    items: Array<{ subject: string; topic?: string; subtopic?: string; officialNodeId: string; stage?: string; weightage?: string }>
  ) => {
    if (items.length === 0) return;
    setImportingNodeId(items[0].officialNodeId);
    const res = await importFromOfficial(userId || 'guest', selectedExam, items);
    setImportingNodeId(null);
    if (res.imported.length > 0) {
      setImportNotification(`Successfully imported ${res.imported.length} topic(s) to My Syllabus!`);
      setTimeout(() => setImportNotification(null), 4000);
      loadData();
    } else if (res.alreadyImported.length > 0) {
      setImportNotification(`Selected items are already in My Syllabus.`);
      setTimeout(() => setImportNotification(null), 3000);
    }
  };

  // Import handler for Google Sheet Import Success
  const handleGoogleSheetImportSuccess = async (topics: SyllabusTopic[], message: string) => {
    if (!topics || topics.length === 0) return;

    try {
      // Group topics by category (subject name)
      const groupedBySubject: Record<string, SyllabusTopic[]> = {};
      topics.forEach((t) => {
        const subjectName = (t.category || t.title || 'Imported Subject').trim();
        if (!groupedBySubject[subjectName]) {
          groupedBySubject[subjectName] = [];
        }
        groupedBySubject[subjectName].push(t);
      });

      // Process each subject group and save to My Syllabus
      for (const [subjectName, subjectTopics] of Object.entries(groupedBySubject)) {
        const existingSubjectNodes = personalRawNodes.filter(
          (n) => n.subject.toLowerCase() === subjectName.toLowerCase()
        );

        const newNodesForSubject: PersonalSyllabusNode[] = [];

        subjectTopics.forEach((topic) => {
          const chapterTitle = topic.title || 'General Chapter';
          const stageVal = (topic.stage === 'Prelims' || topic.stage === 'Mains' || topic.stage === 'Tier-1' || topic.stage === 'Tier-2') ? topic.stage : 'Prelims';
          const weightageVal = topic.weightage || 'Medium';

          if (Array.isArray(topic.subtopics) && topic.subtopics.length > 0) {
            topic.subtopics.forEach((sub, idx) => {
              newNodesForSubject.push({
                id: `pers_node_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
                exam: selectedExam,
                subject: subjectName,
                chapter: chapterTitle,
                topic: chapterTitle,
                subtopic: sub.title || chapterTitle,
                stage: stageVal,
                weightage: sub.weightage || weightageVal,
                time_studied_seconds: 0
              });
            });
          } else {
            newNodesForSubject.push({
              id: `pers_node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              exam: selectedExam,
              subject: subjectName,
              chapter: chapterTitle,
              topic: chapterTitle,
              subtopic: chapterTitle,
              stage: stageVal,
              weightage: weightageVal,
              time_studied_seconds: 0
            });
          }
        });

        const allNodesForSubject = [...existingSubjectNodes, ...newNodesForSubject];

        await savePersonalSubjectSyllabus(
          userId || 'guest',
          selectedExam,
          subjectName,
          allNodesForSubject
        );
      }

      setActiveTab('personal');
      setImportNotification(message || 'Successfully imported Google Sheet to My Syllabus!');
      setTimeout(() => setImportNotification(null), 4000);
      await loadData();
    } catch (err) {
      console.error('Error saving Google Sheet import:', err);
      setImportNotification('Failed to save imported syllabus. Please try again.');
      setTimeout(() => setImportNotification(null), 4000);
    }
  };

  // Hierarchy Builder actions for My Syllabus Tab
  const openAddSubject = () => {
    setBuilderMode('subject');
    setInputSubject('');
    setInputChapter('');
    setInputSubtopic('');
    setIsBuilderModalOpen(true);
  };

  const openAddTopic = (subjectName: string) => {
    setBuilderMode('topic');
    setTargetSubject(subjectName);
    setInputSubject(subjectName);
    setInputChapter('');
    setInputSubtopic('');
    setIsBuilderModalOpen(true);
  };

  const openAddSubtopic = (subjectName: string, chapterName: string) => {
    setBuilderMode('subtopic');
    setTargetSubject(subjectName);
    setTargetChapter(chapterName);
    setInputSubject(subjectName);
    setInputChapter(chapterName);
    setInputSubtopic('');
    setIsBuilderModalOpen(true);
  };

  const handleSaveBuilderNode = async () => {
    if (!inputSubject.trim()) {
      alert('Subject name is required.');
      return;
    }

    let nodesToSave: PersonalSyllabusNode[] = [...personalRawNodes];

    if (builderMode === 'subject') {
      const newNode: PersonalSyllabusNode = {
        id: `pers_node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        exam: selectedExam,
        subject: inputSubject.trim(),
        chapter: inputChapter.trim() || 'General Chapter',
        topic: inputTopic.trim() || 'General Topic',
        subtopic: inputSubtopic.trim() || 'Overview',
        stage: inputStage,
        weightage: inputWeightage,
        time_studied_seconds: 0
      };
      nodesToSave.push(newNode);
    } else if (builderMode === 'topic') {
      const newNode: PersonalSyllabusNode = {
        id: `pers_node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        exam: selectedExam,
        subject: targetSubject,
        chapter: inputChapter.trim() || 'New Chapter',
        topic: inputTopic.trim() || inputChapter.trim() || 'New Topic',
        subtopic: inputSubtopic.trim() || 'Topic Overview',
        stage: inputStage,
        weightage: inputWeightage,
        time_studied_seconds: 0
      };
      nodesToSave.push(newNode);
    } else if (builderMode === 'subtopic') {
      const newNode: PersonalSyllabusNode = {
        id: `pers_node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        exam: selectedExam,
        subject: targetSubject,
        chapter: targetChapter,
        topic: targetChapter,
        subtopic: inputSubtopic.trim() || 'New Subtopic',
        stage: inputStage,
        weightage: inputWeightage,
        time_studied_seconds: 0
      };
      nodesToSave.push(newNode);
    }

    await savePersonalSubjectSyllabus(
      userId,
      selectedExam,
      inputSubject.trim(),
      nodesToSave.filter((n) => n.subject.toLowerCase() === inputSubject.trim().toLowerCase())
    );

    setIsBuilderModalOpen(false);
    loadData();
  };

  const handleDeleteSubject = async (subjectName: string) => {
    if (window.confirm(`Are you sure you want to delete the entire subject "${subjectName}" from My Syllabus?`)) {
      await removePersonalSubject(userId, selectedExam, subjectName);
      loadData();
    }
  };

  const handleDeleteNode = async (subjectName: string, nodeId: string) => {
    const updated = personalRawNodes.filter((n) => n.id !== nodeId);
    await saveAllPersonalSyllabusNodes(userId, selectedExam, updated);
    setPersonalRawNodes(updated);
  };

  // Determine active topics list
  let currentTopics = activeTab === 'official' ? officialTopics : personalTopics;

  if (searchBothTabs && searchQuery.trim()) {
    // Combine both sets
    currentTopics = [...officialTopics, ...personalTopics];
  }

  // Filter topics based on stage & search query
  const filteredTopics = currentTopics.filter((t) => {
    const matchesStage = activeStageFilter === 'All' || t.stage === activeStageFilter;
    const matchesQuery = 
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subtopics && t.subtopics.some((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesStage && matchesQuery;
  });

  // Calculate distinct progress metrics
  const getProgressStats = (topicList: SyllabusTopic[]) => {
    let totalSubs = 0;
    let completedSubs = 0;
    topicList.forEach((t) => {
      if (t.subtopics) {
        totalSubs += t.subtopics.length;
        completedSubs += t.subtopics.filter((s) => completedSubtopicIds.has(s.id) || s.completed).length;
      }
    });
    const percent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;
    return { totalSubs, completedSubs, percent };
  };

  const officialStats = getProgressStats(officialTopics);
  const personalStats = getProgressStats(personalTopics);

  // Predictor stats
  const activeStats = calculatePredictorStats(currentTopics, predictorSettings, selectedExam);

  const stages = ['All', ...Array.from(new Set(currentTopics.map((t) => t.stage).filter(Boolean)))];

  return (
    <div className="space-y-6 pb-12">
      {/* Predictor Engine Dynamic Widget */}
      <PremiumGate
        featureName="ai_predictor"
        featureTitle="PYQ Syllabus Predictor Engine"
        isUserPremium={isUserPremium}
        isGuest={isGuest}
        featureFlags={featureFlags}
        onOpenPremium={onOpenPremium}
        onRequireLogin={onRequireLogin}
      >
        <PredictorEngineWidget
          stats={activeStats}
          settings={predictorSettings}
          onUpdateSettings={(newSettings) => setPredictorSettings(newSettings)}
          examName={selectedExam}
        />
      </PremiumGate>

      {/* Main Header & Actions */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-black/40 border border-white/10 backdrop-blur-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#00FF94]" />
              {EXAM_LIST.find((ex) => ex.id === selectedExam)?.label || selectedExam} Syllabus Engine
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 transition-all ${
                syncState.status === 'synced'
                  ? 'bg-[#00FF94]/10 text-[#00FF94] border-[#00FF94]/30'
                  : syncState.status === 'saving'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
            >
              <CloudCheck className="w-3.5 h-3.5" />
              {syncState.message || 'Saved to Supabase'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Switch between official standard syllabus and your personalized custom study roadmap.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <button
            onClick={() => setIsGlobalSearchOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-cyan-300 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Search All</span>
          </button>

          <button
            onClick={() => setIsMySyllabusModalOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-purple-400/30 flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Layers className="w-4 h-4 text-purple-200" />
            Bulk CSV Upload
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00FF94] to-cyan-400 hover:opacity-90 text-black font-extrabold text-xs transition-all shadow-[0_0_15px_rgba(0,255,148,0.3)] flex items-center justify-center gap-2 min-h-[44px]"
          >
            <FileSpreadsheet className="w-4 h-4" /> Import Sheet
          </button>

          <button
            onClick={handleResetProgress}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Reset All Progress"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {importNotification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-[#00FF94]/10 border border-[#00FF94]/30 text-[#00FF94] text-xs font-bold flex items-center gap-3 shadow-[0_0_20px_rgba(0,255,148,0.2)]"
        >
          <Sparkles className="w-5 h-5 shrink-0" />
          <span>{importNotification}</span>
        </motion.div>
      )}

      {/* TOP LEVEL TAB TOGGLE: Official Syllabus vs My Syllabus */}
      <div className="p-2 rounded-3xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-black/60 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('official')}
            className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'official'
                ? 'bg-gradient-to-r from-[#00FF94] to-cyan-400 text-black shadow-[0_0_20px_rgba(0,255,148,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Official Syllabus</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'official' ? 'bg-black/30 text-black' : 'bg-white/10 text-slate-300'
            }`}>
              {officialStats.completedSubs}/{officialStats.totalSubs}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Syllabus</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'personal' ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-300'
            }`}>
              {personalStats.completedSubs}/{personalStats.totalSubs}
            </span>
          </button>
        </div>

        {/* Tab Progress Bar Indicator */}
        <div className="w-full sm:w-72 px-4 py-2 bg-black/40 rounded-2xl border border-white/5 flex flex-col justify-center">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
            <span className="text-slate-300">
              {activeTab === 'official' ? 'Official Coverage' : 'My Syllabus Coverage'}
            </span>
            <span className={activeTab === 'official' ? 'text-[#00FF94]' : 'text-purple-400'}>
              {activeTab === 'official' ? `${officialStats.percent}%` : `${personalStats.percent}%`}
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                activeTab === 'official' ? 'bg-gradient-to-r from-[#00FF94] to-cyan-400' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
              }`}
              style={{
                width: `${activeTab === 'official' ? officialStats.percent : personalStats.percent}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Tab Specific Helper Header & Builder Trigger */}
      {activeTab === 'personal' && (
        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div>
            <h4 className="text-xs font-black text-purple-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Custom Student Hierarchy
            </h4>
            <p className="text-[11px] text-purple-300/80 mt-0.5">
              Add custom subjects, chapters, topics, or subtopics directly or import from Official Syllabus.
            </p>
          </div>
          <button
            onClick={openAddSubject}
            className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add New Subject
          </button>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Stage Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#00FF94]" /> Stage:
          </span>
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => setActiveStageFilter(stage)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeStageFilter === stage
                  ? 'bg-[#00FF94]/20 text-[#00FF94] border border-[#00FF94]/40 shadow-[0_0_10px_rgba(0,255,148,0.2)]'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>

        {/* Search Bar, Option & Accordion Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics or sub-topics..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#00FF94] transition-all"
            />
          </div>

          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={searchBothTabs}
              onChange={(e) => setSearchBothTabs(e.target.checked)}
              className="rounded accent-[#00FF94]"
            />
            <span>Search both tabs</span>
          </label>

          <button
            onClick={() => toggleExpandAll(currentTopics)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
          >
            Expand/Collapse All
          </button>
        </div>
      </div>

      {/* Topic List Render */}
      {activeTab === 'personal' ? (
        <MySyllabusDndTree
          rawNodes={personalRawNodes}
          selectedExam={selectedExam}
          userId={userId}
          completedSubtopicIds={completedSubtopicIds}
          timeSummary={timeSummary}
          searchQuery={searchQuery}
          activeStageFilter={activeStageFilter}
          onToggleSubtopic={toggleSubtopicCompletion}
          onToggleTopic={(nodes) => toggleParentTopicNodes(nodes)}
          onOpenAddSubject={openAddSubject}
          onOpenAddTopic={(subj) => openAddTopic(subj)}
          onOpenAddSubtopic={(subj, chap) => openAddSubtopic(subj, chap)}
          onDeleteSubject={handleDeleteSubject}
          onDeleteNode={handleDeleteNode}
          onNodesChanged={(newNodes) => setPersonalRawNodes(newNodes)}
        />
      ) : (
        <div className="space-y-4">
          {filteredTopics.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-black/40 border border-white/10">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-bold">
                No official topics match your filter
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Try clearing search or changing the stage filter.
              </p>
            </div>
          ) : (
          filteredTopics.map((topic, topicIdx) => {
            const effectiveGuestLimit = guestLimit ?? Number(localStorage.getItem('aspirantx_guest_syllabus_limit') || 5);
            const isLockedForGuest = isGuest && topicIdx >= effectiveGuestLimit;

            if (isLockedForGuest) {
              return (
                <div
                  key={topic.id}
                  className="p-5 rounded-3xl bg-slate-900/60 border border-amber-500/20 backdrop-blur-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group shadow-lg"
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                          Demo Mode Locked
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Demo Mode limit reached ({effectiveGuestLimit} Topics max). Login or Register to unlock complete syllabus.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onRequireLogin}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
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
            const isFullyCompleted = subCount > 0 && completedCount === subCount;

            // Check if all subtopics in this topic are imported to My Syllabus
            const isEntireTopicImported = subList.length > 0 && subList.every((s) => importedOfficialIds.has(s.id));

            return (
              <div
                key={topic.id}
                className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                  isFullyCompleted
                    ? 'bg-[#00FF94]/5 border-[#00FF94]/30 shadow-[0_0_20px_rgba(0,255,148,0.1)]'
                    : isExpanded
                    ? 'bg-gradient-to-br from-[#0e0e12] to-[#08080a] border-white/15 shadow-xl'
                    : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Topic Accordion Header */}
                <div
                  onClick={() => toggleAccordion(topic.id)}
                  className="p-5 sm:p-6 cursor-pointer flex items-center justify-between gap-4 select-none"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleParentTopicCompletion(filteredTopics, topic.id);
                      }}
                      className="mt-0.5 text-slate-400 hover:text-[#00FF94] transition-colors shrink-0 cursor-pointer"
                      title={isFullyCompleted ? 'Uncheck all subtopics' : 'Check all subtopics'}
                    >
                      {isFullyCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-[#00FF94] fill-[#00FF94]/20 shadow-[0_0_10px_rgba(0,255,148,0.4)]" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-600 hover:text-[#00FF94]" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-base font-extrabold tracking-tight ${isFullyCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                          {topic.title}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                            topic.weightage === 'High'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : topic.weightage === 'Medium'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {topic.weightage} Weight
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-cyan-300 border border-white/10">
                          {topic.stage}
                        </span>

                        {/* Official Syllabus Tab -> Bulk Import Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isEntireTopicImported) return;
                            const items = subList.map((s) => ({
                              subject: topic.category,
                              topic: topic.title,
                              subtopic: s.title,
                              officialNodeId: s.id,
                              stage: topic.stage,
                              weightage: topic.weightage
                            }));
                            handleImportNode(items);
                          }}
                          disabled={isEntireTopicImported}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                            isEntireTopicImported
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 opacity-70 cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                          }`}
                        >
                          <Download className="w-3 h-3" />
                          {isEntireTopicImported ? '✓ In My Syllabus' : 'Import This Subject'}
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>{topic.category}</span>
                        <span>•</span>
                        <span className="text-[#00FF94] font-semibold">
                          {completedCount} of {subCount} Sub-topics Completed
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-xs font-black text-white">{topicPercentage}%</span>
                      <div className="w-20 h-1.5 bg-black/60 rounded-full overflow-hidden mt-1 border border-white/10">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isFullyCompleted ? 'bg-[#00FF94]' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${topicPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Sub-topics Accordion Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-white/10 bg-black/60 p-5 sm:p-6 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                        <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#00FF94]" /> Sub-topics Checklist ({subList.length})
                        </span>
                      </div>

                      {subList.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3">No individual sub-topics loaded.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5">
                          {subList.map((sub) => {
                            const isDone = completedSubtopicIds.has(sub.id) || sub.completed;
                            const isImported = importedOfficialIds.has(sub.id) || Boolean(sub.origin_official_id);

                            // Calculate accumulated time studied for this subtopic
                            const key = `${topic.category}|||${topic.title}|||${sub.title}`;
                            const studiedSecs = timeSummary[sub.id] || sub.time_studied_seconds || timeSummary[key] || 0;
                            const timeText = formatStudiedTime(studiedSecs);

                            return (
                              <div
                                key={sub.id}
                                onClick={() => toggleSubtopicCompletion(sub.id)}
                                className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group ${
                                  isDone
                                    ? 'bg-[#00FF94]/10 border-[#00FF94]/30 text-slate-300 shadow-[0_0_10px_rgba(0,255,148,0.1)]'
                                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/15 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="shrink-0">
                                    {isDone ? (
                                      <div className="w-5 h-5 rounded-lg bg-[#00FF94] text-black flex items-center justify-center font-bold shadow-[0_0_10px_rgba(0,255,148,0.5)]">
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-lg border-2 border-slate-600 group-hover:border-[#00FF94] transition-colors" />
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <span className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                                      {sub.title}
                                    </span>

                                    {/* PHASE 5: Time Studied Badge */}
                                    {studiedSecs > 0 && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                        <Clock className="w-3 h-3 text-cyan-400 animate-pulse" />
                                        {timeText}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Official Syllabus Tab -> Single Subtopic Import Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isImported) return;
                                      handleImportNode([{
                                        subject: topic.category,
                                        topic: topic.title,
                                        subtopic: sub.title,
                                        officialNodeId: sub.id,
                                        stage: topic.stage,
                                        weightage: topic.weightage
                                      }]);
                                    }}
                                    disabled={isImported}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                      isImported
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 cursor-not-allowed opacity-80'
                                        : 'bg-purple-600/80 hover:bg-purple-500 text-white shadow-md'
                                    }`}
                                  >
                                    {importingNodeId === sub.id ? (
                                      <span>Importing...</span>
                                    ) : isImported ? (
                                      <span>✓ In My Syllabus</span>
                                    ) : (
                                      <>
                                        <Download className="w-3 h-3" />
                                        <span>Import to My Syllabus</span>
                                      </>
                                    )}
                                  </button>

                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-[#00FF94]" /> {sub.estimatedHours || 2.5} hrs
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {topic.notes && (
                        <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-start gap-2">
                          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span><strong>Note:</strong> {topic.notes}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    )}

      {/* Hierarchy Builder Modal for My Syllabus Tab */}
      <AnimatePresence>
        {isBuilderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-400" />
                  {builderMode === 'subject' && 'Add New Custom Subject'}
                  {builderMode === 'topic' && `Add Topic under "${targetSubject}"`}
                  {builderMode === 'subtopic' && `Add Subtopic under "${targetChapter}"`}
                </h3>
                <button
                  onClick={() => setIsBuilderModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {builderMode === 'subject' && (
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Subject Name *</label>
                    <input
                      type="text"
                      value={inputSubject}
                      onChange={(e) => setInputSubject(e.target.value)}
                      placeholder="e.g. Ancient Indian History, Ethics, Python..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                )}

                {(builderMode === 'subject' || builderMode === 'topic') && (
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Topic / Chapter Name</label>
                    <input
                      type="text"
                      value={inputChapter}
                      onChange={(e) => setInputChapter(e.target.value)}
                      placeholder="e.g. Indus Valley Civilization, Moral Philosophy..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Subtopic Title</label>
                  <input
                    type="text"
                    value={inputSubtopic}
                    onChange={(e) => setInputSubtopic(e.target.value)}
                    placeholder="e.g. Harappan Seals, Categorical Imperative..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Stage</label>
                    <select
                      value={inputStage}
                      onChange={(e) => setInputStage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                    >
                      <option value="Prelims">Prelims</option>
                      <option value="Mains">Mains</option>
                      <option value="Tier-1">Tier-1</option>
                      <option value="Tier-2">Tier-2</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Weightage</label>
                    <select
                      value={inputWeightage}
                      onChange={(e) => setInputWeightage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setIsBuilderModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBuilderNode}
                  className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-black text-xs transition-all shadow-md"
                >
                  Save to My Syllabus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google Spreadsheet Importer Modal */}
      <GoogleSheetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={(topics, message) => {
          handleGoogleSheetImportSuccess(topics, message);
          setIsImportModalOpen(false);
        }}
      />

      {/* Phase 4 Universal Bulk Import Modal */}
      <AcademicBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      {/* Phase 4 Academic Global Search Modal */}
      <AcademicGlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
      />

      {/* Student Personal Syllabus Upload Modal */}
      <MySyllabusUploadModal
        isOpen={isMySyllabusModalOpen}
        onClose={() => {
          setIsMySyllabusModalOpen(false);
          loadData();
        }}
        exam={selectedExam}
        userId={userId}
        onSyllabusUpdated={() => loadData()}
      />
    </div>
  );
};
