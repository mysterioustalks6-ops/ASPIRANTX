import React, { useState, useEffect } from 'react';
import { Award, Trophy, Medal, Search, Filter, Shield, Zap, Sparkles } from 'lucide-react';
import { LeaderboardEntry, UserProfile } from '../types';

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
      <div className="bg-gradient-to-r from-amber-600 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-300 font-semibold text-xs mb-1">
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>ALL INDIA CANDIDATE RANKINGS</span>
          </div>
          <h1 className="text-2xl font-bold">National Leaderboard & Rank Benchmark</h1>
          <p className="text-indigo-200 text-sm mt-1">
            Benchmark your mock test score, percentile, and XP against top aspirants nationwide.
          </p>
        </div>

        {/* SCOPE TABS */}
        <div className="flex flex-wrap gap-2 bg-black/20 p-1.5 rounded-xl border border-white/10">
          {(['global', 'state', 'batch', 'subject'] as const).map((sc) => (
            <button
              key={sc}
              onClick={() => setScope(sc)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                scope === sc ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-indigo-200 hover:text-white'
              }`}
            >
              {sc} Rank
            </button>
          ))}
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* SILVER #2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col items-center text-center space-y-2 order-2 md:order-1">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-300 font-extrabold text-slate-600 text-lg">
              🥈 #2
            </div>
            <h3 className="font-bold text-slate-900">{leaderboard[1].userName}</h3>
            <div className="text-xs text-slate-500">{leaderboard[1].stateName} • {leaderboard[1].batchName}</div>
            <div className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold">
              {leaderboard[1].score} Marks ({leaderboard[1].percentile}%)
            </div>
          </div>

          {/* GOLD #1 */}
          <div className="bg-gradient-to-b from-amber-500/10 via-white to-white rounded-2xl border-2 border-amber-400 p-6 shadow-md flex flex-col items-center text-center space-y-2 order-1 md:order-2 transform md:-translate-y-2">
            <div className="w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center border-2 border-amber-500 font-extrabold text-slate-950 text-xl shadow-lg">
              👑 #1
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">{leaderboard[0].userName}</h3>
            <div className="text-xs text-amber-700 font-semibold">{leaderboard[0].stateName} • {leaderboard[0].batchName}</div>
            <div className="px-4 py-1.5 bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-sm">
              {leaderboard[0].score} Marks ({leaderboard[0].percentile}%)
            </div>
          </div>

          {/* BRONZE #3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col items-center text-center space-y-2 order-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center border-2 border-amber-700 font-extrabold text-amber-900 text-lg">
              🥉 #3
            </div>
            <h3 className="font-bold text-slate-900">{leaderboard[2].userName}</h3>
            <div className="text-xs text-slate-500">{leaderboard[2].stateName} • {leaderboard[2].batchName}</div>
            <div className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold">
              {leaderboard[2].score} Marks ({leaderboard[2].percentile}%)
            </div>
          </div>
        </div>
      )}

      {/* SEARCH BAR & FULL RANKINGS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-slate-900">Full Ranking Table</h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate or state..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading Rankings...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-50">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">State / Location</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">CBT Score</th>
                  <th className="py-3 px-4">Percentile</th>
                  <th className="py-3 px-4">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((item) => (
                  <tr key={item.userId} className="hover:bg-slate-50/80 transition-all font-medium text-slate-800">
                    <td className="py-3 px-4 font-extrabold text-slate-900">#{item.rank}</td>
                    <td className="py-3 px-4 font-bold text-indigo-900">{item.userName}</td>
                    <td className="py-3 px-4 text-slate-600">{item.stateName}</td>
                    <td className="py-3 px-4 text-slate-600">{item.batchName}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-600">{item.score}</td>
                    <td className="py-3 px-4 font-bold text-purple-600">{item.percentile}%</td>
                    <td className="py-3 px-4 text-amber-600 font-bold">{item.xp} XP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
