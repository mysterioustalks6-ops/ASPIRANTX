// Complete AI CBT Flow verification on Android WebView via CDP
const CDP_HTTP = 'http://127.0.0.1:9222/json/list';

async function run() {
  const res = await fetch(CDP_HTTP);
  const targets = await res.json();
  const page = targets[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 10;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const evalCode = async (expr) => {
    const r = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(r.exceptionDetails)}`);
    }
    return r.result?.value;
  };

  console.log('--- STEP 1: Verify URL & State ---');
  const initialUrl = await evalCode('window.location.href');
  console.log('Current URL:', initialUrl);

  // Switch to tests hash
  await evalCode("window.location.hash = '#tests'");
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- STEP 2: Generate Custom Test via Backend API ---');
  const genResult = await evalCode(`
    (async () => {
      const r = await fetch('/api/academic/cbt/generate-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam: 'NEET_UG',
          subject: 'Biology (Botany & Zoology)',
          topics: ['Cell Biology & Genetics'],
          questionCount: 3,
          durationMinutes: 10,
          difficulty: 'Medium'
        })
      });
      return await r.json();
    })()
  `);

  console.log('Generated custom test:', genResult.success ? `ID: ${genResult.test?.id}, Title: ${genResult.test?.title}, Qs: ${genResult.test?.questions?.length}` : 'FAILED');
  if (!genResult.success || !genResult.test) {
    throw new Error('Could not generate custom test');
  }

  console.log('--- STEP 3: Launch Custom Test into CBT Engine ---');
  // Store custom test and start it in CBT Exam Engine
  const startResult = await evalCode(`
    (() => {
      const test = ${JSON.stringify(genResult.test)};
      // Trigger start by dispatching a custom event or loading into storage
      try {
        localStorage.setItem('aspirantx_active_cbt_test', JSON.stringify(test));
        return { success: true, questionsCount: test.questions.length };
      } catch (e) {
        return { error: e.message };
      }
    })()
  `);
  console.log('Active test stored:', startResult);

  console.log('--- STEP 4: Test Submit Evaluation on Backend ---');
  const submitResult = await evalCode(`
    (async () => {
      const test = ${JSON.stringify(genResult.test)};
      const answers = {
        [test.questions[0].id]: test.questions[0].correctOption,
        [test.questions[1].id]: test.questions[1].correctOption
      };
      const r = await fetch('/api/academic/cbt/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id,
          answers,
          timeSpentSeconds: 120,
          totalQuestions: test.questions.length,
          exam: test.exam,
          questionDetails: test.questions
        })
      });
      return await r.json();
    })()
  `);

  console.log('Submit evaluation result from backend:', JSON.stringify(submitResult, null, 2));

  ws.close();
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
