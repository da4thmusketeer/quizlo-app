const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, dependencies = {}, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(require.resolve(file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, Error, AbortSignal,
    require: name => dependencies[name] ?? require(name), ...globals });
  return module.exports;
}
const sanitizer = load("../src/lib/sanitizeQuizSession.ts");
const raw = {
  attemptId: "attempt", quizTitle: "Secure quiz", timeAllocated: 60,
  correctAnswers: "SECRET ROOT KEY",
  questions: [
    { id: "q1", text: "Pick", type: "Mcq", explanation: "SECRET EXPLANATION", answerOptions: [{ id: "a", text: "A", isCorrect: true, correctData: "SECRET KEY" }] },
    { id: "q2", text: "Write", type: "ShortAnswer", answerOptions: [{ id: "secret", text: "SECRET WRITTEN ANSWER", isCorrect: true }] },
    { id: "q3", text: "Match", type: "Matching", answerOptions: [{ id: "left1", text: "France", matchingText: "Paris" }, { id: "left2", text: "Italy", matchText: "Rome" }] },
    { id: "q4", text: "Arrange", type: "OrderSequencing", answerOptions: [{ id: "s1", text: "First", order: 1 }, { id: "s2", text: "Second", order: 2 }] },
  ],
};

test("server projection removes keys, explanations, and accepted written answers", () => {
  const safe = sanitizer.publicQuizSession(raw);
  const json = JSON.stringify(safe);
  assert.ok(!json.includes("SECRET"));
  assert.ok(!json.includes("isCorrect"));
  assert.ok(!json.includes("correctData"));
  assert.ok(!json.includes("explanation"));
  assert.equal(safe.questions[1].answerOptions.length, 0);
  assert.equal(safe.questions[3].answerOptions.every(option => !("order" in option)), true);
});

test("matching targets are separated from their answer pairs before reaching the browser", () => {
  const match = sanitizer.publicQuizSession(raw).questions[2];
  assert.equal(match.answerOptions.every(option => !("matchingText" in option) && !("matchText" in option)), true);
  assert.deepEqual(Array.from(match.matchingTargets, target => target.text).sort(), ["Paris", "Rome"]);
  assert.equal(match.matchingTargets.some(target => match.answerOptions.some(option => option.id === target.id)), false);
});

function startRoute(fetch) {
  return load("../src/app/api/gameplay/[id]/start/route.ts", { "@/lib/sanitizeQuizSession": sanitizer }, {
    fetch, process: { env: { NEXT_PUBLIC_BACKEND_BASE_URL: "https://backend.test" } },
  }).POST;
}

test("start-session facade requires authentication and forwards the stable operation key", async () => {
  const calls = [];
  const post = startRoute(async (...args) => { calls.push(args); return { ok: true, status: 200, json: async () => ({ data: raw }) }; });
  const denied = await post({ headers: new Headers(), cookies: { get() {} } }, { params: { id: "quiz" } });
  assert.equal(denied.status, 401);
  assert.equal(calls.length, 0);
  const response = await post({ headers: new Headers({ Authorization: "Bearer test", "Idempotency-Key": "stable-start" }), cookies: { get() {} } }, { params: { id: "quiz / 1" } });
  assert.equal(response.status, 200);
  assert.equal(calls[0][0], "https://backend.test/quiz/quiz%20%2F%201/start");
  assert.equal(calls[0][1].headers["Idempotency-Key"], "stable-start");
  assert.ok(!JSON.stringify(await response.json()).includes("SECRET"));
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("upstream authorization errors are shown without leaking response data", async () => {
  const post = startRoute(async () => ({ ok: false, status: 403, json: async () => ({ message: "Private quiz", data: raw }) }));
  const response = await post({ headers: new Headers({ Authorization: "Bearer test" }), cookies: { get() {} } }, { params: { id: "quiz" } });
  assert.equal(response.status, 403);
  assert.ok(!JSON.stringify(await response.json()).includes("SECRET"));
});

test("answer facade validates input, strips injected grading fields, and hides grading responses", async () => {
  let sent;
  const route = load("../src/app/api/gameplay/attempts/[attemptId]/[action]/route.ts", {}, {
    process: { env: { NEXT_PUBLIC_BACKEND_BASE_URL: "https://backend.test" } },
    fetch: async (url, options) => { sent = { url, options }; return { ok: true, status: 200, json: async () => ({ data: { isCorrect: true, correctData: "SECRET ANSWER", pointsEarned: 99 } }) }; },
  });
  const request = { headers: new Headers({ Authorization: "Bearer test", "Idempotency-Key": "answer-key" }), cookies: { get() {} },
    json: async () => ({ type: "Mcq", questionId: "q1", timeSpent: 3, selectedOptionId: "a", isCorrect: true, score: 100, xpEarned: 999 }) };
  const response = await route.POST(request, { params: { attemptId: "a1", action: "submit-answer" } });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.data, { accepted: true });
  assert.ok(!JSON.stringify(body).includes("SECRET"));
  assert.ok(!sent.options.body.includes("isCorrect"));
  assert.ok(!sent.options.body.includes("xpEarned"));
  assert.equal(sent.options.headers["Idempotency-Key"], "answer-key");
  const invalid = await route.POST({ ...request, json: async () => ({ type: "Mcq", questionId: "q1", timeSpent: -2 }) }, { params: { attemptId: "a1", action: "submit-answer" } });
  assert.equal(invalid.status, 400);
});

test("completion facade recovers the original result returned for a repeated completion", async () => {
  const results = { score: 80, xpEarned: 40 };
  const route = load("../src/app/api/gameplay/attempts/[attemptId]/[action]/route.ts", {}, {
    process: { env: { NEXT_PUBLIC_BACKEND_BASE_URL: "https://backend.test" } },
    fetch: async () => ({ ok: false, status: 409, json: async () => ({ success: false, data: results }) }),
  });
  const response = await route.POST({ headers: new Headers({ Authorization: "Bearer test" }), cookies: { get() {} } }, { params: { attemptId: "a1", action: "complete" } });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, results);
});
