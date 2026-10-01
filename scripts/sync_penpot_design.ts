import 'dotenv/config';

interface PenpotShape {
  id: string;
  name: string;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fills?: any[];
  strokes?: any[];
  shapes?: string[];
  [key: string]: any;
}

export async function fetchPenpotFile(fileId?: string, token?: string) {
  const finalToken = token || process.env.PENPOT_ACCESS_TOKEN;
  const finalFileId = fileId || process.env.PENPOT_FILE_ID;

  if (!finalToken) {
    throw new Error('PENPOT_ACCESS_TOKEN is missing in environment variables.');
  }
  if (!finalFileId) {
    throw new Error('PENPOT_FILE_ID is missing in environment variables.');
  }

  const res = await fetch('https://design.penpot.app/api/rpc/command/get-file', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Token ${finalToken}`
    },
    body: JSON.stringify({ id: finalFileId })
  });

  if (!res.ok) {
    throw new Error(`Penpot API error: HTTP ${res.status} - ${await res.text()}`);
  }

  return await res.json();
}

async function main() {
  console.log('================================================================');
  console.log('🎨 PENPOT DESIGN WORKSPACE SYNCHRONIZER');
  console.log('================================================================\n');

  try {
    const fileData = await fetchPenpotFile();
    console.log(`✅ Connected successfully to Penpot!`);
    console.log(`- File Name: "${fileData.name}"`);
    console.log(`- File ID: ${fileData.id}`);
    console.log(`- Modified At: ${fileData.modifiedAt}`);

    const pagesIndex = fileData.data?.pagesIndex || {};
    const pageKeys = Object.keys(pagesIndex);
    console.log(`\n📄 Pages Found: ${pageKeys.length}`);

    for (const pId of pageKeys) {
      const page = pagesIndex[pId];
      const objects = page.objects || {};
      const objList: PenpotShape[] = Object.values(objects);
      const nonRootObjects = objList.filter(o => o.id !== '00000000-0000-0000-0000-000000000000');

      console.log(`\n  ➤ Page: "${page.name}" (ID: ${pId})`);
      console.log(`    Total Objects / Shapes: ${nonRootObjects.length}`);

      if (nonRootObjects.length === 0) {
        console.log(`    ℹ️ Canvas is currently blank. Draw frames, cards, or components in Penpot and run this sync again!`);
      } else {
        console.log(`    Objects breakdown:`);
        for (const obj of nonRootObjects.slice(0, 15)) {
          console.log(`      - [${obj.type.toUpperCase()}] "${obj.name}" (${Math.round(obj.width || 0)}x${Math.round(obj.height || 0)}px)`);
        }
        if (nonRootObjects.length > 15) {
          console.log(`      ... and ${nonRootObjects.length - 15} more objects.`);
        }
      }
    }

    console.log('\n================================================================');
    console.log('🎯 Penpot live connection is active and ready for design conversion!');
    console.log('================================================================');
  } catch (err: any) {
    console.error('❌ Penpot Sync Error:', err.message);
  }
}

if (process.argv[1]?.endsWith('sync_penpot_design.ts') || process.argv[1]?.endsWith('sync_penpot_design.js')) {
  main();
}
