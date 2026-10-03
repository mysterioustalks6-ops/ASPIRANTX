import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, BookOpen, Clock, Sparkles, Layers, Target, CheckCircle2 } from 'lucide-react';
import { PersonalSyllabusNode } from '../lib/personalSyllabus';

interface AddCustomTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedExam: string;
  availableSubjects: string[];
  initialSubject?: string;
  initialChapter?: string;
  onAddCustomTopic: (newNode: PersonalSyllabusNode) => Promise<void> | void;
}

export const AddCustomTopicModal: React.FC<AddCustomTopicModalProps> = ({
  isOpen,
  onClose,
  selectedExam,
  availableSubjects,
  initialSubject = '',
  initialChapter = '',
  onAddCustomTopic
}) => {
  const [subjectMode, setSubjectMode] = useState<'existing' | 'new'>(
    availableSubjects.length > 0 ? 'existing' : 'new'
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubject || (availableSubjects[0] || 'General')
  );
  const [customSubjectName, setCustomSubjectName] = useState<string>('');
  const [chapterTitle, setChapterTitle] = useState<string>(initialChapter || '');
  const [subtopicsText, setSubtopicsText] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<number>(6);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Very Hard'>('Medium');
  const [stage, setStage] = useState<string>('Prelims');
  const [weightage, setWeightage] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subjectMode === 'existing' ? selectedSubject.trim() : customSubjectName.trim();
    if (!finalSubject) {
      setErrorMsg('Please specify a subject name.');
      return;
    }
    if (!chapterTitle.trim()) {
      setErrorMsg('Please enter a Chapter or Topic title.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const generatedId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const parsedSubtopics = subtopicsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const node: PersonalSyllabusNode = {
      id: generatedId,
      exam: selectedExam,
      subject: finalSubject,
      chapter: chapterTitle.trim(),
      topic: chapterTitle.trim(),
      subtopic: parsedSubtopics.length > 0 ? parsedSubtopics[0] : chapterTitle.trim(),
      stage,
      weightage,
      time_studied_seconds: 0,
      tags: `difficulty:${difficulty},estHours:${estimatedHours}`,
      order: Date.now()
    };

    try {
      await onAddCustomTopic(node);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add custom topic.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>Add Custom Syllabus Topic</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Apne hisaab se syllabus jodein — Live forecast & metrics automatically update honge.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 overflow-y-auto pr-1 flex-1 relative z-10 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Subject Selector / Creator */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  <span>Subject</span>
                </label>
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSubjectMode('existing')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      subjectMode === 'existing'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectMode('new')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      subjectMode === 'new'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    + New Subject
                  </button>
                </div>
              </div>

              {subjectMode === 'existing' && availableSubjects.length > 0 ? (
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium outline-none focus:border-sky-500 transition cursor-pointer"
                >
                  {availableSubjects.map(sub => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Physics, Quantitative Aptitude, Modern History..."
                  value={customSubjectName}
                  onChange={e => setCustomSubjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium outline-none focus:border-sky-500 placeholder-slate-500 transition"
                  required
                />
              )}
            </div>

            {/* Chapter / Topic Title */}
            <div>
              <label className="font-bold text-slate-300 block mb-1.5">
                Chapter / Topic Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Thermodynamics, Trigonometry Practice, Indian Polity Fundamental Rights..."
                value={chapterTitle}
                onChange={e => setChapterTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium outline-none focus:border-sky-500 placeholder-slate-500 transition"
                required
              />
            </div>

            {/* Estimated Hours & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Est. Study Hours:</span>
                  </span>
                  <span className="text-amber-400 font-black">{estimatedHours} hrs</span>
                </label>
                <div className="flex items-center gap-1.5 mb-1.5">
                  {[2, 5, 8, 12, 18].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setEstimatedHours(h)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        estimatedHours === h
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="1"
                  value={estimatedHours}
                  onChange={e => setEstimatedHours(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Easy', 'Medium', 'Hard', 'Very Hard'] as const).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2 px-2.5 rounded-xl font-bold text-[11px] border transition cursor-pointer ${
                        difficulty === d
                          ? d === 'Easy'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : d === 'Medium'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                            : d === 'Hard'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stage & Weightage */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">
                  Exam Stage
                </label>
                <select
                  value={stage}
                  onChange={e => setStage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium outline-none focus:border-sky-500 transition cursor-pointer"
                >
                  <option value="Prelims">Prelims / Tier-1</option>
                  <option value="Mains">Mains / Tier-2</option>
                  <option value="Interview">Interview / Viva</option>
                  <option value="Paper 1">Paper 1</option>
                  <option value="Paper 2">Paper 2</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1.5">
                  Weightage
                </label>
                <div className="flex items-center gap-1.5">
                  {(['Low', 'Medium', 'High'] as const).map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeightage(w)}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                        weightage === w
                          ? w === 'High'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                            : w === 'Medium'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-slate-800 text-slate-200 border-slate-600'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Subtopics list */}
            <div>
              <label className="font-bold text-slate-300 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Subtopics (Optional, 1 per line)</span>
                </span>
                <span className="text-[10px] text-slate-500">Breakdown for micro-checklists</span>
              </label>
              <textarea
                rows={3}
                placeholder="Subtopic 1: Basic concepts&#10;Subtopic 2: Formula & derivations&#10;Subtopic 3: PYQ exercise"
                value={subtopicsText}
                onChange={e => setSubtopicsText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px] outline-none focus:border-sky-500 placeholder-slate-600 resize-none transition"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Add to Syllabus & Recalculate'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
