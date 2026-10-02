import 'dotenv/config';
import crypto from 'crypto';

const token = process.env.PENPOT_ACCESS_TOKEN || 'eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2R0NNIn0.d7r9MGfg50_apC9udh8tfWEYqbLlAa2MWoAnZ9CCjqJRbs8-QevyPg.w20YXFxSEQzD4F1O.vF2whyAqtCAEmE9B7lNxoVPD_RG4D6XsfRAOz9CWxF3VFfVHEdlJpJPYMR3dUfaDpglGh3qj6TtI1xDxm2ub8XnIafOf23tYvuKGSnFbewIfua8TTZS6AZzQRjlJ1eMeZeqzaBlN2cZVArxHMtC6mLEC-_1jW_MrYt4fwWHQSCMqxQ9xfjRW4vTS06S0Zls7y_TIroIfAMrE.zUnJIHXzySDvBODjIm6i-g';
const fileId = '19c47d73-0a5d-8067-8008-ba88041e0635';

export const MASTER_PAGES = [
  '01 UX Audit',
  '02 Information Architecture',
  '03 User Flows',
  '04 Design Tokens',
  '05 Components',
  '06 Navigation',
  '07 Authentication',
  '08 Home',
  '09 Exam Discovery',
  '10 Practice',
  '11 PYQ',
  '12 Mock Tests',
  '13 CBT',
  '14 Results',
  '15 History',
  '16 Profile',
  '17 Accessibility',
  '18 Admin',
  '19 States',
  '20 Prototype',
  '21 Final UX Review',
  '22 Handoff'
];

async function setupAll22Pages() {
  console.log('🚀 Connecting to Penpot file:', fileId);
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
  const existingPages = Object.values(pagesIndex) as any[];

  console.log(`Current file revn: ${currentRevn}, vern: ${fileData.vern}, existing pages: ${existingPages.length}`);

  const changes: any[] = [];

  // Rename first page to '01 UX Audit'
  if (existingPages.length > 0 && existingPages[0].name !== MASTER_PAGES[0]) {
    changes.push({
      type: 'mod-page',
      id: existingPages[0].id,
      name: MASTER_PAGES[0]
    });
  }

  // Create missing pages from 02 to 22
  for (let i = 1; i < MASTER_PAGES.length; i++) {
    const pageName = MASTER_PAGES[i];
    const exists = existingPages.some(p => p.name === pageName);
    if (!exists) {
      changes.push({
        type: 'add-page',
        id: crypto.randomUUID(),
        name: pageName
      });
    }
  }

  console.log(`Preparing to commit ${changes.length} page setup changes...`);

  // Batch create/rename pages
  const batchSize = 5;
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
      console.log(`  ✓ Page batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(changes.length / batchSize)} committed (New revn: ${currentRevn})`);
    } else {
      console.error('Page creation error:', await updateRes.text());
    }
  }

  // Verification fetch
  const verifyRes = await fetch('https://design.penpot.app/api/rpc/command/get-file', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Token ${token}`
    },
    body: JSON.stringify({ id: fileId })
  });

  const verifyData = await verifyRes.json();
  const finalPages = Object.values(verifyData.data?.pagesIndex || {}) as any[];
  console.log(`\n🎉 SUCCESS: All 22 pages configured! Total pages now: ${finalPages.length}`);
  finalPages.forEach((p, idx) => console.log(`   ${idx + 1}. [${p.id}] ${p.name}`));
}

setupAll22Pages().catch(err => {
  console.error('Error setting up Penpot pages:', err);
  process.exit(1);
});
