import { preview } from 'vite';
import http from 'http';

function getUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    }).on('error', reject);
  });
}

console.log('=== VITE PREVIEW ASSET RESOLUTION AUDIT ===');

const server = await preview({
  preview: {
    port: 4173,
    host: 'localhost'
  }
});

console.log('Vite preview server listening on http://localhost:4173');

try {
  // 1. Normal route
  console.log('\n--- Normal Route Test: http://localhost:4173/ ---');
  const normalRes = await getUrl('http://localhost:4173/');
  console.log(`GET / -> HTTP ${normalRes.statusCode}`);

  // Extract CSS and JS href/src from index.html (supports both /assets and ./assets)
  const cssMatch = normalRes.body.match(/(?:href|src)="(?:\.\/|\/)?(assets\/[^"]+\.css)"/);
  const jsMatch = normalRes.body.match(/(?:href|src)="(?:\.\/|\/)?(assets\/[^"]+\.js)"/);

  const cssUrl = cssMatch ? `http://localhost:4173/${cssMatch[1]}` : null;
  const jsUrl = jsMatch ? `http://localhost:4173/${jsMatch[1]}` : null;

  if (cssUrl) {
    const cssRes = await getUrl(cssUrl);
    console.log(`GET /${cssMatch[1]} -> HTTP ${cssRes.statusCode} (${cssRes.headers['content-type']})`);
  }
  if (jsUrl) {
    const jsRes = await getUrl(jsUrl);
    console.log(`GET /${jsMatch[1]} -> HTTP ${jsRes.statusCode} (${jsRes.headers['content-type']})`);
  }

  // 2. Nested route
  console.log('\n--- Nested Route Test: http://localhost:4173/nested/curriculum/deep ---');
  const nestedRes = await getUrl('http://localhost:4173/nested/curriculum/deep');
  console.log(`GET /nested/curriculum/deep -> HTTP ${nestedRes.statusCode}`);

  if (cssUrl) {
    const nestedCssRes = await getUrl(cssUrl);
    console.log(`GET (nested asset) ${cssMatch[1]} -> HTTP ${nestedCssRes.statusCode}`);
  }
  if (jsUrl) {
    const nestedJsRes = await getUrl(jsUrl);
    console.log(`GET (nested asset) ${jsMatch[1]} -> HTTP ${nestedJsRes.statusCode}`);
  }

} catch (err) {
  console.error('Error during asset loading test:', err);
} finally {
  server.httpServer.close();
  process.exit(0);
}
