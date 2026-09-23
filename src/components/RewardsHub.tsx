import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Flame, 
  Clock, 
  Target, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Calendar, 
  ArrowRight, 
  Award, 
  ChevronRight,
  Shield, 
  Zap, 
  BookOpen, 
  History,
  Gift,
  X
} from 'lucide-react';
import { UserProfile, TrophyItem, ChallengeItem } from '../types';
import { PressFeedback, SlideUp, CountUp, ProgressAnimation } from '../lib/animations';
import { RewardMilestones } from './RewardMilestones';
import { getApiUrl } from '../lib/apiConfig';

interface RewardsHubProps {
  user: UserProfile | null;
  onOpenFocusShield?: () => void;
  onOpenPractice?: () => void;
  onOpenSyllabus?: () => void;
}

type TabMode = 'trophies' | 'challenges' | 'history' | 'swag';
type CategoryFilter = 'ALL' | 'FOCUS' | 'CONSISTENCY' | 'PRACTICE' | 'MASTERY' | 'SPECIAL';

export const RewardsHub: React.FC<RewardsHubProps> = ({
  user,
  onOpenFocusShield,
  onOpenPractice,
  onOpenSyllabus
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('trophies');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [selectedTrophy, setSelectedTrophy] = useState<TrophyItem | null>(null);

  const [overview, setOverview] = useState<{
    xp: number;
    level: number;
    streakDays: number;
    totalTrophies: number;
    unlockedTrophies: number;
    totalFocusMinutes: number;
  }>({
    xp: user?.xp || 0,
    level: user?.level || 1,
    streakDays: user?.streakDays || 1,
    totalTrophies: 16,
    unlockedTrophies: 0,
    totalFocusMinutes: 0
  });

  const [trophies, setTrophies] = useState<TrophyItem[]>([]);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getHeaders = () => {
    const token = localStorage.getItem('aspirantx_auth_token') || localStorage.getItem('supabase.auth.token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (user?.id) headers['x-user-id'] = user.id;
    if (user?.email) headers['x-user-email'] = user.email;
    return headers;
  };

  // Fetch Authoritative Data from Neon
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Overview
      const oRes = await fetch(getApiUrl('/api/rewards/overview'), { headers: getHeaders() });
      const oData = await oRes.json();
      if (oData.success) {
        setOverview(oData.overview);
      }

      // 2. Trophies
      const tRes = await fetch(getApiUrl('/api/rewards/achievements'), { headers: getHeaders() });
      const tData = await tRes.json();
      if (tData.success) {
        setTrophies(tData.achievements);
      }

      // 3. Challenges
      const cRes = await fetch(getApiUrl(`/api/rewards/challenges?exam=${encodeURIComponent(user.exam || 'ALL')}`), { headers: getHeaders() });
      const cData = await cRes.json();
      if (cData.success) {
        setChallenges(cData.challenges);
      }

      // 4. History
      const hRes = await fetch(getApiUrl('/api/rewards/history?limit=20'), { headers: getHeaders() });
      const hData = await hRes.json();
      if (hData.success) {
        setHistory(hData.history);
      }
    } catch (err) {
      console.error('[RewardsHub] Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, user?.exam]);

  // Filtered trophies
  const filteredTrophies = trophies.filter(t => {
    if (categoryFilter === 'ALL') return true;
    return t.category === categoryFilter;
  });

  const focusHours = Math.floor(overview.totalFocusMinutes / 60);
  const focusMins = overview.totalFocusMinutes % 60;

  // Level progress (each level is 200 XP)
  const currentLevelXp = overview.xp % 200;
  const levelProgressPct = Math.min(100, Math.round((currentLevelXp / 200) * 100));

  const rarityStyles = {
    LEGENDARY: {
      border: 'border-purple-500/50 hover:border-purple-400',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
      pill: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    },
    EPIC: {
      border: 'border-amber-500/50 hover:border-amber-400',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      pill: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
    RARE: {
      border: 'border-cyan-500/50 hover:border-cyan-400',
      glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
      pill: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
    },
    COMMON: {
      border: 'border-slate-700/60 hover:border-slate-600',
      glow: '',
      pill: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* ── HEADER BANNER ────────────────────────────────────────────── */}
      <SlideUp delay={0.05}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/90 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 mb-3">
                <Trophy className="w-3.5 h-3.5" />
                <span>Academic Record & Trophy Collection</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Study Motivation & Rewards
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-1 max-w-xl">
                Every verified study hour, CBT test, and task you complete builds an immutable academic trophy collection.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3">
              {onOpenFocusShield && (
                <PressFeedback>
                  <button
                    onClick={onOpenFocusShield}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 text-sm font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Focus Shield</span>
                  </button>
                </PressFeedback>
              )}
            </div>
          </div>

          {/* 4 Stat Telemetry Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-800/80">
            {/* Stat 1: Total XP & Level */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
                <span>Level {overview.level}</span>
                <span className="text-sky-400 font-bold">{overview.xp} XP</span>
              </div>
              <div className="text-2xl font-black text-white">
                <CountUp value={overview.xp} duration={0.8} /> <span className="text-xs font-medium text-slate-400">Total XP</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2.5">
                <div 
                  className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-500" 
                  style={{ width: `${levelProgressPct}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1 text-right">
                {200 - currentLevelXp} XP to Level {overview.level + 1}
              </div>
            </div>

            {/* Stat 2: Trophies Unlocked */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>My Collection</span>
              </div>
              <div className="text-2xl font-black text-white">
                {overview.unlockedTrophies} <span className="text-sm font-medium text-slate-400">/ {overview.totalTrophies}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {Math.round((overview.unlockedTrophies / (overview.totalTrophies || 1)) * 100)}% achievements completed
              </p>
            </div>

            {/* Stat 3: Study Streak */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70">
              <div className="flex items-center gap-1.5 text-xs text-orange-400 font-semibold mb-1">
                <Flame className="w-3.5 h-3.5" />
                <span>Active Streak</span>
              </div>
              <div className="text-2xl font-black text-white flex items-center gap-1">
                <CountUp value={overview.streakDays} duration={0.6} />
                <span className="text-sm font-medium text-slate-400">Days</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Study today to extend to Day {overview.streakDays + 1}
              </p>
            </div>

            {/* Stat 4: Verified Focus Hours */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Focus Record</span>
              </div>
              <div className="text-2xl font-black text-white">
                {focusHours}h <span className="text-sm font-medium text-slate-400">{focusMins}m</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Server-verified concentration
              </p>
            </div>
          </div>
        </div>
      </SlideUp>

      {/* ── NAVIGATION TABS ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('trophies')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'trophies'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🏆 Trophy Collection ({trophies.length})
        </button>

        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'challenges'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚡ Daily & Weekly Challenges ({challenges.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📜 XP Ledger & History
        </button>

        <button
          onClick={() => setActiveTab('swag')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'swag'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🎁 Physical Swag & Milestones
        </button>
      </div>

      {/* ── TAB 1: TROPHY COLLECTION ───────────────────────────────── */}
      {activeTab === 'trophies' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(['ALL', 'FOCUS', 'CONSISTENCY', 'PRACTICE', 'MASTERY', 'SPECIAL'] as CategoryFilter[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  categoryFilter === cat
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Trophy Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTrophies.map(trophy => {
              const rStyle = rarityStyles[trophy.rarity] || rarityStyles.COMMON;
              const isAlmostUnlocked = !trophy.isUnlocked && trophy.progressPercentage >= 60;

              return (
                <PressFeedback key={trophy.id}>
                  <div
                    onClick={() => setSelectedTrophy(trophy)}
                    className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-56 ${
                      trophy.isUnlocked
                        ? `bg-slate-900/90 ${rStyle.border} ${rStyle.glow}`
                        : isAlmostUnlocked
                        ? 'bg-slate-950/90 border-slate-700/80 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Top Row: Rarity pill & status */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${rStyle.pill}`}>
                        {trophy.rarity}
                      </span>
                      {trophy.isUnlocked ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Unlocked</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </div>
                      )}
                    </div>

                    {/* Middle: Icon & Name */}
                    <div className="my-2">
                      <div className={`text-4xl mb-2.5 transition-transform ${trophy.isUnlocked ? 'scale-105' : 'grayscale opacity-60'}`}>
                        {trophy.icon}
                      </div>
                      <h3 className="font-bold text-base text-white truncate">
                        {trophy.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                        {trophy.description}
                      </p>
                    </div>

                    {/* Bottom: Progress bar or Unlocked date */}
                    <div>
                      {trophy.isUnlocked ? (
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                          <span>{trophy.unlockedAt ? new Date(trophy.unlockedAt).toLocaleDateString('en-GB') : 'Verified'}</span>
                          <span className="text-amber-400 font-bold">+{trophy.xpReward} XP</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>{trophy.currentValue} / {trophy.targetValue} {trophy.unit}</span>
                            <span>{trophy.progressPercentage}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isAlmostUnlocked ? 'bg-sky-400' : 'bg-slate-600'
                              }`}
                              style={{ width: `${trophy.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </PressFeedback>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: DAILY & WEEKLY CHALLENGES ───────────────────────── */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map(ch => (
              <div 
                key={ch.id}
                className={`p-5 rounded-2xl border transition-all ${
                  ch.isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-900/80 border-slate-800/90'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                      ch.frequency === 'DAILY'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    }`}>
                      {ch.frequency}
                    </span>
                    {ch.examId && ch.examId !== 'ALL' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {ch.examId}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-amber-400">+{ch.xpReward} XP</span>
                </div>

                <h4 className="text-base font-bold text-white mb-1">{ch.title}</h4>
                <p className="text-xs text-slate-300 mb-4">{ch.description}</p>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Progress: {ch.currentValue} / {ch.targetValue} {ch.unit}</span>
                    <span>{ch.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        ch.isCompleted ? 'bg-emerald-400' : 'bg-sky-500'
                      }`}
                      style={{ width: `${ch.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {ch.isCompleted && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed • XP Credited</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: XP LEDGER & HISTORY ─────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            <span>Server-Authoritative Reward Ledger</span>
          </h3>

          {history.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              No reward events recorded yet. Start studying or solving CBTs to earn your first XP!
            </p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {history.map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{item.description || item.source}</div>
                    <div className="text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString('en-GB')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">+{item.xpChange} XP</div>
                    <div className="text-[10px] text-slate-400">Balance: {item.balanceAfter} XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: PHYSICAL SWAG MILESTONES ────────────────────────── */}
      {activeTab === 'swag' && (
        <RewardMilestones user={user} />
      )}

      {/* ── TROPHY DETAIL MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {selectedTrophy && (
          <div 
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl"
            >
              <button
                onClick={() => setSelectedTrophy(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-5xl my-3">{selectedTrophy.icon}</div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-800 text-slate-300 border border-slate-700">
                {selectedTrophy.rarity} • {selectedTrophy.category}
              </span>

              <h3 className="text-xl font-black text-white mt-2 mb-1">{selectedTrophy.name}</h3>
              <p className="text-sm text-slate-300 mb-4">{selectedTrophy.description}</p>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-left space-y-2 mb-6 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Requirement:</span>
                  <span className="font-semibold text-white">{selectedTrophy.targetValue} {selectedTrophy.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Your Current Progress:</span>
                  <span className="font-semibold text-sky-400">{selectedTrophy.currentValue} {selectedTrophy.unit} ({selectedTrophy.progressPercentage}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={`font-bold ${selectedTrophy.isUnlocked ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {selectedTrophy.isUnlocked ? '✅ Unlocked' : '🔒 Locked'}
                  </span>
                </div>
                {selectedTrophy.unlockedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unlocked On:</span>
                    <span className="font-semibold text-white">{new Date(selectedTrophy.unlockedAt).toLocaleDateString('en-GB')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">XP Reward:</span>
                  <span className="font-bold text-amber-400">+{selectedTrophy.xpReward} XP</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTrophy(null)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
