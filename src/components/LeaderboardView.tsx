import React, { useState, useEffect } from 'react';
import { Trophy, Search, ChevronUp } from 'lucide-react';
import { LeaderboardEntry, UserProfile } from '../types';
import { SlideUp, triggerConfetti } from '../lib/animations';
import { soundFx } from '../lib/soundEffects';
import { AspirantMascot } from './duolingo/AspirantMascot';

interface LeaderboardViewProps {
  userProfile: UserProfile;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ userProfile }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scope, setScope] = useState<'global' | 'state' | 'batch' | 'subject'>('global');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const userXp = userProfile.xp ?? 0;

  const currentLeague = 
    userXp <= 0 ? 'Unranked' :
    userXp < 500 ? 'Bronze' :
    userXp < 1500 ? 'Silver' :
    userXp < 3000 ? 'Gold' :
    userXp < 6000 ? 'Platinum' : 'Diamond';

  const isUnranked = currentLeague === 'Unranked' || userXp <= 0;

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
      if (data.success && Array.isArray(data.leaderboard)) {
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
      {/* ── HEADER BANNER (TOKENIZED) ── */}
      <SlideUp>
        <div 
          onClick={() => {
            if (!isUnranked) {
              soundFx.playChestOpen();
              triggerConfetti({ particleCount: 30, spread: 60 });
            }
          }}
          className="bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] border-b-[6px] border-b-[var(--sr-line-strong)] rounded-3xl p-5 sm:p-6 text-[var(--sr-text)] shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all select-none"
        >
          <div className="flex items-center gap-4">
            <AspirantMascot size="md" state={isUnranked ? 'encouraging' : 'happy'} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] border border-[var(--sr-primary)]/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  {leagueIcon} {isUnranked ? 'Unranked' : `${currentLeague} League`}
                </span>
                {!isUnranked && (
                  <span className="text-xs text-[var(--sr-warning-text)] font-extrabold flex items-center gap-1">
                    ⏱️ Weekly Reset in 2d 14h
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--sr-text)] mt-1.5">
                {isUnranked ? 'All-India Aspirant League' : `${currentLeague} League Standings`}
              </h1>
              <p className="text-[var(--sr-text-muted)] text-xs mt-1 max-w-md">
                {isUnranked 
                  ? 'Complete your first practice drill to earn XP and enter the national league.'
                  : 'Top 10 advance to the next tier. Keep solving daily questions to defend your ranking!'}
              </p>
            </div>
          </div>

          {/* SCOPE TABS */}
          {!isUnranked && (
            <div className="flex flex-wrap gap-1.5 bg-[var(--sr-surface-2)] p-1.5 rounded-2xl border border-[var(--sr-line)] self-start md:self-center">
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
                      ? 'bg-[var(--sr-primary)] text-[var(--sr-on-primary)] border-[var(--sr-primary-hover)] shadow-sm'
                      : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] hover:bg-[var(--sr-surface)] border-transparent'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
          )}
        </div>
      </SlideUp>

      {/* ── UNRANKED EMPTY STATE: MESSAGE + SINGLE CTA ONLY ── */}
      {isUnranked ? (
        <SlideUp>
          <div className="bg-[var(--sr-surface)] rounded-3xl border-2 border-[var(--sr-line-strong)] border-b-[6px] border-b-[var(--sr-line-strong)] p-8 sm:p-12 text-center shadow-lg space-y-5 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[var(--sr-primary-subtle)] border-2 border-[var(--sr-primary)] flex items-center justify-center text-[var(--sr-primary)] mx-auto shadow-sm">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-[var(--sr-text)]">
                You haven't entered the league yet
              </h2>
              <p className="text-xs text-[var(--sr-text-muted)] max-w-md mx-auto leading-relaxed">
                Complete your first practice drill to earn XP and unlock your All-India rank.
              </p>
            </div>
            <div>
              <button
                onClick={() => {
                  soundFx.playTap();
                  window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'practice' }));
                }}
                className="px-6 py-3.5 rounded-2xl bg-[var(--sr-primary)] text-[var(--sr-on-primary)] font-black text-xs border-b-4 border-[var(--sr-primary-hover)] active:border-b-0 active:translate-y-1 shadow-md cursor-pointer transition-all inline-flex items-center gap-2 hover:opacity-95"
              >
                <span>Start a Practice Drill →</span>
              </button>
            </div>
          </div>
        </SlideUp>
      ) : (
        /* ── RANKED USERS: PODIUM, PROMOTION ZONE, AND LEADERBOARD ── */
        <>
          {/* TOP 3 PODIUM */}
          {!loading && leaderboard.length >= 3 && (
            <SlideUp>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* SILVER #2 */}
                <div 
                  onClick={() => soundFx.playTap()}
                  className="bg-[var(--sr-surface)] rounded-3xl border-2 border-[var(--sr-line-strong)] border-b-[6px] border-b-[var(--sr-line-strong)] p-5 shadow-md flex flex-col items-center text-center space-y-2 order-2 md:order-1 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <div className="w-14 h-14 bg-[var(--sr-surface-2)] rounded-2xl flex items-center justify-center border-2 border-[var(--sr-line-strong)] font-black text-xl shadow-sm">
                    🥈
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] text-xs font-black uppercase">
                    Rank #2
                  </span>
                  <h3 className="font-black text-[var(--sr-text)] text-base">{leaderboard[1].userName}</h3>
                  <div className="text-xs text-[var(--sr-text-muted)]">{leaderboard[1].stateName} • {leaderboard[1].batchName}</div>
                  <div className="px-4 py-1.5 bg-[var(--sr-surface-2)] text-[var(--sr-text)] border border-[var(--sr-line)] rounded-xl text-xs font-black">
                    {leaderboard[1].score} Marks ({leaderboard[1].percentile}%ile)
                  </div>
                  <span className="text-xs font-black text-[var(--sr-warning-text)]">
                    ⚡ {leaderboard[1].xp || 420} XP
                  </span>
                </div>

                {/* GOLD #1 */}
                <div 
                  onClick={() => { soundFx.playVictory(); triggerConfetti({ particleCount: 40, spread: 60 }); }}
                  className="bg-[var(--sr-surface)] rounded-3xl border-2 border-[var(--sr-warning-text)] border-b-[8px] border-b-[var(--sr-warning-text)] p-6 shadow-xl flex flex-col items-center text-center space-y-2 order-1 md:order-2 transform md:-translate-y-3 transition-all hover:scale-[1.03] cursor-pointer"
                >
                  <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center border-2 border-amber-300 font-black text-amber-950 text-3xl shadow-lg">
                    👑
                  </div>
                  <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-[var(--sr-warning-text)] border border-amber-500/40 text-xs font-black uppercase">
                    League Champion #1
                  </span>
                  <h3 className="font-black text-[var(--sr-text)] text-lg">{leaderboard[0].userName}</h3>
                  <div className="text-xs text-[var(--sr-warning-text)] font-bold">{leaderboard[0].stateName} • {leaderboard[0].batchName}</div>
                  <div className="px-5 py-2 bg-amber-400 text-amber-950 rounded-xl text-xs font-black shadow-md border-b-2 border-amber-600">
                    {leaderboard[0].score} Marks ({leaderboard[0].percentile}%ile)
                  </div>
                  <span className="text-xs font-black text-[var(--sr-warning-text)] flex items-center gap-1">
                    🔥 {leaderboard[0].xp || 680} XP
                  </span>
                </div>

                {/* BRONZE #3 */}
                <div 
                  onClick={() => soundFx.playTap()}
                  className="bg-[var(--sr-surface)] rounded-3xl border-2 border-[var(--sr-line-strong)] border-b-[6px] border-b-[var(--sr-line-strong)] p-5 shadow-md flex flex-col items-center text-center space-y-2 order-3 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <div className="w-14 h-14 bg-[var(--sr-surface-2)] rounded-2xl flex items-center justify-center border-2 border-[var(--sr-line-strong)] font-black text-xl shadow-sm">
                    🥉
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] text-xs font-black uppercase">
                    Rank #3
                  </span>
                  <h3 className="font-black text-[var(--sr-text)] text-base">{leaderboard[2].userName}</h3>
                  <div className="text-xs text-[var(--sr-text-muted)]">{leaderboard[2].stateName} • {leaderboard[2].batchName}</div>
                  <div className="px-4 py-1.5 bg-[var(--sr-surface-2)] text-[var(--sr-text)] border border-[var(--sr-line)] rounded-xl text-xs font-black">
                    {leaderboard[2].score} Marks ({leaderboard[2].percentile}%ile)
                  </div>
                  <span className="text-xs font-black text-[var(--sr-warning-text)]">
                    ⚡ {leaderboard[2].xp || 360} XP
                  </span>
                </div>
              </div>
            </SlideUp>
          )}

          {/* PROMOTION ZONE (NO FONT-MONO) */}
          <div className="p-3.5 rounded-2xl bg-[var(--sr-primary-subtle)] border-2 border-[var(--sr-primary)]/40 border-b-[4px] border-b-[var(--sr-primary)] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">⬆️</span>
              <div>
                <span className="font-black text-[var(--sr-primary)] uppercase tracking-wider">Top 10 Promotion Zone</span>
                <span className="text-[var(--sr-text-muted)] ml-2">Candidates in top 10 advance to higher tier</span>
              </div>
            </div>
            <span className="font-black text-[var(--sr-primary)] bg-[var(--sr-primary-subtle)] px-2.5 py-1 rounded-lg border border-[var(--sr-primary)]/30">
              +50 GEMS BONUS
            </span>
          </div>

          {/* RANKING LIST */}
          <SlideUp>
            <div className="bg-[var(--sr-surface)] rounded-3xl border-2 border-[var(--sr-line-strong)] border-b-[6px] border-b-[var(--sr-line-strong)] p-5 sm:p-6 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-base font-black text-[var(--sr-text)] flex items-center gap-2">
                  <span>All Aspirants</span>
                  <span className="text-xs text-[var(--sr-text-muted)]">({filtered.length} active)</span>
                </h3>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-[var(--sr-text-subtle)] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search aspirant or state..."
                    className="w-full pl-9 pr-3 py-2 bg-[var(--sr-surface-2)] border border-[var(--sr-line)] rounded-xl text-xs text-[var(--sr-text)] placeholder-[var(--sr-text-subtle)] focus:outline-none focus:border-[var(--sr-primary)]"
                  />
                </div>
              </div>

              {loading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-14 w-full rounded-2xl bg-[var(--sr-surface-2)] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.length === 0 ? (
                    <div className="p-8 text-center bg-[var(--sr-surface-2)] border border-[var(--sr-line)] rounded-2xl space-y-2">
                      <p className="text-xs font-bold text-[var(--sr-text)]">No aspirants ranked in this view yet</p>
                      <p className="text-[11px] text-[var(--sr-text-muted)]">Complete a practice drill or CBT test to record the first score!</p>
                    </div>
                  ) : (
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
                            ? 'bg-[var(--sr-surface-2)] border-[var(--sr-line-strong)] border-b-[4px] border-b-[var(--sr-line-strong)]'
                            : isPromotionZone
                            ? 'bg-[var(--sr-surface)] border-[var(--sr-primary)]/30 border-b-[3px] border-b-[var(--sr-primary)]/20 hover:border-[var(--sr-primary)]'
                            : 'bg-[var(--sr-surface)] border-[var(--sr-line)] hover:border-[var(--sr-line-strong)]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-950'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : isPromotionZone
                              ? 'bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)]'
                              : 'bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)]'
                          }`}>
                            #{item.rank}
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[var(--sr-text)] text-xs sm:text-sm truncate">
                                {item.userName}
                              </span>
                              {idx < 10 && (
                                <ChevronUp className="w-3.5 h-3.5 text-[var(--sr-primary)] shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-[var(--sr-text-muted)] truncate">
                              {item.stateName || 'All-India'} • {item.batchName || 'General'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-black text-[var(--sr-primary)]">
                              {item.score} Marks
                            </div>
                            <div className="text-xs text-[var(--sr-text-muted)]">
                              {item.percentile}%ile
                            </div>
                          </div>

                          <div className="px-3 py-1.5 rounded-xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] text-xs font-black text-[var(--sr-warning-text)] flex items-center gap-1">
                            <span>🔥</span>
                            <span>{item.xp || 0} XP</span>
                          </div>
                        </div>
                      </div>
                    );
                  }))}
                </div>
              )}
            </div>
          </SlideUp>
        </>
      )}
    </div>
  );
};
