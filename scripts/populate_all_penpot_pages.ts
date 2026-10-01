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

async function populateAllPages() {
  // Page IDs from previous verification
  const pages = {
    screens: '24d9d841-759d-81bc-8008-b8c60cf34505',
    components: '3b8504a9-3204-453b-a681-cdee19f0649d',
    research: 'db3a7a9e-8e43-4134-a153-6803d06c9c67',
    foundations: '28dff861-4da0-485a-8f14-9ec502a0eb9a',
    motion: '4cffe0bf-96ad-47ef-bf46-bed3677666e3',
    prototype: '705b0075-951c-46db-ba0f-d837dabe6e7f',
    handoff: 'f7b5cbe8-ccb3-43ab-98c2-715af263c34d'
  };

  // ════════════════════════════════════════════════════════════════
  // 1. PAGE "00 Research": Product Context, Problem, & Personas
  // ════════════════════════════════════════════════════════════════
  const researchShapes: ShapeDef[] = [
    { name: 'Research Canvas Base', x: 80, y: 80, width: 1400, height: 900, fillColor: '#06080D', r1: 24, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Header: Title Card — Aspirant UX Research', x: 120, y: 120, width: 1320, height: 90, fillColor: '#0C1017', r1: 18, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },
    
    // Column 1: Core Problem & Tree Metaphor Fatigue
    { name: 'Card: Problem Statement (Tree Metaphor Friction)', x: 120, y: 240, width: 420, height: 680, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Problem Pill: Cognitive Friction & Guilt', x: 144, y: 264, width: 220, height: 32, fillColor: '#F43F5E', fillOpacity: 0.18, r1: 8, strokes: [{ 'stroke-color': '#F43F5E', 'stroke-width': 1 }] },
    { name: 'Item: Tree Withering Punishment Demotivation', x: 144, y: 316, width: 372, height: 100, fillColor: '#172132', r1: 12 },
    { name: 'Item: Lack of Multi-Year Progression Scale', x: 144, y: 432, width: 372, height: 100, fillColor: '#172132', r1: 12 },
    { name: 'Item: Childish Cartoon Aesthetic vs Serious Aspirant', x: 144, y: 548, width: 372, height: 100, fillColor: '#172132', r1: 12 },
    { name: 'Summary Bar: Why Cosmos Replaces Garden', x: 144, y: 664, width: 372, height: 220, fillColor: '#0284C7', fillOpacity: 0.12, r1: 12, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },

    // Column 2: Target Candidate Personas & Behavioral Insights
    { name: 'Card: Aspirant Personas (UPSC/NEET/JEE/SSC)', x: 570, y: 240, width: 420, height: 680, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Persona Pill: Deep Endurance Achievers', x: 594, y: 264, width: 230, height: 32, fillColor: '#38BDF8', fillOpacity: 0.18, r1: 8, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Persona 1: The Long-Distance UPSC Aspirant', x: 594, y: 316, width: 372, height: 170, fillColor: '#172132', r1: 12 },
    { name: 'Persona 2: The High-Velocity NEET/JEE Drill Student', x: 594, y: 502, width: 372, height: 170, fillColor: '#172132', r1: 12 },
    { name: 'Insight: Proof-of-Work Need (17 Days Continuous)', x: 594, y: 688, width: 372, height: 196, fillColor: '#10B981', fillOpacity: 0.12, r1: 12, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },

    // Column 3: The 10-Mode Cosmic Progression Engine
    { name: 'Card: Progression Science & Space Metaphor', x: 1020, y: 240, width: 420, height: 680, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Metaphor Pill: 10 Modes x 1000 Levels', x: 1044, y: 264, width: 210, height: 32, fillColor: '#6366F1', fillOpacity: 0.18, r1: 8, strokes: [{ 'stroke-color': '#6366F1', 'stroke-width': 1 }] },
    { name: 'Mode Architecture Strip: 1 Dust to 10 Universe', x: 1044, y: 316, width: 372, height: 380, fillColor: '#172132', r1: 12 },
    { name: 'Scientific Soundscapes: 432Hz Binaural Theta Flow', x: 1044, y: 712, width: 372, height: 172, fillColor: '#0C1017', r1: 12, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] }
  ];
  await commitShapesToPage(pages.research, researchShapes, '00 Research');

  // ════════════════════════════════════════════════════════════════
  // 2. PAGE "01 Foundations": Color Tokens, Typography, Space, Radii, Shadows
  // ════════════════════════════════════════════════════════════════
  const foundationShapes: ShapeDef[] = [
    { name: 'Foundations Canvas Base', x: 80, y: 80, width: 1400, height: 1000, fillColor: '#06080D', r1: 24, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Header: Design Tokens & Foundations', x: 120, y: 120, width: 1320, height: 80, fillColor: '#0C1017', r1: 18, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },

    // Section 1: Color Hierarchy
    { name: 'Card: Dark Deep-Space Palette', x: 120, y: 230, width: 1320, height: 210, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Color: Space Base (#06080D)', x: 144, y: 260, width: 120, height: 150, fillColor: '#06080D', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Color: Surface 1 (#0C1017)', x: 280, y: 260, width: 120, height: 150, fillColor: '#0C1017', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Color: Surface 2 (#0F1623)', x: 416, y: 260, width: 120, height: 150, fillColor: '#0F1623', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Color: Elevated (#172132)', x: 552, y: 260, width: 120, height: 150, fillColor: '#172132', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Color: Primary Sky (#0284C7)', x: 688, y: 260, width: 120, height: 150, fillColor: '#0284C7', r1: 14 },
    { name: 'Color: Cyan Light (#38BDF8)', x: 824, y: 260, width: 120, height: 150, fillColor: '#38BDF8', r1: 14 },
    { name: 'Color: Cosmic Indigo (#6366F1)', x: 960, y: 260, width: 120, height: 150, fillColor: '#6366F1', r1: 14 },
    { name: 'Color: Solar Amber (#F59E0B)', x: 1096, y: 260, width: 120, height: 150, fillColor: '#F59E0B', r1: 14 },
    { name: 'Color: Stable Emerald (#10B981)', x: 1232, y: 260, width: 120, height: 150, fillColor: '#10B981', r1: 14 },

    // Section 2: Typography Scale & Inter System
    { name: 'Card: Typography Scale', x: 120, y: 460, width: 640, height: 490, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Type Row: Display 1 (26/34 Bold)', x: 144, y: 500, width: 590, height: 50, fillColor: '#172132', r1: 10 },
    { name: 'Type Row: Heading 1 (20/26 SemiBold)', x: 144, y: 560, width: 590, height: 50, fillColor: '#172132', r1: 10 },
    { name: 'Type Row: Heading 2 (16/22 SemiBold)', x: 144, y: 620, width: 590, height: 50, fillColor: '#172132', r1: 10 },
    { name: 'Type Row: Body Default (14/20 Regular)', x: 144, y: 680, width: 590, height: 50, fillColor: '#172132', r1: 10 },
    { name: 'Type Row: Caption (11/15 Medium)', x: 144, y: 740, width: 590, height: 50, fillColor: '#172132', r1: 10 },
    { name: 'Type Row: Eyebrow Mono (10/14 Bold)', x: 144, y: 800, width: 590, height: 50, fillColor: '#172132', r1: 10 },
    { name: 'Type Row: Timer Numerals (64 Mono Black)', x: 144, y: 860, width: 590, height: 70, fillColor: '#0284C7', fillOpacity: 0.15, r1: 12, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },

    // Section 3: Realistic Planetary Visual Vocabulary & Lighting
    { name: 'Card: Celestial Graphics Vocabulary', x: 790, y: 460, width: 650, height: 490, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    // 5 Planet Render Specimens
    { name: 'Specimen: Rocky Planet Sphere', x: 820, y: 510, width: 100, height: 100, type: 'circle', fillColor: '#0284C7', r1: 50, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2 }] },
    { name: 'Specimen: Ringed Gas Giant', x: 945, y: 510, width: 100, height: 100, type: 'circle', fillColor: '#F59E0B', r1: 50, strokes: [{ 'stroke-color': '#D97706', 'stroke-width': 2 }] },
    { name: 'Specimen: Ice Giant Blue-White', x: 1070, y: 510, width: 100, height: 100, type: 'circle', fillColor: '#38BDF8', r1: 50, strokes: [{ 'stroke-color': '#FFFFFF', 'stroke-width': 2 }] },
    { name: 'Specimen: Lava Volcanic Core', x: 1195, y: 510, width: 100, height: 100, type: 'circle', fillColor: '#F43F5E', r1: 50, strokes: [{ 'stroke-color': '#991B1B', 'stroke-width': 2 }] },
    { name: 'Specimen: Quantum Star Flare', x: 1320, y: 510, width: 100, height: 100, type: 'circle', fillColor: '#FFFFFF', r1: 50, strokes: [{ 'stroke-color': '#FACC15', 'stroke-width': 3 }] },
    { name: 'Note: Rayleigh Atmospheric Scattering Rules', x: 820, y: 640, width: 600, height: 290, fillColor: '#0C1017', r1: 14, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] }
  ];
  await commitShapesToPage(pages.foundations, foundationShapes, '01 Foundations');

  // ════════════════════════════════════════════════════════════════
  // 3. PAGE "02 Components": Complete Master Component Set
  // ════════════════════════════════════════════════════════════════
  const componentShapes: ShapeDef[] = [
    { name: 'Components Canvas Base', x: 80, y: 80, width: 1400, height: 1100, fillColor: '#06080D', r1: 24, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Header: Master UI Components & Variants', x: 120, y: 120, width: 1320, height: 80, fillColor: '#0C1017', r1: 18, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },

    // Row 1: Buttons & Interactive Controls
    { name: 'Card: Buttons & CTAs', x: 120, y: 220, width: 420, height: 380, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Comp: Primary CTA (Start Focus)', x: 144, y: 260, width: 372, height: 54, fillColor: '#0284C7', r1: 18, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Comp: Secondary Button', x: 144, y: 326, width: 372, height: 50, fillColor: '#172132', r1: 16, strokes: [{ 'stroke-color': '#24344D', 'stroke-width': 1 }] },
    { name: 'Comp: Destructive / Reset Pill', x: 144, y: 388, width: 175, height: 46, fillColor: '#F43F5E', fillOpacity: 0.18, r1: 14, strokes: [{ 'stroke-color': '#F43F5E', 'stroke-width': 1 }] },
    { name: 'Comp: Ghost Refocus Button', x: 341, y: 388, width: 175, height: 46, fillColor: '#0C1017', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1 }] },
    { name: 'Comp: Circular Icon Button 48pt', x: 144, y: 446, width: 48, height: 48, type: 'circle', fillColor: '#172132', r1: 24, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Comp: Subject Chip / Tag Pill', x: 210, y: 452, width: 140, height: 36, fillColor: '#0284C7', fillOpacity: 0.2, r1: 18, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Comp: Focus Shield Status Pill', x: 365, y: 452, width: 151, height: 36, fillColor: '#10B981', fillOpacity: 0.18, r1: 18, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },

    // Row 1 Column 2: Cards, Tasks, Weekly Strip
    { name: 'Card: Cards & Task Lists', x: 570, y: 220, width: 420, height: 380, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Comp: Task Card (Polity Preamble)', x: 594, y: 260, width: 372, height: 74, fillColor: '#172132', r1: 16, strokes: [{ 'stroke-color': '#24344D', 'stroke-width': 1 }] },
    { name: 'Comp: Completed Task Card', x: 594, y: 344, width: 372, height: 74, fillColor: '#0C1017', r1: 16, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },
    { name: 'Comp: Weekly Strip Bar', x: 594, y: 428, width: 372, height: 60, fillColor: '#0C1017', r1: 16, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Comp: Telemetry Stat Card', x: 594, y: 500, width: 175, height: 80, fillColor: '#172132', r1: 14, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Comp: Proof Metric Badge', x: 791, y: 500, width: 175, height: 80, fillColor: '#172132', r1: 14, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },

    // Row 1 Column 3: Dials, Modals, State Indicators
    { name: 'Card: Dial, Progress Rings & Dialogs', x: 1020, y: 220, width: 420, height: 380, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Comp: Progress Ring (Timer Dial)', x: 1050, y: 260, width: 140, height: 140, type: 'circle', fillColor: '#06080D', r1: 70, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 6 }] },
    { name: 'Comp: Mode Badge (Stage I)', x: 1220, y: 260, width: 195, height: 42, fillColor: '#38BDF8', fillOpacity: 0.18, r1: 10, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Comp: Toast Notification (XP Earned)', x: 1050, y: 420, width: 365, height: 50, fillColor: '#10B981', fillOpacity: 0.2, r1: 14, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },
    { name: 'Comp: Warning Toast (Drift Warning)', x: 1050, y: 480, width: 365, height: 50, fillColor: '#F59E0B', fillOpacity: 0.2, r1: 14, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1 }] },
    { name: 'Comp: Offline State Ribbon', x: 1050, y: 540, width: 365, height: 40, fillColor: '#1E293B', r1: 10, strokes: [{ 'stroke-color': '#64748B', 'stroke-width': 1 }] },

    // Row 2: Bottom Sheets & Achievement Badges
    { name: 'Card: Modal Sheets & Certificate Tokens', x: 120, y: 630, width: 1320, height: 420, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Comp: World Inspector Bottom Drawer', x: 150, y: 670, width: 400, height: 340, fillColor: '#0C1017', r1: 24, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },
    { name: 'Comp: Completion Modal Card', x: 580, y: 670, width: 400, height: 340, fillColor: '#0C1017', r1: 24, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1.5 }] },
    { name: 'Comp: Mode Completion Certificate', x: 1010, y: 670, width: 400, height: 340, fillColor: '#0B0F17', r1: 24, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1.5 }] }
  ];
  await commitShapesToPage(pages.components, componentShapes, '02 Components');

  // ════════════════════════════════════════════════════════════════
  // 4. PAGE "04 Motion Specs": Exact Animation Timing, Easing & Reductions
  // ════════════════════════════════════════════════════════════════
  const motionShapes: ShapeDef[] = [
    { name: 'Motion Specs Canvas Base', x: 80, y: 80, width: 1400, height: 950, fillColor: '#06080D', r1: 24, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Header: Motion Specifications & Physics Timings', x: 120, y: 120, width: 1320, height: 80, fillColor: '#0C1017', r1: 18, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },

    // Motion Grid: 8 Choreographed Motion Events
    { name: 'Motion Spec: 1. Planet Creation (Big Bang Genesis)', x: 120, y: 230, width: 310, height: 320, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Motion Spec: 2. Timer Start & Pulse Ignition', x: 450, y: 230, width: 310, height: 320, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Motion Spec: 3. Cosmic Dust Accretion Inward', x: 780, y: 230, width: 310, height: 320, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#6366F1', 'stroke-width': 1 }] },
    { name: 'Motion Spec: 4. Session Completion Growth Burst', x: 1110, y: 230, width: 310, height: 320, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1 }] },

    { name: 'Motion Spec: 5. Moon & Task Creation Orbiting', x: 120, y: 580, width: 310, height: 320, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1 }] },
    { name: 'Motion Spec: 6. Comet Streak on Milestone', x: 450, y: 580, width: 310, height: 320, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#F43F5E', 'stroke-width': 1 }] },
    { name: 'Motion Spec: 7. Mode Evolution to Supercluster', x: 780, y: 580, width: 310, height: 320, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#A855F7', 'stroke-width': 1 }] },
    { name: 'Motion Spec: 8. Reduced Motion System (A11y Fallback)', x: 1110, y: 580, width: 310, height: 320, fillColor: '#0C1017', r1: 16, strokes: [{ 'stroke-color': '#64748B', 'stroke-width': 1 }] }
  ];
  await commitShapesToPage(pages.motion, motionShapes, '04 Motion Specs');

  // ════════════════════════════════════════════════════════════════
  // 5. PAGE "05 Prototype": Interactive User Flows & Clickable Connections
  // ════════════════════════════════════════════════════════════════
  const prototypeShapes: ShapeDef[] = [
    { name: 'Prototype Canvas Base', x: 80, y: 80, width: 1400, height: 950, fillColor: '#06080D', r1: 24, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Header: Clickable User Flow Map & Triggers', x: 120, y: 120, width: 1320, height: 80, fillColor: '#0C1017', r1: 18, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },

    // Primary Loop: Onboarding -> Focus Home -> Active Session -> Session Complete
    { name: 'Node: Onboarding (Create Planet)', x: 120, y: 240, width: 280, height: 160, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2 }] },
    { name: 'Flow Arrow: Onboard to Home', x: 420, y: 315, width: 80, height: 6, fillColor: '#38BDF8', r1: 3 },
    
    { name: 'Node: Focus Home (Hero Cosmos)', x: 520, y: 240, width: 280, height: 160, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 2 }] },
    { name: 'Flow Arrow: Start Focus Sprint', x: 820, y: 315, width: 80, height: 6, fillColor: '#0284C7', r1: 3 },

    { name: 'Node: Active Session Sprint (Timer + Accretion)', x: 920, y: 240, width: 280, height: 160, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#6366F1', 'stroke-width': 2 }] },
    { name: 'Flow Arrow: Timer Finish (00:00)', x: 1220, y: 315, width: 80, height: 6, fillColor: '#10B981', r1: 3 },

    { name: 'Node: Session Complete Modal (+XP Burst)', x: 1320, y: 240, width: 150, height: 160, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 2 }] },

    // Secondary Loops: Galaxy Zoom & Tasks
    { name: 'Node: My Galaxy Zoom & Filter Horizon', x: 120, y: 470, width: 380, height: 180, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#A855F7', 'stroke-width': 1.5 }] },
    { name: 'Node: Task & Moon Creation Flow', x: 540, y: 470, width: 380, height: 180, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1.5 }] },
    { name: 'Node: 10-Mode Roadmap Evolution Flow', x: 960, y: 470, width: 440, height: 180, fillColor: '#0F1623', r1: 16, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1.5 }] },

    // Proof & Hall of Fame
    { name: 'Node: Proof of Work Chronicle & Share Card', x: 120, y: 690, width: 620, height: 210, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1.5 }] },
    { name: 'Node: Hall of Fame Trophy Badges Shelf', x: 780, y: 690, width: 620, height: 210, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1.5 }] }
  ];
  await commitShapesToPage(pages.prototype, prototypeShapes, '05 Prototype');

  // ════════════════════════════════════════════════════════════════
  // 6. PAGE "06 Handoff": Developer Specs, WebGL/Canvas Architecture, Responsive Breakpoints
  // ════════════════════════════════════════════════════════════════
  const handoffShapes: ShapeDef[] = [
    { name: 'Handoff Canvas Base', x: 80, y: 80, width: 1400, height: 1050, fillColor: '#06080D', r1: 24, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 2 }] },
    { name: 'Header: Engineering Handoff & Technical Implementation', x: 120, y: 120, width: 1320, height: 80, fillColor: '#0C1017', r1: 18, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1.5 }] },

    // Card 1: Canvas & WebGL Procedural Architecture
    { name: 'Card: HTML5 Canvas / WebGL Implementation Guide', x: 120, y: 230, width: 640, height: 400, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1.5 }] },
    { name: 'Spec Item: Mulberry32 Seeded Deterministic PRNG', x: 144, y: 270, width: 590, height: 75, fillColor: '#172132', r1: 12 },
    { name: 'Spec Item: Volumetric Dual-Gradient Infrared Nebula', x: 144, y: 355, width: 590, height: 75, fillColor: '#172132', r1: 12 },
    { name: 'Spec Item: Dynamic Solar Terminator & Shadow Vector', x: 144, y: 440, width: 590, height: 75, fillColor: '#172132', r1: 12 },
    { name: 'Spec Item: DPR Screen Density Hardware Scaling', x: 144, y: 525, width: 590, height: 75, fillColor: '#172132', r1: 12 },

    // Card 2: Server-Authoritative API Integration Routes
    { name: 'Card: Server APIs & Offline Sync Pipeline', x: 790, y: 230, width: 650, height: 400, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#10B981', 'stroke-width': 1.5 }] },
    { name: 'API Item: POST /api/user/study-sessions/start', x: 814, y: 270, width: 600, height: 75, fillColor: '#172132', r1: 12 },
    { name: 'API Item: POST /api/user/study-sessions/:id/complete', x: 814, y: 355, width: 600, height: 75, fillColor: '#172132', r1: 12 },
    { name: 'API Item: Offline IndexedDB / LocalStorage Sync Queue', x: 814, y: 440, width: 600, height: 75, fillColor: '#172132', r1: 12 },
    { name: 'API Item: Focus Shield Zero-Bypass VPN Hookup', x: 814, y: 525, width: 600, height: 75, fillColor: '#172132', r1: 12 },

    // Card 3: Responsive Breakpoints (Mobile 390 -> Large Android 412 -> Tablet 768 -> Desktop 1440)
    { name: 'Card: Responsive Layout Breakpoints Matrix', x: 120, y: 660, width: 1320, height: 350, fillColor: '#0F1623', r1: 18, strokes: [{ 'stroke-color': '#1B273A', 'stroke-width': 1 }] },
    { name: 'Breakpoint 1: Compact Mobile (390 x 844)', x: 144, y: 710, width: 290, height: 260, fillColor: '#172132', r1: 14, strokes: [{ 'stroke-color': '#0284C7', 'stroke-width': 1 }] },
    { name: 'Breakpoint 2: Standard Android (412 x 915)', x: 460, y: 710, width: 290, height: 260, fillColor: '#172132', r1: 14, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1 }] },
    { name: 'Breakpoint 3: Tablet iPad (768 x 1024)', x: 776, y: 710, width: 290, height: 260, fillColor: '#172132', r1: 14, strokes: [{ 'stroke-color': '#6366F1', 'stroke-width': 1 }] },
    { name: 'Breakpoint 4: Ultra-Wide Desktop (1440 x 900)', x: 1092, y: 710, width: 320, height: 260, fillColor: '#172132', r1: 14, strokes: [{ 'stroke-color': '#F59E0B', 'stroke-width': 1 }] }
  ];
  await commitShapesToPage(pages.handoff, handoffShapes, '06 Handoff');

  console.log('\n🎉 ALL 7 PAGES IN PENPOT COMPLETELY POPULATED WITH MASTER DESIGNS!');
}

populateAllPages();
