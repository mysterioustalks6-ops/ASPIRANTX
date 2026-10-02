import crypto from 'crypto';

const token = process.env.PENPOT_ACCESS_TOKEN || 'eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2R0NNIn0.d7r9MGfg50_apC9udh8tfWEYqbLlAa2MWoAnZ9CCjqJRbs8-QevyPg.w20YXFxSEQzD4F1O.vF2whyAqtCAEmE9B7lNxoVPD_RG4D6XsfRAOz9CWxF3VFfVHEdlJpJPYMR3dUfaDpglGh3qj6TtI1xDxm2ub8XnIafOf23tYvuKGSnFbewIfua8TTZS6AZzQRjlJ1eMeZeqzaBlN2cZVArxHMtC6mLEC-_1jW_MrYt4fwWHQSCMqxQ9xfjRW4vTS06S0Zls7y_TIroIfAMrE.zUnJIHXzySDvBODjIm6i-g';
const fileId = '19c47d73-0a5d-8067-8008-ba951ea6ced3';

export const STUDYRIDE_PAGES = [
  '01 Research',
  '02 UX Audit',
  '03 Information Architecture',
  '04 User Flows',
  '05 Design Principles',
  '06 Design Tokens',
  '07 Typography',
  '08 Components',
  '09 Android Navigation',
  '10 Authentication',
  '11 Home',
  '12 Exams',
  '13 Practice',
  '14 PYQ',
  '15 Mock Tests',
  '16 CBT',
  '17 Results',
  '18 History',
  '19 Profile',
  '20 Accessibility',
  '21 Permissions',
  '22 Admin',
  '23 States',
  '24 Prototype',
  '25 Final Android Screens',
  '26 Handoff'
];

async function setupPages() {
  console.log('🚀 Connecting to StudyRide Penpot file:', fileId);
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
  const existingPages = Object.values(pagesIndex);

  console.log(`Current file revn: ${currentRevn}, vern: ${fileData.vern}, existing pages: ${existingPages.length}`);

  const changes = [];

  // Rename first page if needed
  if (existingPages.length > 0 && existingPages[0].name !== STUDYRIDE_PAGES[0]) {
    changes.push({
      type: 'mod-page',
      id: existingPages[0].id,
      name: STUDYRIDE_PAGES[0]
    });
  }

  // Create remaining pages from index 1 to 25
  for (let i = 1; i < STUDYRIDE_PAGES.length; i++) {
    const pageName = STUDYRIDE_PAGES[i];
    const exists = existingPages.some(p => p.name === pageName);
    if (!exists) {
      changes.push({
        type: 'add-page',
        id: crypto.randomUUID(),
        name: pageName
      });
    }
  }

  console.log(`Preparing to commit ${changes.length} page setup changes in batches of 5...`);

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

  // Verify pages
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
  const allPages = Object.values(verifyData.data?.pagesIndex || {});
  console.log(`\n🎉 Verified all ${allPages.length} StudyRide Penpot Pages in Master File!`);
  allPages.forEach((p, idx) => console.log(`  [${idx + 1}] ${p.name} (ID: ${p.id})`));

  return verifyData;
}

setupPages().catch(console.error);
