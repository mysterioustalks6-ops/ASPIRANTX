# AspirantX — Master Product Architecture & Figma Design Specifications

This document defines the complete product reorganization, information hierarchy, design tokens, component specifications, and screen blueprints for the **AspirantX UPSC CSE Mobile App**.

---

## FIGMA FILE STRUCTURE OVERVIEW

```
📁 AspirantX Mobile App (Figma Project)
├── 📄 01 — Product Architecture
├── 📄 02 — User Flows
├── 📄 03 — Wireframes
├── 📄 04 — Design System
├── 📄 05 — Components
├── 📄 06 — Home
├── 📄 07 — Study
├── 📄 08 — Practice
├── 📄 09 — Progress
├── 📄 10 — More
├── 📄 11 — Secondary Screens
└── 📄 12 — Prototype
```

---

# PAGE 01 — PRODUCT ARCHITECTURE

### The Core Problem Solved
The previous experience suffered from **cognitive friction**: 28 scattered tabs, 9 competing top-bar actions, loud monetization banners, and "card-inside-card" syndrome.

### The 5-Pillar Reorganization
Every existing feature is preserved and mapped to exactly one of **5 Core Pillars**:

```
                              ASPIRANTX APP
                                    │
    ┌──────────────┬────────────────┼──────────────┬──────────────┐
    ▼              ▼                ▼              ▼              ▼
1. HOME        2. STUDY        3. PRACTICE    4. PROGRESS     5. MORE
(What to do    (What to study   (Test & reinforce (How am I      (Tools, Rewards
   today?)        now?)          knowledge)     performing?)    & Community)
    │              │                │              │              │
    ├─ Today's     ├─ Active        ├─ Post-Topic  ├─ Readiness   ├─ Pomodoro
    │  Plan Hero   │  Roadmap       │  PYQ Drill   │  Rings       │  Timer
    ├─ Continue    ├─ 4-Level       ├─ Topic       ├─ Syllabus    ├─ Study Buddy
    │  Studying    │  Syllabus      │  Practice    │  Breakdown   │  & Community
    ├─ Daily Goal  ├─ NCERT Notes   ├─ 35-Yr PYQs  ├─ Study Time  ├─ Rewards &
    │  Checklist   │  Library       │  Archive     │  Velocity    │  XP Milestones
    ├─ AI Study    ├─ Flashcard     ├─ All-India   ├─ Accuracy    ├─ Lockscreen
    │  Nudge       │  Recall        │  CBT Mock    │  Trends      │  Wallpaper
    └─ Target      └─ Audio         └─ Weakness    └─ All-India   └─ Settings &
       Countdown      Lectures         Detector       Leaderboard    Customizer
```

### Complete 28-Feature Inventory Matrix

| # | Feature Name | Previous Location | New Location | Priority & Exposure |
|---|---|---|---|---|
| 1 | Today's Study Target | Header/Top banner | **HOME** (Hero Card) | Primary Focus (above fold) |
| 2 | Continue Studying | Mid-scroll dashboard | **HOME** (Resume Row) | Secondary Focus |
| 3 | Daily Goals Checklist | `tasks` tab | **HOME** & **MORE** | 3 compact goals on Home |
| 4 | Contextual AI Pace | Giant promo card | **HOME** & **STUDY** | Subtle 1-line guidance |
| 5 | Exam Target Countdown | Dashboard stats | **HOME** (Footer Card) | Calm countdown pill |
| 6 | Interactive Syllabus | `syllabus` tab | **STUDY** (Primary) | Expandable 4-tier tree |
| 7 | Custom Syllabus / Topics | `syllabus` custom | **STUDY** (Tab toggle) | Official vs Personal tab |
| 8 | NCERT & Reference Notes | `library` tab | **STUDY** (Materials) | Linked to topic drawers |
| 9 | Active Recall Flashcards | `flashcards` tab | **STUDY** (Revision) | Spaced repetition decks |
| 10 | Audio Lecture Series | `podcasts` tab | **STUDY** (Revision) | Background audio player |
| 11 | Post-Topic PYQ Drill | Disconnected tab | **PRACTICE** (Top action) | Contextual 5-question test |
| 12 | Chapter Practice Engine | `question_bank` tab | **PRACTICE** (Modules) | 6,000+ categorized Qs |
| 13 | 35-Yr PYQ Archive | `pyq` tab | **PRACTICE** (Modules) | 1991–2026 filtered archive |
| 14 | All-India CBT Simulator | `cbt` / `cbt_exam` | **PRACTICE** (Full Test) | Timed exam simulator |
| 15 | Weakness Detector | `weakness` tab | **PRACTICE** & **PROGRESS** | Mistake notebook & drill |
| 16 | Telemetry Readiness Rings | Dashboard widget | **PROGRESS** (Hero Rings) | Multi-dimensional metrics |
| 17 | Syllabus Completion % | Multiple places | **PROGRESS** (Coverage) | Subject-wise progress bars |
| 18 | Study Time Velocity | Profile modal | **PROGRESS** (Hours chart) | Weekly & daily consistency |
| 19 | Test Accuracy Analytics | Scattered stats | **PROGRESS** (Accuracy) | Trend line by exam subject |
| 20 | All-India Leaderboard | `leaderboard` tab | **PROGRESS** (Rank tab) | Peer comparison & percentile |
| 21 | Pomodoro Focus Engine | `timer` tab | **MORE** (Study Tools) | 25/50m sprint timer |
| 22 | Study Buddy Match | `study_buddy` tab | **MORE** (Community) | Optional subject matching |
| 23 | Aspirant Discussion Rooms | `community` tab | **MORE** (Community) | Topic discussion boards |
| 24 | Reward Milestones & Coins | Header / `reward_milestones`| **MORE** (Rewards Center) | XP, coin ledger, redeem |
| 25 | Earn Premium & Referrals | Header / `earn_premium` | **MORE** (Rewards Center) | Referral link & perks |
| 26 | Daily Habit Wallpaper | `wallpaper` tab | **MORE** (Study Tools) | Lockscreen countdown generator|
| 27 | Eligibility Calculator | `eligibility` tab | **MORE** (Study Tools) | Age & attempt verification |
| 28 | Verified Teacher Portal | `teachers` / `blog_submit` | **MORE** (Educator) | Role-restricted faculty |

---

# PAGE 02 — USER FLOWS

### Flow 1: Morning Kickoff ("What do I do today?")
```
Open App
  └── Home Screen renders in < 100ms
        ├── Header: "AspirantX • UPSC CSE 2026" | Subtle Flame 🔥 14 | Profile Avatar
        ├── Hero: "TODAY'S TARGET: Constitutional Framework — Fundamental Rights"
        │         Duration: 45 min • 3 subtopics • High Yield
        │         └── [ Start Studying ] (Single Primary CTA)
        └── Tap [ Start Studying ]
              └── Direct Navigation to Study Tab → Topic Detail View
```

### Flow 2: Study-to-Practice Reinforcement Loop
```
In Study View:
  Read Topic: "Fundamental Rights (Art 14–18)"
    └── Check Subtopic Box [✓]
          ├── Tactile Micro-Pop (180ms)
          ├── +30 XP floats up and updates profile
          └── Bottom Sheet slides up naturally:
                "Great progress! Reinforce while it's fresh."
                [ Practice 5 PYQs on Fundamental Rights → ]
                  └── Tapping transitions into Practice Tab:
                        - 5 UPSC Prelims PYQs loaded
                        - Instant explanation after each question
                        - Scorecard displays: 4/5 Correct (+80 XP)
                        - Next Action: "Continue to Directive Principles →"
```

### Flow 3: CBT Simulation & Weakness Logging
```
Practice Tab → All-India Mock Test Simulator
  ├── Select Mock: "UPSC GS Paper-1 Full Simulator #4"
  ├── Bottom Sheet: 100 Questions • 120 Minutes • -0.66 Negative Marking
  ├── [ Begin Test ] → Fullscreen immersive NTA exam interface
  ├── Submit Test → Immediate Scorecard: 114.66 / 200 (94.2 Percentile)
  └── Automatic Weakness Tagging:
        "Modern History (1857 Revolt): 2 errors detected"
        └── [ Add to Revision Deck ] button saves directly to Study Tab
```

---

# PAGE 03 — WIREFRAME SPECIFICATIONS

### Grid & Layout Constants (Mobile 393 × 852 pt)
- **Margins**: Left 16pt, Right 16pt
- **Columns**: 4 columns (Fluid, 12pt gutters)
- **Vertical Rhythm**: 8pt base grid (8, 16, 24, 32, 40, 48, 64)
- **Top Safe Area**: 48pt
- **Bottom Nav Height**: 64pt + safe area (34pt) = 98pt total
- **Interactive Touch Targets**: Minimum 48 × 48 pt

### Wireframe Structure: Home Screen
```
+------------------------------------------+  0pt
| [AX] AspirantX   [UPSC ▾]   [🔍] [🔥14] [👤] |  Header (48pt)
+------------------------------------------+  56pt
| "Discipline is choosing between what you |  Quote (28pt)
|  want now and what you want most."       |
+------------------------------------------+  92pt
| +--------------------------------------+ |
| | TODAY'S STUDY PLAN        [HIGH YIELD]| |  Hero Card
| | Indian Polity & Governance           | |  Height: 180pt
| | Constitutional Framework             | |  Padding: 16pt
| | 3 Subtopics • 45 min estimated       | |
| |                                      | |
| | [      START STUDYING  ▶       ]    | |  Primary Button (48pt)
| +--------------------------------------+ |
+------------------------------------------+  284pt
| CONTINUE STUDYING                        |  Resume Row
| Preamble & Basic Structure • 12m left [▶]|  Height: 56pt
+------------------------------------------+  348pt
| TODAY'S GOALS                    2/4 Done|  Goals Section
| [✓] Polity: Preamble notes (20m)   +20 XP|  Row Height: 44pt
| [✓] Daily Editorial summary (15m)  +20 XP|
| [ ] 10 History PYQs Practice (15m)       |
+------------------------------------------+  500pt
| CONTEXTUAL RECOMMENDATION                |  AI Insight Card
| Based on 72% Polity accuracy, 5 revision |  Height: 88pt
| PYQs are recommended today. [Practice →] |
+------------------------------------------+  600pt
| 🎯 TARGET: UPSC PRELIMS 2026             |  Target Card
| 245 Days Remaining • Pace: On Track     |  Height: 64pt
+------------------------------------------+  672pt
|                                          |
| (Scroll margin for bottom navigation)    |
+------------------------------------------+  754pt
| [⌂ Home] [📖 Study] [🎯 Practice] [📊 Progress] [⋯ More]| Bottom Nav (64pt)
+------------------------------------------+  852pt
```

---

# PAGE 04 — DESIGN SYSTEM & TOKENS

### 1. Color Palette (Dark-First, Restrained, Non-Neon)

```json
{
  "color": {
    "background": {
      "base": "#080B11",
      "surface-1": "#0F1623",
      "surface-2": "#172132",
      "surface-3": "#202E45",
      "glass": "rgba(15, 22, 35, 0.85)"
    },
    "border": {
      "subtle": "#1B273A",
      "default": "#24344D",
      "active": "#0284C7"
    },
    "text": {
      "primary": "#F8FAFC",
      "secondary": "#94A3B8",
      "muted": "#64748B",
      "inverse": "#080B11"
    },
    "brand": {
      "primary": "#0284C7",
      "primary-hover": "#0369A1",
      "primary-light": "#38BDF8",
      "secondary": "#6366F1",
      "secondary-light": "#818CF8"
    },
    "semantic": {
      "success": "#10B981",
      "success-surface": "rgba(16, 185, 129, 0.12)",
      "warning": "#F59E0B",
      "warning-surface": "rgba(245, 158, 11, 0.12)",
      "error": "#EF4444",
      "error-surface": "rgba(239, 68, 68, 0.12)"
    }
  }
}
```

### 2. Typography Hierarchy (Inter / System Font)

| Token | Size | Line Height | Weight | Tracking | Purpose |
|---|---|---|---|---|---|
| `display-1` | 26px | 34px | Bold (700) | -0.02em | Hero headline / major stats |
| `heading-1` | 20px | 26px | SemiBold (600) | -0.015em | Screen titles |
| `heading-2` | 16px | 22px | SemiBold (600) | -0.01em | Section headers |
| `body-large` | 15px | 22px | Regular (400) | 0 | Long-form reading / notes |
| `body-default`| 14px | 20px | Regular (400) | 0 | Standard UI text & rows |
| `body-compact`| 13px | 18px | Medium (500) | +0.005em | List subtext & captions |
| `caption` | 11px | 15px | Medium (500) | +0.01em | Timestamps & counters |
| `eyebrow` | 10px | 14px | Bold (700) | +0.06em | Category pills & badges (UPPERCASE) |

### 3. Surface & Elevation Tokens
- **Surface 1 (Cards)**: Fill `#0F1623`, 1px border `#1B273A`, Radius 16pt, Shadow: `0 4px 16px rgba(0,0,0,0.3)`.
- **Surface 2 (Nested / Secondary Rows)**: Fill `#172132`, 1px border `#24344D`, Radius 12pt.
- **Glass Bottom Nav / Sheets**: Fill `rgba(8, 11, 17, 0.92)`, Backdrop Filter `blur(20px)`, Top border 1px `#1B273A`.

---

# PAGE 05 — MASTER COMPONENT SPECIFICATIONS

### Component 1: Global Decluttered Header
- **Frame**: 393 × 52 pt, Auto-layout Horizontal, Space Between, Padding [0, 16].
- **Left Group**:
  - Logo Icon: 28 × 28 pt rounded square (`AX` monogram in Sky 500 gradient).
  - Brand Name: `AspirantX` (15px / Bold / Slate 50).
  - Exam Badge: Rounded pill, Fill `#172132`, Border `#24344D`, text `UPSC ▾` (12px / Medium / Sky 400).
- **Right Group**:
  - Search Icon Button: 36 × 36 pt ghost tap target.
  - Streak Pill: `🔥 14` (12px / SemiBold / Amber 400), subtle `#24180A` background.
  - Profile Avatar: 32 × 32 pt circle with 1.5px border `#0284C7`.

### Component 2: 5-Pillar Bottom Navigation Bar
- **Frame**: 393 × 64 pt (+ safe area 34pt), Auto-layout Horizontal, 5 equal slots (78.6pt each).
- **Slots**:
  1. `Home` (Target icon, 20 × 20 pt)
  2. `Study` (BookOpen icon, 20 × 20 pt)
  3. `Practice` (Award icon, 20 × 20 pt)
  4. `Progress` (BarChart3 icon, 20 × 20 pt)
  5. `More` (Menu / Grid icon, 20 × 20 pt)
- **Active State**: Icon & label in `#38BDF8`, icon container has subtle `rgba(2, 132, 199, 0.18)` pill fill with `0 0 10px rgba(2, 132, 199, 0.25)` soft glow.
- **Inactive State**: Icon & label in `#64748B`.

### Component 3: Today's Primary Hero Card
- **Frame**: 361 × 184 pt, Auto-layout Vertical, Padding 18pt, Radius 18pt.
- **Background**: Deep gradient from `#0E1B2E` to `#0B1320`, 1px border `rgba(56, 189, 248, 0.25)`.
- **Top Bar**: Eyebrow `TODAY'S TARGET` (Sky 400) + Badge `HIGH YIELD` (Amber 400).
- **Title**: `Constitutional Framework` (18px / Bold).
- **Subtitle**: `3 Subtopics • 45 min estimated study time` (13px / Slate 400).
- **Action Button**: Primary Full-Width CTA, Height 46pt, Radius 12pt, Background `#0284C7`, text `START STUDYING ▶` (13px / Bold / White).

### Component 4: Topic Accordion Row
- **Frame**: 361 × Auto pt, Radius 14pt, Padding 14pt.
- **Closed State**: Checkbox circle (22pt) + Topic Title + Subject Tag + Subtopic counter `0/3` + Chevron right.
- **Expanded State**: Smooth animated drawer revealing subtopic list with checkboxes, estimated hours, and "Linked Notes" shortcut.

### Component 5: Telemetry Readiness Ring
- **Frame**: 168 × 168 pt, Radius 16pt, Fill `#0F1623`, Border `#1B273A`.
- **Center**: Dual SVG circle (background `#172132`, stroke fill `#0284C7`), animated number `74%`, label `Polity Mastery`.

---

# PAGES 06 TO 10 — SCREEN BLUEPRINTS

## Page 06: Home Screen ("What should I do today?")
1. **Header**: Clean, quiet global header.
2. **Daily Affirmation**: Single line quote in 12px muted italic.
3. **Hero Card**: Today's study target with `[Start Studying]` button.
4. **Resume Row**: Active chapter resume bar with residual time.
5. **Daily Goals (3 Items)**: Interactive micro-check items with floating `+20 XP` feedback.
6. **Contextual AI Nudge**: Subtle 2-line recommendation based on real user accuracy.
7. **Exam Milestone Footer**: Days remaining to Prelims 2026.

## Page 07: Study Experience ("What should I study now?")
1. **Study Roadmap Header**: Subject selector tabs (`All`, `Polity`, `History`, `Economy`, `Geography`, `CSAT`).
2. **Subject Progress Bar**: Overall syllabus coverage percentage.
3. **Hierarchical Syllabus Accordion**:
   - Subject → Section → Topic → Subtopics.
   - Each subtopic has checkbox, hour estimate, and weightage badge.
4. **Study Resource Drawer (Slide-up)**:
   - Linked NCERT summary PDFs.
   - Active recall flashcard deck.
   - Audio lecture podcast stream.

## Page 08: Practice Hub ("Test and reinforce what I learned")
1. **Contextual Practice Header**: "Finished Fundamental Rights? Take 5 diagnostic PYQs."
2. **Core Practice Grid (2 × 2)**:
   - **PYQ Archive (1991–2026)**: Filter by year, subject, paper.
   - **Topic Practice Engine**: 6,000+ questions drill by difficulty.
   - **All-India CBT Simulator**: Timed full mock tests with live percentiles.
   - **Weakness Re-tester**: Automatically logged mistake review.
3. **Recent Test History**: Scorecards, accuracy ratios, and review buttons.

## Page 09: Progress & Analytics ("How am I performing?")
1. **Readiness Telemetry Gauges**: 3 circular rings:
   - Syllabus Coverage (Target: 100%)
   - Practice Accuracy (Target: > 75%)
   - Consistency / Hours (Target: 8h / day)
2. **Subject Accuracy Matrix**: Horizontal bars comparing Polity (78%), History (62%), Economy (84%).
3. **Study Time Velocity Chart**: Bar chart showing Monday to Sunday hours studied.
4. **All-India Leaderboard Tab**: National ranking, percentile, and peer comparisons.

## Page 10: More & Tools ("Productivity, Community & Settings")
1. **User Profile Card**: Avatar, Level 2, total study hours, edit target button.
2. **Study Productivity Tools**:
   - Pomodoro Focus Engine (25/50m sprint).
   - Lockscreen Countdown Wallpaper Generator.
   - Eligibility & Attempt Counter.
3. **Peer Community & Discussions**:
   - Study Buddy Match.
   - UPSC Peer Discussion Rooms.
4. **Rewards & Milestones Hub**:
   - XP progress bar to Next Level.
   - Coin Balance & Redeem Store.
   - Referral Program.
5. **App Settings & Preferences**:
   - Dark Theme Customizer.
   - Notification & Study Nudge Reminders.
   - Feedback & Support.

---

# PAGE 11 — SECONDARY SCREENS & BOTTOM SHEETS

1. **Exam Switcher Bottom Sheet**:
   - Smooth slide-up sheet with available exams: UPSC CSE (Civil Services), SSC CGL, SSC CHSL, State PSC.
2. **Topic Detail & Notes Bottom Sheet**:
   - Subtopic checklist, linked NCERT extracts, key articles/cases, and "Test Yourself" action.
3. **Subtopic Completion Celebration Modal**:
   - Proportional celebration: smooth check animation, XP counter increment (`+30 XP`), and immediate next action button.
4. **CBT Scorecard Bottom Sheet**:
   - Marks scored, negative marks deducted, time spent per question, and weak area tags.

---

# PAGE 12 — PROTOTYPE & INTERACTION SYSTEM

### Interaction Graph & Micro-Physics
- **Micro-Tap Feedback**: Scale `0.97` on press over `120ms`, spring back over `150ms`.
- **Tab Switching**: Cross-fade with 4px lateral translate, `duration: 250ms`, `easing: [0.22, 1, 0.36, 1]`.
- **Accordion Dropdown**: Smooth height animation with `240ms` duration and 180-degree chevron rotation.
- **Floating Reward Badge**: Ephemeral pill floats up `18pt` and fades over `650ms`.
- **Bottom Sheet Entry**: Upward slide from `y: 100%` with backdrop blur transition over `300ms`.
