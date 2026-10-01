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

async function commitShapesToPage(pageId: string, shapes: ShapeDef[], pageTitle: string) {
  const token = process.env.PENPOT_ACCESS_TOKEN;
  const fileId = process.env.PENPOT_FILE_ID;
  const rootId = '00000000-0000-0000-0000-000000000000';

  console.log(`\n🎨 Committing ${shapes.length} vector objects to "${pageTitle}" (Page ID: ${pageId})...`);

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

  const changes = shapes.map(el => ({
    type: 'add-obj',
    id: crypto.randomUUID(),
    'page-id': pageId,
    'parent-id': rootId,
    'frame-id': rootId,
    obj: makeShape(el, rootId, rootId)
  }));

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
}

async function addScreens() {
  const fileId = process.env.PENPOT_FILE_ID!;
  const token = process.env.PENPOT_ACCESS_TOKEN!;
  const pageId = '24d9d841-759d-81bc-8008-b8c60cf34505'; // "03 Screens"

  console.log('🚀 Generating Full Suite of Mobile Screens (A through L) + Responsive Artboards...');

  const screenShapes: ShapeDef[] = [
    // ════════════════════════════════════════════════════════════════
    // SCREEN A: ONBOARDING — CREATE MY PLANET (390 x 844)
    // ════════════════════════════════════════════════════════════════
    { name: 'Screen A: Onboarding Viewport', x: 100, y: 1000, width: 390, height: 844, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Onboarding: Star Field Atmosphere', x: 100, y: 1000, width: 390, height: 844, fillColor: '#0284C7', fillOpacity: 0.05, r1: 32 },
    { name: 'Onboarding: Progress Step Bar (1 of 3)', x: 124, y: 1050, width: 342, height: 4, fillColor: '#172132', r1: 2 },
    { name: 'Onboarding: Step Fill Active', x: 124, y: 1050, width: 114, height: 4, fillColor: '#38BDF8', r1: 2 },
    { name: 'Onboarding: Step Badge "GENESIS 01"', x: 124, y: 1070, width: 110, height: 24, fillColor: '#0C1017', r1: 6, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Onboarding: Hero Celestial Seed Sphere', type: 'circle', x: 215, y: 1130, width: 160, height: 160, fillColor: '#0C1A30', strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2.5 }] },
    { name: 'Onboarding: Planetary Core Glow', type: 'circle', x: 245, y: 1160, width: 100, height: 100, fillColor: '#0284C7', fillOpacity: 0.25 },
    { name: 'Onboarding: Shadow Terminator Vector', x: 295, y: 1130, width: 80, height: 160, fillColor: '#05070B', fillOpacity: 0.65, r1: 80 },
    { name: 'Onboarding: Seed Type Selector Card', x: 124, y: 1330, width: 342, height: 110, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1.5 }] },
    { name: 'Onboarding: Seed Chip (Rocky Terrestrial)', x: 138, y: 1385, width: 95, height: 36, fillColor: '#172132', r1: 10, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Onboarding: Seed Chip (Gas Giant)', x: 242, y: 1385, width: 95, height: 36, fillColor: '#0C1017', r1: 10 },
    { name: 'Onboarding: Seed Chip (Ringed Ocean)', x: 346, y: 1385, width: 95, height: 36, fillColor: '#0C1017', r1: 10 },
    { name: 'Onboarding: Planet Name Input Card', x: 124, y: 1460, width: 342, height: 75, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1.5 }] },
    { name: 'Onboarding: Name Field Box (Polity Prime)', x: 138, y: 1485, width: 314, height: 38, fillColor: '#0C1017', r1: 8, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Onboarding: Long-term Cosmic Vision Box', x: 124, y: 1555, width: 342, height: 95, fillColor: '#0B1320', r1: 14, strokes: [{ 'stroke-color': '#6366F1', 'stroke-width': 1 }] },
    { name: 'Onboarding: Primary CTA "CREATE MY PLANET"', x: 124, y: 1720, width: 342, height: 54, fillColor: '#0284C7', r1: 16 },

    // ════════════════════════════════════════════════════════════════
    // SCREEN D: SESSION COMPLETE (390 x 844)
    // ════════════════════════════════════════════════════════════════
    { name: 'Screen D: Session Complete Viewport', x: 520, y: 1000, width: 390, height: 844, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Complete: Ambient Success Glow', type: 'circle', x: 615, y: 1080, width: 200, height: 200, fillColor: '#10B981', fillOpacity: 0.12 },
    { name: 'Complete: Growth Burst Accretion Shockwave', type: 'circle', x: 605, y: 1070, width: 220, height: 220, fillColor: '#000000', fillOpacity: 0, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 2 }] },
    { name: 'Complete: Planet Acclimated Hero Sphere', type: 'circle', x: 645, y: 1110, width: 140, height: 140, fillColor: '#0C1E38', strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2 }] },
    { name: 'Complete: New Orbiting Task Moon Accreted', type: 'circle', x: 775, y: 1100, width: 24, height: 24, fillColor: '#E2E8F0', strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 2 }] },
    { name: 'Complete: Milestone Title Card (Sprint Complete)', x: 544, y: 1320, width: 342, height: 95, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1.5 }] },
    { name: 'Complete: Telemetry Metrics Card (XP + Dust)', x: 544, y: 1435, width: 342, height: 120, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1.5 }] },
    { name: 'Complete: Metric 1 (+120 Cosmic Dust)', x: 560, y: 1455, width: 145, height: 80, fillColor: '#172132', r1: 12 },
    { name: 'Complete: Metric 2 (Streak: 15 Days)', x: 721, y: 1455, width: 145, height: 80, fillColor: '#172132', r1: 12 },
    { name: 'Complete: Progression Level Progress Bar Card', x: 544, y: 1575, width: 342, height: 85, fillColor: '#0F1623', r1: 14, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Complete: Bar Fill (Level 142 -> 143)', x: 560, y: 1625, width: 260, height: 8, fillColor: '#10B981', r1: 4 },
    { name: 'Complete: Primary CTA "RETURN TO GALAXY"', x: 544, y: 1720, width: 342, height: 54, fillColor: '#10B981', r1: 16 },

    // ════════════════════════════════════════════════════════════════
    // SCREEN E: MY PLANET / GALAXY EXPLORER (390 x 844)
    // ════════════════════════════════════════════════════════════════
    { name: 'Screen E: Galaxy Explorer Viewport', x: 940, y: 1000, width: 390, height: 844, fillColor: '#05070B', r1: 32, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Galaxy: Nebula Volumetric Backdrop', x: 940, y: 1000, width: 390, height: 844, fillColor: '#4C1D95', fillOpacity: 0.08, r1: 32 },
    { name: 'Galaxy: Level HUD Pill (MODE I: DUST — LVL 142)', x: 964, y: 1050, width: 230, height: 32, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Galaxy: View Filter Horizon Strip (DAY/WEEK/MONTH/YEAR)', x: 964, y: 1100, width: 342, height: 42, fillColor: '#0F1623', r1: 12 },
    { name: 'Galaxy: Filter Active (WEEK: System View)', x: 1050, y: 1104, width: 85, height: 34, fillColor: '#0284C7', r1: 8 },
    { name: 'Galaxy: Orbital Track 1 (Task Ring)', type: 'circle', x: 1005, y: 1220, width: 260, height: 260, fillColor: '#000000', fillOpacity: 0, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5 }] },
    { name: 'Galaxy: Orbital Track 2 (Milestone Ring)', type: 'circle', x: 975, y: 1190, width: 320, height: 320, fillColor: '#000000', fillOpacity: 0, strokes: [{ 'stroke-color': '#172132', 'stroke-width': 1 }] },
    { name: 'Galaxy: Hero Central Planet (Polity Prime)', type: 'circle', x: 1070, y: 1285, width: 130, height: 130, fillColor: '#0C1C36', strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2.5 }] },
    { name: 'Galaxy: Orbiting Moon 1 (Article 21 Task)', type: 'circle', x: 1010, y: 1260, width: 20, height: 20, fillColor: '#CBD5E1', strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1.5 }] },
    { name: 'Galaxy: Orbiting Moon 2 (Fundamental Rights)', type: 'circle', x: 1230, y: 1380, width: 24, height: 24, fillColor: '#E2E8F0', strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },
    { name: 'Galaxy: Comet Streak Trajectory', x: 1150, y: 1180, width: 90, height: 4, fillColor: '#F59E0B', r1: 2 },
    { name: 'Galaxy: Celestial Telemetry Card', x: 964, y: 1540, width: 342, height: 120, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1.5 }] },
    { name: 'Galaxy: Bottom Navigation Dock', x: 964, y: 1720, width: 342, height: 60, fillColor: '#0B1019', r1: 20, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },

    // ════════════════════════════════════════════════════════════════
    // SCREEN F: TASKS & DAYS (390 x 844)
    // ════════════════════════════════════════════════════════════════
    { name: 'Screen F: Tasks & Days Viewport', x: 100, y: 1900, width: 390, height: 844, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Tasks: Header Title (Tasks & Orbit Creation)', x: 124, y: 1950, width: 342, height: 45, fillColor: '#0F1623', r1: 12 },
    { name: 'Tasks: Monday-Sunday Horizontal Strip', x: 124, y: 2010, width: 342, height: 75, fillColor: '#0F1623', r1: 14, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Tasks: Day Ring Active (Wednesday - 4/4)', type: 'circle', x: 260, y: 2025, width: 44, height: 44, fillColor: '#0284C7', fillOpacity: 0.3, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2 }] },
    { name: 'Tasks: Task Card 1 (DPSP Articles Revision)', x: 124, y: 2105, width: 342, height: 95, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1.5 }] },
    { name: 'Tasks: Subject Pill (Indian Polity)', x: 140, y: 2120, width: 95, height: 22, fillColor: '#0284C7', fillOpacity: 0.25, r1: 6 },
    { name: 'Tasks: Pomodoro Progress Dot Strip [● ● ● ○]', x: 290, y: 2120, width: 100, height: 20, fillColor: '#172132', r1: 4 },
    { name: 'Tasks: Task Card 2 (Modern History 1857 Revolt)', x: 124, y: 2215, width: 342, height: 95, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Tasks: Subject Pill (Modern History)', x: 140, y: 2230, width: 105, height: 22, fillColor: '#F59E0B', fillOpacity: 0.25, r1: 6 },
    { name: 'Tasks: Task Card 3 (CSAT Number Systems)', x: 124, y: 2325, width: 342, height: 95, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Tasks: Quick Action "+ ADD FOCUS TASK"', x: 124, y: 2435, width: 342, height: 48, fillColor: '#172132', r1: 14, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Tasks: Moon Accretion Banner (2 Moons Today)', x: 124, y: 2500, width: 342, height: 75, fillColor: '#0B1320', r1: 14, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },
    { name: 'Tasks: Bottom Navigation Dock', x: 124, y: 2620, width: 342, height: 60, fillColor: '#0B1019', r1: 20, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },

    // ════════════════════════════════════════════════════════════════
    // SCREEN G: HISTORY & STATS (390 x 844)
    // ════════════════════════════════════════════════════════════════
    { name: 'Screen G: History & Stats Viewport', x: 520, y: 1900, width: 390, height: 844, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Stats: Header Card (Cosmic Telemetry)', x: 544, y: 1950, width: 342, height: 45, fillColor: '#0F1623', r1: 12 },
    { name: 'Stats: Overview 4-Metric Grid Matrix', x: 544, y: 2010, width: 342, height: 160, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Stats: Tile 1 (Today: 4h 15m)', x: 560, y: 2025, width: 145, height: 65, fillColor: '#172132', r1: 10 },
    { name: 'Stats: Tile 2 (This Week: 28h 30m)', x: 721, y: 2025, width: 145, height: 65, fillColor: '#172132', r1: 10 },
    { name: 'Stats: Tile 3 (Total Hours: 412h)', x: 560, y: 2095, width: 145, height: 65, fillColor: '#172132', r1: 10 },
    { name: 'Stats: Tile 4 (Streak: 21 Days Max)', x: 721, y: 2095, width: 145, height: 65, fillColor: '#172132', r1: 10 },
    { name: 'Stats: Star-Field Focus Heatmap Card', x: 544, y: 2185, width: 342, height: 175, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Stats: Heatmap Matrix Node Array', x: 560, y: 2235, width: 310, height: 100, fillColor: '#0C1017', r1: 8 },
    { name: 'Stats: Subject Telemetry Breakdown Card', x: 544, y: 2375, width: 342, height: 170, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Stats: Subject 1 Bar (Polity - 54%)', x: 560, y: 2425, width: 220, height: 12, fillColor: '#0284C7', r1: 6 },
    { name: 'Stats: Subject 2 Bar (Modern History - 28%)', x: 560, y: 2455, width: 140, height: 12, fillColor: '#F59E0B', r1: 6 },
    { name: 'Stats: Subject 3 Bar (CSAT - 18%)', x: 560, y: 2485, width: 90, height: 12, fillColor: '#6366F1', r1: 6 },
    { name: 'Stats: Bottom Navigation Dock', x: 544, y: 2620, width: 342, height: 60, fillColor: '#0B1019', r1: 20, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },

    // ════════════════════════════════════════════════════════════════
    // SCREEN H: RANKING & 10-MODE ROADMAP (390 x 844)
    // ════════════════════════════════════════════════════════════════
    { name: 'Screen H: 10-Mode Roadmap Viewport', x: 940, y: 1900, width: 390, height: 844, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Roadmap: Current Mode Hero Card (MODE I DUST)', x: 964, y: 1950, width: 342, height: 110, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2 }] },
    { name: 'Roadmap: Level Gauge (142 / 1000)', x: 980, y: 2025, width: 310, height: 10, fillColor: '#172132', r1: 5 },
    { name: 'Roadmap: Level Gauge Fill (14.2%)', x: 980, y: 2025, width: 44, height: 10, fillColor: '#38BDF8', r1: 5 },
    { name: 'Roadmap: Track 1 (1. Cosmic Dust - CURRENT)', x: 964, y: 2075, width: 342, height: 60, fillColor: '#0F1E36', r1: 12, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },
    { name: 'Roadmap: Track 2 (2. Protoplanet - Lvl 1000)', x: 964, y: 2145, width: 342, height: 50, fillColor: '#0C1017', r1: 10, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Roadmap: Track 3 (3. Planet - Lvl 2000)', x: 964, y: 2205, width: 342, height: 50, fillColor: '#0C1017', r1: 10 },
    { name: 'Roadmap: Track 4 (4. Star - Lvl 3000)', x: 964, y: 2265, width: 342, height: 50, fillColor: '#0C1017', r1: 10 },
    { name: 'Roadmap: Track 5 (5. Solar System - Lvl 4000)', x: 964, y: 2325, width: 342, height: 50, fillColor: '#0C1017', r1: 10 },
    { name: 'Roadmap: Track 6 (6. Nebula - Lvl 5000)', x: 964, y: 2385, width: 342, height: 50, fillColor: '#0C1017', r1: 10 },
    { name: 'Roadmap: Track 7-10 (Galaxy -> Universe - Lvl 10,000)', x: 964, y: 2445, width: 342, height: 80, fillColor: '#080B10', r1: 12, strokes: [{ 'stroke-color': '#4C1D95', 'stroke-width': 1 }] },
    { name: 'Roadmap: Anti-Cheat Server Attestation Pill', x: 964, y: 2540, width: 342, height: 40, fillColor: '#0C1017', r1: 8, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },
    { name: 'Roadmap: Bottom Navigation Dock', x: 964, y: 2620, width: 342, height: 60, fillColor: '#0B1019', r1: 20, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },

    // ════════════════════════════════════════════════════════════════
    // SCREEN I: JOURNEY & PROOF OF WORK (390 x 844)
    // ════════════════════════════════════════════════════════════════
    { name: 'Screen I: Proof of Work Viewport', x: 1360, y: 1900, width: 390, height: 844, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Proof: Header Badge (Proof-of-Work Attestation)', x: 1384, y: 1950, width: 240, height: 28, fillColor: '#0C1017', r1: 14, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },
    { name: 'Proof: Emotional Hero Focus Banner', x: 1384, y: 1995, width: 342, height: 160, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1.5 }] },
    { name: 'Proof: Big Stat Display (412 HOURS VERIFIED)', x: 1400, y: 2025, width: 310, height: 50, fillColor: '#172132', r1: 10 },
    { name: 'Proof: Sub-Stat (= 17 DAYS NON-STOP FOCUS)', x: 1400, y: 2090, width: 310, height: 35, fillColor: '#0C1A2E', r1: 8 },
    { name: 'Proof: Monthly Chronicle Strip Container', x: 1384, y: 2170, width: 342, height: 210, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Proof: Month Row Jan (112h Verified Focus)', x: 1400, y: 2210, width: 310, height: 36, fillColor: '#172132', r1: 8 },
    { name: 'Proof: Month Row Feb (96h Verified Focus)', x: 1400, y: 2255, width: 310, height: 36, fillColor: '#172132', r1: 8 },
    { name: 'Proof: Month Row Mar (124h Verified Focus)', x: 1400, y: 2300, width: 310, height: 36, fillColor: '#172132', r1: 8 },
    { name: 'Proof: Month Row Apr (80h Verified Focus)', x: 1400, y: 2345, width: 310, height: 36, fillColor: '#172132', r1: 8 },
    { name: 'Proof: First Focus Genesis Date Pill (14 Jan 2026)', x: 1384, y: 2395, width: 342, height: 55, fillColor: '#0C1017', r1: 12, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Proof: Primary Action "EXPORT PROOF CARD"', x: 1384, y: 2470, width: 342, height: 50, fillColor: '#0284C7', r1: 14 },
    { name: 'Proof: Bottom Navigation Dock', x: 1384, y: 2620, width: 342, height: 60, fillColor: '#0B1019', r1: 20, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },

    // ════════════════════════════════════════════════════════════════
    // SCREEN J: MODE COMPLETE & SHARE CERTIFICATE (390 x 844 + 1080x1920)
    // ════════════════════════════════════════════════════════════════
    { name: 'Screen J: Mode Complete Viewport', x: 100, y: 2800, width: 390, height: 844, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'ModeComp: Transcendence Nova Aura', type: 'circle', x: 175, y: 2880, width: 240, height: 240, fillColor: '#F59E0B', fillOpacity: 0.15 },
    { name: 'ModeComp: Supernova Evolution Flare', type: 'circle', x: 215, y: 2920, width: 160, height: 160, fillColor: '#F59E0B', strokes: [{ 'stroke-color': '#FCD34D', 'stroke-width': 3 }] },
    { name: 'ModeComp: Old Cosmic Dust Core', type: 'circle', x: 255, y: 2960, width: 80, height: 80, fillColor: '#0F1623' },
    { name: 'ModeComp: Evolution Title Card (MODE I -> II)', x: 124, y: 3150, width: 342, height: 100, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 2 }] },
    { name: 'ModeComp: Certificate Preview Mini Card', x: 124, y: 3270, width: 342, height: 180, fillColor: '#0C1017', r1: 14, strokes: [{ 'stroke-color': '#E2E8F0', 'stroke-width': 1 }] },
    { name: 'ModeComp: Seal of Integrity Stamp', type: 'circle', x: 380, y: 3370, width: 50, height: 50, fillColor: '#D97706', strokes: [{ 'stroke-color': '#FDE68A', 'stroke-width': 2 }] },
    { name: 'ModeComp: Primary CTA "CLAIM CERTIFICATE"', x: 124, y: 3480, width: 342, height: 54, fillColor: '#F59E0B', r1: 16 },

    // Social Story 1080x1920 Share Card Artboard (Scaled to 540x960 in Canvas for crisp layout)
    { name: 'Artboard: 1080x1920 Social Share Card', x: 520, y: 2800, width: 540, height: 960, fillColor: '#05070B', r1: 28, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 3 }] },
    { name: 'ShareCard: Deep Space Star Field Grid', x: 520, y: 2800, width: 540, height: 960, fillColor: '#0284C7', fillOpacity: 0.04, r1: 28 },
    { name: 'ShareCard: AspirantX Focus Galaxy Brand Watermark', x: 560, y: 2840, width: 460, height: 50, fillColor: '#0C1017', r1: 12 },
    { name: 'ShareCard: Central High-Res Planet Sphere', type: 'circle', x: 670, y: 2950, width: 240, height: 240, fillColor: '#0A1830', strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 4 }] },
    { name: 'ShareCard: Planetary Halo Rim Light', type: 'circle', x: 660, y: 2940, width: 260, height: 260, fillColor: '#000000', fillOpacity: 0, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },
    { name: 'ShareCard: Candidate Verified Certificate Plaque', x: 560, y: 3260, width: 460, height: 280, fillColor: '#0B1320', r1: 20, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 2 }] },
    { name: 'ShareCard: Cryptographic Attestation Barcode', x: 590, y: 3470, width: 400, height: 40, fillColor: '#172132', r1: 6 },
    { name: 'ShareCard: Share Tagline ("Forged Through Relentless Focus")', x: 560, y: 3570, width: 460, height: 48, fillColor: '#0F1623', r1: 12 },

    // ════════════════════════════════════════════════════════════════
    // SCREEN K: HALL OF FAME (390 x 844)
    // ════════════════════════════════════════════════════════════════
    { name: 'Screen K: Hall of Fame Viewport', x: 1100, y: 2800, width: 390, height: 844, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Hall: Shelf Title (Celestial Trophy Shelf)', x: 1124, y: 2850, width: 342, height: 45, fillColor: '#0F1623', r1: 12 },
    { name: 'Hall: Trophy Badge 1 [100 DAYS STREAK]', x: 1124, y: 2910, width: 342, height: 90, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1.5 }] },
    { name: 'Hall: Badge Icon 1 (Solar Phoenix)', type: 'circle', x: 1140, y: 2928, width: 54, height: 54, fillColor: '#F59E0B', fillOpacity: 0.25, strokes: [{ 'stroke-color': '#FCD34D', 'stroke-width': 1.5 }] },
    { name: 'Hall: Trophy Badge 2 [1000 HOURS FOCUS]', x: 1124, y: 3015, width: 342, height: 90, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },
    { name: 'Hall: Badge Icon 2 (Quantum Pulsar)', type: 'circle', x: 1140, y: 3033, width: 54, height: 54, fillColor: '#0284C7', fillOpacity: 0.25, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1.5 }] },
    { name: 'Hall: Trophy Badge 3 [CENTURION SPRINT]', x: 1124, y: 3120, width: 342, height: 90, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1.5 }] },
    { name: 'Hall: Badge Icon 3 (Shield of Focus)', type: 'circle', x: 1140, y: 3138, width: 54, height: 54, fillColor: '#10B981', fillOpacity: 0.25, strokes: [{ 'stroke-color': '#34D399', 'stroke-width': 1.5 }] },
    { name: 'Hall: Trophy Badge 4 [DEEP WORK DEFENDER]', x: 1124, y: 3225, width: 342, height: 90, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#6366F1', 'stroke-width': 1.5 }] },
    { name: 'Hall: Badge Icon 4 (Nebula Cloak)', type: 'circle', x: 1140, y: 3243, width: 54, height: 54, fillColor: '#6366F1', fillOpacity: 0.25, strokes: [{ 'stroke-color': '#818CF8', 'stroke-width': 1.5 }] },
    { name: 'Hall: Trophy Badge 5 [LOCKED: COSMIC ASCENT]', x: 1124, y: 3330, width: 342, height: 75, fillColor: '#0A0E17', r1: 14, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Hall: Bottom Navigation Dock', x: 1124, y: 3520, width: 342, height: 60, fillColor: '#0B1019', r1: 20, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },

    // ════════════════════════════════════════════════════════════════
    // SCREEN L: SETTINGS & PREFERENCES (390 x 844)
    // ════════════════════════════════════════════════════════════════
    { name: 'Screen L: Settings Viewport', x: 1520, y: 2800, width: 390, height: 844, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Settings: Header Title (System Configuration)', x: 1544, y: 2850, width: 342, height: 45, fillColor: '#0F1623', r1: 12 },
    { name: 'Settings: Section 1 (Focus Sprint Timers)', x: 1544, y: 2910, width: 342, height: 130, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Settings: Focus Duration Row (50 min)', x: 1560, y: 2955, width: 310, height: 34, fillColor: '#172132', r1: 8 },
    { name: 'Settings: Short Break Row (10 min)', x: 1560, y: 2995, width: 310, height: 34, fillColor: '#172132', r1: 8 },
    { name: 'Settings: Section 2 (Audio & Soundscapes)', x: 1544, y: 3055, width: 342, height: 100, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Settings: Theta Binaural Active (432Hz)', x: 1560, y: 3100, width: 310, height: 38, fillColor: '#0284C7', fillOpacity: 0.25, r1: 8, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Settings: Section 3 (Focus Shield & App Blocker)', x: 1544, y: 3170, width: 342, height: 110, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#6366F1', 'stroke-width': 1 }] },
    { name: 'Settings: Strict Mode Switch (ON - 100% Lock)', x: 1560, y: 3220, width: 310, height: 40, fillColor: '#10B981', fillOpacity: 0.25, r1: 8, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },
    { name: 'Settings: Section 4 (Streak Freeze & Vacation)', x: 1544, y: 3295, width: 342, height: 95, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Settings: Freeze Days Balance (2 Days Left)', x: 1560, y: 3340, width: 310, height: 36, fillColor: '#172132', r1: 8 },
    { name: 'Settings: Language & Sync Card (English / Hindi)', x: 1544, y: 3405, width: 342, height: 60, fillColor: '#0C1017', r1: 12, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Settings: Bottom Navigation Dock', x: 1544, y: 3520, width: 342, height: 60, fillColor: '#0B1019', r1: 20, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },

    // ════════════════════════════════════════════════════════════════
    // RESPONSIVE ADAPTATIONS: 412x915 Android, 768x1024 iPad, 1440x900 Desktop
    // ════════════════════════════════════════════════════════════════
    { name: 'Artboard: Responsive Android Viewport (412 x 915)', x: 1360, y: 1000, width: 412, height: 915, fillColor: '#080C14', r1: 32, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2 }] },
    { name: 'RespAndroid: Hero Planet Sphere', type: 'circle', x: 1476, y: 1180, width: 180, height: 180, fillColor: '#0C1C36', strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2 }] },
    { name: 'RespAndroid: Start Focus Primary CTA', x: 1390, y: 1780, width: 352, height: 56, fillColor: '#0284C7', r1: 16 },

    { name: 'Artboard: Responsive iPad Tablet (768 x 1024)', x: 1800, y: 1000, width: 768, height: 1024, fillColor: '#080C14', r1: 36, strokes: [{ 'stroke-color': '#6366F1', 'stroke-width': 2 }] },
    { name: 'RespTablet: Left Galaxy Canvas Viewport', x: 1830, y: 1040, width: 440, height: 940, fillColor: '#05070B', r1: 24, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'RespTablet: Central Planet Focus Stage', type: 'circle', x: 1930, y: 1380, width: 240, height: 240, fillColor: '#0C1C36', strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 3 }] },
    { name: 'RespTablet: Right Telemetry & Task Dock', x: 2290, y: 1040, width: 250, height: 940, fillColor: '#0F1623', r1: 24, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },

    { name: 'Artboard: Responsive Ultra-Wide Desktop (1440 x 900)', x: 1800, y: 2100, width: 1440, height: 900, fillColor: '#06080D', r1: 24, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 2 }] },
    { name: 'RespDesktop: 3D WebGL Orbit Simulation Stage', x: 1840, y: 2140, width: 920, height: 820, fillColor: '#04060A', r1: 20, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'RespDesktop: Hero Deep Space Star & Planet Sphere', type: 'circle', x: 2160, y: 2410, width: 280, height: 280, fillColor: '#0B1A33', strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 4 }] },
    { name: 'RespDesktop: Right Telemetry & Mission Control Panel', x: 2780, y: 2140, width: 420, height: 820, fillColor: '#0F1623', r1: 20, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1.5 }] },
    { name: 'RespDesktop: Primary Mission Ignite CTA', x: 2810, y: 2850, width: 360, height: 60, fillColor: '#0284C7', r1: 16 }
  ];

  console.log(`Total new master screen shapes: ${screenShapes.length}`);
  await commitShapesToPage(pageId, screenShapes, '03 Screens');

  console.log('🎉 ALL MASTER MOBILE SCREENS (A THROUGH L) + RESPONSIVE ARTBOARDS SUCCESSFULLY COMMITTED TO PENPOT!');
}

addScreens().catch(err => {
  console.error('Error committing screens:', err);
  process.exit(1);
});
