import React from 'react';
import { 
  User, 
  Flame, 
  Coins, 
  Clock, 
  Smartphone, 
  Award, 
  Users, 
  MessageSquare, 
  Sparkles, 
  Gift, 
  Share2, 
  Crown, 
  Palette, 
  Bell, 
  HelpCircle, 
  ShieldCheck, 
  FileText, 
  ChevronRight,
  GraduationCap,
  Briefcase,
  Calendar,
  Shield,
  Trophy,
  Download,
  RotateCcw
} from 'lucide-react';
import { UserProfile, ExamType, ActiveTab } from '../types';
import { CANONICAL_APP_RELEASE } from '../config/appRelease';

interface MoreHubProps {
  user: UserProfile;
  selectedExam: ExamType;
  onNavigate: (tab: ActiveTab) => void;
  onOpenProfileModal: () => void;
  onOpenReferralModal: () => void;
  onOpenWorkspaceCustomizer: () => void;
  onOpenReminderSettings: () => void;
  isAdminUnlocked?: boolean;
}

export const MoreHub: React.FC<MoreHubProps> = ({
  user,
  selectedExam,
  onNavigate,
  onOpenProfileModal,
  onOpenReferralModal,
  onOpenWorkspaceCustomizer,
  onOpenReminderSettings,
  isAdminUnlocked = false
}) => {
  const [checkStatus, setCheckStatus] = React.useState<'idle' | 'checking' | 'done'>('idle');

  const handleCheckUpdate = () => {
    setCheckStatus('checking');
    window.dispatchEvent(new CustomEvent('studyride:check-update'));
    setTimeout(() => {
      setCheckStatus('done');
      setTimeout(() => setCheckStatus('idle'), 6000);
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 px-4 font-sans text-slate-100">
      {/* ── TOP PROFILE SUMMARY CARD ── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#1A1D24] border-2 border-slate-800 border-b-4 border-b-slate-900 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-600/20 shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#0F1115] flex items-center justify-center font-black text-white text-xl">
              {user.name ? user.name[0].toUpperCase() : 'A'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">{user.name || 'Aspirant'}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-black border border-sky-500/30">
                LVL {user.level || 1}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            <div className="flex items-center gap-3 mt-2 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#FF9600] font-bold">
                <Flame className="w-4 h-4 fill-current" /> {user.streakDays || 1}d Streak
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
                <Coins className="w-4 h-4" /> {user.coins || 0} Coins
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenProfileModal}
          className="px-4 py-2.5 rounded-xl bg-[#15181F] hover:bg-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-all border border-[#2A2F3A] border-b-2 border-b-slate-950 active:border-b-0 active:translate-y-0.5 self-start sm:self-auto min-h-[44px] cursor-pointer"
        >
          View Full Profile
        </button>
      </div>

      {/* ── SECTION 1: PRODUCTIVITY & FOCUS TOOLS ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Productivity & Focus Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Highlight: Focus Shield Pro */}
          <button
            onClick={() => onNavigate('focus_shield')}
            className="col-span-full p-4 rounded-2xl bg-[#1A1D24] border-2 border-emerald-500/40 border-b-4 border-b-emerald-900/80 hover:border-emerald-400 active:border-b-2 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer shadow-md min-h-[64px]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-white group-hover:text-emerald-300 flex items-center gap-2">
                  <span>Focus Shield Pro</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    APP LOCK & SCREEN TIME
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Block YouTube, Instagram Reels & set daily app limits
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </button>

          {/* Pomodoro Timer */}
          <button
            onClick={() => onNavigate('timer')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-sky-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300">Pomodoro Focus Timer</div>
                <div className="text-[11px] text-slate-400">25/50m focused study intervals</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-all shrink-0 ml-2" />
          </button>

          {/* Kanban / Tasks */}
          <button
            onClick={() => onNavigate('tasks')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-indigo-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300">Daily Study Planner & Kanban</div>
                <div className="text-[11px] text-slate-400">Manage daily micro-goals & routines</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-all shrink-0 ml-2" />
          </button>

          {/* Rewards Hub */}
          <button
            onClick={() => onNavigate('rewards')}
            className="p-4 rounded-2xl bg-[#15181F] border border-amber-500/30 border-b-2 border-b-slate-950 hover:border-amber-400 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#FF9600] flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 flex items-center gap-1.5">
                  <span>Rewards & Trophy Collection</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">NEW</span>
                </div>
                <div className="text-[11px] text-slate-400">Achievements, challenges & XP record</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-all shrink-0 ml-2" />
          </button>

          {/* Download Android APK */}
          <button
            onClick={() => onNavigate('download')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-emerald-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#58CC02] flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300">Download Android App</div>
                <div className="text-[11px] text-slate-400">Official Release APK & QR install</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-all shrink-0 ml-2" />
          </button>

          {/* Lockscreen Wallpaper */}
          <button
            onClick={() => onNavigate('wallpaper')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-purple-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300">Habit Lockscreen Wallpaper</div>
                <div className="text-[11px] text-slate-400">Export dynamic countdown lockscreen</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-all shrink-0 ml-2" />
          </button>

          {/* Eligibility Checker */}
          <button
            onClick={() => onNavigate('eligibility')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-emerald-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300">UPSC / Exam Eligibility Checker</div>
                <div className="text-[11px] text-slate-400">Check age, attempts & category limits</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-all shrink-0 ml-2" />
          </button>
        </div>
      </div>

      {/* ── SECTION 2: PEER COMMUNITY & MENTORSHIP ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Peer Community & Mentorship
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('study_buddy')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-emerald-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300">Study Buddy Matching</div>
                <div className="text-[11px] text-slate-400">Find an accountability partner</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-all shrink-0 ml-2" />
          </button>

          <button
            onClick={() => onNavigate('community')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-sky-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300">Aspirant Discussion Rooms</div>
                <div className="text-[11px] text-slate-400">Subject rooms & answer writing</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-all shrink-0 ml-2" />
          </button>

          <button
            onClick={() => onNavigate('chat')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-indigo-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300">AI Study Mentor (1-on-1)</div>
                <div className="text-[11px] text-slate-400">Conceptual doubts & answer evaluation</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-all shrink-0 ml-2" />
          </button>

          <button
            onClick={() => onNavigate('blog')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-amber-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300">Aspirant Editorial Blog</div>
                <div className="text-[11px] text-slate-400">Toppers' strategies & notes</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-all shrink-0 ml-2" />
          </button>
        </div>
      </div>

      {/* ── SECTION 3: REWARDS, REDEEM & REFERRALS ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Rewards, Coins & Membership
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('reward_milestones')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-yellow-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-yellow-300">XP & Reward Milestones</div>
                <div className="text-[11px] text-slate-400">Earn badges & unlock privileges</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-yellow-400 transition-all shrink-0 ml-2" />
          </button>

          <button
            onClick={() => onNavigate('earn_premium')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-emerald-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#58CC02] flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300">Refer & Earn Free PRO</div>
                <div className="text-[11px] text-slate-400">Invite aspirants and earn free months</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-all shrink-0 ml-2" />
          </button>

          <button
            onClick={() => onNavigate('premium')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-amber-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300">StudyRide Pro Membership</div>
                <div className="text-[11px] text-slate-400">Unlimited mock tests & full archive</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-all shrink-0 ml-2" />
          </button>

          <button
            onClick={() => onNavigate('collaboration')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-sky-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-[#1CB0F6] flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300">Sponsorship & Partnership</div>
                <div className="text-[11px] text-slate-400">Coaching institute collaborations</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-all shrink-0 ml-2" />
          </button>
        </div>
      </div>

      {/* ── SECTION 4: APP SETTINGS & ARCHITECTURE ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Settings & Architecture
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('figma_preview')}
            className="p-4 rounded-2xl bg-[#15181F] border border-sky-500/40 border-b-2 border-b-slate-950 hover:border-sky-400 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-[#1CB0F6] flex items-center justify-center font-black text-xs shrink-0">
                FIG
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 flex items-center gap-1.5">
                  Figma Master Architecture
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">12 Pages</span>
                </div>
                <div className="text-[11px] text-slate-400">Tokens, wireframes, component specs & prototype</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          <button
            onClick={onOpenWorkspaceCustomizer}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-sky-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300">Appearance & Customizer</div>
                <div className="text-[11px] text-slate-400">Dark theme accents & branding</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-all shrink-0 ml-2" />
          </button>

          <button
            onClick={onOpenReminderSettings}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-sky-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300">Study Nudge & Notifications</div>
                <div className="text-[11px] text-slate-400">Daily study alarms & streak protection</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-all shrink-0 ml-2" />
          </button>

          <button
            onClick={() => onNavigate('feedback')}
            className="p-4 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-2 border-b-slate-950 hover:border-sky-500/40 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300">Support & Feedback</div>
                <div className="text-[11px] text-slate-400">Report an issue or request a feature</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-all shrink-0 ml-2" />
          </button>

          {(isAdminUnlocked || user.role === 'ADMIN' || user.role === 'DEVELOPER' || user.email?.trim().toLowerCase() === 'ambujyadav0010@gmail.com') && (
            <button
              onClick={() => onNavigate('admin')}
              className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 border-b-2 border-b-rose-950 hover:border-rose-500/60 active:border-b-0 active:translate-y-0.5 transition-all text-left flex items-center justify-between group cursor-pointer min-h-[56px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-[#FF4B4B] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-rose-300">Admin Control Center</div>
                  <div className="text-[11px] text-slate-400">Role permissions & feature toggles</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          )}
        </div>
      </div>

      {/* ── SECTION 5: APP RELEASE & LIVE UPDATE CHECKER ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#1A1D24] border-2 border-emerald-500/30 border-b-4 border-b-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <img 
            src="/logo.png" 
            alt="StudyRide Logo" 
            className="w-11 h-11 rounded-2xl object-cover border border-emerald-500/40 shadow-sm shrink-0" 
          />
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2 flex-wrap">
              <span>StudyRide v{CANONICAL_APP_RELEASE.version}</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                BUILD {CANONICAL_APP_RELEASE.versionCode}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LATEST
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {checkStatus === 'checking'
                ? 'Checking for latest release updates...'
                : checkStatus === 'done'
                ? '✓ Active build verified! Running official v3.1.0'
                : 'Duolingo Path • Veer Mascot • 33 SSC/State AE/JE Exams'}
            </div>
          </div>
        </div>

        <button
          onClick={handleCheckUpdate}
          disabled={checkStatus === 'checking'}
          className="px-4 py-2.5 rounded-xl bg-[#58CC02] hover:bg-[#46a302] disabled:opacity-75 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-[#58CC02]/20 shrink-0 cursor-pointer border-b-2 border-[#3c8801] active:border-b-0 active:translate-y-0.5 min-h-[44px]"
        >
          <RotateCcw className={`w-3.5 h-3.5 shrink-0 ${checkStatus === 'checking' ? 'animate-spin' : ''}`} />
          <span>
            {checkStatus === 'checking' ? 'Checking...' : checkStatus === 'done' ? '✓ Up to Date' : 'Check Update'}
          </span>
        </button>
      </div>
    </div>
  );
};
