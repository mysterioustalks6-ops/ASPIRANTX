import 'dotenv/config';
import crypto from 'crypto';

const token = process.env.PENPOT_ACCESS_TOKEN || 'eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2R0NNIn0.d7r9MGfg50_apC9udh8tfWEYqbLlAa2MWoAnZ9CCjqJRbs8-QevyPg.w20YXFxSEQzD4F1O.vF2whyAqtCAEmE9B7lNxoVPD_RG4D6XsfRAOz9CWxF3VFfVHEdlJpJPYMR3dUfaDpglGh3qj6TtI1xDxm2ub8XnIafOf23tYvuKGSnFbewIfua8TTZS6AZzQRjlJ1eMeZeqzaBlN2cZVArxHMtC6mLEC-_1jW_MrYt4fwWHQSCMqxQ9xfjRW4vTS06S0Zls7y_TIroIfAMrE.zUnJIHXzySDvBODjIm6i-g';
const fileId = '19c47d73-0a5d-8067-8008-ba88041e0635';

interface ShapeDef {
  name: string;
  type?: 'rect' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  fillOpacity?: number;
  r1?: number;
  r2?: number;
  r3?: number;
  r4?: number;
  strokes?: any[];
}

function makeShape(s: ShapeDef, parentId: string, frameId: string) {
  const id = crypto.randomUUID();
  const radius = s.r1 || 0;
  return {
    id,
    name: s.name,
    type: s.type || 'rect',
    x: s.x,
    y: s.y,
    width: s.width,
    height: s.height,
    rotation: 0,
    parentId,
    frameId,
    r1: radius,
    r2: radius,
    r3: radius,
    r4: radius,
    selrect: {
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      x1: s.x,
      y1: s.y,
      x2: s.x + s.width,
      y2: s.y + s.height
    },
    points: [
      { x: s.x, y: s.y },
      { x: s.x + s.width, y: s.y },
      { x: s.x + s.width, y: s.y + s.height },
      { x: s.x, y: s.y + s.height }
    ],
    transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    'transform-inverse': { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    fills: [
      {
        'fill-color': s.fillColor,
        'fill-opacity': s.fillOpacity ?? 1
      }
    ],
    strokes: s.strokes || []
  };
}

async function populateAll22Pages() {
  console.log('🎨 Connecting to Penpot file:', fileId);
  const fileRes = await fetch('https://design.penpot.app/api/rpc/command/get-file', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Token ${token}`
    },
    body: JSON.stringify({ id: fileId })
  });

  const fileData = await fileRes.json();
  let currentRevn = fileData.revn;
  const pagesIndex = fileData.data?.pagesIndex || {};
  const pagesList = Object.values(pagesIndex) as any[];

  console.log(`Loaded file: "${fileData.name}", Current revn: ${currentRevn}, Total pages: ${pagesList.length}`);

  const pageMap: Record<string, string> = {};
  pagesList.forEach(p => {
    pageMap[p.name] = p.id;
  });

  const rootId = '00000000-0000-0000-0000-000000000000';

  // Helper to commit elements to a given page
  async function commitToPage(pageName: string, elements: ShapeDef[]) {
    const pageId = pageMap[pageName];
    if (!pageId) {
      console.warn(`⚠️ Page "${pageName}" not found in pageMap`);
      return;
    }

    console.log(`\n📦 Committing ${elements.length} components to "${pageName}" (${pageId})...`);

    const changes = elements.map(el => ({
      type: 'add-obj',
      id: crypto.randomUUID(),
      'page-id': pageId,
      'parent-id': rootId,
      'frame-id': rootId,
      obj: makeShape(el, rootId, rootId)
    }));

    const batchSize = 15;
    for (let i = 0; i < changes.length; i += batchSize) {
      const chunk = changes.slice(i, i + batchSize);
      const updateRes = await fetch('https://design.penpot.app/api/rpc/command/update-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          id: fileId,
          'session-id': crypto.randomUUID(),
          revn: currentRevn,
          vern: fileData.vern,
          changes: chunk
        })
      });

      if (updateRes.ok) {
        const resJson = await updateRes.json();
        currentRevn = resJson.revn;
      } else {
        console.error(`  ✗ Error committing batch to ${pageName}:`, await updateRes.text());
      }
    }
    console.log(`  ✓ Successfully committed "${pageName}" (Current revn: ${currentRevn})`);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 01: UX Audit
  // ══════════════════════════════════════════════════════════════════════════════
  const p01: ShapeDef[] = [
    { name: 'Canvas: Mobile Device Matrix (320px to 430px)', x: 60, y: 60, width: 1400, height: 750, fillColor: '#070B14', r1: 24, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] },
    { name: 'Viewport Card: 320px (iPhone SE / Small Phone)', x: 100, y: 120, width: 320, height: 600, fillColor: '#0C121E', r1: 20, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 2 }] },
    { name: 'Viewport Card: 390px (Standard Modern Phone)', x: 460, y: 120, width: 390, height: 600, fillColor: '#0C121E', r1: 24, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2 }] },
    { name: 'Viewport Card: 412px (Android Vivo / Pixel)', x: 890, y: 120, width: 412, height: 600, fillColor: '#0C121E', r1: 24, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 2 }] },
    { name: 'Audit Finding: Safe Area & Gesture Bar Clearance', x: 100, y: 160, width: 280, height: 90, fillColor: '#131D2E', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Audit Finding: Min 48px Touch Targets Enforced', x: 100, y: 270, width: 280, height: 90, fillColor: '#131D2E', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Audit Finding: One-Hand Thumb Reach Zone', x: 480, y: 160, width: 350, height: 180, fillColor: '#131D2E', r1: 16, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Audit Finding: Zero Desktop Regression Baseline', x: 910, y: 160, width: 370, height: 180, fillColor: '#131D2E', r1: 16, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] }
  ];
  await commitToPage('01 UX Audit', p01);

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 04: Design Tokens
  // ══════════════════════════════════════════════════════════════════════════════
  const p04: ShapeDef[] = [
    { name: 'Canvas: Design Tokens Palette & Typography', x: 60, y: 60, width: 1400, height: 750, fillColor: '#080C14', r1: 24, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] },
    // Swatch 1: Primary Brand Sky
    { name: 'Token: Primary Sky 600 (#0284C7)', x: 100, y: 120, width: 180, height: 80, fillColor: '#0284C7', r1: 14 },
    { name: 'Token: Primary Sky 400 (#38BDF8)', x: 300, y: 120, width: 180, height: 80, fillColor: '#38BDF8', r1: 14 },
    // Swatch 2: Backgrounds
    { name: 'Token: BG Slate 950 (#070B14)', x: 500, y: 120, width: 180, height: 80, fillColor: '#070B14', r1: 14, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    { name: 'Token: Surface Slate 900 (#0F172A)', x: 700, y: 120, width: 180, height: 80, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    // Swatch 3: Status Colors
    { name: 'Token: Success Emerald 500 (#10B981)', x: 900, y: 120, width: 180, height: 80, fillColor: '#10B981', r1: 14 },
    { name: 'Token: Danger Rose 500 (#F43F5E)', x: 1100, y: 120, width: 180, height: 80, fillColor: '#F43F5E', r1: 14 },
    // Typography Scale Cards
    { name: 'Token Typography: Display 24px (Bold 800)', x: 100, y: 230, width: 380, height: 100, fillColor: '#111827', r1: 14, strokes: [{ 'stroke-color': '#1F2937', 'stroke-width': 1 }] },
    { name: 'Token Typography: Body 14px (Regular 400 / 22px leading)', x: 500, y: 230, width: 380, height: 100, fillColor: '#111827', r1: 14, strokes: [{ 'stroke-color': '#1F2937', 'stroke-width': 1 }] },
    { name: 'Token Typography: Micro Caption 10px (Semibold 600)', x: 900, y: 230, width: 380, height: 100, fillColor: '#111827', r1: 14, strokes: [{ 'stroke-color': '#1F2937', 'stroke-width': 1 }] },
    // Control Dimensions Spec Cards
    { name: 'Token: Touch Control Height 48px min', x: 100, y: 360, width: 580, height: 60, fillColor: '#1E293B', r1: 12 },
    { name: 'Token: Bottom Navigation Height 64px + pb-safe', x: 700, y: 360, width: 580, height: 60, fillColor: '#1E293B', r1: 12 }
  ];
  await commitToPage('04 Design Tokens', p04);

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 05: Components
  // ══════════════════════════════════════════════════════════════════════════════
  const p05: ShapeDef[] = [
    { name: 'Canvas: Mobile Component Library', x: 60, y: 60, width: 1400, height: 800, fillColor: '#080C14', r1: 24, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] },
    // Primary Button
    { name: 'Component: Primary Button (48px Touch Target)', x: 100, y: 120, width: 300, height: 48, fillColor: '#0284C7', r1: 12 },
    // Success Button
    { name: 'Component: Success Button (Save & Next)', x: 420, y: 120, width: 300, height: 48, fillColor: '#10B981', r1: 12 },
    // Review Button
    { name: 'Component: Review Button (Purple Accent)', x: 740, y: 120, width: 300, height: 48, fillColor: '#A855F7', r1: 12 },
    // MCQ Option Card - Default
    { name: 'Component: Option Card Default (White/Slate 800)', x: 100, y: 200, width: 380, height: 56, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    // MCQ Option Card - Selected
    { name: 'Component: Option Card Selected (Sky Ring)', x: 100, y: 270, width: 380, height: 56, fillColor: '#0369A1', fillOpacity: 0.25, r1: 14, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2 }] },
    // Numerical Keypad Component
    { name: 'Component: Numerical Keypad Frame (3x4 Grid)', x: 520, y: 200, width: 280, height: 260, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    // Question Palette Legend Indicators
    { name: 'Legend: Answered (Green Circle)', x: 840, y: 200, width: 36, height: 36, type: 'circle', fillColor: '#10B981' },
    { name: 'Legend: Not Answered (Red Circle)', x: 890, y: 200, width: 36, height: 36, type: 'circle', fillColor: '#F43F5E' },
    { name: 'Legend: Marked for Review (Purple Circle)', x: 940, y: 200, width: 36, height: 36, type: 'circle', fillColor: '#A855F7' },
    { name: 'Legend: Answered & Marked (Purple-Green Circle)', x: 990, y: 200, width: 36, height: 36, type: 'circle', fillColor: '#7C3AED' }
  ];
  await commitToPage('05 Components', p05);

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 08: Home (Mobile Dashboard)
  // ══════════════════════════════════════════════════════════════════════════════
  const p08: ShapeDef[] = [
    { name: 'Artboard: Mobile Home Dashboard (390 x 844)', x: 100, y: 60, width: 390, height: 844, fillColor: '#070A11', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    // Header
    { name: 'Home: Top Bar (Logo + Goal Pill + Avatar)', x: 120, y: 90, width: 350, height: 50, fillColor: '#0E1422', r1: 14, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    // Target Exam Banner
    { name: 'Home: Target Exam Banner (JEE Main / UPSC)', x: 120, y: 155, width: 350, height: 110, fillColor: '#0284C7', fillOpacity: 0.15, r1: 20, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },
    // Daily Streak Card
    { name: 'Home: Daily Streak & Gamification Counter', x: 120, y: 280, width: 350, height: 75, fillColor: '#0E1422', r1: 16, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    // Quick Actions 3-Pod Row
    { name: 'Home Action: CBT Mock Test Pod', x: 120, y: 370, width: 105, height: 100, fillColor: '#0E1422', r1: 18, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1 }] },
    { name: 'Home Action: 35Y PYQ Archive Pod', x: 242, y: 370, width: 105, height: 100, fillColor: '#0E1422', r1: 18, strokes: [{ 'stroke-color': '#6366F1', 'stroke-width': 1 }] },
    { name: 'Home Action: Focus Galaxy 3D Pod', x: 365, y: 370, width: 105, height: 100, fillColor: '#0E1422', r1: 18, strokes: [{ 'stroke-color': '#A855F7', 'stroke-width': 1 }] },
    // Readiness Radar Card
    { name: 'Home: Readiness & Syllabus Progress Card', x: 120, y: 485, width: 350, height: 230, fillColor: '#0E1422', r1: 20, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    // Sticky Bottom Navigation
    { name: 'Home: Glass Bottom Navigation (5 Tabs)', x: 100, y: 775, width: 390, height: 69, fillColor: '#06080D', fillOpacity: 0.95, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] }
  ];
  await commitToPage('08 Home', p08);

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 13: CBT (Mobile Universal Exam Engine)
  // ══════════════════════════════════════════════════════════════════════════════
  const p13: ShapeDef[] = [
    { name: 'Artboard: Mobile CBT Exam Engine (390 x 844)', x: 100, y: 60, width: 390, height: 844, fillColor: '#070B14', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    // Top Exam Header with Timer & Submit
    { name: 'CBT Top: Exam Header & Countdown Timer', x: 100, y: 60, width: 390, height: 62, fillColor: '#0B111D', strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    { name: 'CBT Timer: Live Countdown Pill (02:45:12)', x: 230, y: 75, width: 105, height: 32, fillColor: '#064E3B', r1: 8, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },
    { name: 'CBT Header Action: Submit Button', x: 345, y: 75, width: 36, height: 32, fillColor: '#059669', r1: 8 },
    // Section Switcher Strip
    { name: 'CBT Section: Section Tabs (Phy / Chem / Math)', x: 100, y: 122, width: 390, height: 42, fillColor: '#0E1524', strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    // Question Meta Bar (Bilingual Switcher + Marks)
    { name: 'CBT Meta: Question # + Bilingual [En|Hi] + Marks (+4/-1)', x: 100, y: 164, width: 390, height: 44, fillColor: '#080C14', strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    // Question Statement Box
    { name: 'CBT Question: Bilingual Statement & Context', x: 120, y: 220, width: 350, height: 160, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    // 4 MCQ Option Cards
    { name: 'CBT Option A: Touch Target (Min 48px)', x: 120, y: 395, width: 350, height: 54, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'CBT Option B: Selected State (Sky Accent)', x: 120, y: 460, width: 350, height: 54, fillColor: '#0284C7', fillOpacity: 0.2, r1: 14, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2 }] },
    { name: 'CBT Option C: Touch Target (Min 48px)', x: 120, y: 525, width: 350, height: 54, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'CBT Option D: Touch Target (Min 48px)', x: 120, y: 590, width: 350, height: 54, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    // Mobile Bottom Actions Bar (Safe-Area Aware)
    { name: 'CBT Bottom: Action Bar (Review | Clear | Prev | Save&Next)', x: 100, y: 760, width: 390, height: 84, fillColor: '#0A0F1A', strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] },
    { name: 'CBT Action: Review Button', x: 110, y: 775, width: 75, height: 42, fillColor: '#581C87', r1: 10 },
    { name: 'CBT Action: Clear Button', x: 190, y: 775, width: 65, height: 42, fillColor: '#1E293B', r1: 10 },
    { name: 'CBT Action: Save & Next (Primary CTA)', x: 260, y: 775, width: 120, height: 42, fillColor: '#0284C7', r1: 10 }
  ];
  await commitToPage('13 CBT', p13);

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 14: Results (Mobile Performance Scorecard)
  // ══════════════════════════════════════════════════════════════════════════════
  const p14: ShapeDef[] = [
    { name: 'Artboard: Mobile Results & Analysis (390 x 844)', x: 100, y: 60, width: 390, height: 844, fillColor: '#070B14', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    // Score Summary Hero Card
    { name: 'Results: Score Hero Card (Score / AIR Rank / Accuracy)', x: 120, y: 100, width: 350, height: 160, fillColor: '#0F172A', r1: 20, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },
    // Section Breakdown Bars
    { name: 'Results: Section Breakdown (Phy 85%, Chem 92%, Math 74%)', x: 120, y: 275, width: 350, height: 140, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    // Mistake Classifier & Revision Plan
    { name: 'Results: Error Classification Tagger Card', x: 120, y: 430, width: 350, height: 120, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    // AI Mentor Doubt Clarification Drawer Entry
    { name: 'Results: AI Mentor Discussion Drawer', x: 120, y: 565, width: 350, height: 110, fillColor: '#581C87', fillOpacity: 0.2, r1: 16, strokes: [{ 'stroke-color': '#A855F7', 'stroke-width': 1 }] },
    // Reattempt CTA Row
    { name: 'Results CTA: Reattempt Test Button', x: 120, y: 690, width: 170, height: 48, fillColor: '#0284C7', r1: 12 },
    { name: 'Results CTA: Practice Weak Topics Button', x: 300, y: 690, width: 170, height: 48, fillColor: '#10B981', r1: 12 }
  ];
  await commitToPage('14 Results', p14);

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 18: Admin (Mobile Executive Console)
  // ══════════════════════════════════════════════════════════════════════════════
  const p18: ShapeDef[] = [
    { name: 'Artboard: Mobile Executive Admin Console (390 x 844)', x: 100, y: 60, width: 390, height: 844, fillColor: '#070A11', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    // Header & Role Badge
    { name: 'Admin Header: Executive Console + Refresh', x: 120, y: 90, width: 350, height: 60, fillColor: '#0E1422', r1: 16, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    // Metrics 3-Stat Counter
    { name: 'Admin Stat: Total Verified Questions (48,866)', x: 120, y: 165, width: 110, height: 80, fillColor: '#0E1422', r1: 14, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Admin Stat: Active Mock Tests (125)', x: 240, y: 165, width: 110, height: 80, fillColor: '#0E1422', r1: 14, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },
    { name: 'Admin Stat: Pending Question Reviews (0)', x: 360, y: 165, width: 110, height: 80, fillColor: '#0E1422', r1: 14, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1 }] },
    // Categorized Tab Pills Strip
    { name: 'Admin Tabs: Content / CBT / Users / Finance / Logs', x: 120, y: 260, width: 350, height: 42, fillColor: '#0E1422', r1: 10, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    // Mobile Question Card 1
    { name: 'Admin Card: Question Review Card (JEE Main / Physics)', x: 120, y: 315, width: 350, height: 180, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    // Mobile Question Card 2
    { name: 'Admin Card: Question Review Card (UPSC CSE / Polity)', x: 120, y: 510, width: 350, height: 180, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    // Bottom Sticky Admin Action Sheet
    { name: 'Admin Action: Bottom Quick Action Sheet (Approve / Reject)', x: 100, y: 770, width: 390, height: 74, fillColor: '#0B111D', strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] }
  ];
  await commitToPage('18 Admin', p18);

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 21: Final UX Review (High-Fidelity Mobile Showcase)
  // ══════════════════════════════════════════════════════════════════════════════
  const p21: ShapeDef[] = [
    { name: 'Showcase Frame: All 5 Primary Mobile Screens', x: 60, y: 60, width: 1980, height: 950, fillColor: '#05070D', r1: 28, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    // Screen 1: Home Dashboard
    { name: 'Review: 01 Home Dashboard Viewport', x: 100, y: 110, width: 360, height: 780, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 2 }] },
    // Screen 2: Exam Discovery & Catalog
    { name: 'Review: 02 Exam Discovery Viewport', x: 480, y: 110, width: 360, height: 780, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2 }] },
    // Screen 3: Universal CBT Exam Engine
    { name: 'Review: 03 CBT Exam Engine Viewport', x: 860, y: 110, width: 360, height: 780, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 2 }] },
    // Screen 4: Results & AI Mentor
    { name: 'Review: 04 Results & Scorecard Viewport', x: 1240, y: 110, width: 360, height: 780, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#A855F7', 'stroke-width': 2 }] },
    // Screen 5: Mobile Executive Admin
    { name: 'Review: 05 Mobile Executive Admin Viewport', x: 1620, y: 110, width: 360, height: 780, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 2 }] }
  ];
  await commitToPage('21 Final UX Review', p21);

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 22: Handoff
  // ══════════════════════════════════════════════════════════════════════════════
  const p22: ShapeDef[] = [
    { name: 'Canvas: Handoff Specifications & Breakpoint Rules', x: 60, y: 60, width: 1400, height: 750, fillColor: '#070B14', r1: 24, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] },
    { name: 'Handoff Spec: CSS Token Variable Mapping Table', x: 100, y: 120, width: 580, height: 260, fillColor: '#0F172A', r1: 18, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    { name: 'Handoff Spec: Safe Area Insets & Android System Bars', x: 720, y: 120, width: 580, height: 260, fillColor: '#0F172A', r1: 18, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    { name: 'Handoff Spec: Android APK Capacitor Sync Matrix', x: 100, y: 410, width: 580, height: 260, fillColor: '#0F172A', r1: 18, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    { name: 'Handoff Spec: Performance Budgets & 60 FPS Canvas', x: 720, y: 410, width: 580, height: 260, fillColor: '#0F172A', r1: 18, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] }
  ];
  await commitToPage('22 Handoff', p22);

  console.log('\n🎉 ALL MASTER PENPOT MOBILE PAGES & ARTBOARDS SUCCESSFULLY POPULATED!');
  console.log(`🔗 Project: "CBT Mobile Experience"`);
  console.log(`📄 File ID: ${fileId}`);
}

populateAll22Pages().catch(err => {
  console.error('Error populating Penpot pages:', err);
  process.exit(1);
});
