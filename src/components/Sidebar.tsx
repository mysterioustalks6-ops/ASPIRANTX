import React from 'react';
import { motion } from 'motion/react';
import { ActiveTab, UserProfile } from '../types';
import { EXAM_LIST } from '../lib/examList';
import { 
  BookOpen, 
  Timer, 
  CheckSquare, 
  MessageSquare, 
  Crown, 
  Flame, 
  Target,
  LogOut,
  ChevronRight,
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
  ChevronDown
} from 'lucide-react';

import { AppCustomizerSettings } from '../lib/customizer';
import { getCustomExamsFromStorage } from '../lib/customExamStore';
import { AdSenseBanner } from './AdSenseBanner';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: UserProfile | null;
  onLogout: () => void;
  isAdminUnlocked?: boolean;
  onTriggerAdminSecret?: () => void;
  onOpenProfileModal?: () => void;
  onOpenReferralModal?: () => void;
  onOpenCustomizerModal?: () => void;
  customizer?: AppCustomizerSettings;
  selectedExam?: string;
  onExamChange?: (examId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  isAdminUnlocked = false,
  onTriggerAdminSecret,
  onOpenProfileModal,
  onOpenReferralModal,
  onOpenCustomizerModal,
  customizer,
  selectedExam,
  onExamChange,
}) => {
  const [clickCount, setClickCount] = React.useState<number>(0);
  const [expandedSection, setExpandedSection] = React.useState<string | null>('practice');

  const handleLogoSecretClick = () => {
    setClickCount((prev) => prev + 1);
    if (onTriggerAdminSecret) {
      onTriggerAdminSecret();
    }
  };

  const navGroups = [
    {
      key: 'practice',
      title: 'Practice & Prep',
      items: [
        { id: 'cbt' as ActiveTab, label: 'CBT Mock Tests', icon: Award, badge: 'Real Exam' },
        { id: 'pyq' as ActiveTab, label: 'PYQ Bank (35+ Yrs)', icon: BookMarked, badge: '1991–2026' },
        { id: 'question_bank' as ActiveTab, label: 'Question Bank', icon: HelpCircle, badge: 'Practice' },
        { id: 'syllabus' as ActiveTab, label: 'Syllabus Tracker', icon: BookOpen, badge: 'Track' },
        { id: 'library' as ActiveTab, label: 'Reference Library', icon: BookOpen, badge: 'NCERT' },
        { id: 'flashcards' as ActiveTab, label: 'Flashcards Recall', icon: BookMarked, badge: 'Spaced' },
      ]
    },
    {
      key: 'ai_community',
      title: 'AI & Peer Learning',
      items: [
        { id: 'chat' as ActiveTab, label: 'AI Mentor & Chat', icon: MessageSquare, badge: 'Gemini AI' },
        { id: 'community' as ActiveTab, label: 'Community Forum', icon: Users, badge: 'Circles' },
        { id: 'study_buddy' as ActiveTab, label: '1-on-1 Study Buddy', icon: Users, badge: 'Peer' },
        { id: 'teachers' as ActiveTab, label: 'Teacher Portal', icon: Users, badge: 'Live Class' },
      ]
    },
    {
      key: 'analytics_productivity',
      title: 'Productivity & Stats',
      items: [
        { id: 'timer' as ActiveTab, label: 'Pomodoro Timer', icon: Timer, badge: 'Focus' },
        { id: 'tasks' as ActiveTab, label: 'Study Tasks', icon: CheckSquare, badge: 'Planner' },
        { id: 'dashboard' as ActiveTab, label: 'Student Telemetry', icon: Target, badge: 'Analytics' },
        { id: 'leaderboard' as ActiveTab, label: 'All-India Ranker Board', icon: Flame, badge: 'Rankings' },
        { id: 'weakness' as ActiveTab, label: 'Lag Detector', icon: HelpCircle, badge: 'Diagnosis' },
      ]
    },
    {
      key: 'resources_perks',
      title: 'Resources & Rewards',
      items: [
        { id: 'reward_milestones' as ActiveTab, label: 'Reward Milestones', icon: Gift, badge: 'Perks' },
        { id: 'podcasts' as ActiveTab, label: 'Topper Podcast', icon: Mic, badge: 'Audio' },
        { id: 'blog' as ActiveTab, label: 'Editorial & Blog Desk', icon: BookOpen, badge: 'Daily' },
        { id: 'eligibility' as ActiveTab, label: 'Eligibility Check', icon: ShieldCheck, badge: 'Calculator' },
        { id: 'collaboration' as ActiveTab, label: 'Partner & Sponsor', icon: Handshake, badge: 'Collab' },
        { id: 'feedback' as ActiveTab, label: 'Feedback & Bugs', icon: MessageSquare, badge: 'Report' },
        { id: 'premium' as ActiveTab, label: 'Monetization / PRO', icon: Crown, badge: 'Plans' },
        ...(!(user?.isPremium && user?.premiumSource === 'paid') ? [{
          id: 'earn_premium' as ActiveTab,
          label: 'Earn Free PRO',
          icon: Gift,
          badge: 'Free PRO'
        }] : []),
      ]
    }
  ];

  const adminItem = {
    id: 'admin' as ActiveTab,
    label: 'Admin Panel',
    icon: ShieldCheck,
    badge: 'Admin'
  };

  const showAdmin = isAdminUnlocked || activeTab === 'admin' || user?.role === 'ADMIN';

  const renderNavItem = (item: { id: ActiveTab; label: string; icon: any; badge: string }, isAdmin: boolean = false) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        id={`sidebar-nav-${item.id}`}
        onClick={() => setActiveTab(item.id)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
          isActive
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
            : isAdmin
            ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
            isActive ? 'text-white' : isAdmin ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-200'
          }`} />
          <span className="truncate">{item.label}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            {item.badge}
          </span>
        </div>
      </button>
    );
  };

  return (
    <aside className="w-full md:w-64 lg:w-72 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 z-30 overflow-y-auto">
      <div className="space-y-5">
        {/* Logo & Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 px-1">
          <div
            onClick={handleLogoSecretClick}
            onDoubleClick={handleLogoSecretClick}
            title="Double-tap logo for secret Admin Mode"
            className="flex items-center gap-3 cursor-pointer select-none group flex-1"
          >
            {customizer?.logoUrl ? (
              <img 
                src={customizer.logoUrl} 
                alt="Brand Logo" 
                className="w-9 h-9 rounded-xl object-cover border border-slate-800 shadow-sm group-hover:scale-105 transition-transform" 
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform shrink-0">
                {customizer?.logoIconText || 'AX'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-slate-100 tracking-wide text-sm">
                  {customizer?.brandName || 'ASPIRANTX'}
                </h1>
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md uppercase">
                  {customizer?.brandBadge || 'PRO'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                {customizer?.brandTagline || 'Exam Prep Suite'}
              </p>
            </div>
          </div>

          {onOpenCustomizerModal && (
            <button
              onClick={onOpenCustomizerModal}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0 ml-1"
              title="App Design Settings"
            >
              <Wrench className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Active Exam Card */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Target className="w-3.5 h-3.5 text-indigo-400" /> Target Exam
            </span>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400/30" />
              {user?.streakDays ?? 1}d Streak
            </span>
          </div>

          <div className="relative flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <div className="truncate flex-1">
              <select
                value={selectedExam || user?.exam || 'NEET_UG'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__CREATE_CUSTOM__') {
                    if (onOpenProfileModal) onOpenProfileModal();
                  } else if (onExamChange) {
                    onExamChange(val);
                  }
                }}
                className="w-full bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer border-none p-0 truncate"
              >
                <optgroup label="Preset Exams">
                  {EXAM_LIST.map((ex) => (
                    <option key={ex.id} value={ex.id} className="bg-slate-900 text-slate-200 font-medium">
                      {ex.label}
                    </option>
                  ))}
                </optgroup>
                {getCustomExamsFromStorage().length > 0 && (
                  <optgroup label="My Custom Exams">
                    {getCustomExamsFromStorage().map((ce) => (
                      <option key={ce.id} value={ce.id} className="bg-slate-900 text-indigo-300 font-semibold">
                        ✨ {ce.label}
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value="__CREATE_CUSTOM__" className="bg-slate-900 text-amber-400 font-bold">
                  + Create Custom Exam...
                </option>
              </select>
            </div>
            <button
              onClick={onOpenProfileModal}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold px-1.5 py-0.5 rounded transition-colors shrink-0 ml-1"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Refer & Earn Quick Banner */}
        {onOpenReferralModal && (
          <div
            onClick={onOpenReferralModal}
            className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition-all flex items-center justify-between group shadow-card"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-300">Refer & Earn</p>
                <p className="text-[10px] text-slate-400 font-mono">{user?.referralCode || 'ASPIRANT'}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              +150 Coins
            </span>
          </div>
        )}

        {/* Grouped Navigation */}
        <div className="space-y-4">
          {navGroups.map((group) => {
            const isGroupExpanded = expandedSection === null || expandedSection === group.key;

            return (
              <div key={group.key} className="space-y-1">
                <div 
                  onClick={() => setExpandedSection(expandedSection === group.key ? null : group.key)}
                  className="px-2 py-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-400 transition-colors"
                >
                  <span>{group.title}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isGroupExpanded ? 'rotate-180' : ''}`} />
                </div>

                {isGroupExpanded && (
                  <nav className="space-y-1">
                    {group.items.map((item) => renderNavItem(item))}
                  </nav>
                )}
              </div>
            );
          })}

          {showAdmin && (
            <div className="pt-2 border-t border-slate-800">
              {renderNavItem(adminItem, true)}
            </div>
          )}
        </div>

        {/* Sidebar AdSense Ad Unit */}
        <div className="pt-3 border-t border-slate-800/80">
          <AdSenseBanner slotType="sidebar" isPremium={user?.isPremium} />
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="pt-4 mt-6 border-t border-slate-800">
        {user ? (
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div 
              onClick={onOpenProfileModal}
              className="flex items-center gap-2.5 overflow-hidden cursor-pointer group flex-1"
            >
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-indigo-500 transition-colors shrink-0"
              />
              <div className="truncate min-w-0">
                <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">My Account Settings</p>
              </div>
            </div>

            <button
              id="logout-btn"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
};

