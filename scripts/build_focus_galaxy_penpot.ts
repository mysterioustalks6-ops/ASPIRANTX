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

async function buildFocusGalaxyInPenpot() {
  const token = process.env.PENPOT_ACCESS_TOKEN;
  const fileId = process.env.PENPOT_FILE_ID;
  const pageId = '24d9d841-759d-81bc-8008-b8c60cf34505'; // Page 1
  const rootId = '00000000-0000-0000-0000-000000000000';

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
  console.log(`Building Focus Galaxy Artboards on revn: ${fileData.revn}`);

  // Artboard 1: Active Pomodoro / Cosmic Accretion Sprint (x = 100, y = 100, 390x844)
  // Artboard 2: Focus Galaxy Celestial Horizon View (x = 560, y = 100, 390x844)
  // Artboard 3: Long-term Cosmic Progression Tiers & Proof of Work (x = 1020, y = 100, 390x844)
  // Design Tokens Legend Strip (x = 100, y = 980, 1310x240)

  const elements: ShapeDef[] = [
    // ══════════════════════════════════════════════════════════════
    // SCREEN 1: ACTIVE FOCUS SPRINT (Mobile Viewport 390x844)
    // ══════════════════════════════════════════════════════════════
    { name: 'Screen 1: Active Sprint Viewport', x: 100, y: 100, width: 390, height: 844, fillColor: '#06080D', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] },
    // Top App Bar
    { name: 'Header: Top Bar', x: 120, y: 130, width: 350, height: 44, fillColor: '#0F1623', r1: 14, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Exam Badge: UPSC CSE 2026', x: 132, y: 140, width: 110, height: 24, fillColor: '#0284C7', fillOpacity: 0.18, r1: 8, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Focus Shield Active Pill', x: 252, y: 140, width: 95, height: 24, fillColor: '#10B981', fillOpacity: 0.15, r1: 8, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },
    { name: 'Profile Avatar Node', x: 426, y: 138, width: 28, height: 28, type: 'circle', fillColor: '#38BDF8', r1: 14 },

    // Cosmic Focus Horizon Tier Ribbon
    { name: 'Banner: Horizon Stage I', x: 120, y: 190, width: 350, height: 60, fillColor: '#0C1017', r1: 16, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Horizon Icon Pulse Node', x: 134, y: 202, width: 36, height: 36, fillColor: '#0284C7', fillOpacity: 0.22, r1: 10 },
    { name: 'Horizon Progress Bar Track', x: 310, y: 220, width: 145, height: 6, fillColor: '#151B26', r1: 3 },
    { name: 'Horizon Progress Bar Fill', x: 310, y: 220, width: 95, height: 6, fillColor: '#38BDF8', r1: 3 },

    // Central Cosmic Accretion Canvas Sphere
    { name: 'Accretion: Outer Nebula Aura', x: 175, y: 280, width: 240, height: 240, type: 'circle', fillColor: '#0284C7', fillOpacity: 0.12 },
    { name: 'Accretion: Orbital Guide Ring 1', x: 190, y: 295, width: 210, height: 210, type: 'circle', fillColor: '#06080D', r1: 105, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1, 'stroke-style': 'dashed' }] },
    { name: 'Accretion: Orbiting Terra Planet', x: 360, y: 340, width: 22, height: 22, type: 'circle', fillColor: '#10B981', r1: 11, strokes: [{ 'stroke-color': '#34D399', 'stroke-width': 1.5 }] },
    { name: 'Accretion: Quantum Star Core', x: 260, y: 365, width: 70, height: 70, type: 'circle', fillColor: '#38BDF8', r1: 35, strokes: [{ 'stroke-color': '#FFFFFF', 'stroke-width': 2 }] },
    { name: 'Accretion: Stellar Corona Flare', x: 280, y: 385, width: 30, height: 30, type: 'circle', fillColor: '#FFFFFF', r1: 15 },

    // Timer Digits Display Card
    { name: 'Timer: Digits Display Plate', x: 155, y: 545, width: 280, height: 75, fillColor: '#0C1017', r1: 20, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Timer: Chapter Subtext Bar', x: 195, y: 595, width: 200, height: 14, fillColor: '#172132', r1: 4 },

    // Cosmic Audio Soundscape Selector
    { name: 'Audio: Cosmic Soundscape Bar', x: 120, y: 640, width: 350, height: 48, fillColor: '#0F1623', r1: 14, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Audio Preset 1: 432Hz Drone', x: 130, y: 648, width: 100, height: 32, fillColor: '#0284C7', fillOpacity: 0.25, r1: 8, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Audio Preset 2: Solar Wind', x: 236, y: 648, width: 100, height: 32, fillColor: '#172132', r1: 8 },
    { name: 'Audio Preset 3: Harmonics', x: 342, y: 648, width: 100, height: 32, fillColor: '#172132', r1: 8 },

    // Primary CTA Button: Ignite Accretion Sprint
    { name: 'CTA: Ignite Accretion Sprint', x: 120, y: 705, width: 280, height: 54, fillColor: '#0284C7', r1: 18, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'CTA: Reset Orbit Quick Button', x: 412, y: 705, width: 58, height: 54, fillColor: '#0C1017', r1: 18, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },

    // Bottom Navigation Bar
    { name: 'Nav: Glass Bottom Navigation', x: 100, y: 775, width: 390, height: 69, fillColor: '#06080D', fillOpacity: 0.94, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Nav: Active Tab (Focus Galaxy)', x: 235, y: 785, width: 120, height: 42, fillColor: '#0284C7', fillOpacity: 0.2, r1: 12, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },

    // ══════════════════════════════════════════════════════════════
    // SCREEN 2: FOCUS GALAXY CELESTIAL HORIZON (Mobile Viewport)
    // ══════════════════════════════════════════════════════════════
    { name: 'Screen 2: Focus Galaxy Horizon Viewport', x: 560, y: 100, width: 390, height: 844, fillColor: '#06080D', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] },
    // Header & Telemetry
    { name: 'Galaxy: Stage Header Card', x: 580, y: 130, width: 350, height: 85, fillColor: '#0C1017', r1: 18, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Galaxy: Stage I Pill', x: 595, y: 142, width: 130, height: 22, fillColor: '#38BDF8', fillOpacity: 0.15, r1: 6, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Galaxy: Share Proof Button', x: 835, y: 142, width: 80, height: 30, fillColor: '#151B26', r1: 8, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },

    // Telemetry 3-Stat Counters
    { name: 'Stat 1: Time in Orbit (48.5h)', x: 580, y: 228, width: 110, height: 64, fillColor: '#0F1623', r1: 14, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Stat 2: Worlds Accreted (28)', x: 700, y: 228, width: 110, height: 64, fillColor: '#0F1623', r1: 14, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Stat 3: Core Luminosity (XP)', x: 820, y: 228, width: 110, height: 64, fillColor: '#0F1623', r1: 14, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },

    // Interactive Viewport Cosmos Canvas
    { name: 'Cosmos: Viewport Canvas Plate', x: 580, y: 306, width: 350, height: 350, fillColor: '#05070A', r1: 24, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Cosmos: Infrared Dust Cloud 1', x: 630, y: 360, width: 250, height: 200, type: 'circle', fillColor: '#0284C7', fillOpacity: 0.08 },
    { name: 'Cosmos: Central Sun Core', x: 725, y: 450, width: 60, height: 60, type: 'circle', fillColor: '#38BDF8', r1: 30, strokes: [{ 'stroke-color': '#FFFFFF', 'stroke-width': 1.5 }] },
    { name: 'Cosmos: Orbit 1 (Polity Prime)', x: 670, y: 395, width: 170, height: 170, type: 'circle', fillColor: '#05070A', r1: 85, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Cosmos: Planet 1 Polity Prime', x: 805, y: 430, width: 22, height: 22, type: 'circle', fillColor: '#0284C7', r1: 11 },
    { name: 'Cosmos: Orbit 2 (History Ringed)', x: 630, y: 355, width: 250, height: 250, type: 'circle', fillColor: '#05070A', r1: 125, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Cosmos: Planet 2 History Ringed', x: 650, y: 420, width: 28, height: 28, type: 'circle', fillColor: '#F59E0B', r1: 14 },

    // World Details Inspection Drawer Card
    { name: 'Card: Selected World Inspector', x: 580, y: 670, width: 350, height: 90, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'World Inspector Subject Pill', x: 595, y: 685, width: 110, height: 20, fillColor: '#0284C7', fillOpacity: 0.2, r1: 6 },
    { name: 'World Inspector Chapter Track', x: 595, y: 715, width: 220, height: 14, fillColor: '#172132', r1: 4 },

    // ══════════════════════════════════════════════════════════════
    // SCREEN 3: LONG-TERM PROGRESSION & PROOF OF WORK SHARE CARD
    // ══════════════════════════════════════════════════════════════
    { name: 'Screen 3: Progression & Proof of Work', x: 1020, y: 100, width: 390, height: 844, fillColor: '#06080D', r1: 36, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] },
    // Header
    { name: 'Progression: Section Header', x: 1040, y: 130, width: 350, height: 44, fillColor: '#0F1623', r1: 14, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    
    // Shareable Proof of Work Card
    { name: 'Share Card: NASA Telemetry Frame', x: 1040, y: 190, width: 350, height: 380, fillColor: '#0B0F17', r1: 24, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },
    { name: 'Telemetry Card: Inner Sky Aura', x: 1060, y: 210, width: 310, height: 180, fillColor: '#06080D', r1: 16, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1 }] },
    { name: 'Telemetry: Planet Artwork Specimen', x: 1175, y: 250, width: 80, height: 80, type: 'circle', fillColor: '#0284C7', r1: 40, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2 }] },
    { name: 'Telemetry: Metric Bar 1 Focus Time', x: 1060, y: 410, width: 145, height: 50, fillColor: '#0F1623', r1: 12, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Telemetry: Metric Bar 2 Consistency', x: 1225, y: 410, width: 145, height: 50, fillColor: '#0F1623', r1: 12, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Telemetry: Verified Candidate Watermark', x: 1060, y: 480, width: 310, height: 42, fillColor: '#0284C7', fillOpacity: 0.15, r1: 10, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Share Action: Copy & Export Pill', x: 1040, y: 590, width: 350, height: 50, fillColor: '#10B981', r1: 16, strokes: [{ 'stroke-color': '#34D399', 'stroke-width': 1 }] },

    // 6-Tier Cosmic Progression Roadmap List
    { name: 'Tier 1: Primordial Nebula (0-5h)', x: 1040, y: 660, width: 350, height: 46, fillColor: '#0F1623', r1: 12, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Tier 2: Planetesimal Cradle (5-25h)', x: 1040, y: 715, width: 350, height: 46, fillColor: '#0C1017', r1: 12, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Tier 3: Stellar Sovereign (25-100h)', x: 1040, y: 770, width: 350, height: 46, fillColor: '#0C1017', r1: 12, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },

    // ══════════════════════════════════════════════════════════════
    // DESIGN SYSTEM & COLOR TOKENS STRIP (Bottom Row)
    // ══════════════════════════════════════════════════════════════
    { name: 'Tokens: Color & Surface Palette Strip', x: 100, y: 980, width: 1310, height: 180, fillColor: '#0C1017', r1: 24, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Token: Space Base (#06080D)', x: 130, y: 1010, width: 110, height: 110, fillColor: '#06080D', r1: 16, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Token: Surface 1 (#0F1623)', x: 260, y: 1010, width: 110, height: 110, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Token: Surface 2 (#172132)', x: 390, y: 1010, width: 110, height: 110, fillColor: '#172132', r1: 16, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Token: Primary Sky (#0284C7)', x: 520, y: 1010, width: 110, height: 110, fillColor: '#0284C7', r1: 16 },
    { name: 'Token: Cyan Accent (#38BDF8)', x: 650, y: 1010, width: 110, height: 110, fillColor: '#38BDF8', r1: 16 },
    { name: 'Token: Nebula Purple (#6366F1)', x: 780, y: 1010, width: 110, height: 110, fillColor: '#6366F1', r1: 16 },
    { name: 'Token: Solar Amber (#F59E0B)', x: 910, y: 1010, width: 110, height: 110, fillColor: '#F59E0B', r1: 16 },
    { name: 'Token: Stable Emerald (#10B981)', x: 1040, y: 1010, width: 110, height: 110, fillColor: '#10B981', r1: 16 },
    { name: 'Token: Text Primary (#F8FAFC)', x: 1170, y: 1010, width: 110, height: 110, fillColor: '#F8FAFC', r1: 16, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] }
  ];

  console.log(`Generating ${elements.length} design system elements...`);

  // Batch create into Penpot
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

  console.log('🎉 Focus Galaxy full design system and screens generated in Penpot!');
}

buildFocusGalaxyInPenpot();
