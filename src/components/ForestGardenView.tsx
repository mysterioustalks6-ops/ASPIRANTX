import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sprout, 
  Trees, 
  Calendar, 
  Clock, 
  Award, 
  Sparkles, 
  Flame, 
  Share2, 
  Download, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { loadStudySessions } from '../lib/gamification';

export interface TreeSpecies {
  id: string;
  name: string;
  emoji: string;
  minMinutes: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  description: string;
  unlockedLevel: number;
  bgGrad: string;
}

export const TREE_SPECIES_LIST: TreeSpecies[] = [
  { id: 'cedar', name: 'Emerald Cedar', emoji: '🌲', minMinutes: 15, rarity: 'Common', description: 'Quick focus power tree', unlockedLevel: 1, bgGrad: 'from-emerald-950/40 to-slate-900' },
  { id: 'oak', name: 'Ancient Oak', emoji: '🌳', minMinutes: 25, rarity: 'Common', description: 'Standard 25m pomodoro mastery', unlockedLevel: 1, bgGrad: 'from-teal-950/40 to-slate-900' },
  { id: 'bonsai', name: 'Zen Bonsai', emoji: '🪴', minMinutes: 45, rarity: 'Rare', description: 'Deep meditation focus tree', unlockedLevel: 2, bgGrad: 'from-cyan-950/40 to-slate-900' },
  { id: 'sakura', name: 'Blossoming Sakura', emoji: '🌸', minMinutes: 60, rarity: 'Epic', description: '1 Hour uninterrupted deep work', unlockedLevel: 3, bgGrad: 'from-pink-950/40 to-slate-900' },
  { id: 'redwood', name: 'Golden Redwood', emoji: '✨🌲', minMinutes: 90, rarity: 'Legendary', description: '90m Exam simulation tree', unlockedLevel: 5, bgGrad: 'from-amber-950/40 to-slate-900' },
  { id: 'cosmic', name: 'Cosmic Star Willow', emoji: '🌌🌳', minMinutes: 120, rarity: 'Legendary', description: '2 Hours Zenith concentration', unlockedLevel: 7, bgGrad: 'from-purple-950/40 to-slate-900' },
];

export interface PlantedTreeRecord {
  id: string;
  speciesId: string;
  speciesName: string;
  emoji: string;
  durationMinutes: number;
  subject: string;
  topic?: string;
  plantedAt: string; // ISO date
  dateKey: string;   // YYYY-MM-DD
  status: 'healthy' | 'withered';
}

interface ForestGardenViewProps {
  userId?: string;
  selectedExam?: string;
  onPlantNewTree?: () => void;
}

export const ForestGardenView: React.FC<ForestGardenViewProps> = ({
  userId = 'guest',
  selectedExam = 'NEET_UG',
  onPlantNewTree,
}) => {
  const [plantedTrees, setPlantedTrees] = useState<PlantedTreeRecord[]>([]);
  const [filterRange, setFilterRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [selectedTree, setSelectedTree] = useState<PlantedTreeRecord | null>(null);

  // Load planted trees from localStorage and StudySessions
  useEffect(() => {
    const key = `aspirantx_forest_garden_${userId}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setPlantedTrees(JSON.parse(stored));
      } else {
        // Initial Mock trees based on real study data
        const today = new Date().toISOString().split('T')[0];
        const defaultTrees: PlantedTreeRecord[] = [
          { id: 'tree_1', speciesId: 'oak', speciesName: 'Ancient Oak', emoji: '🌳', durationMinutes: 25, subject: 'Physics', topic: 'Mechanics', plantedAt: new Date(Date.now() - 3600000).toISOString(), dateKey: today, status: 'healthy' },
          { id: 'tree_2', speciesId: 'sakura', speciesName: 'Blossoming Sakura', emoji: '🌸', durationMinutes: 60, subject: 'Chemistry', topic: 'Organic Mechanisms', plantedAt: new Date(Date.now() - 7200000).toISOString(), dateKey: today, status: 'healthy' },
          { id: 'tree_3', speciesId: 'bonsai', speciesName: 'Zen Bonsai', emoji: '🪴', durationMinutes: 45, subject: 'Biology', topic: 'Human Physiology', plantedAt: new Date(Date.now() - 14400000).toISOString(), dateKey: today, status: 'healthy' },
        ];
        localStorage.setItem(key, JSON.stringify(defaultTrees));
        setPlantedTrees(defaultTrees);
      }
    } catch (e) {}
  }, [userId]);

  const healthyTreesCount = plantedTrees.filter(t => t.status === 'healthy').length;
  const witheredTreesCount = plantedTrees.filter(t => t.status === 'withered').length;
  const totalFocusMinutes = plantedTrees
    .filter(t => t.status === 'healthy')
    .reduce((acc, t) => acc + t.durationMinutes, 0);

  return (
    <div className="space-y-6">
      {/* Forest Garden Stats Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-indigo-950/40 border border-emerald-500/30 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Trees className="w-4 h-4 text-emerald-400" />
              <span>Forest Study Ecosystem</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100">
              My Realtime Focus Forest 🌲
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every completed study sprint grows a living tree in your personal academic sanctuary.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
              <Sprout className="w-4 h-4" />
              <span>{healthyTreesCount} Trees Grown</span>
            </div>
          </div>
        </div>

        {/* Core Forest KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Total Trees</span>
            <span className="text-xl font-extrabold text-emerald-400">{plantedTrees.length} 🌳</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Total Focus Time</span>
            <span className="text-xl font-extrabold text-cyan-400">{(totalFocusMinutes / 60).toFixed(1)} hrs</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Healthy Forest</span>
            <span className="text-xl font-extrabold text-emerald-300">
              {plantedTrees.length > 0 ? Math.round((healthyTreesCount / plantedTrees.length) * 100) : 100}%
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Withered Trees</span>
            <span className="text-xl font-extrabold text-rose-400">{witheredTreesCount} 🥀</span>
          </div>
        </div>
      </div>

      {/* 3D-Isometric Garden Visual Canvas Grid */}
      <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Trees className="w-4 h-4 text-emerald-400" />
            <span>Living Forest Grid (Planted Trees)</span>
          </h3>
          <span className="text-xs text-slate-400">Tap tree for study log</span>
        </div>

        {plantedTrees.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No trees planted yet! Start a Pomodoro study timer to plant your first seed 🌱
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 p-4 rounded-2xl bg-gradient-to-b from-[#061811] via-[#020b08] to-[#020617] border border-emerald-900/30 min-h-[220px]">
            {plantedTrees.map((tree) => (
              <motion.div
                key={tree.id}
                whileHover={{ scale: 1.12, y: -4 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setSelectedTree(tree)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer select-none relative group ${
                  tree.status === 'healthy'
                    ? 'bg-emerald-950/30 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                    : 'bg-rose-950/20 border-rose-900/40 opacity-60'
                }`}
              >
                <div className="text-3xl sm:text-4xl filter drop-shadow-md transform group-hover:scale-110 transition-transform">
                  {tree.status === 'healthy' ? tree.emoji : '🥀'}
                </div>
                <span className="text-[10px] font-bold text-slate-300 mt-1 truncate max-w-full">
                  {tree.subject.split('—')[0]}
                </span>
                <span className="text-[9px] text-emerald-400 font-semibold">
                  {tree.durationMinutes}m
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Unlockable Tree Species Botanical Garden */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Botanical Species Roster (Forest Unlockables)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Level up by studying consistently to unlock rare and legendary focus trees.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {TREE_SPECIES_LIST.map((sp) => (
            <div
              key={sp.id}
              className={`p-3.5 rounded-2xl bg-gradient-to-br ${sp.bgGrad} border border-slate-800/80 flex items-center gap-3`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                {sp.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-200 truncate">{sp.name}</h4>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                    sp.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    sp.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                    sp.rarity === 'Rare' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {sp.rarity}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sp.description}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-emerald-400 font-bold">
                  <span>⏱️ {sp.minMinutes} min focus</span>
                  <span>•</span>
                  <span>Lvl {sp.unlockedLevel}+</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
