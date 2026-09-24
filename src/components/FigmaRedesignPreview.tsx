import React, { useState } from 'react';
import { 
  Compass, 
  Layers, 
  GitBranch, 
  Layout, 
  Palette, 
  Box, 
  Home, 
  BookOpen, 
  Award, 
  BarChart3, 
  Menu, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Clock, 
  Flame, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  ArrowRight, 
  Check, 
  X,
  Target,
  FileText,
  HelpCircle,
  TrendingUp,
  Shield,
  Copy,
  ExternalLink,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckmarkPop, FloatingRewardBadge } from '../lib/animations';

type FigmaPageId = 
  | '01_architecture'
  | '02_user_flows'
  | '03_wireframes'
  | '04_design_system'
  | '05_components'
  | '06_home'
  | '07_study'
  | '08_practice'
  | '09_progress'
  | '10_more'
  | '11_secondary_screens'
  | '12_prototype';

interface FigmaRedesignPreviewProps {
  onClose?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const FigmaRedesignPreview: React.FC<FigmaRedesignPreviewProps> = ({
  onClose,
  onNavigateTab
}) => {
  const [activePage, setActivePage] = useState<FigmaPageId>('01_architecture');
  const [mobileProtoTab, setMobileProtoTab] = useState<'home' | 'study' | 'practice' | 'progress' | 'more'>('home');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Prototype interactive demo states
  const [subtopicChecked, setSubtopicChecked] = useState(false);
  const [showXpPill, setShowXpPill] = useState(false);
  const [showPracticePrompt, setShowPracticePrompt] = useState(false);
  const [practiceScore, setPracticeScore] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState(true);

  const copyToClipboard = (text: string, tokenName: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedToken(tokenName);
    setTimeout(() => setCopiedToken(null), 1800);
  };

  const pages = [
    { id: '01_architecture', name: '01 — Architecture', icon: Compass, badge: '5 Pillars' },
    { id: '02_user_flows', name: '02 — User Flows', icon: GitBranch, badge: '4 Flows' },
    { id: '03_wireframes', name: '03 — Wireframes', icon: Layout, badge: 'Low-Fi' },
    { id: '04_design_system', name: '04 — Design System', icon: Palette, badge: 'Tokens' },
    { id: '05_components', name: '05 — Components', icon: Box, badge: 'Variants' },
    { id: '06_home', name: '06 — Home Screen', icon: Home, badge: '5-Sec Rule' },
    { id: '07_study', name: '07 — Study Experience', icon: BookOpen, badge: 'Syllabus' },
    { id: '08_practice', name: '08 — Practice Hub', icon: Award, badge: 'PYQs & CBT' },
    { id: '09_progress', name: '09 — Progress', icon: BarChart3, badge: 'Analytics' },
    { id: '10_more', name: '10 — More & Tools', icon: Menu, badge: 'Secondary' },
    { id: '11_secondary_screens', name: '11 — Secondary Sheets', icon: Layers, badge: 'Modals' },
    { id: '12_prototype', name: '12 — Prototype', icon: Smartphone, badge: 'Clickable' },
  ];

  return (
    <div className="min-h-screen bg-[#06080D] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Figma Canvas Control Bar */}
      <header className="h-14 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-600/20 text-xs tracking-wider">
            SR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">StudyRide Mobile App</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                Figma Design System v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">12 Artboard Pages • Master Architecture & Prototype</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5 border border-slate-700/60"
            >
              <X className="w-3.5 h-3.5" /> Close Preview
            </button>
          )}
        </div>
      </header>

      {/* Main Canvas Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Figma Pages Sidebar */}
        <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#080C14] p-3 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto shrink-0">
          <div className="hidden lg:flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Figma Pages (12)</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {pages.map((p) => {
            const Icon = p.icon;
            const isActive = activePage === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePage(p.id as FigmaPageId)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap lg:whitespace-normal ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span className="truncate">{p.name}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800/60 text-slate-400'
                }`}>
                  {p.badge}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Center / Right Content Viewer */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#070A10]">
          {/* ============================================================ */}
          {/* PAGE 01: PRODUCT ARCHITECTURE                                */}
          {/* ============================================================ */}
          {activePage === '01_architecture' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono font-semibold text-sky-400 uppercase tracking-wider">Page 01 — Information Architecture</span>
                <h1 className="text-2xl font-bold text-white mt-1">5-Pillar Product Hierarchy</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Reorganized 28 disparate tabs into 5 logical primary pillars. Eliminates cognitive clutter while preserving 100% of existing functionality.
                </p>
              </div>

              {/* Visual 5-Pillar Column Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 pt-2">
                {/* Pillar 1: Home */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-sky-500/30 space-y-3 relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">1. HOME</h3>
                      <p className="text-[10px] text-sky-400">What to do today?</p>
                    </div>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-300">
                    <li className="p-1.5 rounded-lg bg-slate-800/60 font-semibold text-white">🎯 Today's Plan Hero</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">⏳ Continue Studying</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">✓ Daily Goals (3 Items)</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">💡 AI Contextual Nudge</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">⏱ Exam Countdown</li>
                  </ul>
                </div>

                {/* Pillar 2: Study */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">2. STUDY</h3>
                      <p className="text-[10px] text-indigo-400">What to study now?</p>
                    </div>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-300">
                    <li className="p-1.5 rounded-lg bg-slate-800/60 font-semibold text-white">🗺 4-Level Syllabus Tree</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">📑 Official vs Custom</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">📚 NCERT Reference Notes</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">🗂 Active Recall Decks</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">🎙 Audio Lecture Series</li>
                  </ul>
                </div>

                {/* Pillar 3: Practice */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">3. PRACTICE</h3>
                      <p className="text-[10px] text-emerald-400">Test & reinforce</p>
                    </div>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-300">
                    <li className="p-1.5 rounded-lg bg-slate-800/60 font-semibold text-white">⚡ Contextual Post-Study</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">📜 35-Yr PYQs (1991-26)</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">📝 6,000+ Question Bank</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">💻 CBT All-India Mock</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">🎯 Weakness Re-tester</li>
                  </ul>
                </div>

                {/* Pillar 4: Progress */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">4. PROGRESS</h3>
                      <p className="text-[10px] text-purple-400">How am I performing?</p>
                    </div>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-300">
                    <li className="p-1.5 rounded-lg bg-slate-800/60 font-semibold text-white">⭕ Telemetry Rings</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">📊 Subject Coverage</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">📈 Study Velocity Hours</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">🎯 Accuracy Analytics</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">🏆 All-India Leaderboard</li>
                  </ul>
                </div>

                {/* Pillar 5: More */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Menu className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">5. MORE</h3>
                      <p className="text-[10px] text-amber-400">Tools & Community</p>
                    </div>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-300">
                    <li className="p-1.5 rounded-lg bg-slate-800/60 font-semibold text-white">⏱ Pomodoro Focus Timer</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">👥 Study Buddy & Rooms</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">🎁 XP & Rewards Center</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">📱 Habit Lockscreen Wall</li>
                    <li className="p-1.5 rounded-lg bg-slate-800/40">⚙️ Settings & Customizer</li>
                  </ul>
                </div>
              </div>

              {/* Complete 28-Feature Inventory Accordion */}
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" /> Complete 28-Feature Mapping Ledger
                  </h3>
                  <span className="text-xs text-emerald-400 font-mono">100% Features Preserved</span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Every feature has an intentional, permanent home. By moving secondary features (Pomodoro, Wallpaper, Eligibility, Rewards) into the clean <b>More Hub</b> and grouping practice modes (PYQs, Question Bank, CBT, Weakness) under <b>Practice Hub</b>, the user can study with zero distractions while retaining one-tap access to all tools.
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PAGE 02: USER FLOWS                                          */}
          {/* ============================================================ */}
          {activePage === '02_user_flows' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">Page 02 — User Experience Flows</span>
                <h1 className="text-2xl font-bold text-white mt-1">Core Behavioral Journeys</h1>
                <p className="text-sm text-slate-400 mt-1">
                  How a UPSC aspirant navigates through study, practice, and progression without ever asking "What do I do next?".
                </p>
              </div>

              {/* Flow 1: Morning Kickoff */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center">1</span>
                    <h3 className="font-bold text-base text-white">Morning Study Kickoff (The 5-Second Rule)</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Target Time: &lt; 5 seconds</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-slate-400 text-[10px] font-mono">STEP 1</div>
                    <div className="font-semibold text-white mt-1">Open App</div>
                    <p className="text-slate-400 text-[11px] mt-1">Fast initial render with calm, uncluttered top header.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-slate-400 text-[10px] font-mono">STEP 2</div>
                    <div className="font-semibold text-white mt-1">Scan Today's Plan</div>
                    <p className="text-slate-400 text-[11px] mt-1">Hero card shows "Constitutional Framework" (45 min).</p>
                  </div>
                  <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
                    <div className="text-sky-400 text-[10px] font-mono">ACTION</div>
                    <div className="font-semibold text-sky-300 mt-1">Tap [Start Studying]</div>
                    <p className="text-slate-400 text-[11px] mt-1">Single high-contrast primary CTA above the fold.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-emerald-400 text-[10px] font-mono">RESULT</div>
                    <div className="font-semibold text-emerald-300 mt-1">Reading in Study Tab</div>
                    <p className="text-slate-400 text-[11px] mt-1">Directly begins reading chapter notes & subtopics.</p>
                  </div>
                </div>
              </div>

              {/* Flow 2: Study to Practice Loop */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
                    <h3 className="font-bold text-base text-white">Study-to-Practice Reinforcement Loop</h3>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono">Active Curiosity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-slate-400 text-[10px] font-mono">STEP 1</div>
                    <div className="font-semibold text-white mt-1">Finish Reading</div>
                    <p className="text-slate-400 text-[11px] mt-1">Checks off "Preamble & Basic Structure" subtopic.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-slate-400 text-[10px] font-mono">STEP 2</div>
                    <div className="font-semibold text-white mt-1">Tactile Reward</div>
                    <p className="text-slate-400 text-[11px] mt-1">+30 XP floats up; syllabus coverage bar advances.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-emerald-400 text-[10px] font-mono">NUDGE</div>
                    <div className="font-semibold text-emerald-300 mt-1">Practice 5 PYQs</div>
                    <p className="text-slate-400 text-[11px] mt-1">Contextual drawer offers 5 past Prelims questions.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <div className="text-purple-400 text-[10px] font-mono">PROGRESSION</div>
                    <div className="font-semibold text-purple-300 mt-1">Next Topic Unlocked</div>
                    <p className="text-slate-400 text-[11px] mt-1">Scorecard displays + automatic suggestion for next topic.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PAGE 04: DESIGN SYSTEM & TOKENS                              */}
          {/* ============================================================ */}
          {activePage === '04_design_system' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">Page 04 — Design Tokens & Foundations</span>
                <h1 className="text-2xl font-bold text-white mt-1">Restrained Dark Design Palette</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Curated color tokens, typographic hierarchy, and surface elevations tailored for deep study focus without eye fatigue or AI-style neon glow.
                </p>
              </div>

              {/* Color Tokens Grid */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-sky-400" /> Color Swatches & Hex Codes (Click to copy)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { name: 'Base Background', hex: '#080B11', role: 'Main App Surface', text: 'text-white' },
                    { name: 'Surface Level 1', hex: '#0F1623', role: 'Card Container', text: 'text-white' },
                    { name: 'Surface Level 2', hex: '#172132', role: 'Sub-rows & Badges', text: 'text-white' },
                    { name: 'Border Subdued', hex: '#1E2B40', role: 'Subtle Dividers', text: 'text-white' },
                    { name: 'Primary Cyan', hex: '#0284C7', role: 'Primary CTA Button', text: 'text-white' },
                    { name: 'Accent Sky', hex: '#38BDF8', role: 'Active Tab / Focus', text: 'text-slate-900' },
                    { name: 'Success Emerald', hex: '#10B981', role: 'Completed Subtopic', text: 'text-slate-900' },
                    { name: 'Pace Amber', hex: '#F59E0B', role: 'High Yield & Streak', text: 'text-slate-900' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => copyToClipboard(c.hex, c.name)}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-left hover:border-sky-500/50 transition-all group"
                    >
                      <div 
                        className={`h-12 rounded-xl mb-2 flex items-center justify-center font-mono text-xs font-bold shadow-inner ${c.text}`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {c.hex}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white group-hover:text-sky-300">{c.name}</span>
                        {copiedToken === c.name ? (
                          <span className="text-[10px] text-emerald-400 font-mono">Copied!</span>
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{c.role}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography Spec */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-white">Typography Scale (Inter / System Font)</h3>
                <div className="space-y-3 font-sans divide-y divide-slate-800/80">
                  <div className="pt-2 flex items-baseline justify-between">
                    <div>
                      <span className="text-[22px] font-bold text-white tracking-tight">Display Headline 22px Bold</span>
                      <p className="text-[11px] text-slate-400">Used for screen hero titles and major numbers</p>
                    </div>
                    <span className="font-mono text-xs text-slate-400">22px / 28px</span>
                  </div>
                  <div className="pt-2 flex items-baseline justify-between">
                    <div>
                      <span className="text-[16px] font-semibold text-white">Section Title 16px SemiBold</span>
                      <p className="text-[11px] text-slate-400">Used for card titles and module headings</p>
                    </div>
                    <span className="font-mono text-xs text-slate-400">16px / 22px</span>
                  </div>
                  <div className="pt-2 flex items-baseline justify-between">
                    <div>
                      <span className="text-[14px] text-slate-200">Body Default 14px Regular</span>
                      <p className="text-[11px] text-slate-400">Used for subtopic names and primary reading text</p>
                    </div>
                    <span className="font-mono text-xs text-slate-400">14px / 20px</span>
                  </div>
                  <div className="pt-2 flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Eyebrow Badge 11px Medium</span>
                      <p className="text-[11px] text-slate-400">Used for "HIGH YIELD" and "TODAY'S TARGET" badges</p>
                    </div>
                    <span className="font-mono text-xs text-slate-400">11px / 14px</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PAGE 12: CLICKABLE PROTOTYPE VIEWER                         */}
          {/* ============================================================ */}
          {(activePage === '12_prototype' || activePage === '06_home' || activePage === '07_study' || activePage === '08_practice' || activePage === '09_progress' || activePage === '10_more') && (
            <div className="max-w-md mx-auto space-y-4">
              {/* Device Frame Header */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span className="font-mono flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-sky-400" /> Mobile Viewport (393 × 852 pt)
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">● Interactive Sandbox</span>
              </div>

              {/* Physical Mobile Frame Container */}
              <div className="rounded-[40px] border-4 border-slate-800 bg-[#080B11] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col min-h-[720px] relative">
                {/* Mobile Status Bar */}
                <div className="h-10 px-6 flex items-center justify-between text-[11px] font-semibold text-slate-300 select-none bg-[#080B11]">
                  <span>9:41</span>
                  <div className="w-20 h-4 bg-black rounded-full mx-auto" />
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5">
                      <div className="h-full bg-slate-300 w-3/4 rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Decluttered Global Header */}
                <div className="px-4 py-2 flex items-center justify-between border-b border-slate-900 bg-[#080B11]/95">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-600/30 border border-sky-500/40 flex items-center justify-center font-bold text-sky-400 text-xs">
                      SR
                    </div>
                    <span className="font-bold text-sm text-white tracking-tight">StudyRide</span>
                    <button className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-sky-400 font-medium flex items-center gap-1">
                      UPSC ▾
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold">
                      <Flame className="w-3 h-3" /> 14
                    </div>
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-sky-500/50 flex items-center justify-center text-xs font-bold text-white">
                      Y
                    </div>
                  </div>
                </div>

                {/* Dynamic Screen View Based on Selected Navigation */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* HOME TAB VIEW */}
                  {mobileProtoTab === 'home' && (
                    <div className="space-y-4">
                      {/* Quiet Daily Motivational Quote */}
                      <p className="text-[11px] text-slate-400 italic text-center px-4">
                        "Discipline is choosing between what you want now and what you want most."
                      </p>

                      {/* HERO: Today's Primary Study Plan Card */}
                      <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0E1B2E] to-[#0A121E] border border-sky-500/30 shadow-lg space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                            Today's Target
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            HIGH YIELD
                          </span>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">Indian Polity & Governance</div>
                          <h2 className="text-base font-bold text-white mt-0.5">Constitutional Framework</h2>
                          <p className="text-xs text-slate-400 mt-1">3 subtopics • 45 min estimated study time</p>
                        </div>
                        <button
                          onClick={() => setMobileProtoTab('study')}
                          className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-600/30 active:scale-98"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> START STUDYING
                        </button>
                      </div>

                      {/* Continue Studying Resume Row */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Preamble & Basic Structure</div>
                            <div className="text-[10px] text-slate-400">12 min remaining • In progress</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setMobileProtoTab('study')}
                          className="text-xs text-sky-400 font-semibold hover:text-sky-300 flex items-center gap-0.5"
                        >
                          Resume <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Today's Daily Goals (3 Items) */}
                      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">Daily Goals</span>
                          <span className="text-[11px] text-slate-400 font-mono">1/3 Done</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span className="text-slate-400 line-through">Polity: Preamble notes</span>
                            </div>
                            <span className="text-[10px] text-emerald-400">+20 XP</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border border-slate-600" />
                              <span className="text-slate-200">Fundamental Rights PYQs</span>
                            </div>
                            <span className="text-[10px] text-slate-400">15 min</span>
                          </div>
                        </div>
                      </div>

                      {/* Contextual AI Recommendation */}
                      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/90 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="text-slate-300">
                            Based on your 72% accuracy in Polity, 5 revision PYQs are recommended today.
                          </p>
                          <button 
                            onClick={() => setMobileProtoTab('practice')}
                            className="text-sky-400 font-semibold mt-1 flex items-center gap-1 hover:underline text-[11px]"
                          >
                            Practice 5 PYQs →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STUDY TAB VIEW */}
                  {mobileProtoTab === 'study' && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-white">Syllabus Explorer</h2>
                        <span className="text-xs text-sky-400 font-mono">1/4 Done (25%)</span>
                      </div>

                      {/* Subject Progress Bar */}
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full w-1/4 rounded-full transition-all duration-500" />
                      </div>

                      {/* Expandable Topic Accordion */}
                      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                        <button
                          onClick={() => setExpandedSection(!expandedSection)}
                          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/40"
                        >
                          <div>
                            <span className="text-[10px] text-sky-400 font-bold uppercase">Section 1</span>
                            <h3 className="text-sm font-bold text-white">Constitutional Framework</h3>
                            <span className="text-[11px] text-slate-400">3 subtopics • Indian Polity</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSection ? 'rotate-180' : ''}`} />
                        </button>

                        {expandedSection && (
                          <div className="p-3 pt-0 space-y-2 border-t border-slate-800/80 bg-slate-950/40">
                            {/* Subtopic 1 (Interactive Clickable) */}
                            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between relative">
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => {
                                    setSubtopicChecked(!subtopicChecked);
                                    if (!subtopicChecked) {
                                      setShowXpPill(true);
                                      setTimeout(() => setShowXpPill(false), 900);
                                      setShowPracticePrompt(true);
                                    }
                                  }}
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                    subtopicChecked ? 'bg-sky-500 border-sky-400 text-white' : 'border-slate-600 hover:border-slate-400'
                                  }`}
                                >
                                  {subtopicChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                                <div>
                                  <div className={`text-xs font-medium ${subtopicChecked ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                                    Preamble, Citizenship & Basic Structure
                                  </div>
                                  <div className="text-[10px] text-slate-400">2.5 hrs • High Weightage</div>
                                </div>
                              </div>
                              <span className="text-[10px] text-sky-400 font-mono">Notes ↗</span>

                              {/* Floating XP Pill Simulation */}
                              <AnimatePresence>
                                {showXpPill && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 0 }}
                                    animate={{ opacity: 1, y: -22 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute left-6 top-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] shadow-lg pointer-events-none"
                                  >
                                    +30 XP
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Subtopic 2 */}
                            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-5 h-5 rounded-md border border-slate-600" />
                                <div>
                                  <div className="text-xs font-medium text-slate-200">Fundamental Rights (Art 12–35)</div>
                                  <div className="text-[10px] text-slate-400">3.0 hrs • Critical Focus</div>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">Notes ↗</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Contextual Post-Completion Reinforcement Prompt */}
                      {showPracticePrompt && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-300">Topic Completed! Reinforce now?</span>
                            <button onClick={() => setShowPracticePrompt(false)} className="text-slate-400 hover:text-white">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Try 5 UPSC Prelims PYQs on Preamble while concepts are fresh in memory.
                          </p>
                          <button
                            onClick={() => {
                              setShowPracticePrompt(false);
                              setMobileProtoTab('practice');
                            }}
                            className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                          >
                            Practice 5 PYQs →
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* PRACTICE TAB VIEW */}
                  {mobileProtoTab === 'practice' && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-white">Practice Hub</h2>
                        <span className="text-xs text-sky-400 font-mono">6,030 Questions</span>
                      </div>

                      {/* 4 Core Practice Modules (2x2 Grid) */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 hover:border-sky-500/40 transition-all">
                          <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-xs font-bold text-white">PYQ Archive</div>
                          <div className="text-[10px] text-slate-400">1991–2026 Papers</div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 hover:border-sky-500/40 transition-all">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <HelpCircle className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-xs font-bold text-white">Question Bank</div>
                          <div className="text-[10px] text-slate-400">Chapter drills</div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 hover:border-sky-500/40 transition-all">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            <Award className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-xs font-bold text-white">CBT Simulator</div>
                          <div className="text-[10px] text-slate-400">Timed full mocks</div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 hover:border-sky-500/40 transition-all">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <Target className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-xs font-bold text-white">Weak Areas</div>
                          <div className="text-[10px] text-slate-400">Error notebook</div>
                        </div>
                      </div>

                      {/* Diagnostic Sample Question */}
                      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>UPSC Prelims PYQ • Polity</span>
                          <span className="text-sky-400 font-mono">Q1 of 5</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-serif">
                          Which one of the following objectives is not embodied in the Preamble to the Constitution of India?
                        </p>
                        <div className="space-y-1.5 pt-1">
                          {[
                            'Liberty of thought',
                            'Economic liberty',
                            'Liberty of expression',
                            'Liberty of belief'
                          ].map((opt, i) => (
                            <button
                              key={opt}
                              onClick={() => setPracticeScore(i === 1 ? 1 : 0)}
                              className={`w-full p-2 rounded-lg text-left text-xs font-medium border transition-all ${
                                practiceScore !== null && i === 1
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                  : practiceScore !== null && practiceScore === 0 && i !== 1
                                  ? 'bg-slate-950 border-slate-800 text-slate-400 opacity-60'
                                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <span className="font-mono text-slate-400 mr-2">({String.fromCharCode(65 + i)})</span>
                              {opt}
                            </button>
                          ))}
                        </div>
                        {practiceScore === 1 && (
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct! Economic liberty is not mentioned in Preamble. (+20 XP)
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PROGRESS TAB VIEW */}
                  {mobileProtoTab === 'progress' && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-white">Readiness Telemetry</h2>
                        <span className="text-xs text-emerald-400 font-mono">Exam: 245 Days</span>
                      </div>

                      {/* 2 Circular Telemetry Rings */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                          <div className="text-2xl font-bold text-sky-400 font-mono">25%</div>
                          <div className="text-xs font-semibold text-white">Syllabus Coverage</div>
                          <div className="text-[10px] text-slate-400">1 of 4 Subtopics</div>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                          <div className="text-2xl font-bold text-emerald-400 font-mono">82%</div>
                          <div className="text-xs font-semibold text-white">Practice Accuracy</div>
                          <div className="text-[10px] text-slate-400">Polity & History</div>
                        </div>
                      </div>

                      {/* Study Velocity */}
                      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">Weekly Study Hours</span>
                          <span className="text-sky-400 font-mono">28.5 hrs</span>
                        </div>
                        <div className="flex items-end justify-between h-20 pt-2 px-2">
                          {[
                            { day: 'M', h: 4 },
                            { day: 'T', h: 5.5 },
                            { day: 'W', h: 6 },
                            { day: 'T', h: 3 },
                            { day: 'F', h: 5 },
                            { day: 'S', h: 3.5 },
                            { day: 'S', h: 1.5 }
                          ].map((d) => (
                            <div key={d.day} className="flex flex-col items-center gap-1">
                              <div 
                                className="w-5 bg-sky-500/70 rounded-t-sm" 
                                style={{ height: `${d.h * 10}px` }} 
                              />
                              <span className="text-[10px] text-slate-400">{d.day}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MORE TAB VIEW */}
                  {mobileProtoTab === 'more' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-white">Tools & Community</h2>
                        <span className="text-xs text-slate-400">yambuj751 • Lvl 2</span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Productivity</span>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-sky-400" />
                            <span className="text-slate-200">Pomodoro Focus Timer</span>
                          </div>
                          <span className="text-[10px] text-slate-400">25/50m</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-indigo-400" />
                            <span className="text-slate-200">Habit Lockscreen Wallpaper</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Export</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rewards & Community</span>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-amber-400" />
                            <span className="text-slate-200">XP & Reward Milestones</span>
                          </div>
                          <span className="text-[10px] text-amber-400">10 Coins</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-emerald-400" />
                            <span className="text-slate-200">Study Buddy Matching</span>
                          </div>
                          <span className="text-[10px] text-emerald-400">Active</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5-Pillar Persistent Bottom Navigation Bar */}
                <div className="h-16 border-t border-slate-900 bg-[#080B11]/98 px-2 flex items-center justify-around">
                  <button
                    onClick={() => setMobileProtoTab('home')}
                    className={`flex flex-col items-center gap-1 transition-all ${
                      mobileProtoTab === 'home' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span className="text-[10px]">Home</span>
                  </button>

                  <button
                    onClick={() => setMobileProtoTab('study')}
                    className={`flex flex-col items-center gap-1 transition-all ${
                      mobileProtoTab === 'study' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="text-[10px]">Study</span>
                  </button>

                  <button
                    onClick={() => setMobileProtoTab('practice')}
                    className={`flex flex-col items-center gap-1 transition-all ${
                      mobileProtoTab === 'practice' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span className="text-[10px]">Practice</span>
                  </button>

                  <button
                    onClick={() => setMobileProtoTab('progress')}
                    className={`flex flex-col items-center gap-1 transition-all ${
                      mobileProtoTab === 'progress' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-[10px]">Progress</span>
                  </button>

                  <button
                    onClick={() => setMobileProtoTab('more')}
                    className={`flex flex-col items-center gap-1 transition-all ${
                      mobileProtoTab === 'more' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Menu className="w-4 h-4" />
                    <span className="text-[10px]">More</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
