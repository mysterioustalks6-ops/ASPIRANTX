import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { saveUserProfile } from '../lib/gamification';
import { EXAM_LIST } from '../lib/examList';
import { 
  Target, 
  Clock, 
  BookOpen, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  FileText,
  Award
} from 'lucide-react';
import { applyWorkspacePreset } from '../lib/workspacePreferences';

interface OnboardingWizardProps {
  user: UserProfile;
  onComplete: (updated: UserProfile) => void;
}

const POPULAR_EXAMS = [
  { id: 'NEET_UG', label: 'NEET UG', sub: 'National Eligibility cum Entrance Test' },
  { id: 'JEE_MAIN', label: 'JEE Main & Advanced', sub: 'Joint Entrance Examination' },
  { id: 'UPSC_CSE', label: 'UPSC CSE', sub: 'Civil Services Examination' },
  { id: 'SSC_CGL', label: 'SSC CGL', sub: 'Staff Selection Commission' },
  { id: 'GATE', label: 'GATE', sub: 'Graduate Aptitude Test in Engineering' },
  { id: 'CAT', label: 'CAT', sub: 'Common Admission Test' },
  { id: 'NDA_CDS', label: 'NDA / CDS', sub: 'National Defence Academy' },
  { id: 'CUSTOM', label: 'Other / Custom Exam', sub: 'Define your custom syllabus' },
];

const STUDY_COMMITMENTS = [
  { hours: 3, label: '2–3 Hours / Day', sub: 'Foundation & consistent daily review' },
  { hours: 5, label: '4–5 Hours / Day', sub: 'Balanced study & question practice' },
  { hours: 7, label: '6–8 Hours / Day', sub: 'Intensive competitive preparation' },
  { hours: 10, label: '8+ Hours / Day', sub: 'Full-time dedicated sprint' },
];

const FOCUS_AREAS = [
  { 
    id: 'syllabus', 
    label: 'Syllabus Mastery', 
    sub: 'Chapter-by-chapter curriculum tracking & checklist',
    icon: BookOpen,
    preset: 'balanced'
  },
  { 
    id: 'pyq', 
    label: 'Past Year Questions (PYQs)', 
    sub: 'Practice 35+ years of real exam questions with solutions',
    icon: FileText,
    preset: 'revision'
  },
  { 
    id: 'cbt', 
    label: 'Full CBT Mock Tests', 
    sub: 'Simulated computer-based tests with instant percentile scoring',
    icon: Award,
    preset: 'test_series'
  },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [selectedExamId, setSelectedExamId] = useState<string>('NEET_UG');
  const [customExamName, setCustomExamName] = useState<string>('');
  const [dailyHours, setDailyHours] = useState<number>(5);
  const [focusArea, setFocusArea] = useState<string>('syllabus');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (selectedExamId === 'CUSTOM' && !customExamName.trim()) {
        setError('Please enter your custom exam name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    setError(null);

    try {
      const finalExam = selectedExamId === 'CUSTOM' && customExamName.trim()
        ? customExamName.trim()
        : selectedExamId;

      const chosenFocus = FOCUS_AREAS.find((f) => f.id === focusArea);
      const presetId = chosenFocus?.preset || 'balanced';

      // 1. Configure workspace preferences
      try {
        applyWorkspacePreset(presetId, user.id);
      } catch {}

      // 2. Build real initial profile
      const updatedProfile: UserProfile = {
        ...user,
        exam: finalExam,
        targetYear: 2026,
        isProfileComplete: true,
        streakDays: Math.max(1, user.streakDays || 1),
        studyHoursToday: 0,
        xp: user.xp || 0,
        coins: user.coins || 0,
        level: user.level || 1,
      };

      try {
        localStorage.setItem('aspirantx_global_selected_exam', finalExam);
        localStorage.setItem(`aspirantx_daily_target_hours_${user.id}`, String(dailyHours));
        localStorage.setItem(`aspirantx_primary_focus_${user.id}`, focusArea);
      } catch {}

      // 3. Save profile to storage and backend
      await saveUserProfile(updatedProfile);

      // 4. Complete onboarding
      onComplete(updatedProfile);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#06080d] text-slate-100 flex items-center justify-center p-4 md:p-6 relative overflow-hidden font-sans">
      <div className="w-full max-w-lg bg-[#0c1017] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Progress Bar & Step Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
              Setup Step {step} of 3
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  step >= s ? 'w-6 bg-sky-500' : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: TARGET EXAM */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Target className="w-5 h-5 text-sky-400" /> What are you preparing for?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  We'll configure your curriculum, question bank, and test series accordingly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {POPULAR_EXAMS.map((exam) => (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => setSelectedExamId(exam.id)}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      selectedExamId === exam.id
                        ? 'bg-sky-500/10 border-sky-500/50 text-white'
                        : 'bg-[#06080d] border-white/[0.06] text-slate-300 hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{exam.label}</span>
                      {selectedExamId === exam.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{exam.sub}</p>
                  </button>
                ))}
              </div>

              {selectedExamId === 'CUSTOM' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Custom Exam Title</label>
                  <input
                    type="text"
                    value={customExamName}
                    onChange={(e) => setCustomExamName(e.target.value)}
                    placeholder="e.g. State Judiciary / RBI Grade B"
                    className="w-full px-3 py-2 rounded-lg bg-[#06080d] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-sky-500"
                    autoFocus
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: DAILY STUDY TIME */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-400" /> Daily Study Commitment
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  How many hours can you realistically commit to study each day?
                </p>
              </div>

              <div className="space-y-2">
                {STUDY_COMMITMENTS.map((item) => (
                  <button
                    key={item.hours}
                    type="button"
                    onClick={() => setDailyHours(item.hours)}
                    className={`w-full p-3 rounded-xl border text-left transition-colors flex items-center justify-between cursor-pointer ${
                      dailyHours === item.hours
                        ? 'bg-sky-500/10 border-sky-500/50 text-white'
                        : 'bg-[#06080d] border-white/[0.06] text-slate-300 hover:border-white/[0.15]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-white">{item.label}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                    </div>
                    {dailyHours === item.hours && (
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-semibold text-xs transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: FOCUS AREA */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-400" /> Primary Focus Area
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Choose your starting focal point. You can change this anytime from your dashboard.
                </p>
              </div>

              <div className="space-y-2">
                {FOCUS_AREAS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFocusArea(item.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-colors flex items-center gap-3 cursor-pointer ${
                        focusArea === item.id
                          ? 'bg-sky-500/10 border-sky-500/50 text-white'
                          : 'bg-[#06080d] border-white/[0.06] text-slate-300 hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white block">{item.label}</span>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.sub}</p>
                      </div>
                      {focusArea === item.id && (
                        <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-semibold text-xs transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleFinish}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Enter Study Workspace</span>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
