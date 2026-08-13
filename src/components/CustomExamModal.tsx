import React, { useState } from 'react';
import { X, Plus, Trash2, Sparkles, BookOpen, Layers, CheckCircle2, Shield } from 'lucide-react';
import { CustomExamConfig, saveCustomExam } from '../lib/customExamStore';
import { saveUserProfile } from '../lib/gamification';
import { UserProfile } from '../types';

interface CustomExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  onExamCreated?: (examId: string, updatedProfile?: UserProfile) => void;
}

export const CustomExamModal: React.FC<CustomExamModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onExamCreated,
}) => {
  const [examTitle, setExamTitle] = useState('');
  const [targetYear, setTargetYear] = useState(2026);
  const [category, setCategory] = useState('GOVT_JOBS');

  // Subjects & Topics Builder State
  const [subjects, setSubjects] = useState<string[]>(['General Studies', 'Quantitative Aptitude']);
  const [newSubjectInput, setNewSubjectInput] = useState('');

  // Structured Topic Nodes
  const [topicsBySubject, setTopicsBySubject] = useState<
    Record<string, { topicName: string; subtopics: string[]; importance: 'High' | 'Medium' | 'Low' }[]>
  >({
    'General Studies': [
      { topicName: 'Indian Polity & Constitution', subtopics: ['Fundamental Rights', 'Preamble', 'Executive'], importance: 'High' },
      { topicName: 'Indian History & Culture', subtopics: ['Ancient India', 'Modern Freedom Struggle'], importance: 'High' },
    ],
    'Quantitative Aptitude': [
      { topicName: 'Number System & Arithmetic', subtopics: ['Percentages', 'Profit and Loss', 'Ratios'], importance: 'High' },
      { topicName: 'Algebra & Geometry', subtopics: ['Linear Equations', 'Triangles & Circles'], importance: 'Medium' },
    ],
  });

  const [activeSubjectTab, setActiveSubjectTab] = useState('General Studies');
  const [newTopicInput, setNewTopicInput] = useState('');
  const [newSubtopicInput, setNewSubtopicInput] = useState('');
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(0);

  const [rawSyllabusText, setRawSyllabusText] = useState('');
  const [isImportingAi, setIsImportingAi] = useState(false);

  if (!isOpen) return null;

  const handleAddSubject = () => {
    const clean = newSubjectInput.trim();
    if (!clean) return;
    if (subjects.map((s) => s.toLowerCase()).includes(clean.toLowerCase())) {
      alert('This subject is already added!');
      return;
    }
    setSubjects((prev) => [...prev, clean]);
    setTopicsBySubject((prev) => ({
      ...prev,
      [clean]: [
        { topicName: 'Core Principles', subtopics: ['Fundamentals', 'Overview Concepts'], importance: 'High' },
      ],
    }));
    setActiveSubjectTab(clean);
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (subjToRemove: string) => {
    if (subjects.length <= 1) {
      alert('At least one subject is required for your custom exam!');
      return;
    }
    setSubjects((prev) => prev.filter((s) => s !== subjToRemove));
    const copy = { ...topicsBySubject };
    delete copy[subjToRemove];
    setTopicsBySubject(copy);
    if (activeSubjectTab === subjToRemove) {
      setActiveSubjectTab(subjects.find((s) => s !== subjToRemove) || '');
    }
  };

  const handleAddTopic = () => {
    const clean = newTopicInput.trim();
    if (!clean || !activeSubjectTab) return;
    setTopicsBySubject((prev) => ({
      ...prev,
      [activeSubjectTab]: [
        ...(prev[activeSubjectTab] || []),
        { topicName: clean, subtopics: ['Basic Concepts', 'Advanced Applications'], importance: 'High' },
      ],
    }));
    setNewTopicInput('');
  };

  const handleRemoveTopic = (indexToRemove: number) => {
    setTopicsBySubject((prev) => ({
      ...prev,
      [activeSubjectTab]: (prev[activeSubjectTab] || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleAddSubtopic = (topicIndex: number) => {
    const clean = newSubtopicInput.trim();
    if (!clean || !activeSubjectTab) return;

    setTopicsBySubject((prev) => {
      const currentList = [...(prev[activeSubjectTab] || [])];
      if (currentList[topicIndex]) {
        currentList[topicIndex] = {
          ...currentList[topicIndex],
          subtopics: [...currentList[topicIndex].subtopics, clean],
        };
      }
      return { ...prev, [activeSubjectTab]: currentList };
    });

    setNewSubtopicInput('');
  };

  const handleSaveAndApply = async () => {
    const cleanLabel = examTitle.trim();
    if (!cleanLabel) {
      alert('Please enter a name for your custom exam (e.g. "GATE Computer Science 2026")!');
      return;
    }

    setIsImportingAi(true);

    // Generate slug-safe exam ID
    const examId = 'CUSTOM_' + cleanLabel.toUpperCase().replace(/[^A-Z0-9]/g, '_');

    // Build syllabus nodes manually created
    const syllabusNodes: any[] = [];
    subjects.forEach((subj) => {
      const topics = topicsBySubject[subj] || [];
      if (topics.length === 0) {
        syllabusNodes.push({
          id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          exam: examId,
          stage: 'Main Stage',
          paper: 'Paper 1',
          subject: subj,
          chapter: 'General Topics',
          topic: 'Core Concepts',
          subtopic: 'Fundamentals',
          weightage: 10,
          importance: 'High',
          status: 'pending',
        });
      } else {
        topics.forEach((t) => {
          if (t.subtopics.length === 0) {
            syllabusNodes.push({
              id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              exam: examId,
              stage: 'Main Stage',
              paper: 'Paper 1',
              subject: subj,
              chapter: t.topicName,
              topic: t.topicName,
              subtopic: 'General Overview',
              weightage: 10,
              importance: t.importance,
              status: 'pending',
            });
          } else {
            t.subtopics.forEach((sub) => {
              syllabusNodes.push({
                id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                exam: examId,
                stage: 'Main Stage',
                paper: 'Paper 1',
                subject: subj,
                chapter: t.topicName,
                topic: t.topicName,
                subtopic: sub,
                weightage: 10,
                importance: t.importance,
                status: 'pending',
              });
            });
          }
        });
      }
    });

    try {
      // 1. Call POST /api/exams
      await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanLabel,
          description: rawSyllabusText ? rawSyllabusText.substring(0, 200) : 'Custom Exam',
          userEmail: userProfile?.email || ''
        })
      });

      // 2. Call POST /api/exams/:id/import-syllabus
      const importRes = await fetch(`/api/exams/${encodeURIComponent(examId)}/import-syllabus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawSyllabusText || subjects.join(', '),
          name: cleanLabel,
          category,
          userEmail: userProfile?.email || ''
        })
      });

      if (importRes.ok) {
        const importData = await importRes.json();
        if (importData.syllabusNodes && Array.isArray(importData.syllabusNodes) && importData.syllabusNodes.length > 0) {
          syllabusNodes.push(...importData.syllabusNodes);
        }
      }
    } catch (e) {
      console.warn('Server custom exam sync warning:', e);
    } finally {
      setIsImportingAi(false);
    }

    const customExamConfig: CustomExamConfig = {
      id: examId,
      label: cleanLabel,
      category,
      targetYear,
      subjects,
      syllabus: syllabusNodes,
      createdAt: new Date().toISOString(),
      createdByEmail: userProfile?.email,
    };

    // Save custom exam configuration locally and to server
    await saveCustomExam(customExamConfig);

    // Set as user's authoritative target exam in profile if userProfile exists
    let updatedUserProfile: UserProfile | undefined = undefined;
    if (userProfile) {
      updatedUserProfile = {
        ...userProfile,
        exam: examId,
        targetYear,
        isProfileComplete: true,
      };
      await saveUserProfile(updatedUserProfile);
    }
    localStorage.setItem('aspirantx_global_selected_exam', examId);
    window.dispatchEvent(new Event('aspirantx_exam_changed'));

    if (onExamCreated) {
      onExamCreated(examId, updatedUserProfile);
    }

    alert(`🎉 Success! Custom Exam "${cleanLabel}" created and set as your active exam!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0b0f19] border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.2)] text-slate-100 p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white">Create Custom Exam & Syllabus</h2>
              <p className="text-xs text-slate-400">Define your own target exam, custom subjects & custom subtopics</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: EXAM BASIC INFO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Exam Title / Full Name *</label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="e.g. GATE Computer Science 2026, WBCS Mains, REET Level 1..."
              className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Target Year</label>
            <input
              type="number"
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value) || 2026)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-slate-700 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* AI SYLLABUS IMPORT PASTE BOX */}
        <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900/60 p-4 rounded-2xl border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> Paste Syllabus for AI Auto-Structuring (Optional)
            </label>
            <span className="text-[10px] text-purple-300/80">AI will automatically build topics & subtopics!</span>
          </div>
          <textarea
            value={rawSyllabusText}
            onChange={(e) => setRawSyllabusText(e.target.value)}
            rows={3}
            placeholder="Paste raw syllabus text, official PDF contents, or subject list here... (e.g. '1. Data Structures: Arrays, Stacks, Queues. 2. Algorithms: Sorting, Searching, Graphs...')"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/70 border border-purple-500/30 text-xs text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
          />
        </div>

        {/* STEP 2: CUSTOM SUBJECTS BUILDER */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-extrabold text-cyan-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> 1. Define Exam Subjects
            </label>
            <span className="text-xs text-slate-400">{subjects.length} Subjects Defined</span>
          </div>

          {/* Add Subject Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
              placeholder="Add Subject (e.g. Data Structures, General Science, Geography...)"
              className="flex-1 px-4 py-2 rounded-xl bg-black/60 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
            <button
              onClick={handleAddSubject}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>

          {/* Subject Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {subjects.map((subj) => (
              <div
                key={subj}
                onClick={() => setActiveSubjectTab(subj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 border ${
                  activeSubjectTab === subj
                    ? 'bg-cyan-500 text-black border-cyan-400 font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{subj}</span>
                <Trash2
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSubject(subj);
                  }}
                  className="w-3.5 h-3.5 text-red-400 hover:text-red-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* STEP 3: CUSTOM TOPICS & SUBTOPICS SYLLABUS BUILDER */}
        {activeSubjectTab && (
          <div className="space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" /> Syllabus Topics for: <span className="text-cyan-400">{activeSubjectTab}</span>
              </h3>
            </div>

            {/* Add Topic Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                placeholder={`Add Topic under ${activeSubjectTab} (e.g. Fundamental Rights, Percentage, Mechanics...)`}
                className="flex-1 px-4 py-2 rounded-xl bg-black/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <button
                onClick={handleAddTopic}
                className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Topic
              </button>
            </div>

            {/* Topic Cards List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {(topicsBySubject[activeSubjectTab] || []).length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">
                  No topics added yet for {activeSubjectTab}. Add a topic above!
                </p>
              ) : (
                (topicsBySubject[activeSubjectTab] || []).map((topicItem, tIdx) => (
                  <div key={tIdx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-xs font-extrabold text-white">{topicItem.topicName}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveTopic(tIdx)}
                        className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    {/* Subtopics Badges */}
                    <div className="flex flex-wrap gap-1.5 pl-4">
                      {topicItem.subtopics.map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 text-[11px]"
                        >
                          • {sub}
                        </span>
                      ))}
                    </div>

                    {/* Add Subtopic Input */}
                    <div className="flex gap-2 pl-4 pt-1">
                      <input
                        type="text"
                        placeholder="Add subtopic..."
                        value={selectedTopicIndex === tIdx ? newSubtopicInput : ''}
                        onFocus={() => setSelectedTopicIndex(tIdx)}
                        onChange={(e) => {
                          setSelectedTopicIndex(tIdx);
                          setNewSubtopicInput(e.target.value);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtopic(tIdx)}
                        className="flex-1 px-3 py-1 rounded-lg bg-black/60 border border-slate-800 text-[11px] text-white focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddSubtopic(tIdx)}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-bold hover:bg-slate-700"
                      >
                        + Subtopic
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Syllabus Tracker, CBT Mock Engine & AI Chat will adapt to this exam!</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndApply}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-slate-950 font-black text-xs shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:brightness-110 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 fill-slate-950 text-cyan-400" /> Create & Apply Target Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
