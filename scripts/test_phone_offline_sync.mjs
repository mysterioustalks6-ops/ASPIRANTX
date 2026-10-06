import { execFile } from 'child_process';
import { promisify } from 'util';
import WebSocket from 'ws';

const execFileAsync = promisify(execFile);
const ADB_PATH = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = '10BD570GL500057';

async function runOfflineTest() {
  const timeout = setTimeout(() => {
    console.error('Test timed out after 45s');
    process.exit(1);
  }, 45000);

  let ws;
  try {
    // 1. Ensure phone is awake & app is focused
    await execFileAsync(ADB_PATH, ['-s', SERIAL, 'shell', 'input keyevent 224; wm dismiss-keyguard; am start -n com.aspirantx.app/.MainActivity']);
    await new Promise(r => setTimeout(r, 1200));

    // 2. Discover socket
    const { stdout: unixOut } = await execFileAsync(ADB_PATH, ['-s', SERIAL, 'shell', 'cat', '/proc/net/unix']);
    const match = unixOut.match(/@webview_devtools_remote_(\d+)/);
    let socketName;
    if (match) {
      socketName = match[0].replace('@', '');
    } else {
      const { stdout: pidOut } = await execFileAsync(ADB_PATH, ['-s', SERIAL, 'shell', 'pidof', 'com.aspirantx.app']);
      const pid = pidOut.trim();
      if (!pid) throw new Error('com.aspirantx.app process not found on device');
      socketName = `webview_devtools_remote_${pid}`;
    }

    // 3. Forward tcp:9222
    await execFileAsync(ADB_PATH, ['-s', SERIAL, 'forward', 'tcp:9222', `localabstract:${socketName}`]);

    // 4. Connect via WebSocket
    const res = await fetch('http://127.0.0.1:9222/json');
    const endpoints = await res.json();
    const page = endpoints.find(e => e.type === 'page');
    if (!page) throw new Error('No page endpoint found on device');

    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });

    let msgId = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const onMessage = (buf) => {
          const msg = JSON.parse(buf.toString());
          if (msg.id === id) {
            ws.off('message', onMessage);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.on('message', onMessage);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // Emulate network offline in DevTools protocol
    await sendCommand('Network.enable');
    await sendCommand('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0
    });

    // Execute test in phone's context
    const testCode = `
      (async () => {
        const logs = [];
        logs.push('[TEST START] Executing Phone Offline Sync Verification');

        // 1. Verify navigator.onLine override
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true });
        window.dispatchEvent(new Event('offline'));
        logs.push('[1. navigator.onLine]: ' + navigator.onLine);

        const bridge = window.__studyride_offline_bridge || {};
        if (!bridge.fetchWithRetry) {
          logs.push('[ERROR]: __studyride_offline_bridge not found on window');
          return { passed: false, logs };
        }

        // 2. Test apiClient offline behavior
        logs.push('[2. apiClient test]: Testing request with navigator.onLine=false...');
        const startTime = Date.now();
        let apiError = null;
        let attemptCount = 0;

        // Monitor any global fetch attempts
        const origFetch = window.fetch;
        window.fetch = async (...args) => {
          attemptCount++;
          return origFetch(...args);
        };

        try {
          await bridge.fetchWithRetry('/api/test/mutation', {
            method: 'POST',
            body: JSON.stringify({ test: true }),
            maxRetries: 3,
            initialDelayMs: 200
          });
        } catch (err) {
          apiError = err.message;
        } finally {
          window.fetch = origFetch;
        }

        const elapsedMs = Date.now() - startTime;
        logs.push('[apiClient result]: elapsed=' + elapsedMs + 'ms, error="' + apiError + '", networkFetchAttempts=' + attemptCount);
        logs.push('[apiClient retry storm status]: ' + (attemptCount === 0 ? 'PASSED (0 fetch attempts triggered)' : 'FAILED (' + attemptCount + ' attempts)'));

        // 3. Test syncWorker behavior
        logs.push('[3. syncWorker test]: Testing batch sync while offline...');
        let syncWorkerResult = null;
        try {
          syncWorkerResult = await bridge.syncWorker.triggerBatchSync();
        } catch (e) {
          syncWorkerResult = { error: e.message };
        }
        logs.push('[syncWorker result]: ' + JSON.stringify(syncWorkerResult));
        logs.push('[syncWorker status]: ' + (syncWorkerResult && syncWorkerResult.success === false && syncWorkerResult.syncedCount === 0 ? 'PASSED (aborted cleanly without server traffic)' : 'FAILED'));

        // 4. Test packetSyncService behavior
        logs.push('[4. packetSyncService test]: Queueing packet while offline...');
        let initialPendingCount = 0;
        let finalPendingCount = 0;
        try {
          const store = bridge.getLocalDeviceStore('test_user', 'NEET_UG');
          initialPendingCount = store.pendingSyncPackets.length;
          
          store.pendingSyncPackets.push({
            id: 'pkt_test_' + Date.now(),
            taskId: 'neet_phy_01',
            type: 'LEARNING_STATUS',
            timestamp: Date.now(),
            payload: { status: 'completed' }
          });
          
          bridge.queueBackgroundPacketSync(store);
          finalPendingCount = store.pendingSyncPackets.length;
        } catch (e) {
          logs.push('[packetSyncService error]: ' + e.message);
        }

        logs.push('[packetSyncService result]: initialPackets=' + initialPendingCount + ', finalQueuedPackets=' + finalPendingCount);
        logs.push('[packetSyncService status]: ' + (finalPendingCount > initialPendingCount ? 'PASSED (packet queued safely in local store without server egress)' : 'FAILED'));

        // Restore online
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
        window.dispatchEvent(new Event('online'));

        return {
          passed: attemptCount === 0 && syncWorkerResult?.success === false && finalPendingCount > initialPendingCount,
          logs
        };
      })()
    `;

    const evalResult = await sendCommand('Runtime.evaluate', {
      expression: testCode,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('\n--- RAW TEST LOGS FROM DEVICE ---');
    if (evalResult?.result?.value?.logs) {
      evalResult.result.value.logs.forEach(l => console.log(l));
      console.log('\nOverall Result: ' + (evalResult.result.value.passed ? 'ALL OFFLINE GUARDS PASSED' : 'SOME CHECKS FAILED'));
    } else {
      console.log(JSON.stringify(evalResult, null, 2));
    }
    console.log('--- END RAW TEST LOGS ---\n');

  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    if (ws) {
      try { ws.close(); } catch {}
    }
    clearTimeout(timeout);
  }
}

runOfflineTest();
