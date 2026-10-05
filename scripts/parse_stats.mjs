import fs from 'fs';

const data = JSON.parse(fs.readFileSync('dist/stats.html', 'utf-8'));
const root = data.tree;
const mainChunkNode = root.children.find(c => c.name.startsWith('assets/index-') && c.name.endsWith('.js'));

console.log('Main chunk:', mainChunkNode?.name);

function collectModules(node, path = '') {
  let list = [];
  const currentPath = path ? `${path}/${node.name}` : (node.name || '');
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      list = list.concat(collectModules(child, currentPath));
    }
  } else if (node.uid && data.nodeParts[node.uid]) {
    const part = data.nodeParts[node.uid];
    list.push({ path: currentPath, size: part.renderedLength, gzipSize: part.gzipLength });
  }
  return list;
}

if (mainChunkNode) {
  const modules = collectModules(mainChunkNode);
  modules.sort((a, b) => b.size - a.size);

  console.log('\nTop 10 Modules in Main Chunk:');
  modules.slice(0, 10).forEach((m, i) => {
    const cleanPath = m.path
      .replace(/^\u0000/, '')
      .replace(/.*node_modules\//, 'node_modules/')
      .replace(/.*src\//, 'src/');
    console.log(`${i + 1}. ${cleanPath} (${(m.size / 1024).toFixed(1)} KB)`);
  });
}
