import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab } from '../types';
import { 
  ALL_WORKSPACE_FEATURES, 
  WORKSPACE_PRESETS,
  WorkspaceConfig,
  WorkspaceFeatureMeta,
  UserFeaturePreference,
  loadWorkspaceConfig,
  saveWorkspaceConfig,
  applyWorkspacePreset,
  resetWorkspaceToDefault,
  getDefaultWorkspaceConfig
} from '../lib/workspacePreferences';
import { 
  Sliders, 
  Sparkles, 
  GripVertical, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Compass, 
  Eye, 
  CheckCircle2, 
  Search, 
  Info,
  Zap,
  Target,
  BookOpen,
  CheckSquare,
  Timer,
  Award,
  BookMarked,
  HelpCircle,
  MessageSquare,
  Users,
  Mic,
  BarChart3,
  Flame,
  ShieldCheck,
  Gift,
  Crown,
  Handshake
} from 'lucide-react';

interface WorkspaceCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  isWizardMode?: boolean;
  userId?: string;
  onCompleteWizard?: (config: WorkspaceConfig) => void;
}

const ICON_MAP: Record<string, any> = {
  Target,
  BookOpen,
  CheckSquare,
  Timer,
  Award,
  BookMarked,
  HelpCircle,
  Sparkles,
  MessageSquare,
  Users,
  Mic,
  BarChart3,
  Flame,
  ShieldCheck,
  Gift,
  Crown,
  Handshake,
};

export const WorkspaceCustomizer: React.FC<WorkspaceCustomizerProps> = ({
  isOpen,
  onClose,
  isWizardMode = false,
  userId = 'default_user',
  onCompleteWizard,
}) => {
  const [config, setConfig] = useState<WorkspaceConfig>(() => loadWorkspaceConfig(userId));
  const [activeStep, setActiveStep] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingId, setEditingId] = useState<ActiveTab | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = useState<boolean>(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('focused_minimalist');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const current = loadWorkspaceConfig(userId);
      setConfig(current);
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const featureMetaMap = new Map<ActiveTab, WorkspaceFeatureMeta>();
  ALL_WORKSPACE_FEATURES.forEach((m) => featureMetaMap.set(m.id, m));

  // Get active preferences in sorted order
  const activePreferences = config.preferences
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Get inactive preferences
  const inactivePreferences = config.preferences.filter((p) => !p.isActive);

  // Filtered inactive preferences for search
  const filteredInactive = inactivePreferences.filter((p) => {
    const meta = featureMetaMap.get(p.featureId);
    if (!meta) return false;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      meta.defaultLabel.toLowerCase().includes(query) ||
      meta.shortDescription.toLowerCase().includes(query) ||
      meta.categoryLabel.toLowerCase().includes(query)
    );
  });

  const handleToggleFeature = (featureId: ActiveTab) => {
    setConfig((prev) => {
      const current = prev.preferences.find((p) => p.featureId === featureId);
      const willBeActive = !current?.isActive;
      
      let nextOrder = current?.sortOrder || 99;
      if (willBeActive) {
        const maxActiveOrder = Math.max(
          ...prev.preferences.filter((p) => p.isActive).map((p) => p.sortOrder),
          0
        );
        nextOrder = maxActiveOrder + 1;
      }

      const updatedPrefs = prev.preferences.map((p) => {
        if (p.featureId === featureId) {
          return {
            ...p,
            isActive: willBeActive,
            sortOrder: nextOrder,
            lastUsedAt: willBeActive ? new Date().toISOString() : p.lastUsedAt,
          };
        }
        return p;
      });

      return {
        ...prev,
        isConfigured: true,
        preferences: updatedPrefs,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleAddFeature = (featureId: ActiveTab) => {
    setConfig((prev) => {
      const maxOrder = Math.max(
        ...prev.preferences.filter((p) => p.isActive).map((p) => p.sortOrder),
        0
      );
      const updated = prev.preferences.map((p) => {
        if (p.featureId === featureId) {
          return {
            ...p,
            isActive: true,
            sortOrder: maxOrder + 1,
            lastUsedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      return {
        ...prev,
        isConfigured: true,
        preferences: updated,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleRemoveFeature = (featureId: ActiveTab) => {
    setConfig((prev) => {
      const updated = prev.preferences.map((p) => {
        if (p.featureId === featureId) {
          return { ...p, isActive: false };
        }
        return p;
      });
      return {
        ...prev,
        preferences: updated,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleStartRename = (featureId: ActiveTab, currentLabel?: string) => {
    const meta = featureMetaMap.get(featureId);
    setEditingId(featureId);
    setEditingText(currentLabel || meta?.defaultLabel || '');
  };

  const handleSaveRename = (featureId: ActiveTab) => {
    if (editingText.trim()) {
      setConfig((prev) => {
        const updated = prev.preferences.map((p) => {
          if (p.featureId === featureId) {
            return { ...p, customLabel: editingText.trim() };
          }
          return p;
        });
        return { ...prev, preferences: updated };
      });
    }
    setEditingId(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const items = [...activePreferences];
    const temp = items[index - 1];
    items[index - 1] = items[index];
    items[index] = temp;
    rebuildPreferencesOrder(items);
  };

  const handleMoveDown = (index: number) => {
    if (index >= activePreferences.length - 1) return;
    const items = [...activePreferences];
    const temp = items[index + 1];
    items[index + 1] = items[index];
    items[index] = temp;
    rebuildPreferencesOrder(items);
  };

  const rebuildPreferencesOrder = (orderedActiveItems: UserFeaturePreference[]) => {
    setConfig((prev) => {
      const activeIds = new Set(orderedActiveItems.map((i) => i.featureId));
      const remaining = prev.preferences.filter((p) => !activeIds.has(p.featureId));

      const remappedActive = orderedActiveItems.map((item, idx) => ({
        ...item,
        isActive: true,
        sortOrder: idx + 1,
      }));

      let orderCount = remappedActive.length + 1;
      const remappedRemaining = remaining.map((item) => ({
        ...item,
        isActive: false,
        sortOrder: orderCount++,
      }));

      return {
        ...prev,
        isConfigured: true,
        preferences: [...remappedActive, ...remappedRemaining],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const items = [...activePreferences];
    const [draggedItem] = items.splice(draggedIndex, 1);
    items.splice(dropIndex, 0, draggedItem);

    rebuildPreferencesOrder(items);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleApplyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const updated = applyWorkspacePreset(presetId, userId);
    setConfig(updated);
  };

  const handleResetToDefault = () => {
    const def = resetWorkspaceToDefault(userId);
    setConfig(def);
    setSaveSuccessMsg('Restored default AspirantX workspace!');
    setTimeout(() => setSaveSuccessMsg(null), 1500);
  };

  const handleSaveAndApply = () => {
    const finalConfig: WorkspaceConfig = {
      ...config,
      isConfigured: true,
      userId,
      updatedAt: new Date().toISOString(),
    };

    saveWorkspaceConfig(finalConfig, true);

    if (onCompleteWizard) {
      onCompleteWizard(finalConfig);
    }

    setSaveSuccessMsg('✨ Workspace personalization applied successfully!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative my-auto my-6 flex flex-col max-h-[92vh]"
      >
        {/* Glow Element */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between relative z-10 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                {isWizardMode ? 'Personalize Your Study Workspace' : 'Customize My Workspace'}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  Drag & Drop
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Choose features you want active, rename them, and reorder your sidebar for zero clutter.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Customizer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Navigation if in Wizard Mode */}
        {isWizardMode && (
          <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs font-semibold shrink-0">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveStep(1)}
                className={`flex items-center gap-2 transition-colors ${
                  activeStep === 1 ? 'text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  activeStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>1</span>
                <span>Select Starter Preset</span>
              </button>

              <button
                onClick={() => setActiveStep(2)}
                className={`flex items-center gap-2 transition-colors ${
                  activeStep === 2 ? 'text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  activeStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>2</span>
                <span>Select & Rename Features</span>
              </button>

              <button
                onClick={() => setActiveStep(3)}
                className={`flex items-center gap-2 transition-colors ${
                  activeStep === 3 ? 'text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  activeStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>3</span>
                <span>Drag & Drop Order</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              Step {activeStep} of 3
            </div>
          </div>
        )}

        {/* Modal Main Content (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 overscroll-contain">
          {/* STEP 1 (If Wizard Mode): Starter Presets */}
          {(!isWizardMode || activeStep === 1) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  Quick Starter Presets
                </label>
                <span className="text-[11px] text-slate-400">Click any preset to instantly configure</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {WORKSPACE_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative group flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{preset.icon}</span>
                          {isSelected && (
                            <span className="p-1 rounded-full bg-indigo-500 text-white text-[10px]">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {preset.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-indigo-400 font-semibold">
                        <span>{preset.activeFeatureIds.length} Features</span>
                        <span>Apply →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MAIN DRAG & DROP AND FEATURE CUSTOMIZATION VIEW */}
          {(!isWizardMode || activeStep >= 2) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Active Features List (Drag & Drop Reordering & Renaming) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Active In Your Workspace ({activePreferences.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Drag by the handle ⠿ or use arrows ↑↓ to reorder. Click pencil ✎ to rename.
                    </p>
                  </div>

                  <button
                    onClick={handleResetToDefault}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
                    title="Reset to default AspirantX layout"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                {activePreferences.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400 font-semibold">No active features selected.</p>
                    <p className="text-[11px] text-slate-500">
                      Add features from the drawer below or apply a starter preset.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activePreferences.map((pref, index) => {
                      const meta = featureMetaMap.get(pref.featureId);
                      if (!meta) return null;
                      const IconComponent = ICON_MAP[meta.iconName] || Target;
                      const isEditing = editingId === pref.featureId;
                      const isDragging = draggedIndex === index;
                      const isOver = dragOverIndex === index;

                      return (
                        <div
                          key={pref.featureId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={() => {
                            setDraggedIndex(null);
                            setDragOverIndex(null);
                          }}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isDragging
                              ? 'opacity-40 bg-indigo-950/50 border-indigo-500 scale-[0.98]'
                              : isOver
                              ? 'bg-indigo-900/20 border-indigo-400 shadow-lg'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Drag handle & Icon & Name */}
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {/* Grip Handle */}
                            <div 
                              className="cursor-grab active:cursor-grabbing p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                              title="Drag up or down to reorder"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>

                            {/* Order Number Badge */}
                            <span className="w-5 h-5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                              {index + 1}
                            </span>

                            {/* Feature Icon */}
                            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                              <IconComponent className="w-4 h-4" />
                            </div>

                            {/* Title & Description or Inline Rename Form */}
                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveRename(pref.featureId);
                                      if (e.key === 'Escape') setEditingId(null);
                                    }}
                                    autoFocus
                                    className="w-full px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900 border border-indigo-500 text-white focus:outline-none"
                                    placeholder="Enter custom label..."
                                  />
                                  <button
                                    onClick={() => handleSaveRename(pref.featureId)}
                                    className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shrink-0"
                                    title="Save Rename"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors shrink-0"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-bold text-white truncate">
                                      {pref.customLabel || meta.defaultLabel}
                                    </h4>
                                    {pref.customLabel && pref.customLabel !== meta.defaultLabel && (
                                      <span className="text-[9px] text-slate-500 font-normal truncate">
                                        ({meta.defaultLabel})
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 line-clamp-1">
                                    {meta.shortDescription}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions: Edit Rename, Move Up/Down, Remove */}
                          <div className="flex items-center gap-1 shrink-0">
                            {!isEditing && (
                              <button
                                onClick={() => handleStartRename(pref.featureId, pref.customLabel)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                                title="Rename feature (e.g. rename 'Syllabus' to 'My Plan')"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Arrow Up */}
                            <button
                              disabled={index === 0}
                              onClick={() => handleMoveUp(index)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                index === 0
                                  ? 'text-slate-700 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                              }`}
                              title="Move Up in Sidebar"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Arrow Down */}
                            <button
                              disabled={index === activePreferences.length - 1}
                              onClick={() => handleMoveDown(index)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                index === activePreferences.length - 1
                                  ? 'text-slate-700 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                              }`}
                              title="Move Down in Sidebar"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Remove from active workspace */}
                            <button
                              onClick={() => handleRemoveFeature(pref.featureId)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Hide from sidebar (Move to '+ More Features' drawer)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Collapsible "+ Add More Features" Drawer */}
                <div className="pt-2 border-t border-slate-800">
                  <div
                    onClick={() => setIsMoreFeaturesOpen(!isMoreFeaturesOpen)}
                    className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <Plus className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                          + Add More Features Drawer
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            {inactivePreferences.length} Available
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium">
                          These features are safely hidden from your main sidebar. Click to activate anytime.
                        </p>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-white">
                      {isMoreFeaturesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {isMoreFeaturesOpen && (
                    <div className="mt-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3 animate-in fade-in duration-200">
                      {/* Search Filter for Inactive Features */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search available features by name or category..."
                          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {filteredInactive.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                          {searchQuery
                            ? 'No available features match your search filter.'
                            : 'All available features are already active in your workspace!'}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                          {filteredInactive.map((pref) => {
                            const meta = featureMetaMap.get(pref.featureId);
                            if (!meta) return null;
                            const IconComponent = ICON_MAP[meta.iconName] || Target;

                            return (
                              <div
                                key={pref.featureId}
                                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 flex items-start justify-between gap-2.5 transition-all group"
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className="p-2 rounded-xl bg-slate-800 text-slate-400 group-hover:text-indigo-300 group-hover:bg-indigo-500/10 transition-colors shrink-0 mt-0.5">
                                    <IconComponent className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <h5 className="text-xs font-bold text-slate-200 truncate">
                                        {meta.defaultLabel}
                                      </h5>
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                                        {meta.badge}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                                      {meta.shortDescription}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleAddFeature(pref.featureId)}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
                                  title="Add to My Workspace"
                                >
                                  <Plus className="w-3 h-3" /> Add
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live Sidebar Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    Live Sidebar Preview
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase">
                    Real-time
                  </span>
                </div>

                {/* Visual Representation of Sidebar */}
                <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800/80 shadow-inner space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-indigo-600/30">
                      AX
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">ASPIRANTX</h4>
                      <p className="text-[10px] text-slate-400 font-medium">My Custom Workspace</p>
                    </div>
                  </div>

                  {/* Rendered Preview Items */}
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                    {activePreferences.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        Sidebar will be empty. Please select at least one feature.
                      </div>
                    ) : (
                      activePreferences.map((pref, idx) => {
                        const meta = featureMetaMap.get(pref.featureId);
                        if (!meta) return null;
                        const IconComponent = ICON_MAP[meta.iconName] || Target;
                        const isFirst = idx === 0;

                        return (
                          <div
                            key={pref.featureId}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                              isFirst
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                : 'text-slate-300 bg-slate-900/60 border border-slate-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isFirst ? 'text-white' : 'text-slate-400'}`} />
                              <span className="truncate">{pref.customLabel || meta.defaultLabel}</span>
                            </div>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                                isFirst
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {meta.badge}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Preview Footer note */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{activePreferences.length} active features shown</span>
                    <span>{inactivePreferences.length} hidden in drawer</span>
                  </div>
                </div>

                {/* Helper Tips Card */}
                <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-2.5 text-xs">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-indigo-200 leading-relaxed">
                    <strong className="font-bold text-white">Pro Tip:</strong> Reordering automatically updates on all your devices. You can reopen this customizer anytime by clicking the <strong>"✨ Customize Workspace"</strong> button in your sidebar!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            {saveSuccessMsg && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                {saveSuccessMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancel
            </button>

            {isWizardMode && activeStep < 3 ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => prev + 1)}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
              >
                <span>Continue to Step {activeStep + 1}</span>
                <span>→</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAndApply}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save & Apply My Workspace</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
