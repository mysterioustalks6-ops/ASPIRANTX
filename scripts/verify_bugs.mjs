import http from 'http';

function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const target = list.find(t => t.type === 'page');
          if (target && target.webSocketDebuggerUrl) {
            resolve(target.webSocketDebuggerUrl);
          } else {
            reject(new Error('No page target found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function cdpEval(ws, expression) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) return reject(msg.error);
        if (msg.result?.exceptionDetails) {
          console.error('CDP Eval Exception:', msg.result.exceptionDetails);
          return reject(new Error(msg.result.exceptionDetails.text || 'CDP Exception'));
        }
        resolve(msg.result?.result?.value);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({
      id,
      method: 'Runtime.evaluate',
      params: {
        expression,
        returnByValue: true,
        awaitPromise: true
      }
    }));
  });
}

async function run() {
  const wsUrl = await getWebSocketUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  // Switch to #garage
  await cdpEval(ws, `window.location.hash = '#garage'`);
  await new Promise(r => setTimeout(r, 1000));

  const garageInfo = await cdpEval(ws, `
    (() => {
      const storedWeeklyTarget = localStorage.getItem('aspirantx_bike_target_hours_demo-guest-123') ||
                                 localStorage.getItem('aspirantx_bike_target_hours');
      
      const pageText = document.body.innerText;

      return {
        storedWeeklyTarget,
        hasAirCooledDuplicate: pageText.includes('Air-Cooled Air-Cooled'),
        hasInOurWeeklyTargetTypo: pageText.includes('in our weekly target'),
        hasTrailingEllipsis: /coach[^\n]*\.\.\./i.test(pageText),
        hasDoubleDot: pageText.includes('• •') || pageText.includes('Rider coach • •') || pageText.includes('Coach • •'),
        containsSuggestedButton: pageText.includes('Use suggested') || pageText.includes('20.8h'),
        targetStatusText: Array.from(document.querySelectorAll('*'))
          .filter(e => e.innerText && (e.innerText.includes('Weekly target:') || e.innerText.includes('Unset') || e.innerText.includes('Target:')))
          .map(e => e.innerText.slice(0, 50))[0] || 'Not found'
      };
    })()
  `);

  console.log('=== GARAGE VERIFICATION (BUG 3B & 3C) ===');
  console.log('Stored Weekly Target in localStorage:', garageInfo.storedWeeklyTarget);
  console.log('Target Status on screen:', garageInfo.targetStatusText);
  console.log('Air-Cooled duplicate present?:', garageInfo.hasAirCooledDuplicate);
  console.log('"in our weekly target" typo present?:', garageInfo.hasInOurWeeklyTargetTypo);
  console.log('Double dot present?:', garageInfo.hasDoubleDot);

  // Switch to #timer
  await cdpEval(ws, `window.location.hash = '#timer'`);
  await new Promise(r => setTimeout(r, 1000));

  const timerInfo = await cdpEval(ws, `
    (() => {
      const pageText = document.body.innerText;
      const html = document.body.innerHTML;

      return {
        hasRedBikeEmoji: html.includes('🏍️') || html.includes('🏍'),
        hasVeerMascot: html.includes('veer-mascot') || html.includes('Veer') || pageText.includes('Veer'),
        coachText: Array.from(document.querySelectorAll('*'))
          .filter(e => e.innerText && (e.innerText.includes('Set a weekly goal') || e.innerText.includes('workshop')))
          .map(e => e.innerText.slice(0, 100))[0] || 'No coach text found'
      };
    })()
  `);

  console.log('\n=== TIMER COACH VERIFICATION (BUG 3D) ===');
  console.log('Red bike emoji in timer?:', timerInfo.hasRedBikeEmoji);
  console.log('Veer mascot present?:', timerInfo.hasVeerMascot);
  console.log('Coach copy on Timer screen:\n', timerInfo.coachText);

  ws.close();
}

run().catch(console.error);
