import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Sparkles, 
  Flame, 
  Target, 
  Check, 
  RotateCcw,
  Zap
} from 'lucide-react';
import { triggerConfetti } from '../lib/animations';

export interface StudyTask {
  id: string;
  title: string;
  completed: boolean;
  subject?: string;
  createdAt: string;
  completedAt?: string;
}

interface GalaxyStudyChecklistProps {
  userId?: string;
  currentSubject?: string;
  className?: string;
  compact?: boolean;
}

const PRESET_TARGETS = [
  '⚡ Solve 30 Practice MCQs',
  '📖 Deep Read Core Chapter Concepts',
  '📝 Revise Formula Sheet & Short Notes',
  '🎯 Full Mock Exam Analysis',
  '🧠 Active Recall Flashcards',
  '⏱️ 2 Full Focus Pomodoro Sprints'
];

export const GalaxyStudyChecklist: React.FC<GalaxyStudyChecklistProps> = ({
  userId,
  currentSubject,
  className = '',
  compact = false
}) => {
  const storageKey = `studyride_galaxy_tasks_${userId || 'guest'}`;

  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    // Default starter tasks for students
    return [
      {
        id: 't-default-1',
        title: 'Complete 2 High-Yield Pomodoro Sprints (50 mins)',
        completed: false,
        subject: currentSubject || 'General Study',
        createdAt: new Date().toISOString()
      },
      {
        id: 't-default-2',
        title: 'Revise Mistake Notebook & Weak Formulae',
        completed: false,
        subject: currentSubject || 'Revision',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [newTaskInput, setNewTaskInput] = useState('');

  // Persist tasks on update
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch (e) {}
  }, [tasks, storageKey]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const willComplete = !t.completed;
          if (willComplete) {
            triggerConfetti();
          }
          return {
            ...t,
            completed: willComplete,
            completedAt: willComplete ? new Date().toISOString() : undefined
          };
        }
        return t;
      })
    );
  };

  const handleAddTask = (textToAdd?: string) => {
    const title = (textToAdd || newTaskInput).trim();
    if (!title) return;

    const newTask: StudyTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      completed: false,
      subject: currentSubject || 'Study Goal',
      createdAt: new Date().toISOString()
    };

    setTasks((prev) => [newTask, ...prev]);
    if (!textToAdd) setNewTaskInput('');
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  const handleResetAll = () => {
    if (window.confirm('Reset all checkboxes for a fresh study session?')) {
      setTasks((prev) => prev.map((t) => ({ ...t, completed: false, completedAt: undefined })));
    }
  };

  return (
    <div className={`rounded-3xl bg-slate-900/90 border border-purple-500/20 backdrop-blur-2xl shadow-xl overflow-hidden relative ${className}`}>
      {/* Cosmic background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
            <h4 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
              <Target className="w-4 h-4 text-cyan-400" />
              Galaxy Study Checklist
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] font-extrabold text-purple-300">
              Cosmic HUD
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {completedCount} of {tasks.length} targets completed ({progressPercent}%)
          </p>
        </div>

        {/* Progress bar and reset controls */}
        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 transition-all cursor-pointer"
            >
              Clear Done
            </button>
          )}

          <button
            onClick={handleResetAll}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Reset checkboxes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Glowing cosmic progress indicator */}
      <div className="w-full h-1 bg-slate-950">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-sky-500 to-purple-500 transition-all duration-500 shadow-sm shadow-cyan-400/50"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-4 sm:p-5 space-y-4 relative z-10">
        {/* Add Task Input Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Add your study target for this session (e.g. Solve 20 Trigonometry MCQs)..."
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-cyan-400 placeholder:text-slate-600 transition-all"
            />
          </div>
          <button
            onClick={() => handleAddTask()}
            disabled={!newTaskInput.trim()}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Add Target</span>
          </button>
        </div>

        {/* Quick presets chips */}
        {!compact && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Quick Add Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TARGETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddTask(preset)}
                  className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-purple-950/40 border border-slate-800/80 hover:border-purple-500/40 text-[11px] font-medium text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>{preset}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Task list with modern cosmic checkboxes */}
        <div className="space-y-2 pt-1 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          <AnimatePresence initial={false}>
            {tasks.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <Sparkles className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">No active targets set.</p>
                <p className="text-[11px] text-slate-600">Type above or tap a quick suggestion to begin your study checklist.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group select-none ${
                    task.completed
                      ? 'bg-slate-950/50 border-emerald-500/20 opacity-75'
                      : 'bg-slate-950/80 border-slate-800/80 hover:border-purple-500/40 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Modern Galaxy Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0 ${
                        task.completed
                          ? 'bg-gradient-to-tr from-emerald-400 via-cyan-400 to-purple-500 text-slate-950 shadow-md shadow-cyan-400/30 ring-2 ring-emerald-400/30'
                          : 'border-2 border-slate-700 bg-slate-900/80 group-hover:border-cyan-400 group-hover:shadow-sm group-hover:shadow-cyan-400/20'
                      }`}
                    >
                      {task.completed && (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                        </motion.div>
                      )}
                    </div>

                    {/* Task Title & Details */}
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs font-semibold block transition-all break-words ${
                          task.completed
                            ? 'line-through text-slate-500 decoration-slate-600 decoration-2'
                            : 'text-slate-100 group-hover:text-cyan-200'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.subject && (
                        <span className="text-[10px] text-purple-400/80 font-medium">
                          {task.subject}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {task.completed && (
                      <span className="text-[10px] font-extrabold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 hidden sm:inline">
                        Achieved ✨
                      </span>
                    )}
                    <button
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      className="p-1 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-slate-900 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete target"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
