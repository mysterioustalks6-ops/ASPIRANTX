import React, { useState, useEffect } from 'react';
import { Award, Trophy, Medal, Search, Filter, Shield, Zap, Sparkles, Flame, ChevronUp, ChevronDown } from 'lucide-react';
import { LeaderboardEntry, UserProfile } from '../types';
import { FadeIn, SlideUp, Stagger, StaggerItem, PressFeedback, CountUp, SkeletonShimmer, EmptyState, triggerConfetti } from '../lib/animations';
import { soundFx } from '../lib/soundEffects';
import { AspirantMascot } from './duolingo/AspirantMascot';

interface LeaderboardViewProps {
  userProfile: UserProfile;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ userProfile }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scope, setScope] = useState<'global' | 'state' | 'city' | 'batch' | 'subject'>('global');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const userXp = userProfile.xp ?? 0;
  const currentLeague = 
    userXp <= 0 ? 'Unranked' :
    userXp < 500 ? 'Bronze' :
    userXp < 1500 ? 'Silver' :
    userXp < 3000 ? 'Gold' :
    userXp < 6000 ? 'Platinum' : 'Diamond';

  const leagueIcon = 
    currentLeague === 'Unranked' ? '🌱' :
    currentLeague === 'Bronze' ? '🥉' :
    currentLeague === 'Silver' ? '🥈' :
    currentLeague === 'Gold' ? '🥇' :
    currentLeague === 'Platinum' ? '🏆' : '💎';

  useEffect(() => {
    fetchLeaderboard();
  }, [scope, userProfile.exam]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/academic/leaderboard?scope=${scope}&exam=${userProfile.exam}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = leaderboard.filter((item) =>
    item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.stateName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ── DUOLINGO LEAGUES HEADER BANNER ── */}
      <SlideUp>
        <div 
          onClick={() => { soundFx.playChestOpen(); triggerConfetti({ particleCount: 30, spread: 60 }); }}
          className="bg-gradient-to-r from-[#18233C] via-[#1A1D24] to-[#122A1E] border-2 border-sky-400/40 border-b-[6px] border-b-sky-700 rounded-3xl p-5 sm:p-6 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:border-sky-300 transition-all select-none"
        >
          <div className="flex items-center gap-4">
            <AspirantMascot size="md" state="happy" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  {leagueIcon} {currentLeague} League
                </span>
                <span className="text-xs text-amber-300 font-extrabold flex items-center gap-1">
                  ⏱️ Weekly Reset in 2d 14h
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                {currentLeague === 'Unranked' ? 'All-India Aspirant League' : `${currentLeague} Division Standings`}
              </h1>
              <p className="text-slate-300 text-xs mt-0.5 max-w-md">
                {currentLeague === 'Unranked' 
                  ? 'Complete your first syllabus lesson or practice drill to earn XP and enter the Bronze League.'
                  : 'Top 10 advance to the next division. Keep solving daily questions to defend your ranking!'}
              </p>
            </div>
          </div>

          {/* SCOPE TABS WITH DUOLINGO 3D TACTILE BUTTONS */}
          <div className="flex flex-wrap gap-1.5 bg-[#0F1115] p-1.5 rounded-2xl border border-[#2A2F3A] self-start md:self-center">
            {(['global', 'state', 'batch', 'subject'] as const).map((sc) => (
              <button
                key={sc}
                onClick={(e) => {
                  e.stopPropagation();
                  soundFx.playTap();
                  setScope(sc);
                }}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all capitalize cursor-pointer border-b-[3px] active:border-b-0 active:translate-y-0.5 ${
                  scope === sc
                    ? 'bg-[#1CB0F6] text-[#052840] border-[#137BAE] shadow-sm'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1D24] border-transparent'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>
      </SlideUp>

      {/* ── TOP 3 PODIUM (GAMIFIED PODIUM WITH 3D SHADOWS) ── */}
      {!loading && leaderboard.length >= 3 && (
        <SlideUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* SILVER #2 */}
            <div 
              onClick={() => soundFx.playTap()}
              className="bg-[#15181F] rounded-3xl border-2 border-slate-600/40 border-b-[6px] border-b-slate-800 p-5 shadow-lg flex flex-col items-center text-center space-y-2 order-2 md:order-1 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-slate-400 font-black text-slate-200 text-xl shadow-md">
                🥈
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-black uppercase">
                Rank #2
              </span>
              <h3 className="font-black text-white text-base">{leaderboard[1].userName}</h3>
              <div className="text-xs text-[#9CA3AF]">{leaderboard[1].stateName} • {leaderboard[1].batchName}</div>
              <div className="px-4 py-1.5 bg-[#0F1115] text-[#1CB0F6] border border-[#2A2F3A] rounded-xl text-xs font-black font-mono">
                <CountUp value={leaderboard[1].score} /> Marks ({leaderboard[1].percentile}%ile)
              </div>
              <span className="text-[11px] font-black text-amber-400 font-mono">
                ⚡ {leaderboard[1].xp || 420} XP
              </span>
            </div>

            {/* GOLD #1 */}
            <div 
              onClick={() => { soundFx.playVictory(); triggerConfetti({ particleCount: 40, spread: 60 }); }}
              className="bg-[#1A1D24] rounded-3xl border-2 border-amber-400 border-b-[8px] border-b-amber-600 p-6 shadow-2xl shadow-amber-500/15 flex flex-col items-center text-center space-y-2 order-1 md:order-2 transform md:-translate-y-3 transition-all hover:scale-[1.03] cursor-pointer"
            >
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-2xl flex items-center justify-center border-2 border-amber-200 font-black text-[#0B2300] text-3xl shadow-xl">
                👑
              </div>
              <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">
                League Champion #1
              </span>
              <h3 className="font-black text-white text-lg">{leaderboard[0].userName}</h3>
              <div className="text-xs text-amber-400 font-bold">{leaderboard[0].stateName} • {leaderboard[0].batchName}</div>
              <div className="px-5 py-2 bg-amber-400 text-[#0B2300] rounded-xl text-xs font-black shadow-md font-mono border-b-2 border-amber-600">
                <CountUp value={leaderboard[0].score} /> Marks ({leaderboard[0].percentile}%ile)
              </div>
              <span className="text-xs font-black text-amber-300 font-mono flex items-center gap-1">
                🔥 {leaderboard[0].xp || 680} XP
              </span>
            </div>

            {/* BRONZE #3 */}
            <div 
              onClick={() => soundFx.playTap()}
              className="bg-[#15181F] rounded-3xl border-2 border-amber-700/40 border-b-[6px] border-b-amber-900 p-5 shadow-lg flex flex-col items-center text-center space-y-2 order-3 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div className="w-14 h-14 bg-amber-950/60 rounded-2xl flex items-center justify-center border-2 border-amber-700 font-black text-amber-400 text-xl shadow-md">
                🥉
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 text-[10px] font-black uppercase">
                Rank #3
              </span>
              <h3 className="font-black text-white text-base">{leaderboard[2].userName}</h3>
              <div className="text-xs text-[#9CA3AF]">{leaderboard[2].stateName} • {leaderboard[2].batchName}</div>
              <div className="px-4 py-1.5 bg-[#0F1115] text-[#1CB0F6] border border-[#2A2F3A] rounded-xl text-xs font-black font-mono">
                <CountUp value={leaderboard[2].score} /> Marks ({leaderboard[2].percentile}%ile)
              </div>
              <span className="text-[11px] font-black text-amber-400 font-mono">
                ⚡ {leaderboard[2].xp || 360} XP
              </span>
            </div>
          </div>
        </SlideUp>
      )}

      {/* ── PROMOTION ZONE NOTIFICATION BADGE ── */}
      <div className="p-3 rounded-2xl bg-[#58CC02]/10 border-2 border-[#58CC02]/40 border-b-[4px] border-b-[#3C8801] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">⬆️</span>
          <div>
            <span className="font-black text-[#58CC02] uppercase tracking-wider">Top 10 Promotion Zone</span>
            <span className="text-slate-300 ml-2">Candidates in top 10 advance to higher diamond tier</span>
          </div>
        </div>
        <span className="font-mono font-black text-[#58CC02] bg-[#58CC02]/20 px-2 py-0.5 rounded-lg">
          +50 GEMS BONUS
        </span>
      </div>

      {/* ── SEARCH BAR & FULL TACTILE RANKING LIST ── */}
      <SlideUp>
        <div className="bg-[#15181F] rounded-3xl border-2 border-[#2A2F3A] border-b-[6px] border-b-[#1A1D24] p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>All Aspirants</span>
              <span className="text-xs text-slate-400 font-mono">({filtered.length} active)</span>
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search aspirant or state..."
                className="w-full pl-9 pr-3 py-2 bg-[#0F1115] border border-[#2A2F3A] rounded-xl text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#1CB0F6]"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonShimmer key={i} className="h-14 w-full rounded-2xl bg-[#0F1115]" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.length > 0 ? (
                filtered.map((item, idx) => {
                  const isPromotionZone = idx < 10;
                  return (
                    <div
                      key={item.userId || idx}
                      onClick={() => soundFx.playTap()}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        idx === 0
                          ? 'bg-amber-500/10 border-amber-500/40 border-b-[4px] border-b-amber-700'
                          : idx < 3
                          ? 'bg-[#1A1D24] border-slate-700 border-b-[4px] border-b-slate-900'
                          : isPromotionZone
                          ? 'bg-[#15181F] border-[#58CC02]/30 border-b-[3px] border-b-[#58CC02]/20 hover:border-[#58CC02]'
                          : 'bg-[#15181F] border-[#2A2F3A] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black font-mono text-xs shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : isPromotionZone
                            ? 'bg-[#58CC02]/20 text-[#58CC02]'
                            : 'bg-[#0F1115] text-slate-400'
                        }`}>
                          #{item.rank}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-xs sm:text-sm truncate">
                              {item.userName}
                            </span>
                            {idx < 10 && (
                              <ChevronUp className="w-3.5 h-3.5 text-[#58CC02] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#9CA3AF] truncate">
                            {item.stateName || 'All-India'} • {item.batchName || 'General'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-mono font-black text-[#58CC02]">
                            {item.score} Marks
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.percentile}%ile
                          </div>
                        </div>

                        <div className="px-3 py-1.5 rounded-xl bg-[#0F1115] border border-[#2A2F3A] text-xs font-mono font-black text-[#FF9600] flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-current" />
                          <span>{item.xp || (100 - idx * 5)} XP</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 sm:p-12 text-center rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--sr-primary-subtle)] border-2 border-[var(--sr-primary)] flex items-center justify-center text-[var(--sr-primary)] mx-auto shadow-sm">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-[var(--sr-text)]">
                      {userXp === 0 ? 'Complete Your First Ride to Join' : 'All-India Standings Updating'}
                    </h3>
                    <p className="text-xs text-[var(--sr-text-muted)] max-w-sm mx-auto">
                      {userXp === 0
                        ? 'Earn your first 10 XP on the syllabus map to enter the Bronze League and compete nationwide.'
                        : 'Solve topic drills and mock questions today to defend and advance your national ranking.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      soundFx.playTap();
                      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'dashboard' }));
                    }}
                    className="px-6 py-3 rounded-2xl bg-[var(--sr-primary)] text-[var(--sr-on-primary)] font-black text-xs border-b-4 border-[var(--sr-primary-hover)] active:border-b-0 active:translate-y-1 shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
                  >
                    <span>Start First Ride →</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </SlideUp>
    </div>
  );
};

