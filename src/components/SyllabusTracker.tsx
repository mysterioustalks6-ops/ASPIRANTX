import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SyllabusTopic, SubTopic, ExamType, PredictorSettings } from '../types';
import { INITIAL_SYLLABUS_HIERARCHY } from '../data/academicData';
import { SYLLABUS_PRESETS } from '../data/syllabusTemplates';
import { EXAM_LIST } from '../lib/examList';
import { getCustomExamsFromStorage } from '../lib/customExamStore';
import { PredictorEngineWidget } from './PredictorEngineWidget';
import { GoogleSheetImportModal } from './GoogleSheetImportModal';
import { PremiumGate, FeatureFlagsMap } from './PremiumGate';
import { AcademicBulkImportModal } from './AcademicBulkImportModal';
import { AcademicGlobalSearchModal } from './AcademicGlobalSearchModal';
import { MySyllabusUploadModal } from './MySyllabusUploadModal';
import { getPersonalSyllabusNodes } from '../lib/personalSyllabus';
import { 
  loadCompletedSubtopicIds, 
  saveCompletedSubtopicIds, 
  loadPredictorSettings, 
  savePredictorSettings, 
  calculatePredictorStats,
  SyncState 
} from '../lib/syllabusStorage';
import { awardXPAndCoins } from '../lib/gamification';
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
  Flame,
  ShieldCheck,
  Zap,
  Info,
  Lock as LockIcon,
  FileText
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
  // Always use the prop as source of truth — no localStorage stale reads
  const [selectedExam, setSelectedExam] = useState<ExamType>(initialExam || 'UPSC_CSE');

  // Sync prop → local state whenever parent changes exam
  useEffect(() => {
    if (initialExam) {
      setSelectedExam(initialExam);
    }
  }, [initialExam]);

  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  
  // Accordion state: map of topic ID -> boolean (isExpanded)
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  const [activeStageFilter, setActiveStageFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [completedSubtopicIds, setCompletedSubtopicIds] = useState<Set<string>>(new Set());
  const [predictorSettings, setPredictorSettings] = useState<PredictorSettings>(() => loadPredictorSettings(userId));
  const [syncState, setSyncState] = useState<SyncState>({ status: 'synced', message: 'Ready' });
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Phase 4 Academic Engine States
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);
  const [isMySyllabusModalOpen, setIsMySyllabusModalOpen] = useState<boolean>(false);

  // Dynamic Grouping helper
  const groupHierarchyNodes = (nodes: any[]) => {
    const topicsMap: Record<string, SyllabusTopic> = {};
    
    nodes.forEach((node) => {
      // If node is already a topic object with subtopics array
      if (Array.isArray(node.subtopics)) {
        const topicKey = node.id || `topic_${node.title}`;
        const subList: SubTopic[] = node.subtopics.map((sub: any, idx: number) => ({
          id: sub.id || `sub_${topicKey}_${idx}`,
          topicId: topicKey,
          title: typeof sub === 'string' ? sub : (sub.title || sub.name || `Subtopic ${idx + 1}`),
          completed: Boolean(sub.completed) || completedSubtopicIds.has(sub.id),
          estimatedHours: sub.estimatedHours || 2.5,
          weightage: sub.weightage || node.weightage || 'Medium',
          notes: sub.notes || '',
        }));

        topicsMap[topicKey] = {
          id: topicKey,
          exam: node.exam,
          title: node.title || node.chapter || 'Topic',
          category: node.category || node.subject || 'General Subject',
          stage: (node.stage === 'Prelims' || node.stage === 'Mains' || node.stage === 'Tier-1' || node.stage === 'Tier-2') ? node.stage : 'Prelims',
          completed: subList.length > 0 && subList.every((s) => completedSubtopicIds.has(s.id) || s.completed),
          subtopicsCount: subList.length,
          completedSubtopics: subList.filter((s) => completedSubtopicIds.has(s.id) || s.completed).length,
          weightage: node.weightage || 'Medium',
          notes: node.notes || node.description || '',
          subtopics: subList,
        };
        return;
      }

      // Flat node handling
      const key = node.chapter || node.topic || 'General Chapter';
      if (!topicsMap[key]) {
        topicsMap[key] = {
          id: `topic_${node.id || Math.random().toString(36).substring(2, 6)}`,
          exam: node.exam,
          title: key,
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
      
      topicsMap[key].subtopics!.push({
        id: node.id,
        topicId: topicsMap[key].id,
        title: node.title || node.subtopic || 'Subtopic',
        completed: completedSubtopicIds.has(node.id),
        estimatedHours: node.estimatedHours || 3.0,
        weightage: node.weightage,
        notes: node.description,
      });
      topicsMap[key].subtopicsCount++;
      if (completedSubtopicIds.has(node.id)) {
        topicsMap[key].completedSubtopics++;
      }
    });
    
    // Set completion state for each parent topic
    const result = Object.values(topicsMap);
    result.forEach((t) => {
      t.completed = t.subtopicsCount > 0 && t.completedSubtopics === t.subtopicsCount;
    });
    return result;
  };

  // Initialize and load saved completion state from Supabase / LocalStorage & Custom Student Profile Syllabus
  useEffect(() => {
    async function init() {
      const savedIds = await loadCompletedSubtopicIds(userId);
      setCompletedSubtopicIds(savedIds);
      setPredictorSettings(loadPredictorSettings(userId));
    }
    init();

    const handleProfileUpdate = () => {
      init();
    };

    window.addEventListener('aspirantx_gamification_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('aspirantx_gamification_updated', handleProfileUpdate);
    };
  }, [userId]);

  // Persist predictor settings
  useEffect(() => {
    savePredictorSettings(predictorSettings, userId);
  }, [predictorSettings, userId]);

  // Load and group syllabus data for the selected exam
  useEffect(() => {
    async function fetchSyllabus() {
      let rawNodes: any[] = [];
      try {
        const res = await fetch(`/api/academic/syllabus?exam=${selectedExam}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.syllabus) && data.syllabus.length > 0) {
            rawNodes = data.syllabus;
          }
        }
      } catch (e) {
        console.warn('Using initial syllabus hierarchy data fallback');
      }

      if (rawNodes.length === 0) {
        try {
          const res = await fetch(`/api/exams/${selectedExam}/syllabus`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.topics) && data.topics.length > 0) {
              rawNodes = data.topics;
            } else if (data.success && Array.isArray(data.syllabus) && data.syllabus.length > 0) {
              rawNodes = data.syllabus;
            }
          }
        } catch (e) {
          console.warn('Custom exam syllabus route fetch warning:', e);
        }
      }
      
      if (rawNodes.length === 0) {
        // Check if selected exam is a user-created Custom Exam in localStorage
        const customExams = getCustomExamsFromStorage();
        const customMatch = customExams.find(c => c.id === selectedExam || c.id.toLowerCase() === (selectedExam || '').toLowerCase());
        if (customMatch && Array.isArray(customMatch.syllabus) && customMatch.syllabus.length > 0) {
          rawNodes = customMatch.syllabus;
        } else {
          // Normalize exam IDs the same way the server does
          const normalizeKey = (e: string) => {
            const s = (e || '').toLowerCase().replace(/[\s\-_]/g, '');
            if (s.includes('nda') || s.includes('defence') || s.includes('naval')) return 'nda';
            if (s.includes('neet') || s.includes('medical') || s.includes('eligibilitycum')) return 'neet';
            if (s.includes('upsc') || s.includes('civil') || s.includes('cse')) return 'upsc';
            if (s.includes('ssc') || s.includes('cgl') || s.includes('staffselection')) return 'ssc';
            return s;
          };
          rawNodes = INITIAL_SYLLABUS_HIERARCHY.filter(
            n => normalizeKey(n.exam || '') === normalizeKey(selectedExam)
          );
        }
      }

      // Merge student's custom personal syllabus if available
      try {
        const personalNodes = await getPersonalSyllabusNodes(userId, selectedExam);
        if (personalNodes.length > 0) {
          const userSubjects = new Set(
            personalNodes.map((n) => (n.subject || '').trim().toLowerCase())
          );
          // Drop official/global rows for any subject the student has uploaded
          const filteredGlobalNodes = rawNodes.filter(
            (n) => !userSubjects.has((n.subject || n.category || '').trim().toLowerCase())
          );
          rawNodes = [...filteredGlobalNodes, ...personalNodes];
        }
      } catch (err) {
        console.warn('Personal syllabus merge warning:', err);
      }
      
      const grouped = groupHierarchyNodes(rawNodes);
      setTopics(grouped);
      
      // Automatically expand first two topics
      if (grouped.length > 0) {
        setExpandedTopics({
          [grouped[0].id]: true,
          [grouped[1]?.id || '']: true,
        });
      }
    }
    fetchSyllabus();

    const handlePersonalSyllabusUpdate = () => {
      fetchSyllabus();
    };

    window.addEventListener('aspirantx_personal_syllabus_updated', handlePersonalSyllabusUpdate);
    return () => {
      window.removeEventListener('aspirantx_personal_syllabus_updated', handlePersonalSyllabusUpdate);
    };
  }, [selectedExam, completedSubtopicIds, userId]);

  // Handle Exam switch
  const handleExamChange = (newExam: ExamType) => {
    setSelectedExam(newExam);
    localStorage.setItem(`aspirantx_last_selected_exam_${userId || 'guest'}`, newExam);
    setActiveStageFilter('All');
    setSearchQuery('');
  };

  // Toggle individual subtopic completion
  const toggleSubtopicCompletion = async (subtopicId: string) => {
    const nextSet = new Set<string>(completedSubtopicIds);
    const isNowChecking = !nextSet.has(subtopicId);

    if (nextSet.has(subtopicId)) {
      nextSet.delete(subtopicId);
    } else {
      nextSet.add(subtopicId);
    }

    setCompletedSubtopicIds(nextSet);
    
    // Save securely in Supabase & LocalStorage
    setSyncState({ status: 'saving', message: 'Syncing progress...' });
    const res = await saveCompletedSubtopicIds(nextSet, userId);
    setSyncState(res);

    // Award Gamification Rewards
    if (isNowChecking) {
      await awardXPAndCoins(30, 10, 'Checked off Syllabus Sub-topic');
    }
  };

  // Toggle parent topic completion (check all / uncheck all)
  const toggleParentTopicCompletion = async (topicId: string) => {
    const targetTopic = topics.find((t) => t.id === topicId);
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

  // Accordion toggle single topic
  const toggleAccordion = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  // Expand / Collapse All
  const toggleExpandAll = () => {
    const allExpanded = topics.every((t) => expandedTopics[t.id]);
    const nextState: Record<string, boolean> = {};
    topics.forEach((t) => {
      nextState[t.id] = !allExpanded;
    });
    setExpandedTopics(nextState);
  };

  // Handle syllabus import from Google Spreadsheet API
  const handleImportSuccess = (importedTopics: SyllabusTopic[], message: string) => {
    setTopics(importedTopics);
    setImportNotification(message);
    
    // Expand all imported topics
    const nextExpanded: Record<string, boolean> = {};
    importedTopics.forEach((t) => {
      nextExpanded[t.id] = true;
    });
    setExpandedTopics(nextExpanded);

    setTimeout(() => setImportNotification(null), 5000);
  };

  // Reset Progress
  const handleResetProgress = async () => {
    if (window.confirm('Are you sure you want to reset all checked progress for this syllabus?')) {
      const emptySet = new Set<string>();
      setCompletedSubtopicIds(emptySet);
      setSyncState({ status: 'saving', message: 'Resetting...' });
      const res = await saveCompletedSubtopicIds(emptySet, userId);
      setSyncState(res);
    }
  };

  // Filter topics
  const filteredTopics = topics.filter((t) => {
    const matchesStage = activeStageFilter === 'All' || t.stage === activeStageFilter;
    const matchesQuery = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subtopics && t.subtopics.some((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesStage && matchesQuery;
  });

  // Calculate stats for Predictor Engine (Exam-aware)
  const predictorStats = calculatePredictorStats(topics, predictorSettings, selectedExam);

    const stages = ['All', ...Array.from(new Set(topics.map((t) => t.stage).filter(Boolean)))];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Predictor Engine Dynamic Widget */}
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
          stats={predictorStats}
          settings={predictorSettings}
          onUpdateSettings={(newSettings) => setPredictorSettings(newSettings)}
          examName={selectedExam}
        />
      </PremiumGate>

      {/* 2. Controls & Actions Header */}
      <div className="p-6 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#00FF94]" />
              {EXAM_LIST.find((ex) => ex.id === selectedExam)?.label || selectedExam} Syllabus
            </h3>
            {/* Cloud Sync Status Indicator */}
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
            Micro-detailed syllabus breakdown. Check off sub-topics to automatically update the Predictor Engine!
          </p>
        </div>

        {/* Action Buttons & Exam Switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        {/* Global Academic Search Button */}
        <button
          onClick={() => setIsGlobalSearchOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-cyan-300 transition-all flex items-center gap-2"
        >
          <Search className="w-4 h-4 text-cyan-400" />
          <span>Global Academic Search</span>
        </button>

        {/* Add My Own Syllabus Button */}
        <button
          onClick={() => setIsMySyllabusModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] border border-purple-400/30 flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4 text-purple-200" />
          Add My Own Syllabus
        </button>

        {/* Import Google Spreadsheet Button */}
        <button
          id="import-google-sheet-btn"
          onClick={() => setIsImportModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00FF94] to-cyan-400 hover:opacity-90 text-black font-extrabold text-xs transition-all shadow-[0_0_20px_rgba(0,255,148,0.3)] flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" /> Import Google Spreadsheet
        </button>

        {/* Read-Only Active Exam Indicator */}
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
          <span className="text-[10px] font-bold text-slate-400 pl-1">Exam:</span>
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs font-black text-[#00FF94] flex items-center gap-2">
            <span>{EXAM_LIST.find((ex) => ex.id === selectedExam)?.label || selectedExam}</span>
            <span className="text-[8px] bg-[#00FF94]/20 text-[#00FF94] border border-[#00FF94]/30 px-1 py-0.2 rounded font-bold uppercase">Profile Context</span>
          </div>
        </div>

          {/* Reset Button */}
          <button
            onClick={handleResetProgress}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors"
            title="Reset All Progress"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Import Notification Banner */}
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

      {/* 3. Filters & Search Bar */}
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeStageFilter === stage
                  ? 'bg-[#00FF94]/20 text-[#00FF94] border border-[#00FF94]/40 shadow-[0_0_10px_rgba(0,255,148,0.2)]'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>

        {/* Search Bar & Expand/Collapse All */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
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

          <button
            onClick={toggleExpandAll}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold shrink-0 transition-colors"
          >
            Expand/Collapse All
          </button>
        </div>
      </div>

      {/* 4. Aesthetic Accordion List of Topics & Subtopics */}
      <div className="space-y-4">
        {filteredTopics.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-black/40 border border-white/10">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-bold">No topics match your current filter</p>
            <p className="text-slate-500 text-xs mt-1">Try clearing search or changing the stage filter.</p>
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
            const completedCount = subList.filter((s) => s.completed).length;
            const topicPercentage = subCount > 0 ? Math.round((completedCount / subCount) * 100) : 0;
            const isFullyCompleted = subCount > 0 && completedCount === subCount;

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
                    {/* Toggle Checkbox for Entire Topic */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleParentTopicCompletion(topic.id);
                      }}
                      className="mt-0.5 text-slate-400 hover:text-[#00FF94] transition-colors shrink-0"
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
                    {/* Progress Badge */}
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

                    {/* Expand/Collapse Chevron */}
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
                        <span className="text-[11px] text-slate-500">
                          ~2.5 hrs per unchecked sub-topic
                        </span>
                      </div>

                      {subList.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3">No individual sub-topics loaded.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5">
                          {subList.map((sub) => {
                            const isDone = completedSubtopicIds.has(sub.id);

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
                                  {/* Custom Checkbox */}
                                  <div className="shrink-0">
                                    {isDone ? (
                                      <div className="w-5 h-5 rounded-lg bg-[#00FF94] text-black flex items-center justify-center font-bold shadow-[0_0_10px_rgba(0,255,148,0.5)]">
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-lg border-2 border-slate-600 group-hover:border-[#00FF94] transition-colors" />
                                    )}
                                  </div>

                                  <span className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                                    {sub.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-[#00FF94]" /> {sub.estimatedHours || 2.5} hrs
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Topic Notes if available */}
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

      {/* Google Spreadsheet Importer Modal */}
      <GoogleSheetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
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
        onClose={() => setIsMySyllabusModalOpen(false)}
        exam={selectedExam}
        userId={userId}
      />
    </div>
  );
};
