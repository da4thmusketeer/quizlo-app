const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

function load(file, dependencies, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(require.resolve(file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, Error, console,
    require: name => dependencies[name] ?? require(name), ...globals });
  return module.exports.default;
}

const question = { id: "q1", text: "Which planet?", type: "Mcq", answerOptions: [{ id: "mars", text: "Mars" }, { id: "earth", text: "Earth" }] };
const baseGame = { quizId: "demo", phase: "playing", deadline: 160000, index: 0, selections: {}, submitted: [], prepared: {},
  session: { attemptId: "a1", quizTitle: "Space Quiz", timeAllocated: 60, questions: [question] } };
const Question = load("../src/components/GameplayQuestion.tsx", {});

test("question UI supports all nine question types with accessible controls", () => {
  for (const type of ["Mcq", "TrueFalse", "MultipleSelect", "ShortAnswer", "LongAnswer", "Numeric", "FillInTheBlank", "OrderSequencing", "Matching"]) {
    const html = renderToStaticMarkup(React.createElement(Question, { question: { ...question, type, matchingTargets: [{ id: "t1", text: "Target" }] }, value: {}, onChange() {}, disabled: false }));
    assert.ok(html.includes("Your answer"), type);
    if (["Mcq", "TrueFalse", "MultipleSelect"].includes(type)) assert.ok(html.includes('type="' + (type === "MultipleSelect" ? "checkbox" : "radio") + '"'), type);
    if (type === "LongAnswer") assert.ok(html.includes("textarea"));
    if (type === "Numeric") assert.ok(html.includes('type="number"'));
    if (type === "Matching") assert.ok(html.includes("Choose a match"));
    if (type === "OrderSequencing") assert.ok(html.includes("Move item 1 down"));
    assert.ok(!html.includes("isCorrect"));
  }
});

function playView(game) {
  const effects = [];
  const calls = [];
  let index = 0;
  const initial = [true, null, false, 100000, true, false];
  const react = { useState: () => [initial[index++], () => {}], useRef: () => ({ current: null }), useEffect: effect => effects.push(effect) };
  const gameplay = {
    useGameplayStore: selector => selector({ games: { demo: game } }),
    recoverGame: async () => game,
    finishGame: async () => calls.push("finish"),
    retryGame: async () => calls.push("retry"),
    selectAnswer() {},
    answerPayload: () => undefined,
  };
  const Page = load("../src/app/play/[id]/page.tsx", {
    react,
    "next/navigation": { useRouter: () => ({ replace: url => calls.push(url) }) },
    "@/lib/gameplay": gameplay,
    "@/components/GameplayQuestion": { default: Question },
  }, {
    navigator: { onLine: true },
    window: { setInterval() {}, clearInterval() {}, addEventListener() {}, removeEventListener() {},
      setTimeout: callback => { calls.push(callback); return 1; }, clearTimeout() {} },
    document: { addEventListener() {}, removeEventListener() {} },
  });
  const html = renderToStaticMarkup(React.createElement(Page, { params: { id: "demo" } }));
  return { html, effects, calls };
}

test("play page presents one question, progress, timer, and no answer key", () => {
  const { html } = playView(baseGame);
  assert.ok(html.includes("Which planet?"));
  assert.ok(html.includes('role="timer"'));
  assert.ok(html.includes('role="progressbar"'));
  assert.ok(html.includes("Question 1 of 1"));
  assert.ok(!html.includes("Correct answer"));
});

test("the timer effect automatically finishes when the deadline is reached", async () => {
  const { effects, calls } = playView({ ...baseGame, deadline: 90000 });
  effects.forEach(effect => effect());
  await Promise.resolve(); await Promise.resolve();
  assert.equal(calls.filter(call => call === "finish").length, 1);
});

test("completed play sessions redirect to their results route", () => {
  const { effects, calls } = playView({ ...baseGame, phase: "completed" });
  effects.forEach(effect => effect());
  assert.ok(calls.includes("/play/demo/results"));
});

test("transient network errors schedule a background retry", async () => {
  const { effects, calls } = playView({ ...baseGame, phase: "submitting", error: "Connection lost", errorStatus: 0 });
  effects.forEach(effect => effect());
  const callback = calls.find(call => typeof call === "function");
  assert.ok(callback);
  callback(); await Promise.resolve();
  assert.ok(calls.includes("retry"));
});

test("results display server score, XP, breakdown, explanations, and all actions", () => {
  let index = 0;
  const initial = [true, true, "", false];
  const game = { ...baseGame, phase: "completed", submitted: ["q1"], selections: { q1: { optionId: "earth" } },
    results: { score: 0, questionsAnsweredCorrectly: 0, totalQuestions: 1, xpEarned: 5, levelUp: false, newLevel: 1,
      correctAnswers: [{ questionId: "q1", isCorrect: false, correctData: "Mars", explanation: "Iron oxide gives Mars its red color." }] } };
  const Page = load("../src/app/play/[id]/results/page.tsx", {
    react: { useState: () => [initial[index++], () => {}], useEffect() {} },
    "next/navigation": { useRouter: () => ({}) },
    "@/lib/gameplay": { useGameplayStore: selector => selector({ games: { demo: game } }) },
  });
  const html = renderToStaticMarkup(React.createElement(Page, { params: { id: "demo" } }));
  for (const content of ["Final score", "Accuracy", "XP earned", "Incorrect", "Earth", "Iron oxide gives Mars its red color.", "Play Again", "Explore More Quizzes", "Share Results"]) assert.ok(html.includes(content), content);
});

test("replay resets the old attempt and sharing exposes only score plus public quiz link", async () => {
  let index = 0;
  const initial = [true, false, "", false];
  const calls = [];
  const game = { ...baseGame, phase: "completed", results: { score: 75, questionsAnsweredCorrectly: 3, totalQuestions: 4, xpEarned: 30 } };
  const Page = load("../src/app/play/[id]/results/page.tsx", {
    react: { useState: () => [initial[index++], () => {}], useEffect() {} },
    "next/navigation": { useRouter: () => ({ push: url => calls.push(url) }) },
    "@/lib/gameplay": { useGameplayStore: selector => selector({ games: { demo: game } }), resetGame: id => calls.push(`reset:${id}`) },
  }, { window: { location: { origin: "https://quizlo.test" } }, navigator: { clipboard: { writeText: async text => calls.push(text) } } });
  const nodes = [];
  function walk(node) { if (Array.isArray(node)) return node.forEach(walk); if (!node || typeof node !== "object") return; nodes.push(node); walk(node.props?.children); }
  function text(node) { if (typeof node === "string") return node; if (Array.isArray(node)) return node.map(text).join(""); return node && typeof node === "object" ? text(node.props?.children) : ""; }
  walk(Page({ params: { id: "demo" } }));
  await nodes.find(node => node.type === "button" && text(node) === "Share Results").props.onClick();
  await Promise.resolve();
  assert.ok(calls.includes("I scored 75% on Space Quiz with Quizlo! https://quizlo.test/play/demo"));
  assert.ok(!calls.some(call => call.includes("/results")));
  nodes.find(node => node.type === "button" && text(node) === "Play Again").props.onClick();
  assert.ok(calls.includes("reset:demo"));
  assert.ok(calls.includes("/play/demo"));
  assert.ok(nodes.some(node => node.props?.href === "/explore"));
});
