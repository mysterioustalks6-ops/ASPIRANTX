// CDP automation script for Android Capacitor WebView verification
const CDP_HTTP = 'http://127.0.0.1:9222/json/list';

async function getPageTarget() {
  const res = await fetch(CDP_HTTP);
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page' || t.url.includes('localhost'));
  if (!page) throw new Error('No page target found on Android WebView');
  return page;
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
    this.networkRequests = [];
    this.consoleLogs = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        } else if (msg.method) {
          this.handleEvent(msg.method, msg.params);
        }
      };
    });
  }

  handleEvent(method, params) {
    if (method === 'Network.requestWillBeSent') {
      this.networkRequests.push({
        url: params.request.url,
        method: params.request.method,
        headers: params.request.headers,
        type: params.type,
      });
      if (params.request.url.includes('/api/')) {
        console.log(`[CDP Network Request] ${params.request.method} ${params.request.url}`);
      }
    } else if (method === 'Console.messageAdded') {
      this.consoleLogs.push(params.message.text);
      console.log(`[CDP Console] ${params.message.level}: ${params.message.text}`);
    } else if (method === 'Runtime.consoleAPICalled') {
      const args = (params.args || []).map(a => a.value ?? JSON.stringify(a)).join(' ');
      this.consoleLogs.push(args);
      console.log(`[CDP Runtime Console] ${params.type}: ${args}`);
    }
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval exception: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('Fetching Android WebView CDP target...');
  const page = await getPageTarget();
  console.log(`Found target: ${page.title} (${page.url})`);

  const client = new CDPClient(page.webSocketDebuggerUrl);
  await client.connect();
  console.log('Connected to Android WebView via CDP!');

  await client.send('Network.enable');
  await client.send('Console.enable');
  await client.send('Runtime.enable');

  const currentUrl = await client.eval('window.location.href');
  console.log('Current WebView URL:', currentUrl);

  const checkElements = await client.eval(`
    JSON.stringify({
      hasGuestBtn: Boolean(document.getElementById('landing-guest-demo-btn')),
      hasSignInBtn: Boolean(document.getElementById('landing-signin-btn')),
      title: document.title,
      bodyTextSnippet: document.body.innerText.slice(0, 200)
    })
  `);
  console.log('Initial page elements:', JSON.parse(checkElements));

  // If on landing page, click Explore Demo
  const hasGuestBtn = await client.eval(`Boolean(document.getElementById('landing-guest-demo-btn'))`);
  if (hasGuestBtn) {
    console.log('Clicking Explore Demo button on Android...');
    await client.eval(`document.getElementById('landing-guest-demo-btn').click()`);
    await new Promise(r => setTimeout(r, 2000));
  }

  // Check state after demo login
  const afterLogin = await client.eval(`
    JSON.stringify({
      url: window.location.href,
      bodySnippet: document.body.innerText.slice(0, 300)
    })
  `);
  console.log('After login state:', JSON.parse(afterLogin));

  // Navigate to #tests (CBT Engine)
  console.log('Navigating to #tests...');
  await client.eval(`window.location.hash = '#tests'`);
  await new Promise(r => setTimeout(r, 2000));

  const testsState = await client.eval(`
    JSON.stringify({
      url: window.location.href,
      hasCbtRoot: Boolean(document.querySelector('.cbt-exam-engine') || document.querySelector('[data-testid="cbt-engine"]') || document.body.innerText.includes('Computer Based Test')),
      bodySnippet: document.body.innerText.slice(0, 400)
    })
  `);
  console.log('Tests tab state:', JSON.parse(testsState));

  client.close();
}

run().catch(err => {
  console.error('CDP script error:', err);
  process.exit(1);
});
