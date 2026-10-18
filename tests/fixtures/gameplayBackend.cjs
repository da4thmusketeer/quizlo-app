// Local-only fixture for gameplay UI verification; never imported by the app.
const http = require("node:http");
const { randomUUID } = require("node:crypto");
const attempts = new Map();
const operations = new Map();
const counts = { starts: 0, answers: 0, completes: 0, reviews: 0 };
const questions = [
  { id: "q1", text: "Which planet is known as the Red Planet?", type: "Mcq", answerOptions: [{ id: "earth", text: "Earth" }, { id: "mars", text: "Mars" }, { id: "venus", text: "Venus" }, { id: "saturn", text: "Saturn" }] },
  { id: "q2", text: "Which of these are planets?", type: "MultipleSelect", answerOptions: [{ id: "neptune", text: "Neptune" }, { id: "sun", text: "The Sun" }, { id: "jupiter", text: "Jupiter" }] },
  { id: "q3", text: "What is the name of our home galaxy?", type: "ShortAnswer", answerOptions: [] },
];
const correct = { q1: ["mars"], q2: ["neptune", "jupiter"], q3: ["Milky Way"] };
const explanations = { q1: "Iron oxide on its surface gives Mars its reddish appearance.", q2: "Neptune and Jupiter orbit the Sun. The Sun is a star.", q3: "Our Solar System is located in the Milky Way galaxy." };
const quiz = id => ({ id, title: "A Little Space to Think", description: "A quick journey through our cosmic neighborhood.", categoryId: "science", category: { name: "Science" }, timeAllocated: id === "timer" ? 3 : 180, difficulty: "Easy", creationMode: "Manual", isDraft: false, isPrivate: false, _count: { questions: id === "timer" ? 1 : 3 } });
function createGameplayBackend() { return http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "http://localhost:3011");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Idempotency-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");
  const send = (data, status = 200) => { res.statusCode = status; res.end(JSON.stringify(data)); };
  if (req.method === "OPTIONS") return send({});
  const path = new URL(req.url, "http://localhost").pathname;
  if (path === "/__metrics") return send(counts);
  if (path === "/quiz/all") return send({ data: [quiz("demo"), quiz("timer")] });
  if (path === "/quiz/categories") return send({ data: [{ id: "science", name: "Science" }] });
  if (path.includes("profile") || path === "/user/me") return send({ success: true, data: { username: "Quiz Player", xp: 100, level: 1 } });
  if (path === "/user/dashboard") return send({ success: true, data: { statistics: { totalQuizzesPlayed: counts.completes } } });
  const key = req.headers["idempotency-key"];
  if (key && operations.has(key)) return send(operations.get(key));
  const finish = data => { const response = { success: true, data }; if (key) operations.set(key, response); send(response); };
  if (req.method === "POST" && /^\/quiz\/[^/]+\/start$/.test(path)) {
    const id = path.split("/")[2];
    const selected = id === "timer" ? questions.slice(0, 1) : questions;
    const startedAt = new Date().toISOString();
    const data = { attemptId: randomUUID(), quizTitle: quiz(id).title, timeAllocated: quiz(id).timeAllocated, questions: selected, startedAt, expiresAt: new Date(Date.now() + quiz(id).timeAllocated * 1000).toISOString() };
    attempts.set(data.attemptId, { id, data, answers: new Map() }); counts.starts++; return finish(data);
  }
  const attemptId = path.split("/")[3];
  const attempt = attempts.get(attemptId);
  if (path.endsWith("/submit-answer") && attempt) {
    if (attempt.id === "expired") return send({ message: "Attempt expired" }, 410);
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const answer = JSON.parse(Buffer.concat(chunks).toString());
    const values = answer.selectedOptionIds ?? [answer.selectedOptionId ?? answer.textResponse];
    const expected = correct[answer.questionId];
    const isCorrect = values.length === expected.length && values.every(value => expected.some(item => item.toLowerCase() === String(value).toLowerCase()));
    attempt.answers.set(answer.questionId, { answer, isCorrect }); counts.answers++;
    const response = { success: true, data: { isCorrect, pointsEarned: isCorrect ? 10 : 0, correctData: expected } };
    if (key) operations.set(key, response);
    if (attempt.id === "network" && !attempt.failedOnce) { attempt.failedOnce = true; return res.destroy(); }
    return send(response);
  }
  if (path.endsWith("/complete") && attempt) {
    const total = attempt.data.questions.length;
    const count = Array.from(attempt.answers.values()).filter(value => value.isCorrect).length;
    counts.completes++; attempt.completed = true;
    return finish({ score: Math.round(count / total * 100), questionsAnsweredCorrectly: count, totalQuestions: total, xpEarned: count * 10, levelUp: false, newLevel: 1,
      correctAnswers: attempt.data.questions.map(question => ({ questionId: question.id, type: question.type, correctData: correct[question.id], isCorrect: attempt.answers.get(question.id)?.isCorrect ?? false, explanation: explanations[question.id] })) });
  }
  if (req.method === "GET" && /^\/quiz\/[^/]+$/.test(path)) {
    const id = path.split("/")[2];
    if (!Array.from(attempts.values()).some(item => item.id === id && item.completed)) return send({ message: "Review available after completion only" }, 403);
    counts.reviews++;
    return finish({ ...quiz(id), questions: questions.map(question => ({ ...question, explanation: explanations[question.id], answerOptions: question.type === "ShortAnswer" ? [{ text: "Milky Way", isCorrect: true }] : question.answerOptions.map(option => ({ ...option, isCorrect: correct[question.id].includes(option.id) })) })) });
  }
  return send({ message: "Fixture route not found" }, 404);
}); }
module.exports = { createGameplayBackend };
if (require.main === module) createGameplayBackend().listen(4011, "127.0.0.1", () => console.log("Gameplay API fixture listening on http://127.0.0.1:4011"));
