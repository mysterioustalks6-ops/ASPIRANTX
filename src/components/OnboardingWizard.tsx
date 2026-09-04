import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { saveUserProfile } from '../lib/gamification';
import { EXAM_LIST } from '../lib/examList';
import { getCombinedExamList } from '../lib/customExamStore';
import { CustomExamModal } from './CustomExamModal';
import { 
  EXAM_CATEGORIES, 
  INDIAN_STATES_AND_UTS, 
  EDUCATIONAL_BOARDS, 
  SYLLABUS_PRESETS 
} from '../data/syllabusTemplates';
import { 
  User, 
  Target, 
  GraduationCap, 
  MapPin, 
  Building2, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  BookOpen, 
  HelpCircle,
  Award
} from 'lucide-react';

const EXAM_PREP_TIPS: Record<string, string> = {
  SCHOOL_PRIMARY: "💡 Tip: Focus on reading speed, basic EVS concepts, and quick mental arithmetic calculations.",
  SCHOOL_MIDDLE: "💡 Tip: Focus on school textbook questions, basic geography/polity, and science definitions.",
  SCHOOL_HIGH: "💡 Tip: Practice board-format answers, draw neat science diagrams, and solve mock sets.",
  SCHOOL_SENIOR_PCM: "💡 Tip: Solve Physics numericals daily, learn chemistry equations, and practice JEE math questions.",
  SCHOOL_SENIOR_PCB: "💡 Tip: Highlight NCERT Biology keywords, practice botany diagrams, and learn key formulas for NEET.",
  UPSC_CIVILS: "💡 Tip: General Studies (GS 1-4) analysis, answer formatting structure, and daily current affairs tracking.",
  SSC_EXAMS: "💡 Tip: Improve math shortcut speed, memorize English vocabulary, and practice Tier-1 mock sets.",
  BANKING_INSURANCE: "💡 Tip: Speed-solve coding puzzles, study financial current events, and practice high-speed test series.",
  RAILWAYS_DEFENCE: "💡 Tip: Review NDA physics principles, Indian/World history summaries, and basic logical reasoning tasks.",
  STATE_PSC_CIVIL: "💡 Tip: Master state-specific history, regional schemes, local geographical assets, and civil services answers.",
};

interface OnboardingWizardProps {
  user: UserProfile;
  onComplete: (updated: UserProfile) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>(user.name || '');
  const [category, setCategory] = useState<string>('UPSC_CIVILS');
  const [selectedExamId, setSelectedExamId] = useState<string>('UPSC_CSE');
  const [customExamName, setCustomExamName] = useState<string>('');
  const [useCustomExam, setUseCustomExam] = useState<boolean>(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [stateName, setStateName] = useState<string>('All India (Central)');
  const [boardOrUniversity, setBoardOrUniversity] = useState<string>('Central / State Public Service Commission (UPSC / State PSC)');
  const [streamOrSubject, setStreamOrSubject] = useState<string>('General Studies');
  const [targetYear, setTargetYear] = useState<number>(2026);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get active exam label
  const getExamLabel = () => {
    if (useCustomExam && customExamName.trim()) {
      return customExamName.trim();
    }
    const standard = EXAM_LIST.find(e => e.id === selectedExamId);
    return standard ? standard.label : 'UPSC CSE';
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError('Please enter your full name to proceed.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Auto assign defaults based on category for better user UX
      if (category === 'SCHOOL_PRIMARY') {
        setBoardOrUniversity('CBSE (Central Board of Secondary Education)');
        setStreamOrSubject('All Subjects');
      } else if (category === 'SCHOOL_SENIOR_PCB') {
        setSelectedExamId('ENGINEERING_MEDICAL_ENTRANCE');
        setStreamOrSubject('Biology / Medical Prep');
      } else if (category === 'UPSC_CIVILS') {
        setSelectedExamId('UPSC_CSE');
        setBoardOrUniversity('Central / State Public Service Commission (UPSC / State PSC)');
        setStreamOrSubject('General Studies');
      } else if (category === 'SSC_EXAMS') {
        setSelectedExamId('SSC_CGL');
        setBoardOrUniversity('Central / State Public Service Commission (UPSC / State PSC)');
        setStreamOrSubject('General Awareness & Aptitude');
      }
      setStep(3);
    }
  };

  const handleSaveProfile = async () => {
    setError(null);
    if (useCustomExam && !customExamName.trim()) {
      setError('Please write your custom exam name.');
      return;
    }

    setSaving(true);
    try {
      const chosenExam = useCustomExam && customExamName.trim() ? customExamName.trim() : selectedExamId;
      try {
        localStorage.setItem('aspirantx_global_selected_exam', chosenExam);
      } catch (e) {}

      const updatedProfile: UserProfile = {
        ...user,
        name: name.trim(),
        exam: chosenExam,
        educationCategory: category,
        stateName,
        boardOrUniversity,
        streamOrSubject,
        targetYear,
        isProfileComplete: true
      };

      // 1. Save locally and trigger backend sync via saveUserProfile (which we modified earlier)
      await saveUserProfile(updatedProfile);

      // 2. Pre-configure custom syllabus presets based on chosen category to populate Study tracker
      if (SYLLABUS_PRESETS[category]) {
        localStorage.setItem(`aspirantx_custom_syllabus_${user.id}`, JSON.stringify(SYLLABUS_PRESETS[category]));
      } else {
        // Fallback to standard UPSC preset
        localStorage.setItem(`aspirantx_custom_syllabus_${user.id}`, JSON.stringify(SYLLABUS_PRESETS['UPSC_CIVILS']));
      }

      // 3. Complete onboarding
      onComplete(updatedProfile);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-xl bg-slate-900 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col justify-between space-y-6 relative"
        >
          {/* Header Progress Indicators */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-sky-500 rounded-full shadow-sm" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                {user.isGuest ? 'Demo Profile Setup' : 'Candidate Onboarding'}
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step >= s ? 'w-7 bg-sky-500' : 'w-2 bg-slate-800'
                  }`} 
                />
              ))}
            </div>
          </div>

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                  <User className="w-6 h-6 text-sky-400" /> Welcome to AspirantX
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Let's personalize your prep engine. Please enter your name to unlock your personalized curriculum tracker.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Your Full Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ambuj Yadav"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-sky-500 transition-all font-semibold"
                />
              </div>

              {error && (
                <p className="text-xs font-semibold text-rose-400 mt-2 flex items-center gap-1.5">
                  ⚠️ {error}
                </p>
              )}

              <button
                onClick={handleNextStep}
                className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 active:scale-[0.98] cursor-pointer"
              >
                <span>Continue Setup</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* STEP 2: Exam Field Category Selection */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                  <GraduationCap className="w-6 h-6 text-sky-400" /> Choose Your Field
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Select your primary study path. Your exam tracker, AI models, and community will center around this field.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[290px] overflow-y-auto pr-1.5 custom-scrollbar">
                {EXAM_CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                      category === cat.id
                        ? 'bg-sky-500/10 border-sky-500/50 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">{cat.name}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{cat.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Dynamic Exam Prep Tip */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-sky-300 font-medium flex items-center gap-2 transition-all duration-300">
                <span>{EXAM_PREP_TIPS[category] || "💡 Tip: Track topics daily, review mock analytics, and practice past year questions."}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-900 transition-all active:scale-[0.98]"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="flex-2 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 active:scale-[0.98] w-2/3 cursor-pointer"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Specific Exam Title & Location */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                  <Target className="w-6 h-6 text-sky-400" /> Specific Goal Settings
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Refine the specific exam title, target year, and location to activate the curriculum simulator.
                </p>
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1.5 custom-scrollbar">
                {/* Specific Exam Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Examination</label>
                    <button
                      type="button"
                      onClick={() => setUseCustomExam(!useCustomExam)}
                      className="text-[10px] font-bold text-sky-400 hover:underline"
                    >
                      {useCustomExam ? 'Select Standard Exam' : 'Enter Custom Exam'}
                    </button>
                  </div>

                  {useCustomExam ? (
                    <input
                      type="text"
                      required
                      value={customExamName}
                      onChange={(e) => setCustomExamName(e.target.value)}
                      placeholder="e.g. UPSC CSE 2026, State Board Matriculation"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500 transition-all font-semibold"
                    />
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500 transition-all font-semibold"
                      >
                        {getCombinedExamList().map((ex) => (
                          <option key={ex.id} value={ex.id} className="bg-slate-900 text-white font-semibold">{ex.label}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setIsCustomModalOpen(true)}
                        className="w-full py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-bold hover:bg-sky-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Exam not listed? Create Custom Exam & Syllabus
                      </button>
                    </div>
                  )}
                </div>

                {/* State / UT */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" /> State / Region
                  </label>
                  <select
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500 transition-all font-semibold"
                  >
                    {INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st} className="bg-slate-900 text-white font-semibold">{st}</option>
                    ))}
                  </select>
                </div>

                {/* Target Year */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Preparation Year</label>
                  <div className="flex gap-2">
                    {[2025, 2026, 2027, 2028, 2029].map((year) => (
                      <button
                        type="button"
                        key={year}
                        onClick={() => setTargetYear(year)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          targetYear === year
                            ? 'bg-sky-600 text-white border-sky-500 shadow-sm shadow-sky-600/20'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-xs font-semibold text-rose-400 mt-2 flex items-center gap-1.5">
                  ⚠️ {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setStep(2)}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-900 transition-all active:scale-[0.98]"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveProfile}
                  className="flex-2 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 active:scale-[0.98] w-2/3 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Configuring Prep...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Save & Launch App</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <CustomExamModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        userProfile={user}
        onExamCreated={(newExamId, updatedProfile) => {
          setSelectedExamId(newExamId);
          if (updatedProfile) {
            onComplete(updatedProfile);
          }
        }}
      />
    </div>
  );
};
