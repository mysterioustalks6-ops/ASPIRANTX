import 'dotenv/config';

async function updatePenpotWorkspace() {
  const token = process.env.PENPOT_ACCESS_TOKEN;
  const fileId = process.env.PENPOT_FILE_ID;
  const pageId = '24d9d841-759d-81bc-8008-b8c60cf34505';

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Token ${token}`
  };

  console.log('🚀 Starting Penpot updates in studyride project...');

  // 1. Rename File to "AspirantX — Focus Galaxy (Design System & Screens)"
  try {
    const res = await fetch('https://design.penpot.app/api/rpc/command/rename-file', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: fileId,
        name: 'AspirantX — Focus Galaxy UI & UX'
      })
    });
    console.log('rename-file status:', res.status);
    if (res.ok) {
      console.log('✅ File successfully renamed to: "AspirantX — Focus Galaxy UI & UX"');
    } else {
      console.log('rename-file response:', await res.text());
    }
  } catch (e: any) {
    console.log('rename-file error:', e.message);
  }

  // 2. Fetch latest file info
  try {
    const res = await fetch('https://design.penpot.app/api/rpc/command/get-file', {
      method: 'POST',
      headers,
      body: JSON.stringify({ id: fileId })
    });
    if (res.ok) {
      const data = await res.json();
      console.log('Updated File Info:', {
        id: data.id,
        name: data.name,
        projectId: data.projectId,
        pages: Object.values(data.data?.pagesIndex || {}).map((p: any) => ({
          id: p.id,
          name: p.name
        }))
      });
    }
  } catch (e: any) {
    console.log('get-file error:', e.message);
  }
}

updatePenpotWorkspace();
