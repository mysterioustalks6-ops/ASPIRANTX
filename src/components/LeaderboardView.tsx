import React, { useState, useEffect } from 'react';
import { Award, Trophy, Medal, Search, Filter, Shield, Zap, Sparkles } from 'lucide-react';
import { LeaderboardEntry, UserProfile } from '../types';
import { FadeIn, SlideUp, Stagger, StaggerItem, PressFeedback, CountUp, SkeletonShimmer, EmptyState } from '../lib/animations';

interface LeaderboardViewProps {
  userProfile: UserProfile;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ userProfile }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scope, setScope] = useState<'global' | 'state' | 'city' | 'batch' | 'subject'>('global');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER BANNER */}
      <SlideUp>
        <div className="bg-[#15181F] border border-[#2A2F3A] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#FF9600] font-black text-xs mb-1">
              <Trophy className="w-4 h-4 text-[#FF9600]" />
              <span>ALL INDIA CANDIDATE RANKINGS</span>
            </div>
            <h1 className="text-2xl font-black text-white">National Leaderboard & Rank Benchmark</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">
              Benchmark your mock test score, percentile, and XP against top aspirants nationwide.
            </p>
          </div>

          {/* SCOPE TABS */}
          <div className="flex flex-wrap gap-2 bg-[#0F1115] p-1.5 rounded-xl border border-[#2A2F3A]">
            {(['global', 'state', 'batch', 'subject'] as const).map((sc) => (
              <PressFeedback key={sc}>
                <button
                  onClick={() => setScope(sc)}
                  className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all capitalize cursor-pointer ${
                    scope === sc
                      ? 'bg-[#FF9600] text-[#0B2300] shadow-sm'
                      : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1D24]'
                  }`}
                >
                  {sc} Rank
                </button>
              </PressFeedback>
            ))}
          </div>
        </div>
      </SlideUp>

      {/* TOP 3 PODIUM */}
      {!loading && leaderboard.length >= 3 && (
        <SlideUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* SILVER #2 */}
            <div className="bg-[#15181F] rounded-2xl border border-[#2A2F3A] border-b-4 border-b-[#1A1D24] p-5 shadow-sm flex flex-col items-center text-center space-y-2 order-2 md:order-1 transition-all hover:scale-[1.02]">
              <div className="w-12 h-12 bg-[#0F1115] rounded-xl flex items-center justify-center border-2 border-slate-400 font-extrabold text-slate-300 text-lg">
                🥈 #2
              </div>
              <h3 className="font-extrabold text-[#F3F4F6]">{leaderboard[1].userName}</h3>
              <div className="text-xs text-[#9CA3AF]">{leaderboard[1].stateName} • {leaderboard[1].batchName}</div>
              <div className="px-3 py-1 bg-[#0F1115] text-[#F3F4F6] border border-[#2A2F3A] rounded-lg text-xs font-black font-mono">
                <CountUp value={leaderboard[1].score} /> Marks ({leaderboard[1].percentile}%)
              </div>
            </div>

            {/* GOLD #1 */}
            <div className="bg-[#1A1D24] rounded-2xl border-2 border-[#FF9600] border-b-4 border-b-[#E08500] p-6 shadow-lg shadow-[#FF9600]/10 flex flex-col items-center text-center space-y-2 order-1 md:order-2 transform md:-translate-y-2 transition-all hover:scale-[1.03]">
              <div className="w-14 h-14 bg-[#FF9600] rounded-xl flex items-center justify-center border-2 border-amber-300 font-black text-[#0B2300] text-xl shadow-lg">
                👑 #1
              </div>
              <h3 className="font-black text-white text-lg">{leaderboard[0].userName}</h3>
              <div className="text-xs text-[#FF9600] font-bold">{leaderboard[0].stateName} • {leaderboard[0].batchName}</div>
              <div className="px-4 py-1.5 bg-[#FF9600] text-[#0B2300] rounded-xl text-xs font-black shadow-sm font-mono">
                <CountUp value={leaderboard[0].score} /> Marks ({leaderboard[0].percentile}%)
              </div>
            </div>

            {/* BRONZE #3 */}
            <div className="bg-[#15181F] rounded-2xl border border-[#2A2F3A] border-b-4 border-b-[#1A1D24] p-5 shadow-sm flex flex-col items-center text-center space-y-2 order-3 transition-all hover:scale-[1.02]">
              <div className="w-12 h-12 bg-[#0F1115] rounded-xl flex items-center justify-center border-2 border-amber-700 font-extrabold text-amber-500 text-lg">
                🥉 #3
              </div>
              <h3 className="font-extrabold text-[#F3F4F6]">{leaderboard[2].userName}</h3>
              <div className="text-xs text-[#9CA3AF]">{leaderboard[2].stateName} • {leaderboard[2].batchName}</div>
              <div className="px-3 py-1 bg-[#0F1115] text-[#F3F4F6] border border-[#2A2F3A] rounded-lg text-xs font-black font-mono">
                <CountUp value={leaderboard[2].score} /> Marks ({leaderboard[2].percentile}%)
              </div>
            </div>
          </div>
        </SlideUp>
      )}

      {/* SEARCH BAR & FULL RANKINGS TABLE */}
      <SlideUp>
        <div className="bg-[#15181F] rounded-2xl border border-[#2A2F3A] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-black text-white">Full Ranking Table</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate or state..."
                className="w-full pl-9 pr-3 py-2 bg-[#0F1115] border border-[#2A2F3A] rounded-xl text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#FF9600]"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4, 5].map(i => (
                <SkeletonShimmer key={i} className="h-12 w-full rounded-xl bg-[#0F1115]" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2A2F3A] text-[11px] font-bold text-[#9CA3AF] uppercase bg-[#0F1115]/50">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">State / Location</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">CBT Score</th>
                    <th className="py-3 px-4">Percentile</th>
                    <th className="py-3 px-4">XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2F3A]/60 text-xs">
                  {filtered.length > 0 ? (
                    filtered.map((item) => (
                      <tr key={item.userId} className="hover:bg-[#1A1D24] transition-all font-medium text-[#F3F4F6]">
                        <td className="py-3 px-4 font-black text-white font-mono">#{item.rank}</td>
                        <td className="py-3 px-4 font-bold text-[#1CB0F6]">{item.userName}</td>
                        <td className="py-3 px-4 text-[#9CA3AF]">{item.stateName}</td>
                        <td className="py-3 px-4 text-[#9CA3AF]">{item.batchName}</td>
                        <td className="py-3 px-4 font-black text-[#58CC02] font-mono">{item.score}</td>
                        <td className="py-3 px-4 font-bold text-[#1CB0F6] font-mono">{item.percentile}%</td>
                        <td className="py-3 px-4 text-[#FF9600] font-black font-mono">{item.xp} XP</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#9CA3AF]">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-[#FF9600]/10 text-[#FF9600] flex items-center justify-center">
                            <Trophy className="w-6 h-6" />
                          </div>
                          <div className="font-bold text-white text-sm">No candidate rankings found</div>
                          <p className="text-xs text-[#9CA3AF] max-w-sm">
                            Be the first aspirant in this scope to complete a CBT mock exam and claim Rank #1!
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SlideUp>
    </div>
  );
};
