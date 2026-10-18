const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { webcrypto, randomUUID } = require("node:crypto");
const { createGameplayBackend } = require("./fixtures/gameplayBackend.cjs");

function load(file, dependencies, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(require.resolve(file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, Error, TextEncoder, AbortSignal, atob,
    crypto: { subtle: webcrypto.subtle, randomUUID },
    require: name => dependencies[name] ?? require(name), ...globals });
  return module.exports;
}

test("real HTTP flow grades on the backend and recovers a response lost after grading", async () => {
  const server = createGameplayBackend();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const env = { process: { env: { NEXT_PUBLIC_BACKEND_BASE_URL: base } } };
  const sanitizer = load("../src/lib/sanitizeQuizSession.ts", {});
  const route = load("../src/app/api/gameplay/[id]/start/route.ts", { "@/lib/sanitizeQuizSession": sanitizer }, { ...env, fetch });
  const attemptsRoute = load("../src/app/api/gameplay/attempts/[attemptId]/[action]/route.ts", {}, { ...env, fetch });
  const auth = { getToken: () => "fixture-user" };
  const api = load("../src/lib/quiz.ts", { "@/lib/auth": auth }, { ...env, fetch: (url, options) => {
    if (url.startsWith("/api/gameplay/")) {
      if (url.startsWith("/api/gameplay/attempts/")) return attemptsRoute.POST({
        headers: new Headers(options.headers), cookies: { get() {} }, json: async () => JSON.parse(options.body ?? "{}"),
      }, { params: { attemptId: decodeURIComponent(url.split("/")[4]), action: url.split("/")[5] } });
      return route.POST({ headers: new Headers(options.headers), cookies: { get() {} } }, { params: { id: decodeURIComponent(url.split("/")[3]) } });
    }
    return fetch(url, options);
  } });
  const storage = new Map();
  const engine = load("../src/lib/gameplay.ts", { "@/lib/auth": auth, "@/lib/quiz": api }, {
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
  });
  try {
    await engine.beginGame("demo");
    assert.equal(engine.currentGame("demo").phase, "playing");
    engine.selectAnswer("demo", { optionId: "mars" }); await engine.advanceGame("demo");
    engine.selectAnswer("demo", { optionIds: ["sun"] }); await engine.advanceGame("demo");
    assert.equal((await (await fetch(`${base}/__metrics`)).json()).answers, 0);
    engine.selectAnswer("demo", { text: "Milky Way" }); await engine.advanceGame("demo");
    await engine.loadGameReview("demo");
    assert.equal(engine.currentGame("demo").results.score, 67);
    assert.equal(engine.currentGame("demo").results.xpEarned, 20);
    assert.ok(engine.currentGame("demo").review.questions[0].explanation.includes("Iron oxide"));

    const before = await (await fetch(`${base}/__metrics`)).json();
    await engine.beginGame("network");
    engine.selectAnswer("network", { optionId: "mars" }); await engine.advanceGame("network");
    await engine.finishGame("network");
    assert.equal(engine.currentGame("network").errorStatus, 502);
    await engine.retryGame("network");
    assert.equal(engine.currentGame("network").phase, "completed");
    const after = await (await fetch(`${base}/__metrics`)).json();
    assert.equal(after.answers - before.answers, 1, "Retry must not grade the accepted answer twice");

    await engine.beginGame("expired"); engine.selectAnswer("expired", { optionId: "mars" }); await engine.finishGame("expired");
    assert.equal(engine.currentGame("expired").phase, "expired");
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
