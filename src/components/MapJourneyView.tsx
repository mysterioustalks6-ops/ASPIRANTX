import React, { useState, useEffect, useMemo } from 'react';
import { DuolingoPathEngine } from './duolingo/DuolingoPathEngine';
import { UserProfile, ActiveTab } from '../types';
import { awardXPAndCoins } from '../lib/gamification';

const SyllabusTracker = React.lazy(() => import('./SyllabusTracker').then(m => ({ default: m.SyllabusTracker })));
import { 
  Map, 
  BookOpen, 
  Compass, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Circle, 
  X, 
  Sparkles, 
  Target, 
  HelpCircle, 
  Check,
  Layers,
  ArrowRight
} from 'lucide-react';
import { getExamConfig, normalizeExamId } from '../lib/examRegistry';
import { getLocalCompletedSubtopicIds, saveCompletedSubtopicIds } from '../lib/syllabusStorage';
import { triggerConfetti } from '../lib/animations';
import { soundFx } from '../lib/soundEffects';
import { TactileButton } from './TactileButton';

interface MapJourneyViewProps {
  user: UserProfile;
  selectedExam: string;
  isAdmin: boolean;
  featureFlagsMap: any;
  onNavigate: (tab: ActiveTab) => void;
  onExamChange: (newExam: string) => void;
  onOpenPremium: () => void;
  onRequireLogin: () => void;
}

type MasteryState = 'new' | 'learning' | 'strong';

interface TopicCellData {
  id: string;
  title: string;
  subject: string;
  mastery: MasteryState;
  isCompleted: boolean;
}

export const MapJourneyView: React.FC<MapJourneyViewProps> = ({
  user,
  selectedExam,
  isAdmin,
  featureFlagsMap,
  onNavigate,
  onExamChange,
  onOpenPremium,
  onRequireLogin,
}) => {
  // Territory View is the default mode
  const [viewMode, setViewMode] = useState<'territory' | 'list' | 'path'>('territory');
  const [selectedTopic, setSelectedTopic] = useState<TopicCellData | null>(null);
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(() =>
    getLocalCompletedSubtopicIds(user.id, selectedExam)
  );

  const normExam = normalizeExamId(selectedExam);
  const startedKey = `aspirantx_started_topics_${user.id || 'guest'}_${normExam}`;
  const [startedTopicIds, setStartedTopicIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(startedKey);
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  });

  const handleStartTopic = (topic: TopicCellData) => {
    const updated = new Set(startedTopicIds);
    updated.add(topic.id);
    updated.add(topic.title);
    setStartedTopicIds(updated);
    try {
      localStorage.setItem(startedKey, JSON.stringify(Array.from(updated)));
    } catch {}
  };

  useEffect(() => {
    const handleSync = () => {
      setCompletedTopicIds(getLocalCompletedSubtopicIds(user.id, selectedExam));
    };
    window.addEventListener('aspirantx_personal_syllabus_updated', handleSync);
    return () => window.removeEventListener('aspirantx_personal_syllabus_updated', handleSync);
  }, [user.id, selectedExam]);

  const examConfig = useMemo(() => getExamConfig(selectedExam), [selectedExam]);

  // Build subject territories and topic cells
  const territories = useMemo(() => {
    const norm = normalizeExamId(selectedExam);
    const subjects = examConfig.subjects && examConfig.subjects.length > 0 
      ? examConfig.subjects 
      : ['Physics', 'Chemistry', 'Biology'];

    return subjects.map((subject, sIdx) => {
      const treeNode = examConfig.syllabusTree?.[subject];
      let topicList: string[] = [];

      if (treeNode && Array.isArray(treeNode.topics) && treeNode.topics.length > 0) {
        topicList = treeNode.topics;
      } else {
        topicList = [
          `${subject} Fundamental Overview`,
          'Standard Laws & Principles',
          'High-Yield Problem Solving',
          'Applied Real-World Cases',
          'Unit Assessment & PYQs'
        ];
      }

      const cells: TopicCellData[] = topicList.map((topicTitle, tIdx) => {
        const topicId = `topic-${norm}-${sIdx}-${tIdx}`;
        const isDone = completedTopicIds.has(topicId) || completedTopicIds.has(topicTitle);
        const isStarted = startedTopicIds.has(topicId) || startedTopicIds.has(topicTitle);

        let mastery: MasteryState = 'new';
        if (isDone) {
          mastery = 'strong';
        } else if (isStarted) {
          mastery = 'learning';
        } else {
          mastery = 'new';
        }

        return {
          id: topicId,
          title: topicTitle,
          subject,
          mastery,
          isCompleted: isDone,
        };
      });

      const completedInSubject = cells.filter(c => c.isCompleted).length;
      const progressPercent = cells.length > 0 ? Math.round((completedInSubject / cells.length) * 100) : 0;

      return {
        subject,
        cells,
        completedCount: completedInSubject,
        totalCount: cells.length,
        progressPercent,
      };
    });
  }, [examConfig, completedTopicIds, startedTopicIds, selectedExam]);

  const handleToggleCompletion = (topic: TopicCellData) => {
    soundFx.playTap();
    const updated = new Set(completedTopicIds);
    const willComplete = !topic.isCompleted;

    const xpKey = `aspirantx_mastered_xp_${user.id || 'guest'}_${selectedExam}`;
    let awardedTopicIds: string[] = [];
    try {
      awardedTopicIds = JSON.parse(localStorage.getItem(xpKey) || '[]');
    } catch {}

    if (willComplete) {
      updated.add(topic.id);
      updated.add(topic.title);
      triggerConfetti();
      soundFx.playChestOpen();

      // Guard: strictly award XP once per topic; never re-award on unmark/remark
      if (!awardedTopicIds.includes(topic.id)) {
        awardedTopicIds.push(topic.id);
        try {
          localStorage.setItem(xpKey, JSON.stringify(awardedTopicIds));
        } catch {}
        awardXPAndCoins(50, 5, `Mastered ${topic.title}`, user.id);
      }
    } else {
      updated.delete(topic.id);
      updated.delete(topic.title);
    }

    setCompletedTopicIds(updated);
    saveCompletedSubtopicIds(updated, user.id, selectedExam);
    window.dispatchEvent(new CustomEvent('aspirantx_personal_syllabus_updated'));

    if (selectedTopic && selectedTopic.id === topic.id) {
      setSelectedTopic({
        ...selectedTopic,
        isCompleted: willComplete,
        mastery: willComplete ? 'strong' : 'learning',
      });
    }
  };

  const getMasteryBadge = (state: MasteryState) => {
    switch (state) {
      case 'strong':
        return {
          label: 'Mastered',
          badgeClass: 'bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] border-[var(--sr-primary)]/30',
          icon: CheckCircle2,
          color: 'var(--sr-primary)',
        };
      case 'learning':
        return {
          label: 'In Progress',
          badgeClass: 'bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] border-[var(--sr-blue)]/30',
          icon: Clock,
          color: 'var(--sr-blue)',
        };
      case 'new':
      default:
        return {
          label: 'New',
          badgeClass: 'bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] border-[var(--sr-line)]',
          icon: Circle,
          color: 'var(--sr-text-muted)',
        };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 px-3 sm:px-4 text-[var(--sr-text)]">
      {/* ── TOP SEGMENTED VIEW SWITCHER: Territory (default), List, Path ── */}
      <div className="flex items-center justify-center pt-1">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] max-w-sm w-full shadow-sm">
          <button
            onClick={() => { soundFx.playTap(); setViewMode('territory'); }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === 'territory'
                ? 'bg-[var(--sr-primary)] text-[var(--sr-on-primary)] shadow-sm'
                : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Territory</span>
          </button>

          <button
            onClick={() => { soundFx.playTap(); setViewMode('list'); }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === 'list'
                ? 'bg-[var(--sr-blue)] text-white shadow-sm'
                : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>List</span>
          </button>

          <button
            onClick={() => { soundFx.playTap(); setViewMode('path'); }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === 'path'
                ? 'bg-[var(--sr-purple-depth)] text-white shadow-sm'
                : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Path</span>
          </button>
        </div>
      </div>

      {/* ── 1. TERRITORY VIEW (Default) ─────────────────────────────────── */}
      {viewMode === 'territory' && (
        <div className="space-y-5 pb-24">
          {/* Header Overview Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] shadow-sm flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--sr-primary-subtle)] border border-[var(--sr-primary)]/30 flex items-center justify-center text-[var(--sr-primary)] shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[var(--sr-primary)]">
                  Exam Syllabus Territory
                </span>
                <h2 className="text-base sm:text-lg font-black text-[var(--sr-text)] tracking-tight">
                  {examConfig.displayName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--sr-text-muted)]">
                {territories.reduce((acc, t) => acc + t.completedCount, 0)}/{territories.reduce((acc, t) => acc + t.totalCount, 0)} Mastered
              </span>
            </div>
          </div>

          {/* Territory Regions by Subject */}
          {territories.map((territory, sIdx) => (
            <div 
              key={territory.subject} 
              className="p-4 sm:p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] space-y-4 shadow-sm"
            >
              {/* Region Header */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] flex items-center justify-center text-[var(--sr-primary)] font-black text-xs shrink-0">
                      {sIdx + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-black text-[var(--sr-text)] truncate">
                        {territory.subject} Region
                      </h3>
                      <p className="text-xs text-[var(--sr-text-muted)] truncate">
                        {territory.completedCount} of {territory.totalCount} topics mastered ({territory.progressPercent}%)
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-[var(--sr-text)] shrink-0">
                    {territory.progressPercent}%
                  </span>
                </div>

                {/* Region progress bar full width under the region title */}
                <div className="w-full bg-[var(--sr-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--sr-line)]">
                  <div
                    className="bg-[var(--sr-primary)] h-full rounded-full transition-all duration-300"
                    style={{ width: `${territory.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Compact 2-column Grid of MasteryCells */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {territory.cells.map((cell) => {
                  const badge = getMasteryBadge(cell.mastery);
                  const Icon = badge.icon;
                  return (
                    <button
                      key={cell.id}
                      onClick={() => {
                        soundFx.playTap();
                        setSelectedTopic(cell);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 active:scale-[0.98] min-h-[82px] select-none ${
                        cell.isCompleted
                          ? 'bg-[var(--sr-surface-2)] border-[var(--sr-primary)]/40 hover:border-[var(--sr-primary)]'
                          : 'bg-[var(--sr-surface-2)] border-[var(--sr-line)] hover:border-[var(--sr-line-strong)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 w-full">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase border flex items-center gap-1 shrink-0 ${badge.badgeClass}`}>
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                        {cell.isCompleted && (
                          <span className="w-4 h-4 rounded-full bg-[var(--sr-primary)] text-[var(--sr-on-primary)] flex items-center justify-center text-[10px] font-black shrink-0">
                            ✓
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-[var(--sr-text)] line-clamp-2 leading-snug">
                        {cell.title}
                      </h4>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 2. LIST VIEW (Checklist Guidebook) ───────────────────────────── */}
      {viewMode === 'list' && (
        <React.Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold text-xs">Loading Syllabus Checklist...</div>}>
          <SyllabusTracker
            exam={selectedExam as any}
            userId={user.id}
            isGuest={user.isGuest}
            isUserPremium={user.isPremium || isAdmin}
            featureFlags={featureFlagsMap}
            onOpenPremium={onOpenPremium}
            onRequireLogin={onRequireLogin}
          />
        </React.Suspense>
      )}

      {/* ── 3. PATH VIEW (Themed Duolingo S-Curve) ───────────────────────── */}
      {viewMode === 'path' && (
        <DuolingoPathEngine
          userProfile={user}
          selectedExam={selectedExam}
          onExamChange={onExamChange}
          onNavigate={(tab) => {
            if (tab === 'syllabus_list' || tab === 'syllabus') {
              setViewMode('list');
            } else {
              onNavigate(tab);
            }
          }}
        />
      )}

      {/* ── 4. TOPIC BOTTOMSHEET (Learn, PYQs, Flashcards, Ask Veer, Mark done) ── */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 text-left no-backdrop-blur">
          <div className="absolute inset-0" onClick={() => setSelectedTopic(null)} />
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] p-5 sm:p-6 shadow-2xl z-10 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--sr-line)] pb-3">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black uppercase text-[var(--sr-primary)] tracking-wider">
                  {selectedTopic.subject}
                </span>
                <h3 className="text-base sm:text-lg font-black text-[var(--sr-text)] leading-snug line-clamp-2 mt-0.5">
                  {selectedTopic.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTopic(null)}
                className="w-8 h-8 rounded-full bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5 Topic Actions */}
            <div className="space-y-2 pt-1">
              {/* 1. Learn */}
              <button
                onClick={() => {
                  handleStartTopic(selectedTopic);
                  setSelectedTopic(null);
                  onNavigate('syllabus');
                }}
                className="w-full p-3 rounded-2xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-primary-subtle)] border border-[var(--sr-line)] flex items-center justify-between gap-3 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--sr-surface)] border border-[var(--sr-line)] flex items-center justify-center text-[var(--sr-blue)] shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs sm:text-sm font-black text-[var(--sr-text)]">Learn Concepts</span>
                    <span className="block text-xs text-[var(--sr-text-muted)]">Core notes, formulas & overview</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--sr-text-muted)]" />
              </button>

              {/* 2. PYQs */}
              <button
                onClick={() => {
                  handleStartTopic(selectedTopic);
                  setSelectedTopic(null);
                  onNavigate('pyq');
                }}
                className="w-full p-3 rounded-2xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-primary-subtle)] border border-[var(--sr-line)] flex items-center justify-between gap-3 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--sr-surface)] border border-[var(--sr-line)] flex items-center justify-center text-[var(--sr-primary)] shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs sm:text-sm font-black text-[var(--sr-text)]">Solve PYQs</span>
                    <span className="block text-xs text-[var(--sr-text-muted)]">Previous years' solved MCQs</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--sr-text-muted)]" />
              </button>

              {/* 3. Flashcards */}
              <button
                onClick={() => {
                  handleStartTopic(selectedTopic);
                  setSelectedTopic(null);
                  onNavigate('flashcards');
                }}
                className="w-full p-3 rounded-2xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-primary-subtle)] border border-[var(--sr-line)] flex items-center justify-between gap-3 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--sr-surface)] border border-[var(--sr-line)] flex items-center justify-center text-[var(--sr-purple)] shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs sm:text-sm font-black text-[var(--sr-text)]">Active Flashcards</span>
                    <span className="block text-xs text-[var(--sr-text-muted)]">Spaced repetition memory cards</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--sr-text-muted)]" />
              </button>

              {/* 4. Ask Veer */}
              <button
                onClick={() => {
                  handleStartTopic(selectedTopic);
                  setSelectedTopic(null);
                  onNavigate('chat');
                }}
                className="w-full p-3 rounded-2xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-primary-subtle)] border border-[var(--sr-line)] flex items-center justify-between gap-3 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--sr-surface)] border border-[var(--sr-line)] flex items-center justify-center text-[var(--sr-amber)] shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs sm:text-sm font-black text-[var(--sr-text)]">Ask Veer AI Mentor</span>
                    <span className="block text-xs text-[var(--sr-text-muted)]">Clarify topic doubts & tricks</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--sr-text-muted)]" />
              </button>

              {/* 5. Mark Done / Incomplete */}
              <div className="pt-2">
                <TactileButton
                  variant={selectedTopic.isCompleted ? 'secondary' : 'primary'}
                  size="md"
                  fullWidth
                  leftIcon={<Check className="w-4 h-4" />}
                  onClick={() => handleToggleCompletion(selectedTopic)}
                >
                  {selectedTopic.isCompleted ? 'Mark as Incomplete' : 'Mark Topic as Mastered (+50 XP)'}
                </TactileButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
