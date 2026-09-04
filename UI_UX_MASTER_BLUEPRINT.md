# ASPIRANTX — PRODUCT UI/UX MASTER BLUEPRINT

## HIGH-PRECISION PRODUCT ARCHITECTURE, TAXONOMY & SYSTEMATIC EXECUTION PLAN

---

## 1. PRODUCT PHILOSOPHY & COGNITIVE MODEL

AspirantX is an authoritative, high-stakes competitive examination preparation platform. It must feel like an **academic command center** — calm, intelligent, focused, and trustworthy — rather than an ad-heavy or chaotic dashboard.

### Core Non-Negotiable Directives:
1. **Zero Feature Deletion**: Every single existing feature, tool, and route must remain accessible and functional.
2. **Zero Data Loss**: No database rows, user progress, CBT test submissions, or local cache schemas may be deleted or modified destructively.
3. **Zero Business Logic Distortion**: Authentication flows, role gates, CBT scoring rules (+2 / -0.66), pricing, offline packaging, and sync worker behaviors remain 100% intact.
4. **No Superficial/Global Reskins**: No uncontrolled global CSS swaps or random color shifts. We proceed **one product area at a time**, verify against gates, freeze, and advance.

---

## 2. ACTUAL PRODUCT MIND MAP (MAPPED TO REAL CODEBASE)

Derived directly from `src/App.tsx`, `src/types.ts`, `src/components/Sidebar.tsx`, and `src/components/MobileDrawer.tsx`.

```text
ASPIRANTX
│
├── 1. PUBLIC & AUTHENTICATION (src/components/LandingPage.tsx)
│   ├── Hero & Multi-Exam Story ("One System. Master Any Exam.")
│   ├── Exam Coverage Pills (UPSC, NEET, JEE, SSC, GATE, CAT, NDA, CDS, CUET, State PSC)
│   ├── 3-Step Preparation Loop (Learn → Practice → Analyze)
│   ├── 6-Module Capability Matrix
│   ├── Preview / Guest Exploration Session (demoSession.ts)
│   ├── Google Sign-In & Supabase OAuth
│   └── Email / Password Auth Modal (Login & Registration)
│
├── 2. ONBOARDING & GUIDANCE
│   ├── Guided Onboarding Wizard (src/components/OnboardingWizard.tsx)
│   │   ├── Exam Selection (EXAM_LIST)
│   │   ├── Goal & Timeline Setup
│   │   └── Daily Study Target Preferences
│   └── First-Time Interactive Tour (src/components/OnboardingTour.tsx)
│
├── 3. GLOBAL APP SHELL (Desktop & Mobile)
│   ├── Sticky Header (src/components/Header.tsx)
│   │   ├── Route Title & Breadcrumb
│   │   ├── Global Exam Switcher (ExamContext.tsx)
│   │   ├── Global Omnibox Search Trigger (GlobalSearchModal.tsx)
│   │   ├── Demo Mode Countdown Timer (for Guests)
│   │   └── User Avatar & Profile Modal Trigger
│   ├── Desktop Left Sidebar (src/components/Sidebar.tsx)
│   │   ├── Collapsed (64px) & Expanded (256px) States
│   │   ├── 6 Domain Nav Groups + Administration
│   │   ├── Workspace Feature Customizer Trigger (WorkspaceCustomizer.tsx)
│   │   └── Inactive Feature Discover Drawer ("+ Add More Features")
│   ├── Mobile Bottom Bar (src/components/MobileBottomNav.tsx)
│   │   └── 5 Core Tabs: Home | Learn | Practice | Progress | More
│   ├── Mobile Drawer (src/components/MobileDrawer.tsx)
│   │   └── Full Domain-Grouped Navigation Sheet
│   ├── Gamification & Level Status Bar (src/components/GamificationBar.tsx)
│   │   └── Level, XP Progress, Streak Days, Coins, Upgrade Pro Button
│   ├── Dynamic Habit Lockscreen Wallpaper Widget (src/components/ExamWallpaperWidget.tsx)
│   └── Global Modals & Utilities:
│       ├── Profile Modal (UserProfileModal.tsx)
│       ├── Global Search Omnibox (GlobalSearchModal.tsx)
│       ├── App Branding Customizer (AppCustomizerModal.tsx)
│       ├── Workspace Layout Customizer (WorkspaceCustomizer.tsx)
│       ├── Referral & Rewards Modal (ReferralModal.tsx)
│       ├── Study Reminder Notification Settings (ReminderSettingsModal.tsx)
│       ├── Android APK / PWA Download (AppDownloadModal.tsx)
│       └── Demo Expiration Notice (DemoExpiredModal.tsx)
│
├── 4. STUDENT WORKSPACE — 6 COGNITIVE DOMAINS (28 ActiveTab States)
│   │
│   ├── [DOMAIN 1] HOME / COMMAND CENTER
│   │   ├── student_dashboard / dashboard (src/components/StudentDashboard.tsx)
│   │   │   ├── Region 1: Compact Header (Greeting, Streak, Days Left, Exam Switcher)
│   │   │   ├── Region 2: "Continue Where You Left Off" Split Card + Today's Focus + AI Recommendations
│   │   │   ├── Region 3: Circular Performance Hub (Mastery & Accuracy)
│   │   │   ├── Region 4: Native AdSense Banner Slot
│   │   │   ├── Region 5: Quick Launch Workspace Grid (User-Customizable Sort Order)
│   │   │   └── Region 6: Wallpaper Widget & Daily Study Summary
│   │   └── wallpaper (ExamWallpaperWidget.tsx)
│   │
│   ├── [DOMAIN 2] LEARN
│   │   ├── syllabus (src/components/SyllabusTracker.tsx)
│   │   │   ├── Official Exam Curriculum Tree
│   │   │   ├── Personal Syllabus Drag-and-Drop Tree (MySyllabusDndTree.tsx)
│   │   │   ├── Google Sheets Syllabus Importer (GoogleSheetImportModal.tsx)
│   │   │   ├── CSV / JSON Bulk Importer (AcademicBulkImportModal.tsx)
│   │   │   └── Exam Day Predictor Engine (PredictorEngineWidget.tsx)
│   │   ├── library (src/components/LibraryEngine.tsx)
│   │   │   └── Standard Reference Books, NCERT Textbooks, Curated PDF Notes
│   │   └── podcasts (src/components/PodcastSeries.tsx)
│   │       └── Audio Revision & Expert Subject Breakdown Tracks
│   │
│   ├── [DOMAIN 3] PRACTICE
│   │   ├── pyq (src/components/PyqEngine.tsx)
│   │   │   └── 1991–2026 Previous Year Exam Questions Archive with Year/Topic Filters
│   │   ├── question_bank (src/components/QuestionBankEngine.tsx)
│   │   │   └── 4,000+ Topic-Wise Practice Questions with Immediate Answer Verification
│   │   ├── cbt / cbt_exam (src/components/CbtExamEngine.tsx)
│   │   │   └── NTA/UPSC Standard CBT Simulator (Timer, Marking Scheme, Palette, Review Queue)
│   │   └── flashcards (src/components/FlashcardEngine.tsx)
│   │       └── Spaced-Repetition Active Recall Revision Flashcard Deck
│   │
│   ├── [DOMAIN 4] PLAN
│   │   ├── tasks (src/components/TaskManager.tsx)
│   │   │   └── Daily Study Task Checklist, Priority Tags & Completion Status
│   │   ├── timer (src/components/PomodoroTimer.tsx)
│   │   │   └── 25/50 Min Pomodoro Focus Session, Ambient Noise & Session History
│   │   └── study_buddy (src/components/StudyBuddy.tsx)
│   │       └── Peer Accountability Partner Sync & Shared Study Room
│   │
│   ├── [DOMAIN 5] IMPROVE
│   │   ├── weakness (src/components/WeaknessDetector.tsx)
│   │   │   └── AI Error Pattern Analyzer & Low-Accuracy Topic Re-Test Generator
│   │   ├── leaderboard (src/components/LeaderboardView.tsx)
│   │   │   └── All-India Rank, State-Wise Rank & Weekly Aspirant Leaderboard
│   │   └── eligibility (src/components/EligibilityChecker.tsx)
│   │       └── Age, Education, Category & Attempt Eligibility Calculator
│   │
│   └── [DOMAIN 6] CONNECT & CONTENT
│       ├── chat (src/components/AiStudyChat.tsx)
│       │   └── Gemini-Powered 1-on-1 AI Study Mentor & Mains Answer Evaluator
│       ├── community (src/components/CommunityPlatform.tsx)
│       │   ├── Aspirants Discussion Feed & Subject Doubt Threads
│       │   ├── Peer Karma Upvoting System
│       │   └── Exam-Specific Group Study Rooms
│       ├── blog (src/components/BlogView.tsx)
│       │   └── Editorial Strategy Guides, Topper Interviews & Exam Updates
│       └── feedback (src/components/FeedbackEngine.tsx)
│           └── User Bug Reporting & Feature Suggestion Desk
│
├── 5. ACCOUNT & MONETIZATION
│   ├── premium (src/components/PremiumPlans.tsx)
│   │   └── Razorpay Plan Checkout & Manual UTR Bank Verification
│   ├── earn_premium (src/components/EarnPremium.tsx)
│   │   └── Quest-Based Free Pro Pass Unlock
│   └── reward_milestones (src/components/RewardMilestones.tsx)
│       └── Streak Milestone Rewards, AspirantX Coin Wallet & Redemptions
│
├── 6. FACULTY & TEACHER WORKSPACE (Role-Gated)
│   ├── teachers (src/components/TeacherPortal.tsx)
│   │   └── Educator Dashboard, Batch Management & Student Progress Oversight
│   └── blog_submit (src/components/TeacherBlogSubmit.tsx)
│       └── Faculty Content Publishing & Strategy Article Editor
│
└── 7. ADMINISTRATION (Role-Gated)
    └── admin (src/components/AdminPanel.tsx)
        ├── User Directory & Role Assignment (Student / Teacher / Admin)
        ├── Subscription & Manual UTR Payment Approval
        ├── Feature Flags & Demo Duration Controls
        ├── Academic Content Ingestion & CSV Importer
        ├── Live System Health Watchdog & Security Audit Logs
        └── Global Brand Customizer (Theme, Hero Image, Announcement Ticker)
```

---

## 3. ACTUAL TECHNICAL ROUTING TABLE (src/App.tsx)

Every `activeTab` value present in `src/types.ts` and rendered in `src/App.tsx`:

| # | `activeTab` Value | Rendered Component | Role Gating / Wrapper | Core Purpose (Single Sentence) |
|---|-------------------|--------------------|-----------------------|--------------------------------|
| 1 | `dashboard` | `<StudentDashboard>` | All Authenticated Users | Command center showing immediate next study action, performance hub, and quick shortcuts. |
| 2 | `student_dashboard` | `<StudentDashboard>` | All Authenticated Users | Alias for `dashboard` supporting direct navigation links. |
| 3 | `syllabus` | `<SyllabusTracker>` | `<PremiumGate feature="syllabus">` | Interactive official exam curriculum and personal drag-and-drop study tree with progress tracking. |
| 4 | `pyq` | `<PyqEngine>` | `<PremiumGate feature="pyq">` | Searchable archive of previous years' exam papers (1991–2026) with detailed solutions. |
| 5 | `question_bank` | `<QuestionBankEngine>` | `<PremiumGate feature="question_bank">` | Subject and topic filtered question practice with instant evaluation and detailed explanations. |
| 6 | `cbt` | `<CbtExamEngine>` | `<PremiumGate feature="cbt">` | Realistic exam simulation replicating official NTA/UPSC CBT interfaces with timers and negative marking. |
| 7 | `cbt_exam` | `<CbtExamEngine>` | `<PremiumGate feature="cbt">` | Direct test-taking view alias within the CBT engine. |
| 8 | `timer` | `<PomodoroTimer>` | `<PremiumGate feature="timer">` | Dedicated focus timer with ambient soundscapes and tracked study session analytics. |
| 9 | `tasks` | `<TaskManager>` | `<PremiumGate feature="task">` | Daily study checklist and target planner with completion history. |
| 10 | `chat` | `<AiStudyChat>` | `<PremiumGate feature="chat">` | Conversational AI mentor for instant concept doubt resolution and syllabus explanations. |
| 11 | `leaderboard` | `<LeaderboardView>` | All Users | Gamified All-India and State rankings based on study streak, XP, and practice accuracy. |
| 12 | `community` | `<CommunityPlatform>` | All Users | Forum for peer study discussions, doubt resolution, and exam room groups. |
| 13 | `study_buddy` | `<StudyBuddy>` | All Users | Direct peer connection for simultaneous study sessions and accountability. |
| 14 | `premium` | `<PremiumPlans>` | All Users | Pricing options, feature comparisons, and Razorpay/UPI subscription checkout. |
| 15 | `earn_premium` | `<EarnPremium>` | All Users | Streak and referral milestones that unlock Pro Pass access without payment. |
| 16 | `reward_milestones`| `<RewardMilestones>` | All Users | Redeemable coin milestones earned through consistent daily study activity. |
| 17 | `collaboration` | `<SponsorshipCollaboration>` | All Users | Official institutional partners, educational sponsors, and collaborative resources. |
| 18 | `library` | `<LibraryEngine>` | `<PremiumGate feature="library">` | Reference books, NCERT PDFs, and topper notes repository organized by subject. |
| 19 | `flashcards` | `<FlashcardEngine>` | All Users | Spaced repetition memory cards for high-yield facts, articles, and formulas. |
| 20 | `weakness` | `<WeaknessDetector>` | All Users | Diagnostic AI tool highlighting low-accuracy topics and generating remedial practice sets. |
| 21 | `teachers` | `<TeacherPortal>` | TEACHER, ADMIN, CO_ADMIN, or Designated Email | Faculty management console for managing student batches and curriculum assignments. |
| 22 | `podcasts` | `<PodcastSeries>` | All Users | Audio-first subject revision tracks and expert analysis for commute/hands-free learning. |
| 23 | `eligibility` | `<EligibilityChecker>` | All Users | Deterministic eligibility calculator for age limits, attempts, and educational qualifications. |
| 24 | `feedback` | `<FeedbackEngine>` | All Users | Formal feedback, bug reporting, and feature suggestion ticketing channel. |
| 25 | `blog` | `<BlogView>` | All Users | Curated editorial articles, exam strategy breakdowns, and syllabus notifications. |
| 26 | `blog_submit` | `<TeacherBlogSubmit>` | TEACHER, ADMIN, CO_ADMIN | Article submission and publishing interface for faculty and authorized contributors. |
| 27 | `wallpaper` | `<ExamWallpaperWidget>` | All Users | Custom mobile lockscreen habit wallpaper generator tied to live exam countdowns. |
| 28 | `admin` | `<AdminPanel>` | ADMIN, CO_ADMIN, or Designated Email | Platform operations: user management, payments, feature flags, and security auditing. |

---

## 4. GLOBAL SHELL ARCHITECTURE

The application shell establishes spatial consistency across the platform.

### Desktop Hierarchy:
```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Desktop Viewport                                                                │
│ ┌───────────────┬─────────────────────────────────────────────────────────────┐ │
│ │ Sidebar       │ Header (Title, Exam Switcher, Search, Demo Timer, Profile)   │ │
│ │ (Sticky Left) │─────────────────────────────────────────────────────────────│ │
│ │               │ Gamification Bar (Level, Streak, XP, Coins, Upgrade)         │ │
│ │ - Learn       │─────────────────────────────────────────────────────────────│ │
│ │ - Practice    │ Main Scroll Workspace (Padded max-w-7xl)                    │ │
│ │ - Plan        │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ - Improve     │ │ Active Page Content (e.g., Dashboard / CBT / Syllabus) │ │ │
│ │ - Connect     │ └─────────────────────────────────────────────────────────┘ │ │
│ │ - Account     │─────────────────────────────────────────────────────────────│ │
│ │ - Admin       │ AdSense Footer Slot                                         │ │
│ └───────────────┴─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Hierarchy:
```text
┌───────────────────────────────────────┐
│ Mobile Viewport (320px–412px)         │
│ ┌───────────────────────────────────┐ │
│ │ Mobile Header (Logo, Exam, Menu)  │ │
│ ├───────────────────────────────────┤ │
│ │ Gamification Mini-Pill            │ │
│ ├───────────────────────────────────┤ │
│ │ Main Scroll Workspace             │ │
│ │ (Padding-bottom: 96px for bar)    │ │
│ ├───────────────────────────────────┤ │
│ │ Persistent Mobile Bottom Nav      │ │
│ │ [Home] [Learn] [Practice]         │ │
│ │ [Progress] [More]                 │ │
│ └───────────────────────────────────┘ │
└───────────────────────────────────────┘
```

---

## 5. DESIGN SYSTEM SPECIFICATION (TOKENS & PRIMITIVES)

### Surface Architecture (4 Strict Levels):
1. **Level 0 (Base Canvas)**: `#090d16` (Deep slate-midnight) — zero noise.
2. **Level 1 (Card Surface)**: `#0f172a` (Slate-900) with `border: 1px solid rgba(148, 163, 184, 0.1)`.
3. **Level 2 (Elevated Panels & Flyouts)**: `#1e293b` (Slate-800) with soft directional shadow.
4. **Level 3 (Interactive / Hover Surfaces)**: `#334155` (Slate-700) or brand-tinted `rgba(14, 165, 233, 0.08)`.

### Semantic Color System:
- **Primary Brand**: Sky-500 (`#0ea5e9`) & Indigo-600 (`#4f46e5`) — Academic, modern, focused.
- **Success / Mastery**: Emerald-500 (`#10b981`) — Completed subtopics, correct answers, high accuracy.
- **Warning / Review**: Amber-500 (`#f59e0b`) — Pending tasks, medium weightage, streak at risk.
- **Critical / Danger**: Rose-500 (`#f43f5e`) — Negative marks, incorrect answers, locked access.
- **Neutral Foreground**: Slate-100 (`#f1f5f9`) for primary headings, Slate-400 (`#94a3b8`) for secondary text, Slate-600 (`#475569`) for subtle metadata.

### Typography Hierarchy:
- **Display**: 28px–32px, Font-weight 800 (Page Titles, Hero Headlines).
- **Section Heading**: 18px–20px, Font-weight 700 (Card Headers, Domain Titles).
- **Subheading**: 14px–15px, Font-weight 600 (List Items, Card Subtitles).
- **Body**: 13px–14px, Font-weight 400–500 (Paragraphs, Question Text).
- **Metadata / Eyebrow**: 10px–11px, Font-weight 700, Uppercase, Tracking-wide.

### Button Component Scale:
- **Primary**: Solid Sky-600 (`bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl px-4 py-2.5`).
- **Secondary**: Slate-800 border (`bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl px-4 py-2.5`).
- **Tertiary / Ghost**: Subtle hover (`text-slate-400 hover:text-white hover:bg-white/5 rounded-lg px-2.5 py-1.5`).
- **Danger / Destructive**: Rose tinted (`bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl`).

---

## 6. PAGE DENSITY & PURPOSE SPECIFICATIONS

| Page Area | Density Level | Guiding Purpose Statement |
| :--- | :--- | :--- |
| **Landing** | Low | *"What is AspirantX and why should I prepare here?"* |
| **Auth** | Very Low | *"Sign in or register securely and get straight to learning."* |
| **Onboarding** | Low | *"Select your target exam and initialize your custom preparation trajectory."* |
| **Dashboard** | Medium-Low | *"What should I study or practice right now?"* |
| **Syllabus** | Medium | *"Which topics have I mastered, and what is next on my curriculum path?"* |
| **Question Bank** | Focused | *"What subject questions should I practice with instant verification?"* |
| **PYQ** | Focused | *"Which real previous-year exam questions should I solve today?"* |
| **CBT** | High Task / Zero Clutter | *"How will I perform under authentic exam timer and marking pressure?"* |
| **Analytics & Weakness** | Medium-High | *"Where are my scoring leaks, and how do I increase accuracy?"* |
| **AI Mentor** | Conversation-First | *"What specific concept or question doubt do I need help explaining?"* |
| **Community** | Medium | *"What are other serious aspirants discussing and solving?"* |
| **Account & Perks** | Medium | *"Manage my subscription, profile details, and redeem earned rewards."* |
| **Teacher Portal** | High Operational | *"Manage student batches, monitor submissions, and track class progress."* |
| **Admin Panel** | High Operational | *"Manage platform users, transactions, academic content, and system health."* |

---

## 7. FROZEN 19-PHASE EXECUTION SEQUENCE

Work proceeds strictly through this controlled sequence. **No skipping, no multi-page batch rewrites.**

```text
PHASE 1  → Global Design System Tokens & Base Primitives (src/index.css)
PHASE 2  → Global Shell & Navigation (Sidebar, Header, BottomNav, Drawer)
PHASE 3  → Landing Page (Hero, Value Loop, Capability Matrix, Responsive)
PHASE 4  → Authentication (Modal & OAuth States, Error Handling)
PHASE 5  → Onboarding (Exam Setup, Trajectory Initializer)
PHASE 6  → Student Dashboard (5-Region Command Center, Continuity Sync)
PHASE 7  → Learn Domain (Syllabus Tracker, Library Engine, Podcasts)
PHASE 8  → Practice Domain (PYQ Archive, Question Bank Engine)
PHASE 9  → Analytics & Improve Domain (Weakness Detector, Leaderboard)
PHASE 10 → AI Intelligence (AI Study Mentor, Evaluator)
PHASE 11 → Community Domain (Forum, Peer Groups, Upvoting)
PHASE 12 → Account & Perks (Profile, Subscription, Rewards)
PHASE 13 → Teacher Portal (Batches, Assignment Review)
PHASE 14 → Admin Panel (User Ops, Content Ingestion, Watchdog)
PHASE 15 → CBT Exam Simulation Visual Polish (Pure Task Focus)
PHASE 16 → Mobile & Android Viewports (320px, 360px, 375px, 390px, 412px)
PHASE 17 → Accessibility Audit (Contrast, Tap Targets, ARIA Semantics)
PHASE 18 → Performance Verification (Bundle, Layout Shifts, CWV)
PHASE 19 → Final Regression & End-to-End User Journey Walkthrough
```

---

## 8. GATE SYSTEM & COMPLETION PROTOCOL

At the completion of each phase:
1. **Code Verification**: `npx tsc --noEmit` must pass with 0 errors.
2. **Build Verification**: `npm run build` must compile cleanly.
3. **Execution Verification**: Automated tests for that domain must pass.
4. **Phase Artifact**: Create `PHASE_X_COMPLETE.md` documenting:
   - What Changed
   - What Stayed Intact
   - Verification Evidence
   - Lock Status (PASS / FREEZE)
5. **Freeze Rule**: The completed phase is frozen before opening the next phase.
