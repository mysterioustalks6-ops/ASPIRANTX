import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { saveUserProfile } from '../lib/gamification';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  BookOpen, 
  Calendar, 
  Sparkles, 
  Check, 
  X, 
  ShieldCheck, 
  Flame, 
  Award, 
  Coins, 
  Crown,
  Loader2,
  RefreshCw,
  Building2,
  Layers,
  Gift,
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
  onOpenReferralModal?: () => void;
  onNavigateToRewards?: () => void;
  onOpenCustomizerModal?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onProfileUpdated,
  onOpenReferralModal,
  onNavigateToRewards,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'rewards'>('profile');
  const [name, setName] = useState<string>(user.name || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatar_url || AVATAR_PRESETS[0]);
  const [bio, setBio] = useState<string>(user.bio || '');
  const [studyGoal, setStudyGoal] = useState<string>(user.studyGoal || '');
  const [category, setCategory] = useState<string>(user.educationCategory || 'UPSC_CIVILS');
  const [examName, setExamName] = useState<string>(user.exam || 'UPSC CSE (IAS/IPS)');
  const [stateName, setStateName] = useState<string>(user.stateName || 'Uttar Pradesh');
  const [boardOrUniversity, setBoardOrUniversity] = useState<string>(
    user.boardOrUniversity || 'CBSE (Central Board of Secondary Education)'
  );
  const [streamOrSubject, setStreamOrSubject] = useState<string>(user.streamOrSubject || 'General Studies');
  const [targetYear, setTargetYear] = useState<number>(user.targetYear || 2026);

  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [myClaims, setMyClaims] = useState<any[]>([]);
  const [loadingClaims, setLoadingClaims] = useState<boolean>(false);

  const [isGeneratingAiSyllabus, setIsGeneratingAiSyllabus] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'rewards' && user) {
      fetchMyClaims();
    }
  }, [activeTab, user?.id]);

  const fetchMyClaims = async () => {
    setLoadingClaims(true);
    try {
      const res = await fetch(`/api/rewards/my-claims?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success && data.claims) {
        setMyClaims(data.claims);
      }
    } catch (e) {
      console.error('Failed to load my claims', e);
    } finally {
      setLoadingClaims(false);
    }
  };

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File size exceeds 8MB limit. Please choose a smaller image.');
      return;
    }

    if (!isSupabaseConfigured) {
      setUploadError('Supabase is not configured. Real photo upload requires Supabase credentials.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 512;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
          }
          canvas.toBlob(async (blob) => {
            if (!blob) {
              setUploadingPhoto(false);
              setUploadError('Failed to compress image.');
              return;
            }
            const fileName = `${user.id}/${Date.now()}.jpg`;
            const { data, error } = await supabase.storage.from('avatars').upload(fileName, blob, {
              contentType: 'image/jpeg',
              upsert: true
            });
            if (error) {
              setUploadError(`Upload failed: ${error.message}. Please ensure storage bucket 'avatars' (public read) is created in Supabase Dashboard.`);
              setUploadingPhoto(false);
              return;
            }
            const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            if (pubData?.publicUrl) {
              setAvatarUrl(pubData.publicUrl);
            }
            setUploadingPhoto(false);
          }, 'image/jpeg', 0.8);
        };
      };
    } catch (err: any) {
      setUploadError(err.message || 'Error processing photo.');
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedProfile: UserProfile = {
      ...user,
      name,
      avatar_url: avatarUrl,
      bio,
      studyGoal,
      educationCategory: category,
      exam: examName,
      stateName,
      boardOrUniversity,
      streamOrSubject,
      targetYear,
    };

    await saveUserProfile(updatedProfile);

    if (SYLLABUS_PRESETS[category]) {
      localStorage.setItem(`aspirantx_custom_syllabus_${user.id}`, JSON.stringify(SYLLABUS_PRESETS[category]));
    }

    setSaveSuccessMessage('Profile & Syllabus settings updated successfully!');
    if (onProfileUpdated) onProfileUpdated(updatedProfile);

    setTimeout(() => {
      setSaveSuccessMessage(null);
      onClose();
    }, 1200);
  };

  const handleGenerateAiSyllabus = async () => {
    setIsGeneratingAiSyllabus(true);
    setSaveSuccessMessage(null);

    const promptMessage = `Generate a structured syllabus breakdown for a student studying "${examName}" under Education Level "${category}", Board/Commission "${boardOrUniversity}", State "${stateName}", Stream/Subject "${streamOrSubject}". 
Output MUST be a JSON array of 4 SyllabusTopic objects, each with title, category, stage ("Prelims" or "Mains" or "Exam"), weightage ("High" or "Medium"), notes, and 4 subtopics.
Return ONLY valid JSON format like:
[
  {
    "id": "c1",
    "title": "Topic Title",
    "category": "Subject",
    "stage": "Prelims",
    "completed": false,
    "subtopicsCount": 4,
    "completedSubtopics": 0,
    "weightage": "High",
    "notes": "Key study instructions",
    "subtopics": [
      { "id": "c1-1", "topicId": "c1", "title": "Subtopic 1", "completed": false, "estimatedHours": 2.5, "weightage": "High" }
    ]
  }
]`;

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptMessage,
          exam: examName || 'UPSC_CSE',
          userEmail: user?.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to generate AI syllabus');
      }

      if (data.reply) {
        const jsonMatch = data.reply.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedSyllabus = JSON.parse(jsonMatch[0]);
          localStorage.setItem(`aspirantx_custom_syllabus_${user.id}`, JSON.stringify(parsedSyllabus));
          setSaveSuccessMessage(`Custom AI Syllabus generated for "${examName}"!`);
        } else if (data.reply.includes('[AspirantX AI Mentor') || data.reply.includes('GEMINI_API_KEY')) {
          if (SYLLABUS_PRESETS[category]) {
            localStorage.setItem(`aspirantx_custom_syllabus_${user.id}`, JSON.stringify(SYLLABUS_PRESETS[category]));
          }
          setSaveSuccessMessage(`⚠️ GEMINI_API_KEY is missing in server environment (.env). Preset syllabus loaded for "${examName}".`);
        } else {
          if (SYLLABUS_PRESETS[category]) {
            localStorage.setItem(`aspirantx_custom_syllabus_${user.id}`, JSON.stringify(SYLLABUS_PRESETS[category]));
          }
          setSaveSuccessMessage(`Syllabus template configured for "${examName}"!`);
        }
      } else {
        throw new Error('No response generated by AI mentor.');
      }
    } catch (e: any) {
      if (SYLLABUS_PRESETS[category]) {
        localStorage.setItem(`aspirantx_custom_syllabus_${user.id}`, JSON.stringify(SYLLABUS_PRESETS[category]));
      }
      setSaveSuccessMessage(`Syllabus template configured for "${examName}"! (${e.message || 'Error occurred'})`);
    } finally {
      setIsGeneratingAiSyllabus(false);
    }
  };

  const fulfilledCount = myClaims.filter(c => c.status === 'fulfilled').length;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative my-auto my-6"
      >
        {/* Glow Header */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between relative z-10 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Student Profile & Rewards Hub
              </h2>
              <p className="text-xs text-slate-400">
                Manage your profile, academic exam preferences, and reward prize claims.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Tab Navigation Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-3 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> Profile Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'rewards'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gift className="w-4 h-4" /> My Rewards ({myClaims.length})
          </button>
        </div>

        {/* Tab 1: Profile Details */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Section 1: Personal Details & Avatar */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> Student Profile Info & Stats
              </h3>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-[10px] text-slate-400">Level</p>
                    <p className="font-extrabold text-white">LVL {user.level || 1}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <div>
                    <p className="text-[10px] text-slate-400">Coins</p>
                    <p className="font-extrabold text-amber-400">{user.coins || 0} Coins</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                  <div>
                    <p className="text-[10px] text-slate-400">Streak</p>
                    <p className="font-extrabold text-orange-400">{user.streakDays ?? 1} Days</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-slate-400">Status</p>
                    <p className="font-extrabold text-emerald-400">
                      {user.isPremium ? 'PRO Pass' : 'Freemium'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Referral Code Quick Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-purple-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Referral Code: <span className="font-mono text-amber-400 tracking-wider font-extrabold">{user.referralCode || 'ASPIRANT-101'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Share code with friends to earn +150 Coins & unlock 1-Day PRO Pass!
                  </p>
                </div>

                {onOpenReferralModal && (
                  <button
                    type="button"
                    onClick={onOpenReferralModal}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 shrink-0"
                  >
                    Referral Dashboard →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Student Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Avatar (Presets or Upload)</span>
                    {uploadingPhoto && <span className="text-[10px] text-cyan-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</span>}
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt="Current Avatar"
                      className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400 shadow-md shrink-0"
                    />

                    {/* Preset Gallery */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {AVATAR_PRESETS.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt="Avatar Preset"
                          onClick={() => setAvatarUrl(url)}
                          className={`w-8 h-8 rounded-full object-cover cursor-pointer border-2 transition-all ${
                            avatarUrl === url ? 'border-cyan-400 scale-110 shadow-lg' : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Real Photo Upload File Input */}
                  <div className="pt-1">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-cyan-300 cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5" /> Upload Your Photo (Max 8MB)
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Note: Requires Supabase Storage bucket named <code className="text-cyan-400">avatars</code> (public read) in your Supabase dashboard.
                    </p>
                    {uploadError && (
                      <p className="text-[11px] text-rose-400 mt-1 font-semibold">{uploadError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Profile Fields: Bio & Study Goal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Bio / About Me</span>
                    <span className="text-[10px] text-slate-500">{(bio || '').length}/150 chars</span>
                  </label>
                  <input
                    type="text"
                    maxLength={150}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Dedicated aspirant, coffee lover & focused learner."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Study Goal / Target</label>
                  <input
                    type="text"
                    value={studyGoal}
                    onChange={(e) => setStudyGoal(e.target.value)}
                    placeholder="e.g. Crack UPSC CSE 2027 with AIR under 100"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Education Level & Target Exam Category */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> 1. Select Education Level / Exam Field
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                {EXAM_CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id);
                      if (cat.id === 'SCHOOL_PRIMARY') setExamName('Class 5 Foundation (EVS, Math, English)');
                      else if (cat.id === 'SCHOOL_MIDDLE') setExamName('Class 8 Board / School Exam');
                      else if (cat.id === 'SCHOOL_HIGH') setExamName('Class 10 Board Exam (CBSE/State)');
                      else if (cat.id === 'SCHOOL_SENIOR_PCM') setExamName('Class 12 Physics, Chemistry, Math & JEE');
                      else if (cat.id === 'SCHOOL_SENIOR_PCB') setExamName('Class 12 Biology & NEET UG');
                      else if (cat.id === 'SCHOOL_SENIOR_COMMERCE') setExamName('Class 12 Commerce & Accounts');
                      else if (cat.id === 'SCHOOL_SENIOR_ARTS') setExamName('Class 12 Humanities & Arts');
                      else if (cat.id === 'PHD_RESEARCH') setExamName('Ph.D. Entrance & Research Methodology');
                      else if (cat.id === 'STATE_PSC_CIVIL') setExamName('State PSC Civil Services Exam');
                      else if (cat.id === 'STATE_POLICE_TEACHER') setExamName('State Sub-Inspector / SI & Police Exam');
                      else if (cat.id === 'UPSC_CIVILS') setExamName('UPSC Civil Services (IAS/IPS)');
                      else if (cat.id === 'SSC_EXAMS') setExamName('SSC CGL / CHSL / MTS');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      category === cat.id
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-xl shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{cat.name}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{cat.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Exam Name, State & Board Customizer */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4" /> 2. Specific Exam, State & Board Details
              </h3>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Exam / Degree Title</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomModalOpen(true)}
                      className="text-[11px] font-extrabold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition-all"
                    >
                      <Sparkles className="w-3 h-3" /> + Create Custom Exam & Syllabus
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                    placeholder="e.g. UPSC CSE, JEE Advanced, Class 10 CBSE"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" /> State / UT
                    </label>
                    <select
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                    >
                      {INDIAN_STATES_AND_UTS.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Board / Commission
                    </label>
                    <select
                      value={boardOrUniversity}
                      onChange={(e) => setBoardOrUniversity(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                    >
                      {EDUCATIONAL_BOARDS.map((bo) => (
                        <option key={bo} value={bo}>{bo}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Target Year</label>
                  <div className="flex items-center gap-2">
                    {[2025, 2026, 2027, 2028, 2029].map((year) => (
                      <button
                        type="button"
                        key={year}
                        onClick={() => setTargetYear(year)}
                        className={`flex-1 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                          targetYear === year
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: AI Syllabus Generator Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-amber-500/10 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> Generate Tailored AI Syllabus
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Automatically builds a custom syllabus with chapters & subtopics for "{examName}" ({stateName}).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiSyllabus}
                  disabled={isGeneratingAiSyllabus}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 shrink-0"
                >
                  {isGeneratingAiSyllabus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" /> AI Auto-Syllabus
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Save Status Banner */}
            {saveSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> {saveSuccessMessage}
              </div>
            )}

            {/* Action Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Check className="w-4 h-4" /> Save Profile & Update Dashboard
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: My Rewards */}
        {activeTab === 'rewards' && (
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-400">Total Claims</div>
                  <div className="text-lg font-black text-white">{myClaims.length}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-400">Fulfilled Prizes</div>
                  <div className="text-lg font-black text-emerald-400">{fulfilledCount}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-400">Reward Milestones</div>
                  <div className="text-xs font-bold text-slate-300 mt-0.5">Unlock more tiers</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToRewards) onNavigateToRewards();
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
                >
                  Browse →
                </button>
              </div>
            </div>

            {/* Claims List */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Your Reward Claims History
              </h3>

              {loadingClaims ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
                  <p className="text-xs font-bold">Loading your reward claims...</p>
                </div>
              ) : myClaims.length === 0 ? (
                <div className="p-10 rounded-3xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
                  <Gift className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-300">You have not claimed any reward milestones yet.</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Complete progressive study hours in the Reward Milestones section to unlock real-world prize kits and printed study merch!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onNavigateToRewards) onNavigateToRewards();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
                  >
                    <Trophy className="w-4 h-4 fill-current" /> Explore Reward Milestones
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myClaims.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-extrabold text-white">{c.milestoneTitle || 'Study Prize Milestone'}</div>
                        <div className="text-xs text-slate-400">
                          Claimed: {new Date(c.claimedAt || Date.now()).toLocaleDateString()} • Verified Time: {c.verifiedMinutesAtClaim || 0} mins
                        </div>
                        {c.adminNote && (
                          <div className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 mt-1">
                            Admin Note: {c.adminNote}
                          </div>
                        )}
                      </div>

                      <div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border ${
                          c.status === 'fulfilled'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : c.status === 'approved'
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                            : c.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <CustomExamModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        userProfile={user}
        onExamCreated={(newExamId, updatedProfile) => {
          setExamName(newExamId);
          if (updatedProfile && onProfileUpdated) {
            onProfileUpdated(updatedProfile);
          }
        }}
      />
    </div>
  );
};
