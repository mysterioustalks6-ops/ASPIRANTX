import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab, UserProfile } from '../types';
import { EXAM_LIST } from '../lib/examList';
import { 
  X,
  BookOpen, 
  Timer, 
  CheckSquare, 
  MessageSquare, 
  Crown, 
  Flame, 
  Target,
  LogOut,
  ShieldCheck,
  Users,
  Gift,
  Wrench,
  BookMarked,
  HelpCircle,
  Award,
  Handshake,
  Mic,
  BarChart3,
  Sparkles,
  Sliders,
  ChevronRight,
  User,
  GraduationCap,
  Download
} from 'lucide-react';
import { AppCustomizerSettings } from '../lib/customizer';
import { getCustomExamsFromStorage } from '../lib/customExamStore';
import { loadWorkspaceConfig, ALL_WORKSPACE_FEATURES } from '../lib/workspacePreferences';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: UserProfile | null;
  onLogout: () => void;
  isAdminUnlocked?: boolean;
  onOpenProfileModal?: () => void;
  onOpenReferralModal?: () => void;
  onOpenWorkspaceCustomizer?: () => void;
  customizer?: AppCustomizerSettings;
  selectedExam?: string;
  onExamChange?: (examId: string) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  user,
  onLogout,
  isAdminUnlocked = false,
  onOpenProfileModal,
  onOpenReferralModal,
  onOpenWorkspaceCustomizer,
  customizer,
  selectedExam,
  onExamChange,
}) => {
  const customExams = getCustomExamsFromStorage();
  const workspaceConfig = loadWorkspaceConfig(user?.id);

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  const navCategories = [
    {
      title: 'Study & Practice',
      items: [
        { id: 'dashboard' as ActiveTab, label: 'Candidate Telemetry', icon: Target, badge: 'Live' },
        { id: 'syllabus' as ActiveTab, label: 'Syllabus Tracker', icon: BookOpen, badge: 'AI' },
        { id: 'cbt' as ActiveTab, label: 'CBT Test Series', icon: Award, badge: 'NTA' },
        { id: 'pyq' as ActiveTab, label: 'Previous Year Papers', icon: BookMarked, badge: '35 Yrs' },
        { id: 'question_bank' as ActiveTab, label: 'Question Bank', icon: HelpCircle, badge: '4000+' },
        { id: 'flashcards' as ActiveTab, label: 'Active Recall Decks', icon: Sparkles },
        { id: 'library' as ActiveTab, label: 'Digital Library & Notes', icon: BookOpen },
      ]
    },
    {
      title: 'Productivity & AI Mentor',
      items: [
        { id: 'chat' as ActiveTab, label: 'AI Study Mentor', icon: MessageSquare, badge: 'Gemini' },
        { id: 'timer' as ActiveTab, label: 'Pomodoro Focus Timer', icon: Timer },
        { id: 'tasks' as ActiveTab, label: 'Daily Study Tasks', icon: CheckSquare },
        { id: 'weakness' as ActiveTab, label: 'Weakness Detector', icon: BarChart3, badge: 'AI' },
        { id: 'community' as ActiveTab, label: 'Peer Study Community', icon: Users },
        { id: 'podcasts' as ActiveTab, label: 'Audio Lecture Series', icon: Mic },
        { id: 'eligibility' as ActiveTab, label: 'Exam Eligibility Check', icon: ShieldCheck },
      ]
    },
    {
      title: 'Rewards & Perks',
      items: [
        { id: 'reward_milestones' as ActiveTab, label: 'Study Milestones', icon: Gift },
        { id: 'earn_premium' as ActiveTab, label: 'Refer & Earn Coins', icon: Handshake, badge: '+150' },
        { id: 'premium' as ActiveTab, label: 'AspirantX PRO Access', icon: Crown, badge: 'PRO' },
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
          />

          {/* Drawer Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-h-[88vh] bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-2xl flex flex-col z-10 overflow-hidden pb-safe"
          >
            {/* Header Handle & Close */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                  {customizer?.logoIconText || 'AX'}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100">{customizer?.brandName || 'ASPIRANTX'}</h2>
                  <p className="text-[11px] text-slate-400">Complete Mobile Navigation</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* User Mini Profile Card */}
              {user && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt="Avatar"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{user.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center text-amber-400 font-semibold">
                          <Flame className="w-3 h-3 mr-0.5" /> {user.streakDays || 1}d
                        </span>
                        <span>•</span>
                        <span>{user.coins || 0} Coins</span>
                      </div>
                    </div>
                  </div>

                  {onOpenProfileModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenProfileModal();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-[11px] shrink-0"
                    >
                      Profile
                    </button>
                  )}
                </div>
              )}

              {/* Target Exam Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Target Examination
                </label>
                <select
                  value={selectedExam || user?.exam || 'NEET_UG'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__CREATE_CUSTOM__' && onOpenProfileModal) {
                      onClose();
                      onOpenProfileModal();
                    } else if (onExamChange) {
                      onExamChange(val);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                >
                  <optgroup label="Preset Competitive Exams">
                    {EXAM_LIST.map((ex) => (
                      <option key={ex.id} value={ex.id} className="bg-slate-900 text-slate-200">
                        {ex.label}
                      </option>
                    ))}
                  </optgroup>
                  {customExams.length > 0 && (
                    <optgroup label="My Custom Exam Roadmaps">
                      {customExams.map((ce) => (
                        <option key={ce.id} value={ce.id} className="bg-slate-900 text-purple-300">
                          {ce.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="__CREATE_CUSTOM__" className="bg-slate-900 text-amber-400 font-bold">
                    + Create Custom Exam...
                  </option>
                </select>
              </div>

              {/* Navigation Sections */}
              {navCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-1">
                    {cat.title}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                            isActive
                              ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                              : 'bg-slate-950/40 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <span className="text-xs font-semibold">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-300 border border-slate-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Teacher & Admin Section */}
              {(user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'DEVELOPER' || isAdminUnlocked) && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-1">
                    Management & Portals
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {(user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'DEVELOPER') && (
                      <button
                        onClick={() => handleNavClick('teachers')}
                        className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                          activeTab === 'teachers'
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-950/40 text-slate-300 hover:bg-slate-800 border border-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold">Teacher & Mentor Portal</span>
                        </div>
                      </button>
                    )}

                    {(isAdminUnlocked || user?.role === 'ADMIN' || user?.role === 'DEVELOPER') && (
                      <button
                        onClick={() => handleNavClick('admin')}
                        className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                          activeTab === 'admin'
                            ? 'bg-rose-600 text-white font-bold'
                            : 'bg-rose-950/20 text-rose-300 hover:bg-rose-900/30 border border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-rose-400" />
                          <span className="text-xs font-semibold">Admin Panel</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Download APK & Workspace Personalization & Logout Buttons */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                {/* Download Android APK Button */}
                <a
                  href="/aspirantx.apk"
                  download="AspirantX.apk"
                  onClick={onClose}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 text-center cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Android App (.APK)</span>
                </a>

                {onOpenWorkspaceCustomizer && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenWorkspaceCustomizer();
                    }}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 border border-indigo-500/30 text-indigo-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Personalize Workspace Order</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
