const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function setup(page, api) {
  const source = fs.readFileSync(require.resolve(`../src/app/${page}/page.tsx`), "utf8");
  const ast = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) && node.initializer && ts.isCallExpression(node.initializer) && node.initializer.expression.getText(ast) === "useState") names.push(node.name.elements[0].getText(ast));
    ts.forEachChild(node, visit);
  }
  visit(ast);
  let hook = 0;
  let refHook = 0;
  const refs = [];
  const state = {};
  const effects = [];
  const react = {
    useState(initial) {
      const name = names[hook++];
      if (!(name in state)) state[name] = initial;
      return [state[name], value => { state[name] = typeof value === "function" ? value(state[name]) : value; }];
    },
    useRef: initial => refs[refHook++] ?? (refs[refHook - 1] = { current: initial }),
    useEffect: fn => effects.push(fn),
  };
  const jsx = (type, props) => ({ type, props });
  const module = { exports: {} };
  const navigations = [];
  const toasts = [];
  const dependencies = {
    react, "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/link": { default: "Link" }, "lucide-react": {},
    "@/components/AccountLayout": { default: "AccountLayout", accountCard: "card" },
    "goey-toast": { goeyToast: { success: message => toasts.push({ type: "success", message }), error: message => toasts.push({ type: "error", message }) } },
    "@/lib/auth": { logout: api.logout || (async () => {}) },
    "@/lib/user": { getLevelLabel: () => "Novice", ...api },
  };
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: id => dependencies[id], URL, window: { location: { replace: url => navigations.push(url) } } });
  function render() {
    hook = refHook = 0;
    const nodes = [];
    function walk(node) {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== "object") return;
      nodes.push(node);
      walk(node.props?.children);
    }
    walk(module.exports.default());
    return nodes;
  }
  async function mount() {
    render();
    effects.shift()();
    await new Promise(resolve => setImmediate(resolve));
  }
  return { state, render, mount, navigations, effects, toasts };
}

const profile = { id: "user", username: "Quizzer", firstName: "Quiz", lastName: "Fan", email: "quiz@example.com", level: 2, xp: 150, streak: 3 };
const event = { preventDefault() {} };

test("settings loads real profile data and updates username only on successful save", async () => {
  const calls = [];
  const app = setup("settings", {
    getProfileData: async () => ({ success: true, data: profile }),
    changeUsername: async name => { calls.push(name); return { success: true }; },
  });
  await app.mount();
  assert.equal(app.state.username, "Quizzer");
  app.state.username = "  New name  ";
  await app.render().find(node => node.props?.id === "username-form").props.onSubmit(event);
  assert.deepEqual(calls, ["New name"]);
  assert.equal(app.state.profile.username, "New name");
  assert.equal(app.toasts.at(-1)?.type, "success");
});

test("password mismatch never calls the API; successful change clears password inputs", async () => {
  let calls = 0;
  const app = setup("settings", {
    getProfileData: async () => ({ success: true, data: profile }),
    changePassword: async payload => { calls++; assert.equal(payload.currentPassword, "old-secret"); return { success: true }; },
  });
  await app.mount();
  Object.assign(app.state, { currentPassword: "old-secret", newPassword: "new-secret", confirmPassword: "mismatch" });
  await app.render().find(node => node.props?.id === "password-form").props.onSubmit(event);
  assert.equal(calls, 0);
  assert.equal(app.toasts.at(-1)?.type, "error");
  app.state.confirmPassword = "new-secret";
  await app.render().find(node => node.props?.id === "password-form").props.onSubmit(event);
  assert.equal(calls, 1);
  assert.equal(app.state.currentPassword, "");
  assert.equal(app.state.newPassword, "");
  assert.equal(app.state.confirmPassword, "");
});

test("email saves prevent duplicate requests and preserve inputs after rejection", async () => {
  let reject;
  let calls = 0;
  const app = setup("settings", {
    getProfileData: async () => ({ success: true, data: profile }),
    updateEmail: () => { calls++; return new Promise((resolve, fail) => { reject = fail; }); },
  });
  await app.mount();
  app.state.email = "new@example.com";
  app.state.emailPassword = "current-secret";
  const submit = app.render().find(node => node.props?.id === "email-form").props.onSubmit;
  const pending = submit(event);
  await submit(event);
  assert.equal(calls, 1);
  reject({ message: "Rejected" });
  await pending;
  assert.equal(app.state.email, "new@example.com");
  assert.equal(app.state.profile.email, profile.email);
  assert.equal(app.state.saving, null);
  assert.equal(app.toasts.at(-1)?.type, "error");
});

test("dashboard loads statistics and routes drafts to editing and published quizzes to summary", async () => {
  const app = setup("dashboard", { getDashboardData: async () => ({ success: true, data: {
    profile, statistics: { totalQuizzesPlayed: 2, totalQuizzesCreated: 2, averageAccuracy: 80, totalXPEarned: 150 },
    myQuizzes: [{ id: "draft", title: "Draft", isDraft: true }, { id: "published", title: "Published", isDraft: false }], recentActivity: [],
  } }) });
  await app.mount();
  const links = app.render().filter(node => node.type === "Link").map(node => node.props.href);
  assert.ok(links.includes("/create?edit=draft"));
  assert.ok(links.includes("/create/summary?id=published"));
  assert.equal(app.state.loading, false);
  assert.equal(app.state.data.statistics.totalQuizzesPlayed, 2);
});

test("failed dashboard and settings loads show retryable errors", async () => {
  for (const page of ["dashboard", "settings"]) {
    const failed = async () => ({ success: false, message: "Please retry" });
    const app = setup(page, { getDashboardData: failed, getProfileData: failed });
    await app.mount();
    assert.equal(app.state.loading, false);
    assert.equal(app.state[page === "dashboard" ? "error" : "loadError"], "Please retry");
    app.render().find(node => node.type === "button").props.onClick();
    assert.equal(app.state.attempt, 1);
  }
});

test("account changes require a current password before contacting the API", async () => {
  let calls = 0;
  const app = setup("settings", {
    getProfileData: async () => ({ success: true, data: profile }),
    updateEmail: async () => { calls++; }, changePassword: async () => { calls++; },
  });
  await app.mount();
  for (const section of ["email", "password"]) {
    await app.render().find(node => node.props?.id === `${section}-form`).props.onSubmit(event);
    assert.equal(app.toasts.at(-1)?.type, "error");
  }
  assert.equal(calls, 0);
});

test("picture uploads prevent duplicates and update the shared profile after success", async () => {
  let finish;
  let calls = 0;
  const image = { name: "avatar.png", type: "image/png" };
  const app = setup("settings", {
    getProfileData: async () => ({ success: true, data: profile }),
    uploadProfilePicture: file => { calls++; assert.equal(file, image); return new Promise(resolve => { finish = resolve; }); },
  });
  await app.mount();
  app.state.pictureFile = image;
  const submit = app.render().find(node => node.props?.id === "picture-form").props.onSubmit;
  const pending = submit(event);
  await submit(event);
  assert.equal(calls, 1);
  finish({ success: true, data: { profilePicture: "https://example.com/avatar.png" } });
  await pending;
  assert.equal(app.state.profile.profilePicture, "https://example.com/avatar.png");
  assert.equal(app.state.pictureFile, null);
  assert.equal(app.render().find(node => node.type === "AccountLayout").props.profile.profilePicture, "https://example.com/avatar.png");
});

test("failed picture upload keeps the previous avatar and allows retry", async () => {
  const app = setup("settings", {
    getProfileData: async () => ({ success: true, data: { ...profile, profilePicture: "original.png" } }),
    uploadProfilePicture: async () => ({ success: false, message: "Upload failed" }),
  });
  await app.mount();
  app.state.pictureFile = { name: "avatar.png", type: "image/png" };
  await app.render().find(node => node.props?.id === "picture-form").props.onSubmit(event);
  assert.equal(app.state.profile.profilePicture, "original.png");
  assert.ok(app.state.pictureFile);
  assert.equal(app.toasts.at(-1)?.type, "error");
  assert.equal(app.state.saving, null);
});

test("logout waits for session clearing and then redirects once to login", async () => {
  let finish;
  let calls = 0;
  const app = setup("settings", {
    getProfileData: async () => ({ success: true, data: profile }),
    logout: () => { calls++; return new Promise(resolve => { finish = resolve; }); },
  });
  await app.mount();
  const button = app.render().find(node => node.type === "button" && node.props.onClick && !node.props.type?.includes("submit"));
  const pending = button.props.onClick();
  await button.props.onClick();
  assert.equal(calls, 1);
  assert.deepEqual(app.navigations, []);
  finish();
  await pending;
  assert.deepEqual(app.navigations, ["/login"]);
});

test("logout clears the cookie even when local storage throws", () => {
  const source = fs.readFileSync(require.resolve("../src/lib/auth.ts"), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  const document = { cookie: "auth_token=old-token" };
  vm.runInNewContext(code, { module, exports: module.exports, require, process: { env: {} }, window: {}, document,
    localStorage: { removeItem() { throw new Error("Storage disabled"); } } });
  module.exports.clearToken();
  assert.match(document.cookie, /auth_token=; expires=Thu, 01 Jan 1970/);
});

test("edit picture opens the file picker without changing the current avatar", async () => {
  const app = setup("settings", { getProfileData: async () => ({ success: true, data: { ...profile, profilePicture: "original.png" } }) });
  await app.mount();
  let clicks = 0;
  const nodes = app.render();
  nodes.find(node => node.props?.id === "profile-picture").props.ref.current = { click() { clicks++; } };
  nodes.find(node => node.props?.["aria-label"] === "Edit profile picture").props.onClick();
  assert.equal(clicks, 1);
  assert.equal(app.state.profile.profilePicture, "original.png");
});

test("deleting a picture calls the API once and restores the placeholder", async () => {
  let finish;
  let calls = 0;
  const app = setup("settings", {
    getProfileData: async () => ({ success: true, data: { ...profile, profilePicture: "original.png" } }),
    deleteProfilePicture: () => { calls++; return new Promise(resolve => { finish = resolve; }); },
  });
  await app.mount();
  const remove = app.render().find(node => node.props?.["aria-label"] === "Delete profile picture").props.onClick;
  const pending = remove();
  await remove();
  assert.equal(calls, 1);
  assert.equal(app.state.profile.profilePicture, "original.png");
  finish({ success: true });
  await pending;
  assert.equal(app.state.profile.profilePicture, undefined);
  assert.ok(app.render().find(node => node.props?.["aria-label"] === "Profile picture placeholder"));
  assert.equal(app.state.isDeletingPicture, false);
});

test("failed picture deletion retains the avatar and allows retry", async () => {
  const app = setup("settings", {
    getProfileData: async () => ({ success: true, data: { ...profile, profilePicture: "original.png" } }),
    deleteProfilePicture: async () => ({ success: false, message: "Please try again" }),
  });
  await app.mount();
  await app.render().find(node => node.props?.["aria-label"] === "Delete profile picture").props.onClick();
  assert.equal(app.state.profile.profilePicture, "original.png");
  assert.equal(app.toasts.at(-1)?.type, "error");
  assert.equal(app.state.saving, null);
});

test("selected pictures preview locally before any upload and release their object URL", async () => {
  let uploads = 0;
  const app = setup("settings", {
    getProfileData: async () => ({ success: true, data: { ...profile, profilePicture: "original.png" } }),
    uploadProfilePicture: async () => { uploads++; },
  });
  await app.mount();
  const image = new Blob(["image data"], { type: "image/png" });
  app.render().find(node => node.props?.id === "profile-picture").props.onChange({ target: { files: [image] } });
  app.render();
  const cleanup = app.effects.pop()();
  const preview = app.render().find(node => node.type === "img");
  assert.match(preview.props.src, /^blob:/);
  assert.equal(app.state.profile.profilePicture, "original.png");
  assert.equal(uploads, 0);
  cleanup();
});
