const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(
  fs.readFileSync(require.resolve("../src/store/quizStore.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
).outputText;

function createStore(api = {}, storage = {}) {
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    Error,
    window: {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {}, ...storage },
    require: (name) => name === "@/lib/quiz"
      ? { getAllQuizzes: async () => [], getCategoryData: async () => [], ...api }
      : require(name),
  });
  return module.exports.useQuizStore;
}

test("Home and Explore share an in-flight quiz request", async () => {
  let calls = 0;
  let resolve;
  const response = new Promise((done) => { resolve = done; });
  const store = createStore({ getAllQuizzes: () => { calls++; return response; } });
  const home = store.getState().fetchQuizzes();
  const explore = store.getState().fetchExploreData();
  assert.equal(calls, 1);
  assert.equal(store.getState().isLoadingQuizzes, true);
  resolve([{ id: "quiz-1" }]);
  await Promise.all([home, explore]);
  assert.equal(store.getState().quizzes[0].id, "quiz-1");
  assert.equal(store.getState().isLoadingQuizzes, false);
});

test("failed initial request leaves loading and can be retried", async () => {
  let calls = 0;
  const store = createStore({ getAllQuizzes: async () => {
    if (++calls === 1) throw new Error("Backend unavailable");
    return [{ id: "recovered" }];
  } });
  await store.getState().fetchExploreData();
  let state = store.getState();
  assert.equal(state.isLoadingQuizzes, false);
  assert.equal(state.quizzesError, "Backend unavailable");
  assert.equal(state.quizzes.length === 0 && (!state._hasHydrated || state.isLoadingQuizzes || (!state.isQuizzesFetched && !state.quizzesError)), false);
  await state.fetchQuizzes(true);
  state = store.getState();
  assert.equal(state.quizzesError, null);
  assert.equal(state.quizzes[0].id, "recovered");
});

test("an empty successful response is cached", async () => {
  let calls = 0;
  const store = createStore({ getAllQuizzes: async () => { calls++; return []; } });
  await store.getState().fetchQuizzes();
  await store.getState().fetchQuizzes();
  assert.equal(calls, 1);
  assert.equal(store.getState().isQuizzesFetched, true);
});

test("corrupt or unavailable localStorage does not block hydration or fetching", async () => {
  for (const storage of [
    { getItem: () => "invalid JSON" },
    { getItem: () => { throw new Error("Storage blocked"); } },
    { setItem: () => { throw new Error("Storage full"); } },
  ]) {
    const store = createStore({ getAllQuizzes: async () => [{ id: "loaded" }] }, storage);
    assert.equal(store.getState()._hasHydrated, true);
    await store.getState().fetchQuizzes();
    assert.equal(store.getState().quizzes[0].id, "loaded");
    assert.equal(store.getState().isLoadingQuizzes, false);
  }
});

test("a refresh failure preserves cached quizzes", async () => {
  const store = createStore({ getAllQuizzes: async () => { throw new Error("Offline"); } });
  store.getState().setQuizzes([{ id: "cached" }]);
  await store.getState().fetchQuizzes(true);
  assert.equal(store.getState().quizzes[0].id, "cached");
  assert.equal(store.getState().quizzesError, "Offline");
});
