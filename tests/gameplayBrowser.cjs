// Run against the local fixture + dev server with an isolated headless Chrome on :9229.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const app = "http://localhost:3011";
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const pages = await (await fetch("http://127.0.0.1:9229/json/list")).json();
  const target = pages.find(page => page.type === "page");
  assert.ok(target, "An isolated Chrome page is required");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  const browserErrors = [];
  let pageLoads = 0;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timed out: ${method}`)); }, 60000);
      pending.set(id, { resolve, reject, timer });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === "Page.loadEventFired") pageLoads++;
    if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    if (message.method === "Page.javascriptDialogOpening") void send("Page.handleJavaScriptDialog", { accept: true });
    if (!message.id) return;
    const request = pending.get(message.id); if (!request) return;
    pending.delete(message.id); clearTimeout(request.timer);
    if (message.error) request.reject(Error(message.error.message)); else request.resolve(message.result);
  };
  async function evaluate(expression) {
    const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
    return response.result?.value;
  }
  async function waitFor(expression, label, timeout = 60000) {
    const until = Date.now() + timeout;
    while (Date.now() < until) {
      try { if (await evaluate(expression)) return; } catch (error) { if (!/context|navigat|Cannot find/i.test(error.message)) throw error; }
      await pause(150);
    }
    throw Error(`Timed out: ${label}. Page: ${await evaluate("document.body.innerText")}`);
  }
  const clickButton = label => evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)}); if (!b || b.disabled) throw Error('Button unavailable: ' + ${JSON.stringify(label)}); b.click(); })()`);
  const pick = text => evaluate(`(() => { const label = [...document.querySelectorAll('label')].find(l => l.textContent.includes(${JSON.stringify(text)})); if (!label) throw Error('Answer unavailable'); label.click(); })()`);
  async function viewport(width, height, mobile) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
    await pause(200);
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, `No horizontal overflow at ${width}px`);
  }
  async function screenshot(name) {
    const layout = await send("Page.getLayoutMetrics");
    const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: layout.cssContentSize.width, height: layout.cssContentSize.height, scale: 1 } });
    fs.mkdirSync(".next-dev/gameplay-qa", { recursive: true });
    fs.writeFileSync(`.next-dev/gameplay-qa/${name}.png`, Buffer.from(image.data, "base64"));
  }
  async function openQuiz(id) {
    await send("Page.navigate", { url: `${app}/play/${id}` });
    await waitFor("document.body.innerText.includes('Let’s Play')", "Ready screen");
    await clickButton("Let’s Play");
    await waitFor("document.body.innerText.includes('Question 1 of')", "First question");
  }
  try {
    await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
    await send("Network.deleteCookies", { name: "auth_token", url: app });
    await send("Page.navigate", { url: `${app}/login` });
    await waitFor("location.pathname === '/login' && document.querySelector('input[type=email]')", "Login origin ready");
    await evaluate("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('auth_token','fixture-user')");
    await send("Network.setCookie", { name: "auth_token", value: "fixture-user", url: app, sameSite: "Lax" });
    browserErrors.length = 0;
    const before = await (await fetch("http://127.0.0.1:4011/__metrics")).json();
    await viewport(1280, 900, false);
    await openQuiz("demo");
    await pick("Mars");
    await waitFor("document.querySelector('input[value]') || [...document.querySelectorAll('input[type=radio]')].some(x => x.checked)", "Selected answer");
    await screenshot("play-desktop");
    await viewport(390, 844, true); await screenshot("play-mobile");
    const original = await evaluate("JSON.parse(sessionStorage.getItem('quizlo_gameplay_v1:demo'))");
    assert.ok(!JSON.stringify(original).includes('"isCorrect"'));
    assert.ok(!JSON.stringify(original).includes('"correctData"'));
    assert.ok(!JSON.stringify(original).includes('"explanation"'));
    const previousLoads = pageLoads;
    await send("Page.reload");
    const reloadDeadline = Date.now() + 60000;
    while (pageLoads <= previousLoads && Date.now() < reloadDeadline) await pause(100);
    assert.ok(pageLoads > previousLoads, "The reload must commit before testing recovered controls");
    await waitFor("document.body.innerText.includes('Question 1 of') && [...document.querySelectorAll('input[type=radio]')].some(x => x.checked)", "Refresh restores selection");
    const recovered = await evaluate("JSON.parse(sessionStorage.getItem('quizlo_gameplay_v1:demo'))");
    assert.equal(recovered.deadline, original.deadline);
    assert.equal(recovered.session.attemptId, original.session.attemptId);
    await clickButton("Next Question");
    await waitFor("document.body.innerText.includes('Which of these are planets?')", "Second question");
    await pick("The Sun"); await clickButton("Next Question");
    await waitFor("!!document.querySelector('#written-answer')", "Written answer");
    await evaluate("(() => { const input = document.querySelector('#written-answer'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Milky Way'); input.dispatchEvent(new Event('input',{bubbles:true})); })()");
    await clickButton("Submit Quiz");
    await waitFor("location.pathname === '/play/demo/results' && document.body.innerText.includes('XP earned')", "Results");
    assert.equal(await evaluate("JSON.parse(sessionStorage.getItem('quizlo_gameplay_v1:demo')).results.score"), 67);
    await clickButton("Review Your Answers");
    await waitFor("document.body.innerText.includes('Iron oxide')", "Answer explanations");
    await screenshot("results-mobile");
    await viewport(1280, 900, false); await screenshot("results-desktop");
    await viewport(640, 900, false);
    console.log("PASS: desktop/mobile gameplay and results; no horizontal overflow at 390/640/1280px.");
    console.log("PASS: refresh keeps selected answer, attempt, and deadline; server score and explanations render.");

    await openQuiz("timer");
    await waitFor("location.pathname === '/play/timer/results' && document.body.innerText.includes('XP earned')", "Automatic timer submission", 30000);
    console.log("PASS: countdown automatically completes an unanswered quiz.");
    await openQuiz("network"); await pick("Mars"); await clickButton("Next Question");
    await waitFor("document.body.innerText.includes('Question 2 of')", "Network fixture question 2"); await clickButton("Skip Question");
    await waitFor("document.body.innerText.includes('Question 3 of')", "Network fixture question 3"); await clickButton("Submit Quiz");
    await waitFor("location.pathname === '/play/network/results' && document.body.innerText.includes('XP earned')", "Automatic network recovery", 30000);
    const after = await (await fetch("http://127.0.0.1:4011/__metrics")).json();
    assert.equal(after.answers - before.answers, 4);
    assert.equal(after.starts - before.starts, 3);
    assert.equal(after.completes - before.completes, 3);
    console.log("PASS: lost response retries automatically without duplicate grading, XP, or sessions.");
    await openQuiz("expired"); await pick("Mars"); await clickButton("Next Question");
    await waitFor("document.body.innerText.includes('Question 2 of')", "Expired fixture question 2"); await clickButton("Skip Question");
    await waitFor("document.body.innerText.includes('Question 3 of')", "Expired fixture question 3"); await clickButton("Submit Quiz");
    await waitFor("document.body.innerText.includes('This session has ended')", "Server expiry state");
    assert.deepEqual(browserErrors, []);
    console.log("PASS: server-expired attempt is handled; no browser runtime exceptions.");
    console.log("Screenshots: .next-dev/gameplay-qa/");
  } finally {
    ws.close();
    for (const request of pending.values()) clearTimeout(request.timer);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
