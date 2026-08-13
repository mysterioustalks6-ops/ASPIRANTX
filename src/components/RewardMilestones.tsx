import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { PremiumGate, FeatureFlagsMap } from './PremiumGate';
import { Gift, Award, Clock, CheckCircle2, AlertCircle, Sparkles, Package, ShieldCheck, Check, ChevronRight, Trophy, BookOpen, Lock } from 'lucide-react';

interface RewardMilestonesProps {
  user: UserProfile | null;
  featureFlags?: FeatureFlagsMap;
  onOpenPremium?: () => void;
}

export const RewardMilestones: React.FC<RewardMilestonesProps> = ({ user, featureFlags = {}, onOpenPremium }) => {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [progressMap, setProgressMap] = useState<{ [milestoneId: string]: { verifiedMinutes: number; requiredMinutes: number; canClaim: boolean } }>({});
  const [userClaims, setUserClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchMilestonesAndProgress = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rewards/milestones?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success && data.milestones) {
        setMilestones(data.milestones);

        // Fetch progress for each milestone
        const prog: { [id: string]: any } = {};
        for (const m of data.milestones) {
          try {
            const pRes = await fetch(`/api/rewards/progress?userId=${encodeURIComponent(user.id)}&milestoneId=${encodeURIComponent(m.id)}`);
            const pData = await pRes.json();
            if (pData.success) {
              prog[m.id] = pData;
            }
          } catch (e) {}
        }
        setProgressMap(prog);
      }

      // Fetch user claims
      const cRes = await fetch(`/api/admin/reward-claims?status=`);
      const cData = await cRes.json();
      if (cData.success && cData.claims) {
        setUserClaims(cData.claims.filter((c: any) => c.userId === user.id || c.userEmail?.toLowerCase() === user.email?.toLowerCase()));
      }
    } catch (err) {
      console.error('Failed to load milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestonesAndProgress();
  }, [user?.id]);

  const handleClaimReward = async (milestoneId: string) => {
    if (!user) return;
    setClaimingId(milestoneId);
    setActionMsg(null);
    try {
      const res = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          milestoneId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg({ type: 'success', text: data.message || 'Reward claim submitted successfully — pending admin review!' });
        fetchMilestonesAndProgress();
      } else {
        setActionMsg({ type: 'error', text: data.error || 'Failed to submit reward claim.' });
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: 'Network error while claiming reward.' });
    } finally {
      setClaimingId(null);
    }
  };

  // Group milestones into tracks and untracked
  const tracksMap = new Map<string, any[]>();
  const untrackedMilestones: any[] = [];

  for (const m of milestones) {
    const tid = (m.trackId || '').trim();
    if (!tid) {
      untrackedMilestones.push(m);
    } else {
      if (!tracksMap.has(tid)) tracksMap.set(tid, []);
      tracksMap.get(tid)!.push(m);
    }
  }

  for (const [tid, milList] of tracksMap.entries()) {
    milList.sort((a, b) => (Number(a.tier) || 1) - (Number(b.tier) || 1));
  }

  return (
    <PremiumGate
      featureName="reward_milestones"
      featureTitle="Real-World Reward Milestones"
      isUserPremium={user?.isPremium}
      isGuest={user?.isGuest}
      featureFlags={featureFlags}
      onOpenPremium={onOpenPremium}
    >
      <div className="space-y-8 pb-16">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-8 sm:p-10 text-white shadow-xl">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-xs font-black tracking-wider uppercase">
              <Trophy className="w-4 h-4 text-amber-300" /> PRO Progressive Study Ladders
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Earn Real-World Prizes Through Progressive Difficulty
            </h1>
            <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed">
              Complete foundational tiers to unlock harder advanced reward tiers. Official study kits, cotton merch, and VIP passes await dedicated aspirants.
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {actionMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl flex items-center gap-3 border ${
                actionMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {actionMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="text-xs sm:text-sm font-semibold">{actionMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Milestones Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" /> Progressive Reward Tracks & Tiers
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed tier claims automatically unlock the next challenging reward level in each track.
              </p>
            </div>
            <button
              onClick={fetchMilestonesAndProgress}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Refresh Progress
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">Loading Rewards...</div>
            </div>
          ) : milestones.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-300">No active milestones available right now.</div>
              <p className="text-xs text-slate-500">Check back soon as admins add new progressive prize tracks.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Render Tracks as Connected Ladders */}
              {Array.from(tracksMap.entries()).map(([trackId, trackMilestones]) => (
                <div key={trackId} className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 font-black shadow-lg">
                        🎯
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Progression Track</div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white capitalize">{trackId.replace(/_/g, ' ')}</h3>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {trackMilestones.length} Tiers Ladder
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                    {trackMilestones.map((m, idx) => {
                      const isLocked = m.locked === true;
                      const prog = progressMap[m.id] || { verifiedMinutes: 0, requiredMinutes: m.requiredVerifiedMinutes || 600, canClaim: false };
                      const percent = Math.min(100, Math.round((prog.verifiedMinutes / prog.requiredMinutes) * 100));
                      const existingClaim = userClaims.find((c) => c.milestoneId === m.id);

                      return (
                        <div
                          key={m.id}
                          className={`rounded-3xl p-6 space-y-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                            isLocked
                              ? 'bg-slate-950/40 border border-slate-900 opacity-60'
                              : 'bg-slate-950/80 border border-slate-800 group hover:border-amber-500/40 shadow-lg'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              isLocked
                                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                              Tier {m.tier || idx + 1}
                            </span>
                            <span className="text-xs font-mono font-bold text-amber-300">
                              {Math.round(prog.requiredMinutes / 60)} Hours ({prog.requiredMinutes} mins)
                            </span>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                              {isLocked && <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                              {m.title}
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {m.description}
                            </p>
                          </div>

                          {!isLocked ? (
                            <div className="space-y-4 pt-4 border-t border-slate-800/80">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span className="text-slate-400">Verified Study Time</span>
                                  <span className="text-white font-mono">
                                    {prog.verifiedMinutes} / {prog.requiredMinutes} mins ({percent}%)
                                  </span>
                                </div>
                                <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                                  <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>
                              </div>

                              {existingClaim ? (
                                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] font-black uppercase text-slate-400">Claim Status</div>
                                    <div className="text-xs font-extrabold text-amber-400 capitalize">
                                      {existingClaim.status} {existingClaim.status === 'pending' && '— Under Review'}
                                    </div>
                                  </div>
                                  <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                                    Submitted
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleClaimReward(m.id)}
                                  disabled={!prog.canClaim || claimingId === m.id}
                                  className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                                    prog.canClaim
                                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 hover:brightness-110 shadow-amber-500/20'
                                      : 'bg-slate-900 text-slate-400 cursor-not-allowed border border-slate-800'
                                  }`}
                                >
                                  {claimingId === m.id ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                                      Submitting...
                                    </>
                                  ) : prog.canClaim ? (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5 fill-current" /> Claim Reward
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3.5 h-3.5" /> {prog.requiredMinutes - prog.verifiedMinutes} mins remaining
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="pt-4 border-t border-slate-900 flex items-center gap-2 text-xs font-bold text-slate-500">
                              <Lock className="w-3.5 h-3.5" /> Unlocks upon completing Tier {(m.tier || 1) - 1}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Render Untracked Milestones if any */}
              {untrackedMilestones.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-white">Standalone Milestones</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {untrackedMilestones.map((m) => {
                      const prog = progressMap[m.id] || { verifiedMinutes: 0, requiredMinutes: m.requiredVerifiedMinutes || 600, canClaim: false };
                      const percent = Math.min(100, Math.round((prog.verifiedMinutes / prog.requiredMinutes) * 100));
                      const existingClaim = userClaims.find((c) => c.milestoneId === m.id);

                      return (
                        <div
                          key={m.id}
                          className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                {m.rewardType || 'Prize'}
                              </span>
                              <span className="text-xs font-mono font-bold text-amber-300">
                                {Math.round(prog.requiredMinutes / 60)} Hours Required
                              </span>
                            </div>
                            <h4 className="text-base font-black text-white">{m.title}</h4>
                            <p className="text-xs text-slate-300">{m.description}</p>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-slate-800">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-400">Progress</span>
                                <span className="text-white font-mono">{prog.verifiedMinutes} / {prog.requiredMinutes} mins ({percent}%)</span>
                              </div>
                              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" style={{ width: `${percent}%` }}></div>
                              </div>
                            </div>

                            {existingClaim ? (
                              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-amber-400">
                                Claim Status: <span className="capitalize">{existingClaim.status}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleClaimReward(m.id)}
                                disabled={!prog.canClaim || claimingId === m.id}
                                className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
                                  prog.canClaim
                                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20'
                                    : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                                }`}
                              >
                                {prog.canClaim ? 'Claim Reward' : `${prog.requiredMinutes - prog.verifiedMinutes} mins remaining`}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Claim History */}
        {userClaims.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <h3 className="text-md font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" /> Your Reward Claims History ({userClaims.length})
            </h3>
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800">
                {userClaims.map((c) => (
                  <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white">{c.milestoneTitle}</div>
                      <div className="text-xs text-slate-400">
                        Claimed at: {new Date(c.claimedAt).toLocaleDateString()} | Verified Time: {c.verifiedMinutesAtClaim} mins
                      </div>
                      {c.adminNote && (
                        <div className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 mt-1">
                          Admin Note: {c.adminNote}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border ${
                        c.status === 'fulfilled'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : c.status === 'approved'
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : c.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PremiumGate>
  );
};
