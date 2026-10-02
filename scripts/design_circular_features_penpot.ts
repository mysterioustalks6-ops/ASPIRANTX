import 'dotenv/config';
import crypto from 'crypto';

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

const CIRCULAR_FEATURES = [
  { name: 'Syllabus Tracker', short: 'Syllabus', color: '#0284C7', badge: 'Core' },
  { name: 'PYQ 35Y Archive', short: 'PYQ 35Y', color: '#6366F1', badge: '35Y' },
  { name: 'CBT Mock Tests', short: 'CBT Mocks', color: '#F59E0B', badge: 'Live' },
  { name: 'Question Bank', short: 'Questions', color: '#10B981', badge: '10K+' },
  { name: 'Focus Galaxy 3D', short: 'Focus Galaxy', color: '#A855F7', badge: '3D', active: true },
  { name: 'Focus Shield', short: 'Focus Shield', color: '#F43F5E', badge: 'Shield' },
  { name: 'Study Tasks', short: 'Study Tasks', color: '#06B6D4' },
  { name: 'Library & Notes', short: 'Library', color: '#2563EB' },
  { name: 'Flashcards', short: 'Flashcards', color: '#EAB308' },
  { name: 'AI Mentor', short: 'AI Mentor', color: '#10B981', badge: 'AI' },
  { name: 'Weakness Radar', short: 'Weakness', color: '#D946EF' },
  { name: 'Rankings Board', short: 'Rankings', color: '#FBBF24' },
  { name: 'Rewards Hub', short: 'Rewards', color: '#F97316' },
  { name: 'Topper Podcasts', short: 'Podcasts', color: '#8B5CF6' },
  { name: 'Community Feed', short: 'Community', color: '#14B8A6' }
];

async function designCircularFeaturesInPenpot() {
  const token = process.env.PENPOT_ACCESS_TOKEN;
  const fileId = process.env.PENPOT_FILE_ID;

  if (!token || !fileId) {
    throw new Error('PENPOT_ACCESS_TOKEN or PENPOT_FILE_ID missing in environment');
  }

  console.log('🎨 Connecting to Penpot API to design Circular Features Section...');
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
  console.log(`✅ Connected to Penpot file: "${fileData.name}" (Revn: ${fileData.revn})`);

  const pagesIndex = fileData.data?.pagesIndex || {};
  const pagesList = Object.values(pagesIndex) as any[];
  console.log('Available pages in file:', pagesList.map(p => ({ id: p.id, name: p.name })));

  // Use Screens page or Components page or default first page
  const targetPage = pagesList.find(p => p.name.includes('Screens') || p.name.includes('Components')) || pagesList[0];
  const pageId = targetPage.id;
  const rootId = '00000000-0000-0000-0000-000000000000';
  console.log(`Targeting Page: "${targetPage.name}" (${pageId})`);

  const elements: ShapeDef[] = [];

  // =========================================================================
  // ARTBOARD 1: DESKTOP CIRCULAR FEATURE LAUNCHER TRAY (1440 x 300)
  // Replaces legacy desktop Sidebar + Header with clean circular launcher
  // =========================================================================
  const deskX = 100;
  const deskY = 1200; // Position below existing artboards

  // Master Artboard Frame
  elements.push({
    name: 'Artboard: Desktop Circular Features Launcher',
    x: deskX,
    y: deskY,
    width: 1440,
    height: 300,
    fillColor: '#07090E',
    r1: 24,
    strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }]
  });

  // Top Utility Strip Container
  elements.push({
    name: 'Top Utility Row: Container',
    x: deskX + 40,
    y: deskY + 24,
    width: 1360,
    height: 52,
    fillColor: '#0B0F19',
    r1: 16,
    strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }]
  });

  // Brand Logo: AspirantX
  elements.push({
    name: 'Brand Logo Icon Pod',
    x: deskX + 54,
    y: deskY + 34,
    width: 32,
    height: 32,
    type: 'circle',
    fillColor: '#0284C7',
    strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1.5 }]
  });
  elements.push({
    name: 'Brand Name: AspirantX',
    x: deskX + 96,
    y: deskY + 38,
    width: 100,
    height: 16,
    fillColor: '#FFFFFF',
    r1: 4
  });
  elements.push({
    name: 'Version Badge: v2.6.2',
    x: deskX + 204,
    y: deskY + 38,
    width: 55,
    height: 16,
    fillColor: '#0284C7',
    fillOpacity: 0.25,
    r1: 4,
    strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }]
  });

  // Target Exam Switcher Pill (with Search Indicator)
  elements.push({
    name: 'Exam Pill: Target Exam Switcher (Searchable)',
    x: deskX + 275,
    y: deskY + 32,
    width: 220,
    height: 36,
    fillColor: '#111827',
    r1: 18,
    strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }]
  });
  elements.push({
    name: 'Exam Pill: Live Green Dot',
    x: deskX + 288,
    y: deskY + 45,
    width: 10,
    height: 10,
    type: 'circle',
    fillColor: '#10B981'
  });
  elements.push({
    name: 'Exam Text: UPSC CSE 2026',
    x: deskX + 306,
    y: deskY + 42,
    width: 150,
    height: 16,
    fillColor: '#38BDF8',
    r1: 4
  });

  // Daily Streak Pill (Flame)
  elements.push({
    name: 'Streak Pill: 12d Active Streak',
    x: deskX + 1040,
    y: deskY + 34,
    width: 85,
    height: 32,
    fillColor: '#F59E0B',
    fillOpacity: 0.15,
    r1: 12,
    strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1 }]
  });
  elements.push({
    name: 'Streak Flame Icon',
    x: deskX + 1050,
    y: deskY + 42,
    width: 16,
    height: 16,
    fillColor: '#F59E0B',
    r1: 4
  });

  // Coins Balance Pill
  elements.push({
    name: 'Coins Pill: 450 Coins',
    x: deskX + 1135,
    y: deskY + 34,
    width: 90,
    height: 32,
    fillColor: '#EAB308',
    fillOpacity: 0.15,
    r1: 12,
    strokes: [{ 'stroke-color': '#EAB308', 'stroke-width': 1 }]
  });

  // Global Search Action Button
  elements.push({
    name: 'Action Button: Global Search',
    x: deskX + 1235,
    y: deskY + 34,
    width: 32,
    height: 32,
    fillColor: '#1E293B',
    r1: 10,
    strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }]
  });

  // User Profile Avatar Circle
  elements.push({
    name: 'Profile Avatar: Circle Node',
    x: deskX + 1277,
    y: deskY + 32,
    width: 36,
    height: 36,
    type: 'circle',
    fillColor: '#38BDF8',
    strokes: [{ 'stroke-color': '#FFFFFF', 'stroke-width': 1.5 }]
  });

  // ─────────────────────────────────────────────────────────
  // Horizontal Circular Features Tray (15 Circular Feature Pods)
  // ─────────────────────────────────────────────────────────
  elements.push({
    name: 'Tray: Circular Feature Carousel Rail',
    x: deskX + 40,
    y: deskY + 95,
    width: 1360,
    height: 180,
    fillColor: '#090D14',
    r1: 20,
    strokes: [{ 'stroke-color': '#161F30', 'stroke-width': 1 }]
  });

  const circleDiameter = 64;
  const startX = deskX + 65;
  const circleY = deskY + 120;
  const itemSpacing = 88;

  CIRCULAR_FEATURES.forEach((feature, idx) => {
    const itemX = startX + (idx * itemSpacing);
    const isActive = feature.active;

    // Glowing aura ring if active
    if (isActive) {
      elements.push({
        name: `${feature.name}: Outer Glow Ring (Active)`,
        x: itemX - 8,
        y: circleY - 8,
        width: circleDiameter + 16,
        height: circleDiameter + 16,
        type: 'circle',
        fillColor: feature.color,
        fillOpacity: 0.25,
        strokes: [{ 'stroke-color': feature.color, 'stroke-width': 2 }]
      });
    }

    // Circular Icon Pod
    elements.push({
      name: `${feature.name}: Circle Icon Pod`,
      x: itemX,
      y: circleY,
      width: circleDiameter,
      height: circleDiameter,
      type: 'circle',
      fillColor: feature.color,
      fillOpacity: isActive ? 1.0 : 0.85,
      strokes: [
        {
          'stroke-color': isActive ? '#FFFFFF' : '#334155',
          'stroke-width': isActive ? 2.5 : 1
        }
      ]
    });

    // Inner Glyph Representation (Centered in circle)
    elements.push({
      name: `${feature.name}: Inner Icon Glyph`,
      x: itemX + 20,
      y: circleY + 20,
      width: 24,
      height: 24,
      fillColor: '#FFFFFF',
      fillOpacity: 0.9,
      r1: 6
    });

    // Badge / Chip (if specified)
    if (feature.badge) {
      elements.push({
        name: `${feature.name}: Micro Badge (${feature.badge})`,
        x: itemX + 38,
        y: circleY - 4,
        width: 32,
        height: 16,
        fillColor: '#0284C7',
        r1: 8,
        strokes: [{ 'stroke-color': '#FFFFFF', 'stroke-width': 1 }]
      });
    }

    // Active Indicator Dot
    if (isActive) {
      elements.push({
        name: `${feature.name}: Active Pulse Dot`,
        x: itemX + (circleDiameter / 2) - 4,
        y: circleY + circleDiameter + 6,
        width: 8,
        height: 8,
        type: 'circle',
        fillColor: '#38BDF8'
      });
    }

    // Label Text Plate Underneath Circle (Feature Name)
    elements.push({
      name: `Label Under Circle: ${feature.short}`,
      x: itemX - 4,
      y: circleY + circleDiameter + 18,
      width: 72,
      height: 14,
      fillColor: isActive ? '#38BDF8' : '#94A3B8',
      r1: 3
    });
  });

  // =========================================================================
  // ARTBOARD 2: MOBILE VIEWPORT WITH CIRCULAR FEATURE SECTION (390 x 844)
  // Shows how circular launcher adapts seamlessly on smartphone screens
  // =========================================================================
  const mobX = deskX + 1500;
  const mobY = deskY;

  elements.push({
    name: 'Artboard: Mobile Viewport (AspirantX Circular UI)',
    x: mobX,
    y: mobY,
    width: 390,
    height: 844,
    fillColor: '#07090E',
    r1: 36,
    strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 2 }]
  });

  // Mobile Top Utility Bar
  elements.push({
    name: 'Mobile Top Bar: Background',
    x: mobX + 16,
    y: mobY + 28,
    width: 358,
    height: 48,
    fillColor: '#0B0F19',
    r1: 14,
    strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }]
  });
  elements.push({
    name: 'Mobile Brand Logo Circle',
    x: mobX + 28,
    y: mobY + 38,
    width: 28,
    height: 28,
    type: 'circle',
    fillColor: '#0284C7'
  });
  elements.push({
    name: 'Mobile Exam Switcher Pill',
    x: mobX + 66,
    y: mobY + 36,
    width: 150,
    height: 32,
    fillColor: '#111827',
    r1: 16,
    strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }]
  });
  elements.push({
    name: 'Mobile Streak Pill',
    x: mobX + 226,
    y: mobY + 36,
    width: 58,
    height: 32,
    fillColor: '#F59E0B',
    fillOpacity: 0.15,
    r1: 12,
    strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1 }]
  });
  elements.push({
    name: 'Mobile Search Icon',
    x: mobX + 292,
    y: mobY + 36,
    width: 32,
    height: 32,
    fillColor: '#1E293B',
    r1: 10
  });
  elements.push({
    name: 'Mobile Profile Circle',
    x: mobX + 332,
    y: mobY + 36,
    width: 32,
    height: 32,
    type: 'circle',
    fillColor: '#38BDF8'
  });

  // Mobile Horizontal Circular Features Tray (Overflow Swipe)
  elements.push({
    name: 'Mobile Features Tray: Horizontal Scroller',
    x: mobX + 12,
    y: mobY + 90,
    width: 366,
    height: 125,
    fillColor: '#090D14',
    r1: 18,
    strokes: [{ 'stroke-color': '#161F30', 'stroke-width': 1 }]
  });

  // Display first 4 visible circles + 1 peek on mobile
  const mobDiameter = 54;
  const mobStartX = mobX + 26;
  const mobCircleY = mobY + 104;
  const mobSpacing = 72;

  CIRCULAR_FEATURES.slice(0, 5).forEach((feature, idx) => {
    const itemX = mobStartX + (idx * mobSpacing);
    const isActive = feature.active;

    if (isActive) {
      elements.push({
        name: `Mobile: ${feature.name} Active Glow`,
        x: itemX - 4,
        y: mobCircleY - 4,
        width: mobDiameter + 8,
        height: mobDiameter + 8,
        type: 'circle',
        fillColor: feature.color,
        fillOpacity: 0.3,
        strokes: [{ 'stroke-color': feature.color, 'stroke-width': 1.5 }]
      });
    }

    elements.push({
      name: `Mobile: ${feature.name} Circle Pod`,
      x: itemX,
      y: mobCircleY,
      width: mobDiameter,
      height: mobDiameter,
      type: 'circle',
      fillColor: feature.color,
      strokes: [{ 'stroke-color': isActive ? '#FFFFFF' : '#334155', 'stroke-width': isActive ? 2 : 1 }]
    });

    elements.push({
      name: `Mobile: ${feature.short} Label Underneath`,
      x: itemX - 2,
      y: mobCircleY + mobDiameter + 8,
      width: 58,
      height: 10,
      fillColor: isActive ? '#38BDF8' : '#94A3B8',
      r1: 3
    });
  });

  // Mobile Active Workspace Hero Card (Focus Galaxy / Pomodoro / Syllabus)
  elements.push({
    name: 'Mobile: Active Feature Display Card',
    x: mobX + 16,
    y: mobY + 230,
    width: 358,
    height: 520,
    fillColor: '#0C1017',
    r1: 24,
    strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }]
  });

  // Central Celestial Focus Galaxy Globe in Mobile Viewport
  elements.push({
    name: 'Mobile Hero: Celestial Orbit Aura',
    x: mobX + 85,
    y: mobY + 300,
    width: 220,
    height: 220,
    type: 'circle',
    fillColor: '#A855F7',
    fillOpacity: 0.15,
    strokes: [{ 'stroke-color': '#A855F7', 'stroke-width': 1, 'stroke-style': 'dashed' }]
  });
  elements.push({
    name: 'Mobile Hero: Focus Galaxy Core Star',
    x: mobX + 155,
    y: mobY + 370,
    width: 80,
    height: 80,
    type: 'circle',
    fillColor: '#38BDF8',
    strokes: [{ 'stroke-color': '#FFFFFF', 'stroke-width': 2 }]
  });
  elements.push({
    name: 'Mobile Hero: Timer Countdown Plate',
    x: mobX + 95,
    y: mobY + 560,
    width: 200,
    height: 54,
    fillColor: '#111827',
    r1: 16,
    strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }]
  });
  elements.push({
    name: 'Mobile Hero: Primary Action CTA',
    x: mobX + 46,
    y: mobY + 650,
    width: 298,
    height: 52,
    fillColor: '#0284C7',
    r1: 18,
    strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }]
  });

  // Mobile Bottom Tab Bar
  elements.push({
    name: 'Mobile: Bottom Navigation Bar',
    x: mobX,
    y: mobY + 774,
    width: 390,
    height: 70,
    fillColor: '#06080D',
    strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }]
  });

  // =========================================================================
  // ARTBOARD 3: DESIGN TOKENS & CIRCULAR COMPONENT SPECS (1000 x 280)
  // =========================================================================
  const specX = deskX;
  const specY = deskY + 330;

  elements.push({
    name: 'Artboard: Circular Feature Design Tokens & Specs',
    x: specX,
    y: specY,
    width: 1440,
    height: 240,
    fillColor: '#080C14',
    r1: 20,
    strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }]
  });

  // Token 1: 64px Circular Geometry (50% radius)
  elements.push({
    name: 'Spec: 64px Circular Node Pod',
    x: specX + 40,
    y: specY + 40,
    width: 64,
    height: 64,
    type: 'circle',
    fillColor: '#0284C7',
    strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2 }]
  });
  elements.push({
    name: 'Spec Card: 64px Desktop / 54px Mobile',
    x: specX + 120,
    y: specY + 45,
    width: 260,
    height: 54,
    fillColor: '#0F172A',
    r1: 10,
    strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }]
  });

  // Token 2: Active Glow Shader Token
  elements.push({
    name: 'Spec: Glowing Active Ring Token',
    x: specX + 420,
    y: specY + 35,
    width: 74,
    height: 74,
    type: 'circle',
    fillColor: '#A855F7',
    fillOpacity: 0.25,
    strokes: [{ 'stroke-color': '#EC4899', 'stroke-width': 2 }]
  });
  elements.push({
    name: 'Spec Card: Active Aura Halo (rgba: 0.45)',
    x: specX + 510,
    y: specY + 45,
    width: 260,
    height: 54,
    fillColor: '#0F172A',
    r1: 10,
    strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }]
  });

  // Token 3: Text Label Placement Token
  elements.push({
    name: 'Spec: Under-Circle Label Position Token',
    x: specX + 810,
    y: specY + 40,
    width: 64,
    height: 64,
    type: 'circle',
    fillColor: '#10B981',
    strokes: [{ 'stroke-color': '#34D399', 'stroke-width': 2 }]
  });
  elements.push({
    name: 'Spec Card: Inter SemiBold 11px / 12px Labels',
    x: specX + 890,
    y: specY + 45,
    width: 260,
    height: 54,
    fillColor: '#0F172A',
    r1: 10,
    strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }]
  });

  // Token 4: Color Palette Swatches (Sky, Indigo, Amber, Emerald, Rose, Purple)
  const paletteColors = ['#0284C7', '#6366F1', '#F59E0B', '#10B981', '#F43F5E', '#A855F7', '#06B6D4', '#EAB308'];
  paletteColors.forEach((color, i) => {
    elements.push({
      name: `Palette Swatch ${i + 1}`,
      x: specX + 40 + (i * 120),
      y: specY + 140,
      width: 48,
      height: 48,
      type: 'circle',
      fillColor: color,
      strokes: [{ 'stroke-color': '#FFFFFF', 'stroke-width': 1.5 }]
    });
    elements.push({
      name: `Palette Label ${i + 1}`,
      x: specX + 40 + (i * 120),
      y: specY + 196,
      width: 48,
      height: 12,
      fillColor: '#64748B',
      r1: 3
    });
  });

  console.log(`\n📦 Committing ${elements.length} design objects to Penpot...`);

  const changes = elements.map(el => ({
    type: 'add-obj',
    id: crypto.randomUUID(),
    'page-id': pageId,
    'parent-id': rootId,
    'frame-id': rootId,
    obj: makeShape(el, rootId, rootId)
  }));

  // Send in batches of 15 to stay within Penpot mutation limits
  let currentRevn = fileData.revn;
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
      const data = await updateRes.json();
      currentRevn = data.revn;
      console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(changes.length / batchSize)} committed (New revn: ${currentRevn})`);
    } else {
      console.error(`  ✗ Batch failed:`, await updateRes.text());
    }
  }

  console.log('\n🎉 SUCCESS: Circular Features Section fully designed and committed to Penpot!');
  console.log(`🔗 Penpot File ID: ${fileId}`);
  console.log(`📄 Page: "${targetPage.name}" (${pageId})`);
}

designCircularFeaturesInPenpot().catch((err) => {
  console.error('❌ Error executing Penpot design generator:', err);
  process.exit(1);
});
