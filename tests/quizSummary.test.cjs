const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { renderToStaticMarkup } = require("react-dom/server");
const React = require("react");

function load(file, dependencies, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(require.resolve(file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, Error, ...globals,
    require: name => dependencies[name] ?? require(name) });
  return module.exports;
}

const question = { text: "Capital of France?", type: "Mcq", answerOptions: [
  { text: "Paris", isCorrect: true }, { text: "London", isCorrect: false },
] };
const quiz = { id: "quiz-1", title: "Geography", difficulty: "Easy", timeAllocated: 60,
  categoryId: "geography", creationMode: "Manual", questions: [question] };

test("publication responses missing options retain submitted answers and render them", async () => {
  const helper = load("../src/lib/quizPreview.ts", { "@/lib/quiz": { getQuizWithQuestions: () => { throw Error("Should use complete cache"); } } });
  helper.rememberQuiz({ ...quiz, questions: [{ ...question, answerOptions: [] }] }, [question]);
  const saved = await helper.loadPreviewQuiz(quiz.id);
  const review = load("../src/components/QuizReview.tsx", { "@/lib/quizPreview": helper }).default;
  const html = renderToStaticMarkup(React.createElement(review, { quiz: saved }));
  assert.ok(html.includes("Paris"));
  assert.ok(html.includes("London"));
  assert.ok(html.includes('aria-label="Correct answer"'));
});

test("submitted answers survive reloads even when the API omits answer options", async () => {
  const data = new Map();
  const globals = { window: {}, sessionStorage: {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  } };
  const deps = { "@/lib/quiz": { getQuizWithQuestions: async () => {
    throw new Error("The complete snapshot should be used");
  } } };
  const initial = load("../src/lib/quizPreview.ts", deps, globals);
  initial.rememberQuiz({ ...quiz, questions: [{ ...question, answerOptions: [] }] }, [question]);
  const reloaded = load("../src/lib/quizPreview.ts", deps, globals);
  const saved = await reloaded.loadPreviewQuiz(quiz.id);
  assert.equal(saved.questions[0].answerOptions[0].text, "Paris");
  assert.equal(saved.questions[0].answerOptions[0].isCorrect, true);
});

test("a later partial response does not erase previously saved answers", async () => {
  const helper = load("../src/lib/quizPreview.ts", { "@/lib/quiz": {} });
  helper.rememberQuiz(quiz);
  helper.rememberQuiz({ ...quiz, questions: [{ ...question, answerOptions: [] }] });
  const saved = await helper.loadPreviewQuiz(quiz.id);
  assert.equal(saved.questions[0].answerOptions[0].text, "Paris");
});

test("reloaded summaries normalize options and matching text from the API", async () => {
  const helper = load("../src/lib/quizPreview.ts", { "@/lib/quiz": {
    getQuizWithQuestions: async () => ({ data: { ...quiz, questions: [{ text: "Match", type: "Matching", options: [{ text: "France", matchText: "Paris" }] }] } }),
  } });
  const saved = await helper.loadPreviewQuiz(quiz.id);
  assert.equal(saved.questions[0].answerOptions[0].matchingText, "Paris");
});

test("partial caches are refetched without blocking the summary when options are unavailable", async () => {
  let requests = 0;
  const helper = load("../src/lib/quizPreview.ts", { "@/lib/quiz": {
    getQuizWithQuestions: async () => { requests++; return { ...quiz, questions: [{ ...question, answerOptions: [] }] }; },
  } });
  helper.rememberQuiz({ ...quiz, questions: [{ ...question, answerOptions: [] }] });
  const saved = await helper.loadPreviewQuiz(quiz.id);
  assert.equal(saved.title, "Geography");
  assert.equal(saved.questions[0].answerOptions.length, 0);
  const review = load("../src/components/QuizReview.tsx", { "@/lib/quizPreview": helper }).default;
  const html = renderToStaticMarkup(React.createElement(review, { quiz: saved }));
  assert.ok(html.includes("Answer options were not included"));
  assert.equal(requests, 1);
});
