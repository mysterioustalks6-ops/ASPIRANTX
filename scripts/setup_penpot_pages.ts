import 'dotenv/config';
import crypto from 'crypto';

async function setupPenpotPages() {
  const token = process.env.PENPOT_ACCESS_TOKEN;
  const fileId = process.env.PENPOT_FILE_ID;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Token ${token}`
  };

  const fileRes = await fetch('https://design.penpot.app/api/rpc/command/get-file', {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: fileId })
  });
  const fileData = await fileRes.json();
  console.log(`Current file revn: ${fileData.revn}, vern: ${fileData.vern}`);

  const pagesIndex = fileData.data?.pagesIndex || {};
  console.log('Existing pages:', Object.values(pagesIndex).map((p: any) => ({ id: p.id, name: p.name })));

  // Desired pages:
  // 00 Research
  // 01 Foundations
  // 02 Components
  // 03 Screens
  // 04 Motion Specs
  // 05 Prototype
  // 06 Handoff

  const targetPages = [
    '00 Research',
    '01 Foundations',
    '02 Components',
    '03 Screens',
    '04 Motion Specs',
    '05 Prototype',
    '06 Handoff'
  ];

  // We can rename existing pages if suitable or add missing pages
  // Page 1 -> rename to "03 Screens" (or "01 Foundations")
  // Page "02 — Focus Galaxy Design System" -> rename to "02 Components"
  const existingNames = Object.values(pagesIndex).map((p: any) => p.name);

  const changes: any[] = [];

  // Rename Page 1 (id: 24d9d841-759d-81bc-8008-b8c60cf34505) to "03 Screens"
  const page1 = Object.values(pagesIndex).find((p: any) => p.id === '24d9d841-759d-81bc-8008-b8c60cf34505');
  if (page1 && (page1 as any).name !== '03 Screens') {
    changes.push({
      type: 'mod-page',
      id: (page1 as any).id,
      name: '03 Screens'
    });
  }

  // Rename Page 2 (id: 3b8504a9-3204-453b-a681-cdee19f0649d) to "02 Components"
  const page2 = Object.values(pagesIndex).find((p: any) => p.id === '3b8504a9-3204-453b-a681-cdee19f0649d');
  if (page2 && (page2 as any).name !== '02 Components') {
    changes.push({
      type: 'mod-page',
      id: (page2 as any).id,
      name: '02 Components'
    });
  }

  // Add the remaining pages: '00 Research', '01 Foundations', '04 Motion Specs', '05 Prototype', '06 Handoff'
  const needed = ['00 Research', '01 Foundations', '04 Motion Specs', '05 Prototype', '06 Handoff'];
  for (const n of needed) {
    const found = Object.values(pagesIndex).find((p: any) => p.name === n);
    if (!found) {
      changes.push({
        type: 'add-page',
        id: crypto.randomUUID(),
        name: n
      });
    }
  }

  console.log(`Committing ${changes.length} page setup changes...`);

  if (changes.length > 0) {
    const updateRes = await fetch('https://design.penpot.app/api/rpc/command/update-file', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: fileId,
        'session-id': crypto.randomUUID(),
        revn: fileData.revn,
        vern: fileData.vern,
        changes
      })
    });

    if (updateRes.ok) {
      const resData = await updateRes.json();
      console.log('✅ Pages successfully configured! New revn:', resData.revn);
    } else {
      console.error('Page configuration error:', await updateRes.text());
    }
  } else {
    console.log('All pages already configured.');
  }
}

setupPenpotPages();
