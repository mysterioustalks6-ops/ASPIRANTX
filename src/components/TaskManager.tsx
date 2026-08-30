import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskItem, TaskStatus } from '../types';
import { INITIAL_TASKS } from '../data/tasks';
import { 
  Plus, 
  CheckSquare, 
  Square, 
  Trash2, 
  Calendar, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Flame,
  Kanban,
  Award
} from 'lucide-react';
import { awardXPAndCoins } from '../lib/gamification';

interface TaskManagerProps {
  userId?: string;
  selectedExam?: string;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ userId, selectedExam = 'NEET_UG' }) => {
  const getTaskKey = (id?: string, exam?: string) => `aspirantx_kanban_tasks_v3_${id || 'guest'}_${exam || 'NEET_UG'}`;

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const raw = localStorage.getItem(getTaskKey(userId, selectedExam));
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_TASKS;
  });

  // Reload tasks when selectedExam or userId changes
  useEffect(() => {
    const raw = localStorage.getItem(getTaskKey(userId, selectedExam));
    if (raw) {
      try {
        setTasks(JSON.parse(raw));
        return;
      } catch (e) {
        // fallback
      }
    }
    setTasks(INITIAL_TASKS);
  }, [selectedExam, userId]);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Form Fields
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('Syllabus Micro Checklist');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newMinutes, setNewMinutes] = useState<number>(45);
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');

  // NOTE: Removed duplicate [userId]-only useEffect — the [selectedExam, userId] effect above handles both cases.

  // Save to LocalStorage on change per exam
  useEffect(() => {
    localStorage.setItem(getTaskKey(userId, selectedExam), JSON.stringify(tasks));
  }, [tasks, userId, selectedExam]);

  // Move task to new status
  const moveTaskStatus = async (id: string, nextStatus: TaskStatus) => {
    let earnedReward = false;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          if (t.status !== 'completed' && nextStatus === 'completed') {
            earnedReward = true;
          }
          return {
            ...t,
            status: nextStatus,
            completed: nextStatus === 'completed',
          };
        }
        return t;
      })
    );

    if (earnedReward) {
      await awardXPAndCoins(20, 5, 'Completed Daily Task', userId);
      try {
        const res = await fetch('/api/user/streak/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId || 'guest', activityType: 'task_complete' }),
        });
        const data = await res.json().catch(() => null);
        if (data && typeof data.streakDays === 'number') {
          window.dispatchEvent(
            new CustomEvent('aspirantx_streak_updated', {
              detail: { streakDays: data.streakDays, lastActiveDate: data.lastActiveDate },
            })
          );
        }
      } catch (e) {
        console.warn('Streak trigger failed:', e);
      }
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task_${Date.now()}`,
      title: newTitle.trim(),
      subject: newSubject,
      priority: newPriority,
      completed: newStatus === 'completed',
      status: newStatus,
      dueDate: 'Today',
      estimatedMinutes: newMinutes,
    };

    setTasks([newTask, ...tasks]);
    setNewTitle('');
    setShowAddModal(false);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (id) {
      moveTaskStatus(id, targetStatus);
    }
    setDraggedTaskId(null);
  };

  const columns: { id: TaskStatus; title: string; color: string; badgeBg: string }[] = [
    { id: 'todo', title: 'To Do Routine', color: 'text-cyan-400', badgeBg: 'bg-cyan-500/10 border-cyan-500/20' },
    { id: 'in_progress', title: 'In Progress Sprint', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/20' },
    { id: 'completed', title: 'Completed Tasks', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/20' },
  ];

  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Kanban className="w-5 h-5 text-emerald-400" />
            Aspirant Daily Kanban Board
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Drag cards between columns or use quick action buttons. Earn <span className="text-amber-400 font-bold">+20 XP & +5 Coins</span> per finished task!
          </p>
        </div>

        <button
          id="add-kanban-task-btn"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add Study Goal
        </button>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex flex-col min-h-[420px] backdrop-blur-xl"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.id === 'todo' ? 'bg-cyan-400' : col.id === 'in_progress' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                    {col.title}
                  </h4>
                </div>
                <span className="text-xs font-bold text-slate-400 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Cards List */}
              <div className="flex-1 space-y-3">
                <AnimatePresence>
                  {colTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e as any, task.id)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 hover:border-slate-700 cursor-grab active:cursor-grabbing transition-all space-y-3 ${
                        task.status === 'completed' ? 'opacity-75 border-emerald-500/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-cyan-300 border border-slate-800">
                          {task.subject}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            task.priority === 'High'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : task.priority === 'Medium'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <p className={`text-xs font-bold leading-relaxed ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {task.title}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> {task.estimatedMinutes} mins
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Left Move Button */}
                          {col.id !== 'todo' && (
                            <button
                              onClick={() => moveTaskStatus(task.id, col.id === 'completed' ? 'in_progress' : 'todo')}
                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                              title="Move Left"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}

                          {/* Right Move Button */}
                          {col.id !== 'completed' && (
                            <button
                              onClick={() => moveTaskStatus(task.id, col.id === 'todo' ? 'in_progress' : 'completed')}
                              className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30"
                              title={col.id === 'todo' ? 'Start Sprint' : 'Mark Complete & Earn XP'}
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colTasks.length === 0 && (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs my-auto">
                    No tasks in {col.title.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
          >
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Add New Study Task
            </h4>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Read Chapter 12 on Fundamental Rights & solve 20 PYQs"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Polity">Polity</option>
                    <option value="History">History</option>
                    <option value="Economy">Economy</option>
                    <option value="Environment">Environment</option>
                    <option value="Quant">Quant</option>
                    <option value="CSAT">CSAT</option>
                    <option value="Current Affairs">Current Affairs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estimated Mins
                  </label>
                  <input
                    type="number"
                    value={newMinutes}
                    onChange={(e) => setNewMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    min={5}
                    max={240}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
                >
                  Save Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
