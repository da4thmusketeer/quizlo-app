const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const ts = require("typescript");
const { webcrypto, randomUUID } = require("node:crypto");

const source = ts.transpileModule(fs.readFileSync(require.resolve("../src/lib/gameplay.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }
const q = (id = "q1") => ({ id, type: "Mcq", text: `Question ${id}`, answerOptions: [{ id: "a", text: "A" }, { id: "b", text: "B" }] });
const session = () => ({ attemptId: "attempt-1", quizTitle: "Test", timeAllocated: 60, questions: [q(), q("q2")] });
const results = { score: 50, questionsAnsweredCorrectly: 1, totalQuestions: 2, xpEarned: 25, levelUp: false, newLevel: 1 };

function setup(overrides = {}, storage = new Map()) {
  let time = 100000;
  let token = "token-a";
  const calls = [];
  const api = {
    QuizApiError: ApiError,
    startQuiz: async (...args) => { calls.push(["start", ...args]); return session(); },
    submitAnswer: async (...args) => { calls.push(["answer", ...args]); return { isCorrect: true, correctData: "a", pointsEarned: 10 }; },
    completeQuiz: async (...args) => { calls.push(["complete", ...args]); return results; },
    getQuizWithQuestions: async (...args) => { calls.push(["review", ...args]); return { id: "quiz", questions: [] }; },
    ...overrides,
  };
  const module = { exports: {} };
  class Clock extends Date { static now() { return time; } }
  vm.runInNewContext(source, {
    module, exports: module.exports, Error, TextEncoder, Date: Clock, atob, AbortSignal,
    crypto: { subtle: webcrypto.subtle, randomUUID },
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    require: name => name === "@/lib/auth" ? { getToken: () => token } : name === "@/lib/quiz" ? api : require(name),
  });
  return { engine: module.exports, calls, storage, setTime: value => { time = value; }, setToken: value => { token = value; } };
}

test("concurrent starts create only one backend session", async () => {
  const { engine, calls } = setup();
  await Promise.all([engine.beginGame("quiz"), engine.beginGame("quiz")]);
  assert.equal(calls.filter(call => call[0] === "start").length, 1);
  assert.equal(engine.currentGame("quiz").phase, "playing");
});

test("answers stay local during play; no grading data is requested or saved", async () => {
  const { engine, calls, storage } = setup();
  await engine.beginGame("quiz");
  engine.selectAnswer("quiz", { optionId: "b" });
  await Promise.all([engine.advanceGame("quiz"), engine.advanceGame("quiz")]);
  assert.equal(calls.filter(call => call[0] === "answer").length, 0);
  assert.equal(engine.currentGame("quiz").index, 1);
  const snapshot = Array.from(storage.values())[0];
  assert.ok(!snapshot.includes("isCorrect"));
  assert.ok(!snapshot.includes("correctData"));
  assert.ok(!snapshot.includes("pointsEarned"));
  assert.equal(calls.filter(call => call[0] === "review").length, 0);
});

test("refresh recovery retains attempt, selections, and original absolute deadline", async () => {
  const first = setup();
  await first.engine.beginGame("quiz");
  first.engine.selectAnswer("quiz", { optionId: "b" });
  const deadline = first.engine.currentGame("quiz").deadline;
  const second = setup({}, first.storage);
  second.setTime(120000);
  await second.engine.recoverGame("quiz");
  assert.equal(second.engine.currentGame("quiz").deadline, deadline);
  assert.equal(second.engine.currentGame("quiz").session.attemptId, "attempt-1");
  assert.equal(second.engine.currentGame("quiz").selections.q1.optionId, "b");
  assert.equal(second.calls.length, 0);
});

test("network retry reuses the exact journaled answer and idempotency key", async () => {
  const attempts = [];
  const app = setup({ submitAnswer: async (...args) => { attempts.push(args); if (attempts.length === 1) throw new ApiError("Offline", 0); return {}; } });
  await app.engine.beginGame("quiz");
  app.engine.selectAnswer("quiz", { optionId: "a" });
  await app.engine.advanceGame("quiz");
  app.engine.selectAnswer("quiz", { optionId: "b" });
  await app.engine.advanceGame("quiz");
  assert.equal(app.engine.currentGame("quiz").phase, "submitting");
  app.setTime(110000);
  await app.engine.retryGame("quiz");
  assert.equal(attempts.length, 3);
  assert.equal(JSON.stringify(attempts[0]), JSON.stringify(attempts[1]));
  assert.equal(app.engine.currentGame("quiz").phase, "completed");
});

test("expired countdown submits the saved selection once then completes with server results", async () => {
  const { engine, calls, setTime } = setup();
  await engine.beginGame("quiz");
  engine.selectAnswer("quiz", { optionId: "a" });
  setTime(165000);
  await Promise.all([engine.finishGame("quiz"), engine.finishGame("quiz")]);
  assert.equal(calls.filter(call => call[0] === "answer").length, 1);
  assert.equal(calls.filter(call => call[0] === "complete").length, 1);
  assert.equal(engine.currentGame("quiz").results.xpEarned, 25);
  assert.equal(engine.currentGame("quiz").phase, "completed");
  assert.ok(calls.findIndex(call => call[0] === "review") > calls.findIndex(call => call[0] === "complete"));
});

test("server-expired sessions stop accepting answers", async () => {
  const app = setup({ submitAnswer: async () => { throw new ApiError("Attempt expired", 410); } });
  await app.engine.beginGame("quiz");
  app.engine.selectAnswer("quiz", { optionId: "a" });
  await app.engine.finishGame("quiz");
  assert.equal(app.engine.currentGame("quiz").phase, "expired");
});

test("unsafe session payloads fail closed", () => {
  const { engine } = setup();
  assert.throws(() => engine.sanitizeSession({ ...session(), questions: [{ ...q(), answerOptions: [{ id: "a", text: "secret", isCorrect: true }] }] }), /answer-key/);
  assert.throws(() => engine.sanitizeSession({ ...session(), questions: [{ ...q(), type: "ShortAnswer" }] }), /answer-key/);
  assert.throws(() => engine.sanitizeSession({ ...session(), questions: [{ ...q(), type: "Matching" }] }), /independent target/);
});

test("session snapshots cannot be resumed by a different signed-in user", async () => {
  const first = setup(); await first.engine.beginGame("quiz");
  const second = setup({}, first.storage); second.setToken("token-b");
  assert.equal(await second.engine.recoverGame("quiz"), undefined);
});

test("all supported question types serialize answers without correctness data", () => {
  const { engine } = setup();
  assert.equal(engine.answerPayload(q(), { optionId: "a" }).selectedOptionId, "a");
  for (const type of ["ShortAnswer", "FillInTheBlank", "Numeric", "LongAnswer"]) assert.equal(engine.answerPayload({ ...q(), type }, { text: "42" }).textResponse, "42");
  for (const type of ["MultipleSelect", "OrderSequencing"]) assert.equal(engine.answerPayload({ ...q(), type }, { optionIds: ["a", "b"] }).selectedOptionIds.length, 2);
  assert.equal(engine.answerPayload({ ...q(), type: "Matching" }, { matches: { a: "Target" } }).responseJson.a, "Target");
  assert.equal(engine.answerPayload(q(), {}), undefined);
});

test("token rotation for the same JWT subject preserves recovery", async () => {
  const jwt = version => `header.${Buffer.from(JSON.stringify({ sub: "user-1", exp: version })).toString("base64url")}.signature`;
  const first = setup(); first.setToken(jwt(1)); await first.engine.beginGame("quiz");
  const second = setup({}, first.storage); second.setToken(jwt(2));
  const recovered = await second.engine.recoverGame("quiz");
  assert.equal(recovered.session.attemptId, "attempt-1");
});

test("a completion retry does not resubmit accepted answers or change the completion key", async () => {
  const completions = [];
  const app = setup({ completeQuiz: async (...args) => { completions.push(args); if (completions.length === 1) throw new ApiError("Connection lost", 0); return results; } });
  await app.engine.beginGame("quiz");
  app.engine.selectAnswer("quiz", { optionId: "a" });
  await app.engine.finishGame("quiz");
  assert.equal(app.engine.currentGame("quiz").phase, "submitting");
  const second = setup({
    submitAnswer: async () => { throw Error("Accepted answer must not be resent"); },
    completeQuiz: async (...args) => { completions.push(args); return results; },
  }, app.storage);
  await second.engine.recoverGame("quiz");
  await second.engine.retryGame("quiz");
  assert.equal(second.engine.currentGame("quiz").phase, "completed");
  assert.equal(JSON.stringify(completions[0]), JSON.stringify(completions[1]));
});

test("a slow answer-review request never blocks replay or leaks into a new session", async () => {
  let resolveReview;
  const review = new Promise(resolve => { resolveReview = resolve; });
  const app = setup({ getQuizWithQuestions: () => review });
  await app.engine.beginGame("quiz");
  await app.engine.finishGame("quiz");
  assert.equal(app.engine.currentGame("quiz").phase, "completed");
  app.engine.resetGame("quiz");
  await app.engine.beginGame("quiz");
  resolveReview({ id: "quiz", questions: [{ ...q(), answerOptions: [{ id: "a", text: "A", isCorrect: true }] }] });
  await Promise.resolve(); await Promise.resolve();
  assert.equal(app.engine.currentGame("quiz").phase, "playing");
  assert.equal(app.engine.currentGame("quiz").review, undefined);
});
