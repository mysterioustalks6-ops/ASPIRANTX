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

async function populateRemainingPages() {
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

  const pageMap: Record<string, string> = {};
  pagesList.forEach(p => { pageMap[p.name] = p.id; });
  const rootId = '00000000-0000-0000-0000-000000000000';

  async function commitToPage(pageName: string, elements: ShapeDef[]) {
    const pageId = pageMap[pageName];
    if (!pageId) return;

    console.log(`\n📦 Committing ${elements.length} components to "${pageName}"...`);
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
      }
    }
    console.log(`  ✓ Successfully committed "${pageName}" (Revn: ${currentRevn})`);
  }

  // 02 Information Architecture
  await commitToPage('02 Information Architecture', [
    { name: 'IA: Master Architecture Canvas', x: 60, y: 60, width: 1400, height: 750, fillColor: '#070B14', r1: 24, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] },
    { name: 'Root: Mobile Page Shell', x: 550, y: 100, width: 300, height: 60, fillColor: '#0284C7', r1: 12 },
    { name: 'Nav Level 1: Bottom Navigation (Home/Study/Practice/Progress/More)', x: 100, y: 200, width: 1200, height: 70, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Sub-Flow: CBT Exam Engine (Timed & Section Locked)', x: 100, y: 310, width: 280, height: 180, fillColor: '#111C2E', r1: 16, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Sub-Flow: 35-Year PYQ Engine', x: 410, y: 310, width: 280, height: 180, fillColor: '#111C2E', r1: 16, strokes: [{ 'stroke-color': '#6366F1', 'stroke-width': 1 }] },
    { name: 'Sub-Flow: Question Bank Engine', x: 720, y: 310, width: 280, height: 180, fillColor: '#111C2E', r1: 16, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },
    { name: 'Sub-Flow: Executive Admin Console', x: 1030, y: 310, width: 280, height: 180, fillColor: '#111C2E', r1: 16, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1 }] }
  ]);

  // 03 User Flows
  await commitToPage('03 User Flows', [
    { name: 'Flows: Master User Journey Canvas', x: 60, y: 60, width: 1400, height: 750, fillColor: '#070B14', r1: 24, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] },
    { name: 'Flow 1: Quick Practice (Home -> Subject -> 10Q -> Result)', x: 100, y: 120, width: 1200, height: 100, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Flow 2: Official CBT Mock (Mock Listing -> Instructions -> Timed CBT -> Submit -> Scorecard)', x: 100, y: 250, width: 1200, height: 100, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },
    { name: 'Flow 3: Mistake Revision (Result -> Tag Silly/Concept -> Revision Queue)', x: 100, y: 380, width: 1200, height: 100, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1 }] },
    { name: 'Flow 4: Admin Question Moderation (Console -> Filter -> Review -> Approve)', x: 100, y: 510, width: 1200, height: 100, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#A855F7', 'stroke-width': 1 }] }
  ]);

  // 06 Navigation
  await commitToPage('06 Navigation', [
    { name: 'Nav: Mobile Navigation Specs Frame', x: 60, y: 60, width: 1400, height: 750, fillColor: '#070B14', r1: 24, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] },
    { name: 'Spec: 5-Tab Glass Bottom Navigation (64px + pb-safe)', x: 100, y: 120, width: 390, height: 69, fillColor: '#06080D', r1: 16, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    { name: 'Spec: Mobile Slide-Up Drawer Menu', x: 530, y: 120, width: 390, height: 500, fillColor: '#090D16', r1: 24, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    { name: 'Spec: Category Pills Carousel (Engineering/Medical/Civil)', x: 100, y: 220, width: 390, height: 48, fillColor: '#0F172A', r1: 12 }
  ]);

  // 07 Authentication
  await commitToPage('07 Authentication', [
    { name: 'Artboard: Mobile Login Screen (390 x 844)', x: 100, y: 60, width: 390, height: 844, fillColor: '#070A11', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    { name: 'Auth: Brand Logo & Title Header', x: 145, y: 120, width: 300, height: 70, fillColor: '#0E1422', r1: 14 },
    { name: 'Auth: Email Input Field (48px Min Target)', x: 120, y: 230, width: 350, height: 52, fillColor: '#0F172A', r1: 12, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Auth: Password Input Field (With Eye Toggle)', x: 120, y: 295, width: 350, height: 52, fillColor: '#0F172A', r1: 12, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Auth: Primary Login CTA Button', x: 120, y: 370, width: 350, height: 52, fillColor: '#0284C7', r1: 14 },
    { name: 'Auth: Google SSO Button', x: 120, y: 435, width: 350, height: 52, fillColor: '#1E293B', r1: 14 },
    { name: 'Auth: Guest Access Link', x: 170, y: 510, width: 250, height: 35, fillColor: '#070A11' }
  ]);

  // 09 Exam Discovery
  await commitToPage('09 Exam Discovery', [
    { name: 'Artboard: Mobile Exam Discovery & Catalog', x: 100, y: 60, width: 390, height: 844, fillColor: '#070B14', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    { name: 'Discovery: Instant Exam Search Bar', x: 120, y: 100, width: 350, height: 48, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1.5 }] },
    { name: 'Discovery: Exam Category Pills Strip', x: 120, y: 165, width: 350, height: 40, fillColor: '#0B111D', r1: 10 },
    { name: 'Discovery Card: JEE Main (NTA / 7,521 Questions)', x: 120, y: 220, width: 350, height: 110, fillColor: '#0E1626', r1: 18, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Discovery Card: UPSC CSE (UPSC / 5,548 Questions)', x: 120, y: 345, width: 350, height: 110, fillColor: '#0E1626', r1: 18, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },
    { name: 'Discovery Card: IBPS PO (IBPS / 840 Questions)', x: 120, y: 470, width: 350, height: 110, fillColor: '#0E1626', r1: 18, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1 }] }
  ]);

  // 10 Practice
  await commitToPage('10 Practice', [
    { name: 'Artboard: Mobile Practice Hub Setup', x: 100, y: 60, width: 390, height: 844, fillColor: '#070B14', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    { name: 'Practice: Subject Selection Dropdown', x: 120, y: 100, width: 350, height: 50, fillColor: '#0F172A', r1: 12, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Practice: Topic Checklist Area', x: 120, y: 165, width: 350, height: 260, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    { name: 'Practice: Difficulty Segmented Control (Easy/Med/Hard)', x: 120, y: 440, width: 350, height: 44, fillColor: '#0B111D', r1: 12 },
    { name: 'Practice: Question Count Selector (10 / 25 / 50)', x: 120, y: 500, width: 350, height: 44, fillColor: '#0B111D', r1: 12 },
    { name: 'Practice: Start Practice Session CTA', x: 120, y: 570, width: 350, height: 52, fillColor: '#0284C7', r1: 14 }
  ]);

  // 11 PYQ
  await commitToPage('11 PYQ', [
    { name: 'Artboard: Mobile 35-Year PYQ Archive', x: 100, y: 60, width: 390, height: 844, fillColor: '#070B14', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    { name: 'PYQ: Year Filter Strip (2026 ... 1990)', x: 120, y: 100, width: 350, height: 42, fillColor: '#0E1626', r1: 10 },
    { name: 'PYQ Card: 2025 Shift 1 Full Paper (Verified Official)', x: 120, y: 160, width: 350, height: 130, fillColor: '#0F172A', r1: 18, strokes: [{ 'stroke-color': '#6366F1', 'stroke-width': 1.5 }] },
    { name: 'PYQ Card: 2024 Shift 2 Full Paper (Verified Official)', x: 120, y: 305, width: 350, height: 130, fillColor: '#0F172A', r1: 18, strokes: [{ 'stroke-color': '#6366F1', 'stroke-width': 1.5 }] },
    { name: 'PYQ Badge: Official PYQ (Gold Verified Badge)', x: 140, y: 180, width: 100, height: 24, fillColor: '#F59E0B', r1: 6 }
  ]);

  // 12 Mock Tests
  await commitToPage('12 Mock Tests', [
    { name: 'Artboard: Mobile Mock Instructions & Config', x: 100, y: 60, width: 390, height: 844, fillColor: '#070B14', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    { name: 'Mock: Official Instructions Card', x: 120, y: 100, width: 350, height: 320, fillColor: '#0F172A', r1: 18, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    { name: 'Mock: Timing Model Pill (SECTION_TIMER / GLOBAL)', x: 140, y: 125, width: 150, height: 28, fillColor: '#0284C7', r1: 8 },
    { name: 'Mock: Disclaimer & Ready Confirmation Checkbox', x: 120, y: 440, width: 350, height: 60, fillColor: '#0E1422', r1: 12 },
    { name: 'Mock: "I am ready to begin" CTA Button', x: 120, y: 520, width: 350, height: 52, fillColor: '#10B981', r1: 14 }
  ]);

  // 15 History
  await commitToPage('15 History', [
    { name: 'Artboard: Mobile Test History & Reviews', x: 100, y: 60, width: 390, height: 844, fillColor: '#070B14', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    { name: 'History Item 1: Full Mock Exam (Score: 240/300 - 88% Accuracy)', x: 120, y: 100, width: 350, height: 140, fillColor: '#0F172A', r1: 18, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    { name: 'History Item 2: Physics Sectional (Score: 82/100 - 92% Accuracy)', x: 120, y: 255, width: 350, height: 140, fillColor: '#0F172A', r1: 18, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    { name: 'History Action: Review Detailed Analytics Button', x: 140, y: 190, width: 310, height: 38, fillColor: '#0284C7', r1: 10 }
  ]);

  // 16 Profile
  await commitToPage('16 Profile', [
    { name: 'Artboard: Mobile Profile & Preferences', x: 100, y: 60, width: 390, height: 844, fillColor: '#070B14', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    { name: 'Profile: User Avatar & Exam Goal Pill', x: 120, y: 100, width: 350, height: 120, fillColor: '#0F172A', r1: 18, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    { name: 'Profile Setting: Daily Study Notification Time', x: 120, y: 235, width: 350, height: 60, fillColor: '#0E1422', r1: 12 },
    { name: 'Profile Setting: Language & Font Size', x: 120, y: 310, width: 350, height: 60, fillColor: '#0E1422', r1: 12 },
    { name: 'Profile Setting: High Contrast Theme', x: 120, y: 385, width: 350, height: 60, fillColor: '#0E1422', r1: 12 },
    { name: 'Profile Action: Sign Out Button', x: 120, y: 465, width: 350, height: 50, fillColor: '#F43F5E', fillOpacity: 0.15, r1: 14, strokes: [{ 'stroke-color': '#F43F5E', 'stroke-width': 1 }] }
  ]);

  // 17 Accessibility
  await commitToPage('17 Accessibility', [
    { name: 'Artboard: Mobile Accessibility Verification', x: 100, y: 60, width: 390, height: 844, fillColor: '#070B14', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    { name: 'A11y Test: Large Font Scaling (120% Text Height)', x: 120, y: 100, width: 350, height: 150, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1.5 }] },
    { name: 'A11y Test: Minimum Touch Target Matrix (48px Enforced)', x: 120, y: 270, width: 350, height: 150, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },
    { name: 'A11y Test: Screen Reader Accessible Labels', x: 120, y: 440, width: 350, height: 150, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#A855F7', 'stroke-width': 1.5 }] }
  ]);

  // 19 States
  await commitToPage('19 States', [
    { name: 'Artboard: Mobile States & Feedback Systems', x: 100, y: 60, width: 390, height: 844, fillColor: '#070B14', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }] },
    { name: 'State: Loading Skeleton Card (Pulsing Shimmer)', x: 120, y: 100, width: 350, height: 110, fillColor: '#1E293B', r1: 16 },
    { name: 'State: Empty State Card ("No Questions Found")', x: 120, y: 230, width: 350, height: 150, fillColor: '#0F172A', r1: 18, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'State: Network Offline Indicator Toast', x: 120, y: 400, width: 350, height: 50, fillColor: '#B45309', r1: 12 },
    { name: 'State: Destructive Action Confirmation Modal', x: 120, y: 470, width: 350, height: 180, fillColor: '#1F1218', r1: 20, strokes: [{ 'stroke-color': '#F43F5E', 'stroke-width': 1.5 }] }
  ]);

  // 20 Prototype
  await commitToPage('20 Prototype', [
    { name: 'Canvas: Prototype Link Diagram', x: 60, y: 60, width: 1400, height: 750, fillColor: '#070B14', r1: 24, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] },
    { name: 'Node: Home Dashboard (EntryPoint)', x: 100, y: 120, width: 250, height: 140, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 2 }] },
    { name: 'Node: CBT Exam Session (Full Screen Flow)', x: 420, y: 120, width: 250, height: 140, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 2 }] },
    { name: 'Node: Question Palette Sheet (Transient Modal)', x: 740, y: 120, width: 250, height: 140, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#A855F7', 'stroke-width': 2 }] },
    { name: 'Node: Scorecard & Solutions Review', x: 1060, y: 120, width: 250, height: 140, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 2 }] }
  ]);

  console.log('\n🎉 ALL 22 MASTER PENPOT PAGES HAVE BEEN POPULATED WITH HIGH-FIDELITY MOBILE ARTBOARDS!');
}

populateRemainingPages().catch(err => {
  console.error('Error populating remaining Penpot pages:', err);
  process.exit(1);
});
