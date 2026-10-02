import crypto from 'crypto';

const token = process.env.PENPOT_ACCESS_TOKEN || 'eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2R0NNIn0.d7r9MGfg50_apC9udh8tfWEYqbLlAa2MWoAnZ9CCjqJRbs8-QevyPg.w20YXFxSEQzD4F1O.vF2whyAqtCAEmE9B7lNxoVPD_RG4D6XsfRAOz9CWxF3VFfVHEdlJpJPYMR3dUfaDpglGh3qj6TtI1xDxm2ub8XnIafOf23tYvuKGSnFbewIfua8TTZS6AZzQRjlJ1eMeZeqzaBlN2cZVArxHMtC6mLEC-_1jW_MrYt4fwWHQSCMqxQ9xfjRW4vTS06S0Zls7y_TIroIfAMrE.zUnJIHXzySDvBODjIm6i-g';
const fileId = '19c47d73-0a5d-8067-8008-ba951ea6ced3';

function makeShape(s, parentId, frameId) {
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

// Generate Artboard frames for standard phone widths: Small (320px), Standard (360px), Large (393px - Vivo V2240), Tablet (412px)
function createScreenArtboard(title, xOffset, themeColor = '#0284C7') {
  return [
    // Device Frame (Vivo V2240: 393 x 852 CSS px)
    { name: `📱 ${title} [Vivo V2240 / 393x852]`, x: xOffset, y: 50, width: 393, height: 852, fillColor: '#090D16', r1: 44, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 3, 'stroke-style': 'solid' }] },
    // Status Bar & Punch Hole
    { name: 'Status Bar & Notch', x: xOffset + 140, y: 64, width: 113, height: 26, fillColor: '#020617', r1: 13 },
    { name: 'Punch-hole Camera', x: xOffset + 189, y: 72, width: 15, height: 15, fillColor: '#000000', r1: 8 },
    // Top App Bar
    { name: 'Header App Bar', x: xOffset + 16, y: 100, width: 361, height: 60, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1, 'stroke-style': 'solid' }] },
    { name: 'StudyRide Brand Pill', x: xOffset + 28, y: 114, width: 120, height: 32, fillColor: themeColor, r1: 8 },
    // Primary Content Card
    { name: 'Hero Content Card', x: xOffset + 16, y: 176, width: 361, height: 210, fillColor: '#0B132B', r1: 20, strokes: [{ 'stroke-color': themeColor, 'stroke-width': 1.5, 'stroke-style': 'solid' }] },
    // Secondary Interactive Cards
    { name: 'Interactive Module 1', x: xOffset + 16, y: 402, width: 174, height: 140, fillColor: '#111827', r1: 16, strokes: [{ 'stroke-color': '#1F2937', 'stroke-width': 1, 'stroke-style': 'solid' }] },
    { name: 'Interactive Module 2', x: xOffset + 203, y: 402, width: 174, height: 140, fillColor: '#111827', r1: 16, strokes: [{ 'stroke-color': '#1F2937', 'stroke-width': 1, 'stroke-style': 'solid' }] },
    // Practice & Activity List
    { name: 'Activity List Card 1', x: xOffset + 16, y: 558, width: 361, height: 72, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1, 'stroke-style': 'solid' }] },
    { name: 'Activity List Card 2', x: xOffset + 16, y: 642, width: 361, height: 72, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1, 'stroke-style': 'solid' }] },
    // Bottom Safe Area & Floating Navigation Bar
    { name: 'StudyRide Bottom Nav Dock', x: xOffset + 16, y: 738, width: 361, height: 68, fillColor: '#030712', r1: 24, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 1.5, 'stroke-style': 'solid' }] },
    { name: 'Nav Item 1 (Home)', x: xOffset + 36, y: 752, width: 44, height: 40, fillColor: '#0284C7', r1: 10 },
    { name: 'Nav Item 2 (Exams)', x: xOffset + 104, y: 752, width: 44, height: 40, fillColor: '#1E293B', r1: 10 },
    { name: 'Nav Item 3 (Practice)', x: xOffset + 174, y: 746, width: 48, height: 50, fillColor: '#38BDF8', r1: 14 },
    { name: 'Nav Item 4 (Progress)', x: xOffset + 244, y: 752, width: 44, height: 40, fillColor: '#1E293B', r1: 10 },
    { name: 'Nav Item 5 (More)', x: xOffset + 312, y: 752, width: 44, height: 40, fillColor: '#1E293B', r1: 10 },
    // Android Gesture Pill
    { name: 'Android 15 Gesture Bar', x: xOffset + 126, y: 836, width: 140, height: 5, fillColor: '#94A3B8', r1: 3 }
  ];
}

// CBT Specific Artboard
function createCbtArtboard(title, xOffset) {
  return [
    { name: `⚡ ${title} [Vivo V2240 / 393x852]`, x: xOffset, y: 50, width: 393, height: 852, fillColor: '#090D16', r1: 44, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 3, 'stroke-style': 'solid' }] },
    // Status Bar
    { name: 'Status Bar & Notch', x: xOffset + 140, y: 64, width: 113, height: 26, fillColor: '#020617', r1: 13 },
    // CBT Test Bar: Timer, Pause, Section, Bilingual Switch
    { name: 'CBT Examination Header', x: xOffset + 12, y: 100, width: 369, height: 52, fillColor: '#0F172A', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1, 'stroke-style': 'solid' }] },
    { name: 'Timer Box [01:59:59]', x: xOffset + 24, y: 110, width: 100, height: 32, fillColor: '#1E1B4B', r1: 8, strokes: [{ 'stroke-color': '#818CF8', 'stroke-width': 1, 'stroke-style': 'solid' }] },
    { name: 'Bilingual Switch [EN | HI]', x: xOffset + 140, y: 110, width: 88, height: 32, fillColor: '#1E293B', r1: 8 },
    { name: 'Section Pill (General Knowledge)', x: xOffset + 240, y: 110, width: 130, height: 32, fillColor: '#0369A1', r1: 8 },
    // Question Meta & Content Card
    { name: 'Question Card (Q.12)', x: xOffset + 12, y: 164, width: 369, height: 180, fillColor: '#0F172A', r1: 16, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1, 'stroke-style': 'solid' }] },
    { name: 'Marks Indicator [+1.0, -0.33]', x: xOffset + 24, y: 176, width: 120, height: 24, fillColor: '#064E3B', r1: 6 },
    // MCQ 4 Options
    { name: 'Option A (Unselected)', x: xOffset + 12, y: 356, width: 369, height: 60, fillColor: '#1E293B', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1, 'stroke-style': 'solid' }] },
    { name: 'Option B (Selected Active)', x: xOffset + 12, y: 426, width: 369, height: 60, fillColor: '#0369A1', r1: 14, strokes: [{ 'stroke-color': '#38BDF8', 'stroke-width': 2, 'stroke-style': 'solid' }] },
    { name: 'Option C (Unselected)', x: xOffset + 12, y: 496, width: 369, height: 60, fillColor: '#1E293B', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1, 'stroke-style': 'solid' }] },
    { name: 'Option D (Unselected)', x: xOffset + 12, y: 566, width: 369, height: 60, fillColor: '#1E293B', r1: 14, strokes: [{ 'stroke-color': '#334155', 'stroke-width': 1, 'stroke-style': 'solid' }] },
    // Question Palette Drawer Preview
    { name: 'Question Palette Drawer Trigger', x: xOffset + 12, y: 640, width: 369, height: 86, fillColor: '#0B132B', r1: 16, strokes: [{ 'stroke-color': '#1D4ED8', 'stroke-width': 1, 'stroke-style': 'solid' }] },
    // CBT Action Dock (Review, Clear, Prev, Save & Next)
    { name: 'CBT Sticky Action Dock', x: xOffset + 12, y: 738, width: 369, height: 72, fillColor: '#030712', r1: 20, strokes: [{ 'stroke-color': '#1E293B', 'stroke-width': 1.5, 'stroke-style': 'solid' }] },
    { name: 'Mark For Review Button', x: xOffset + 24, y: 750, width: 75, height: 48, fillColor: '#6D28D9', r1: 12 },
    { name: 'Clear Button', x: xOffset + 107, y: 750, width: 55, height: 48, fillColor: '#334155', r1: 12 },
    { name: 'Previous Button', x: xOffset + 170, y: 750, width: 55, height: 48, fillColor: '#1E293B', r1: 12 },
    { name: 'Save & Next (Primary CTA)', x: xOffset + 233, y: 750, width: 136, height: 48, fillColor: '#10B981', r1: 12 },
    // Android Gesture Pill
    { name: 'Android 15 Gesture Bar', x: xOffset + 126, y: 836, width: 140, height: 5, fillColor: '#94A3B8', r1: 3 }
  ];
}

async function populateAllPages() {
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
  const pagesList = Object.values(pagesIndex);
  const rootId = '00000000-0000-0000-0000-000000000000';

  console.log(`Connecting to ${pagesList.length} pages in file "${fileData.name}" (revn: ${currentRevn})`);

  for (const page of pagesList) {
    const pageName = page.name;
    let shapes = [];

    if (pageName.includes('CBT') || pageName.includes('Mock Tests')) {
      shapes = [
        ...createCbtArtboard(`${pageName} - Standard View`, 50),
        ...createCbtArtboard(`${pageName} - Palette Open`, 480)
      ];
    } else {
      shapes = [
        ...createScreenArtboard(`${pageName} - Primary View`, 50, '#0284C7'),
        ...createScreenArtboard(`${pageName} - Adaptive Density`, 480, '#6366F1')
      ];
    }

    console.log(`\n📦 Committing ${shapes.length} artboard components to page: "${pageName}"...`);
    const changes = shapes.map(s => ({
      type: 'add-obj',
      id: crypto.randomUUID(),
      'page-id': page.id,
      'parent-id': rootId,
      'frame-id': rootId,
      obj: makeShape(s, rootId, rootId)
    }));

    // Send in batches of 15
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
        const updateData = await updateRes.json();
        currentRevn = updateData.revn;
      } else {
        console.error(`Error on page ${pageName}:`, await updateRes.text());
      }
    }
    console.log(`  ✓ Successfully populated "${pageName}" (Revn: ${currentRevn})`);
  }

  console.log('\n🎉 ALL 26 STUDYRIDE MASTER PENPOT PAGES HAVE BEEN POPULATED WITH MASTER MOBILE ARTBOARDS!');
}

populateAllPages().catch(console.error);
