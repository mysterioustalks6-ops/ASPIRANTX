import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, X, Plus, Trash2, Clock, Shield, Check, Lock } from 'lucide-react';
import { DistractingApp, AppPickerModal } from './AppPickerModal';

export interface AppGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  packages: string[];
  dailyLimitMinutes: number;
  blockMode: 'LIMIT' | 'BLOCKED';
  enabled: boolean;
  isCustom?: boolean;
}

interface AppGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: AppGroup | null;
  installedApps: DistractingApp[];
  onSave: (group: AppGroup) => void;
  onDelete?: (groupId: string) => void;
}

const EMOJI_OPTIONS = ['📱', '🎮', '🎬', '🛍️', '💬', '⚡', '🔒', '🚫', '🍔', '📚', '🎯', '⏳', '🔥', '🌐'];
const COLOR_OPTIONS = [
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Indigo', hex: '#6366F1' }
];

export const AppGroupModal: React.FC<AppGroupModalProps> = ({
  isOpen,
  onClose,
  group,
  installedApps,
  onSave,
  onDelete
}) => {
  const isEditing = !!group;

  const [name, setName] = useState(group?.name || '');
  const [icon, setIcon] = useState(group?.icon || '📱');
  const [color, setColor] = useState(group?.color || '#EC4899');
  const [packages, setPackages] = useState<string[]>(group?.packages || []);
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState<number>(group?.dailyLimitMinutes || 30);
  const [blockMode, setBlockMode] = useState<'LIMIT' | 'BLOCKED'>(group?.blockMode || 'LIMIT');
  const [showAppPicker, setShowAppPicker] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    const updatedGroup: AppGroup = {
      id: group?.id || `group_${Date.now()}`,
      name: name.trim(),
      icon,
      color,
      packages,
      dailyLimitMinutes: blockMode === 'BLOCKED' ? 0 : dailyLimitMinutes,
      blockMode,
      enabled: group?.enabled ?? true,
      isCustom: group?.isCustom ?? true
    };

    onSave(updatedGroup);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
        <div className="max-w-md w-full max-h-[90vh] rounded-3xl bg-[#0C0F0D] border border-[#1E2520] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#1E2520] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl border shadow-sm"
                style={{ backgroundColor: `${color}20`, borderColor: `${color}50` }}
              >
                <span>{icon}</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {isEditing ? `Edit ${group.name}` : 'Create App Group'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Combine multiple apps into a unified blocking rule
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh]">
            {/* Group Name & Emoji */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">Group Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Social Media, Gaming, Exam Mode..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex-1 p-3 rounded-2xl bg-[#161B18] border border-[#1E2520] text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">Group Icon</label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {EMOJI_OPTIONS.map(em => (
                  <button
                    key={em}
                    onClick={() => setIcon(em)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all cursor-pointer ${
                      icon === em
                        ? 'bg-white/20 border-2 border-white scale-110 shadow-sm'
                        : 'bg-[#161B18] border border-[#1E2520] hover:bg-white/10'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">Badge Accent Color</label>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      color === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {color === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Apps in this Group */}
            <div className="p-3.5 rounded-2xl bg-[#161B18] border border-[#1E2520] space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Apps in this Group</h4>
                  <p className="text-[10px] text-slate-400">{packages.length} apps selected</p>
                </div>
                <button
                  onClick={() => setShowAppPicker(true)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Manage Apps
                </button>
              </div>

              {/* Apps Pills Preview */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {packages.length === 0 ? (
                  <span className="text-slate-500 text-xs italic">No apps selected yet. Click Manage Apps to add!</span>
                ) : (
                  packages.map(pkg => {
                    const info = installedApps.find(a => a.package === pkg);
                    const label = info?.name || (pkg.includes('instagram') ? 'Instagram' : pkg.includes('youtube') ? 'YouTube' : pkg.split('.').pop() || pkg);
                    const emoji = info?.icon || '📱';
                    return (
                      <span
                        key={pkg}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-[#1E2520] text-[11px] text-slate-300 flex items-center gap-1 font-medium"
                      >
                        <span>{emoji}</span>
                        <span>{label}</span>
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            {/* Group Protection Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">Protection Policy</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBlockMode('LIMIT')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    blockMode === 'LIMIT'
                      ? 'bg-emerald-950/30 border-emerald-500 text-white'
                      : 'bg-[#161B18] border-[#1E2520] text-slate-400'
                  }`}
                >
                  <Clock className="w-4 h-4 text-emerald-400 mb-1" />
                  <div className="text-xs font-bold">Shared Daily Limit</div>
                  <div className="text-[10px] text-slate-400">Total time shared by all apps</div>
                </button>

                <button
                  onClick={() => setBlockMode('BLOCKED')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    blockMode === 'BLOCKED'
                      ? 'bg-rose-950/30 border-rose-500 text-white'
                      : 'bg-[#161B18] border-[#1E2520] text-slate-400'
                  }`}
                >
                  <Lock className="w-4 h-4 text-rose-400 mb-1" />
                  <div className="text-xs font-bold">100% Strict Block</div>
                  <div className="text-[10px] text-slate-400">Zero tolerance instant block</div>
                </button>
              </div>

              {blockMode === 'LIMIT' && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Daily Shared Quota:</span>
                    <span className="text-emerald-400 font-bold font-mono">{dailyLimitMinutes} mins / day</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[15, 25, 30, 45, 60].map(m => (
                      <button
                        key={m}
                        onClick={() => setDailyLimitMinutes(m)}
                        className={`py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          dailyLimitMinutes === m
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                            : 'bg-[#161B18] border-[#1E2520] text-slate-400'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[#1E2520] bg-[#0C0F0D] flex items-center justify-between gap-2.5">
            {isEditing && group?.isCustom && onDelete && (
              <button
                onClick={() => {
                  onDelete(group.id);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                title="Delete Group"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={!name.trim() || packages.length === 0}
              className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Save Group
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modal: App Picker for this Group */}
      <AppPickerModal
        isOpen={showAppPicker}
        onClose={() => setShowAppPicker(false)}
        installedApps={installedApps}
        selectedPackages={packages}
        title={`Select Apps for ${name || 'Group'}`}
        subtitle="Selected apps will share this group's protection rules"
        onSave={selected => setPackages(selected)}
      />
    </>
  );
};
