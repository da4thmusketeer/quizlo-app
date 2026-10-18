import { create } from "zustand";
import { getToken } from "@/lib/auth";
import {
  startQuiz, submitAnswer, completeQuiz, getQuizWithQuestions, QuizApiError,
  QuizSession, QuizResults, SanitizedQuestion, SubmitAnswerPayload, QuizDetails,
} from "@/lib/quiz";

export type Selection = { optionId?: string; optionIds?: string[]; text?: string; matches?: Record<string, string> };
export type GamePhase = "starting" | "playing" | "submitting" | "completed" | "expired";
export interface Game {
  quizId: string;
  owner: string;
  operationId: string;
  phase: GamePhase;
  session?: QuizSession;
  deadline: number;
  index: number;
  questionStartedAt: number;
  selections: Record<string, Selection>;
  prepared: Record<string, SubmitAnswerPayload>;
  submitted: string[];
  pending?: SubmitAnswerPayload;
  results?: QuizResults;
  review?: QuizDetails;
  error?: string;
  errorStatus?: number;
  storageWarning?: boolean;
}

const KEY = "quizlo_gameplay_v1";
const running = new Map<string, Promise<void>>();
const reviewRequests = new Map<string, Promise<void>>();
export const useGameplayStore = create<{ games: Record<string, Game> }>(() => ({ games: {} }));

async function ownerKey() {
  const token = getToken();
  if (!token) throw new QuizApiError("Please log in to play this quiz.", 401);
  let identity = token;
  try {
    const claims = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const subject = claims.sub ?? claims.userId ?? claims.id;
    if (typeof subject === "string" && subject) identity = `${claims.iss ?? "quizlo"}:${subject}`;
  } catch { /* Opaque tokens remain scoped to their own fingerprint. */ }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
  return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, "0")).join("");
}

function write(game: Game) {
  let next = game;
  try { sessionStorage.setItem(`${KEY}:${game.quizId}`, JSON.stringify(game)); }
  catch { next = { ...game, storageWarning: true }; }
  useGameplayStore.setState(state => ({ games: { ...state.games, [game.quizId]: next } }));
}

export function currentGame(id: string) { return useGameplayStore.getState().games[id]; }
function patch(id: string, update: Partial<Game>) {
  const game = currentGame(id);
  if (game) write({ ...game, ...update });
}

const written = new Set(["ShortAnswer", "LongAnswer", "FillInTheBlank", "Numeric"]);
const questionTypes = new Set(["Mcq", "TrueFalse", "MultipleSelect", "ShortAnswer", "LongAnswer", "FillInTheBlank", "Numeric", "OrderSequencing", "Matching"]);

// Whitelist the public session shape. No correct answers or explanations enter play storage.
export function sanitizeSession(input: QuizSession): QuizSession {
  if (!input?.attemptId || !Array.isArray(input.questions) || !input.questions.length || !(input.timeAllocated > 0)) {
    throw new Error("The server did not return a playable session.");
  }
  const questions = input.questions.map(question => {
    if (!question.id || !questionTypes.has(question.type)) throw new Error("This session contains an unsupported question.");
    const options = question.answerOptions ?? [];
    if (options.some(option => "isCorrect" in option || "matchingText" in option || "matchText" in option) ||
        (written.has(question.type) && options.length > 0)) {
      throw new Error("The session includes answer-key data. The server must return sanitized questions before this quiz can be played.");
    }
    if (!written.has(question.type) && options.length === 0) throw new Error("This question has no available answer options.");
    if (question.type === "Matching" && !question.matchingTargets?.length) throw new Error("Matching questions require independent target choices from the server.");
    return {
      id: question.id, text: question.text, type: question.type,
      answerOptions: options.map(option => ({ id: option.id, text: option.text })),
      ...(question.matchingTargets ? { matchingTargets: question.matchingTargets.map(target => ({ id: target.id, text: target.text })) } : {}),
      media: (question.media ?? []).flatMap(media => {
        const url = typeof media === "string" ? media : media?.url;
        return typeof url === "string" && /^https?:\/\//i.test(url) ? [{ url }] : [];
      }),
    };
  });
  return { attemptId: input.attemptId, quizTitle: input.quizTitle, timeAllocated: input.timeAllocated, questions,
    startedAt: input.startedAt, expiresAt: input.expiresAt };
}

export async function recoverGame(id: string) {
  const owner = await ownerKey();
  const existing = currentGame(id);
  if (existing?.owner === owner) return existing;
  let game: Game | undefined;
  try {
    const raw = sessionStorage.getItem(`${KEY}:${id}`);
    const saved = raw ? JSON.parse(raw) : null;
    if (saved?.owner === owner && saved.quizId === id && saved.operationId && Array.isArray(saved.submitted)) {
      // Reject unexpected persisted state instead of issuing requests with corrupt IDs.
      if (saved.session) {
        saved.session = sanitizeSession(saved.session);
        if (!Number.isInteger(saved.index) || saved.index < 0 || saved.index >= saved.session.questions.length ||
            !Number.isFinite(saved.deadline) || !saved.selections || typeof saved.selections !== "object") throw new Error("Invalid session snapshot");
        saved.prepared ??= {};
      }
      if (["starting", "playing", "submitting", "completed", "expired"].includes(saved.phase)) game = saved;
    }
  } catch { /* Start a fresh session when no valid snapshot exists. */ }
  if (game) write(game);
  else useGameplayStore.setState(state => {
    const games = { ...state.games }; delete games[id]; return { games };
  });
  return game;
}

function singleFlight(id: string, action: () => Promise<void>) {
  const pending = running.get(id);
  if (pending) return pending;
  const task = action().finally(() => running.delete(id));
  running.set(id, task);
  return task;
}

function recordError(id: string, error: unknown) {
  const status = error instanceof QuizApiError ? error.status : 422;
  const message = error instanceof Error ? error.message : "Something went wrong. Your progress is saved.";
  const expired = status === 410 || status === 404 || /session.*expired|attempt.*expired|time.*expired/i.test(message) ||
    (status === 409 && /already.*completed/i.test(message));
  patch(id, { error: message, errorStatus: status, ...(expired ? { phase: "expired" as const } : {}) });
}

export function beginGame(id: string) {
  return singleFlight(id, async () => {
    try {
      const owner = await ownerKey();
      const previous = currentGame(id);
      if (previous?.owner === owner && previous?.session && previous.phase !== "completed" && previous.phase !== "expired") return;
      const game: Game = previous?.phase === "starting" && previous.owner === owner ? previous : {
        quizId: id, owner, operationId: crypto.randomUUID(), phase: "starting", deadline: 0, index: 0,
        questionStartedAt: Date.now(), selections: {}, prepared: {}, submitted: [],
      };
      write({ ...game, error: undefined });
      const requestedAt = Date.now();
      const session = sanitizeSession(await startQuiz(id, `${game.operationId}:start`));
      const serverDeadline = session.expiresAt ? Date.parse(session.expiresAt) : NaN;
      const serverStart = session.startedAt ? Date.parse(session.startedAt) : NaN;
      const deadline = Number.isFinite(serverDeadline) ? serverDeadline :
        (Number.isFinite(serverStart) ? serverStart : requestedAt) + session.timeAllocated * 1000;
      write({ ...game, phase: "playing", session, deadline, questionStartedAt: Date.now(), error: undefined });
    } catch (error) {
      if (!currentGame(id)) throw error;
      recordError(id, error);
    }
  });
}

export function selectAnswer(id: string, selection: Selection) {
  const game = currentGame(id);
  const question = game?.session?.questions[game.index];
  if (!game || !question || game.phase !== "playing" || Date.now() >= game.deadline || running.has(id) || game.submitted.includes(question.id) || game.pending) return;
  patch(id, { selections: { ...game.selections, [question.id]: selection }, error: undefined });
}

export function answerPayload(question: SanitizedQuestion, selection: Selection = {}, timeSpent = 0): SubmitAnswerPayload | undefined {
  const base = { questionId: question.id, timeSpent: Math.max(0, timeSpent) };
  switch (question.type) {
    case "Mcq": case "TrueFalse":
      return selection.optionId ? { ...base, type: question.type, selectedOptionId: selection.optionId } : undefined;
    case "MultipleSelect": case "OrderSequencing":
      return selection.optionIds?.length ? { ...base, type: question.type, selectedOptionIds: selection.optionIds } : undefined;
    case "Matching":
      return selection.matches && Object.keys(selection.matches).length ? { ...base, type: "Matching", responseJson: selection.matches } : undefined;
    default:
      return selection.text?.trim() ? { ...base, type: question.type, textResponse: selection.text.trim() } : undefined;
  }
}

function prepareCurrent(id: string) {
  const game = currentGame(id)!;
  const question = game.session!.questions[game.index];
  if (game.prepared[question.id]) return;
  const payload = answerPayload(question, game.selections[question.id],
    Math.max(0, Math.min(Date.now(), game.deadline) - game.questionStartedAt) / 1000);
  if (payload) patch(id, { prepared: { ...game.prepared, [question.id]: payload } });
}

async function sendPrepared(id: string, questionId: string) {
  const game = currentGame(id)!;
  if (game.submitted.includes(questionId)) return;
  const payload = game.pending?.questionId === questionId ? game.pending : game.prepared[questionId];
  if (!payload) return;
  // Journal the exact payload before sending so retries use identical data and key.
  patch(id, { pending: payload });
  try {
    await submitAnswer(game.session!.attemptId, payload, `${game.operationId}:answer:${questionId}`);
  } catch (error) {
    // The backend may enforce one accepted answer per attempt/question.
    if (!(error instanceof QuizApiError && [400, 409].includes(error.status) && /already.*(answered|submitted)/i.test(error.message))) throw error;
  }
  patch(id, { submitted: Array.from(new Set([...currentGame(id)!.submitted, questionId])), pending: undefined });
}

export function advanceGame(id: string) {
  return singleFlight(id, async () => {
    const game = currentGame(id);
    if (!game?.session || game.phase !== "playing") return;
    patch(id, { error: undefined });
    try {
      if (Date.now() >= game.deadline) { patch(id, { phase: "submitting" }); await finishInternal(id); return; }
      prepareCurrent(id);
      if (game.index < game.session.questions.length - 1) patch(id, { index: game.index + 1, questionStartedAt: Date.now() });
      else { patch(id, { phase: "submitting" }); await finishInternal(id); }
    } catch (error) { recordError(id, error); }
  });
}

async function finishInternal(id: string) {
  const game = currentGame(id)!;
  prepareCurrent(id);
  for (const question of game.session!.questions) await sendPrepared(id, question.id);
  const results = await completeQuiz(game.session!.attemptId, `${game.operationId}:complete`);
  if (!Number.isFinite(results?.score) || results.score < 0 || results.score > 100 ||
      !Number.isFinite(results?.xpEarned) || results.xpEarned < 0 ||
      !Number.isInteger(results?.totalQuestions) || results.totalQuestions < 1 ||
      !Number.isInteger(results?.questionsAnsweredCorrectly) || results.questionsAnsweredCorrectly < 0 ||
      results.questionsAnsweredCorrectly > results.totalQuestions) {
    throw new Error("The server did not return valid results. Please retry completion.");
  }
  patch(id, { phase: "completed", results, pending: undefined, error: undefined });
  // Never fetch answer keys before server-confirmed completion.
  void loadGameReview(id);
}

export function finishGame(id: string) {
  return singleFlight(id, async () => {
    const game = currentGame(id);
    if (!game?.session || game.phase === "completed" || game.phase === "expired") return;
    patch(id, { phase: "submitting", error: undefined });
    try { await finishInternal(id); } catch (error) { recordError(id, error); }
  });
}

export async function loadGameReview(id: string) {
  if (reviewRequests.has(id)) return reviewRequests.get(id);
  const game = currentGame(id);
  if (game?.phase !== "completed") return;
  const request = (async () => {
    try {
      const response = await getQuizWithQuestions(id, AbortSignal.timeout(20000));
      const review: QuizDetails = response?.data ?? response;
      const active = currentGame(id);
      if (Array.isArray(review?.questions) && active?.phase === "completed" && active.session?.attemptId === game.session?.attemptId) patch(id, { review });
    } catch { /* Results remain available if answer review is temporarily unavailable. */ }
  })().finally(() => reviewRequests.delete(id));
  reviewRequests.set(id, request);
  return request;
}

export async function retryGame(id: string) {
  const game = currentGame(id);
  if (game?.phase === "starting") return beginGame(id);
  if (game?.phase === "submitting" || (game?.deadline && Date.now() >= game.deadline)) return finishGame(id);
  if (game?.phase === "playing") return advanceGame(id);
}

export function resetGame(id: string) {
  if (running.has(id)) return;
  try { sessionStorage.removeItem(`${KEY}:${id}`); } catch { /* Optional storage. */ }
  useGameplayStore.setState(state => { const games = { ...state.games }; delete games[id]; return { games }; });
}
