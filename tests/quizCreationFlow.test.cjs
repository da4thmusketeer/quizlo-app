const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(require.resolve("../src/app/create/page.tsx"), "utf8");
const ast = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const hookNames = [];
function findHooks(node) {
  if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) &&
      node.initializer && ts.isCallExpression(node.initializer) && node.initializer.expression.getText(ast) === "useState") {
    hookNames.push(node.name.elements[0].getText(ast));
  }
  ts.forEachChild(node, findHooks);
}
findHooks(ast);
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020,
} }).outputText;

function setup(mode = "manual") {
  const calls = [];
  const navigations = [];
  const question = { id: "question-1", text: "Which answer?", type: "Mcq", isOpen: true,
    options: [{ text: "Correct", isCorrect: true }, { text: "Wrong", isCorrect: false }] };
  const state = { mode, title: "My quiz", categoryId: "science", categories: [{ id: "science", name: "Science" }],
    isLoadingEditor: false, questions: [question], aiNotes: "An introduction to the solar system" };
  const saved = { id: "saved-quiz", title: "My quiz", categoryId: "science", difficulty: "Medium", timeAllocated: 300,
    isPrivate: false, isDraft: true, creationMode: "Ai", questions: [{ ...question, answerOptions: question.options }] };
  let hook = 0;
  let refHook = 0;
  const refs = [];
  const react = {
    useState(initial) {
      const name = hookNames[hook++];
      if (!(name in state)) state[name] = initial;
      return [state[name], value => { state[name] = typeof value === "function" ? value(state[name]) : value; }];
    },
    useRef: initial => refs[refHook++] ?? (refs[refHook - 1] = { current: initial }), useEffect() {}, useMemo: fn => fn(),
  };
  const jsx = (type, props) => ({ type, props });
  const deps = {
    react: { ...react, default: react }, "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/navigation": { useRouter: () => ({ push: url => navigations.push(url) }) },
    "@/components/QuizPreviewModal": { default: "PreviewModal" },
    "@/components/DashboardNavbar": { default: "Navbar" },
    "goey-toast": { goeyToast: { error() {}, success() {} } },
    "@/lib/user": {}, "@/lib/auth": { getToken: () => "test-token" }, "@/lib/media": {},
    "@/lib/quiz": {
      createQuiz: async payload => { calls.push({ action: "create", payload }); return { data: { ...payload, id: "published" } }; },
      createAiQuiz: async payload => { calls.push({ action: "generate", payload }); return { data: { ...saved, ...payload, questions: saved.questions } }; },
      updateQuiz: async (id, payload) => { calls.push({ action: "update", id, payload }); return { data: { ...payload, id } }; },
    },
    "@/lib/quizPreview": { normalizeQuizDetails: quiz => quiz, rememberQuiz() {}, quizSummaryUrl: id => `/create/summary?id=${id}` },
    "@/store/quizStore": { useQuizStore: { getState: () => ({ fetchQuizzes: async () => [] }) } },
    "lucide-react": {},
  };
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: id => deps[id], console });
  function render() {
    hook = 0;
    refHook = 0;
    const nodes = [];
    function walk(node) {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== "object") return;
      nodes.push(node); walk(node.props?.children);
    }
    walk(module.exports.default());
    return nodes;
  }
  function text(node) {
    if (Array.isArray(node)) return node.map(text).join("");
    if (typeof node === "string") return node;
    return node && typeof node === "object" ? text(node.props?.children) : "";
  }
  const button = label => render().find(node => node.type === "button" && text(node) === label);
  return { state, calls, navigations, render, button, api: deps["@/lib/quiz"] };
}

test("manual preview makes no API calls and closing preserves the editor", () => {
  const app = setup();
  app.button("Preview Quiz").props.onClick();
  const modal = app.render().find(node => node.type === "PreviewModal");
  assert.equal(modal.props.quiz.questions[0].answerOptions[0].text, "Correct");
  assert.equal(app.calls.length, 0);
  modal.props.onClose();
  assert.equal(app.state.questions[0].text, "Which answer?");
  assert.equal(app.state.showPreview, false);
  assert.equal(app.navigations.length, 0);
});

test("manual quiz publishes only through Publish Quiz and goes to summary", async () => {
  const app = setup();
  await app.button("Publish Quiz").props.onClick();
  assert.equal(app.calls.length, 1);
  assert.equal(app.calls[0].payload.isDraft, false);
  assert.equal(app.navigations[0], "/create/summary?id=published");
});

test("AI generates into preview, preserves the form, and publishes only on review", async () => {
  const app = setup("ai");
  assert.equal(app.button("Publish Quiz"), undefined);
  assert.equal(app.button("Preview Quiz"), undefined);
  await app.button("Generate Quiz").props.onClick();
  assert.equal(app.calls[0].payload.isDraft, true);
  assert.equal(app.state.mode, "ai");
  assert.equal(app.navigations.length, 0);
  let modal = app.render().find(node => node.type === "PreviewModal");
  assert.equal(modal.props.quiz.questions[0].answerOptions[0].text, "Correct");
  modal.props.onClose();
  assert.equal(app.state.aiNotes, "An introduction to the solar system");
  assert.equal(app.state.questions[0].text, "Which answer?");
  app.state.aiNotes = "A different prompt about planets";
  app.state.title = "New generation";
  await app.button("Generate Quiz").props.onClick();
  modal = app.render().find(node => node.type === "PreviewModal");
  assert.equal(modal.props.quiz.title, "New generation");
  assert.equal(app.calls[1].payload.topic, app.state.aiNotes);
  await modal.props.onPublish();
  assert.equal(app.calls[2].action, "update");
  assert.equal(app.calls[2].id, "saved-quiz");
  assert.equal(app.calls[2].payload.isDraft, false);
  assert.equal(app.navigations[0], "/create/summary?id=saved-quiz");
});

test("AI generation rejects duplicate submissions and recovers from failure", async () => {
  const app = setup("ai");
  let reject;
  let requests = 0;
  app.api.createAiQuiz = () => { requests++; return new Promise((resolve, fail) => { reject = fail; }); };
  const generate = app.button("Generate Quiz").props.onClick;
  const pending = generate();
  await generate();
  assert.equal(requests, 1);
  reject(new Error("Generation failed"));
  await pending;
  assert.equal(app.state.showPreview, false);
  assert.equal(app.state.isGenerating, false);
  assert.equal(app.state.aiNotes, "An introduction to the solar system");
});

test("AI publishing prevents duplicates and keeps the preview available on errors", async () => {
  const app = setup("ai");
  await app.button("Generate Quiz").props.onClick();
  let reject;
  let requests = 0;
  app.api.updateQuiz = () => { requests++; return new Promise((resolve, fail) => { reject = fail; }); };
  const modal = app.render().find(node => node.type === "PreviewModal");
  const pending = modal.props.onPublish();
  await modal.props.onPublish();
  modal.props.onClose();
  assert.equal(requests, 1);
  assert.equal(app.state.showPreview, true);
  reject(new Error("Publication failed"));
  await pending;
  assert.equal(app.state.publishError, "Publication failed");
  assert.equal(app.state.isSubmitting, false);
  assert.equal(app.navigations.length, 0);
  app.api.updateQuiz = async () => ({ data: { isDraft: false } });
  await app.render().find(node => node.type === "PreviewModal").props.onPublish();
  assert.equal(app.navigations[0], "/create/summary?id=saved-quiz");
});
