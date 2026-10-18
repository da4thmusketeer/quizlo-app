import { getQuizWithQuestions, QuizDetails, CreateQuizQuestion } from "@/lib/quiz";

// Preserve submitted answers across navigation and reloads when API responses omit them.
const quizzes = new Map<string, QuizDetails>();
const storageKey = (id: string) => `quizlo_quiz_summary:${id}`;

function readSnapshot(id: string): QuizDetails | undefined {
  try {
    if (typeof window === "undefined") return;
    const value = sessionStorage.getItem(storageKey(id));
    if (!value) return;
    const quiz = JSON.parse(value);
    if (quiz?.id === id && Array.isArray(quiz.questions)) return normalizeQuizDetails(quiz);
  } catch {
    // A disabled or full browser cache must not block the summary.
  }
}

export function normalizeQuizDetails(quiz: QuizDetails, fallbackQuestions: CreateQuizQuestion[] = []): QuizDetails {
  return {
    ...quiz,
    questions: (quiz.questions ?? []).map((question, index) => {
      const fallback = fallbackQuestions.find((item) => item.text === question.text) ?? fallbackQuestions[index];
      const alternate = (question as typeof question & { options?: typeof question.answerOptions }).options;
      const options = question.answerOptions?.length ? question.answerOptions
        : alternate?.length ? alternate : fallback?.answerOptions ?? [];
      return {
        ...fallback,
        ...question,
        answerOptions: options.map((option) => {
          const value = typeof option === "string" ? { text: option } : option;
          const original = fallback?.answerOptions.find((item) => item.text === value.text);
          return {
            ...original,
            ...value,
            matchingText: value.matchingText ?? (value as { matchText?: string }).matchText ?? original?.matchingText,
          };
        }),
      };
    }),
  };
}

function hasOptions(quiz: QuizDetails) {
  return quiz.questions.every((question) => question.answerOptions.length > 0);
}

export function rememberQuiz(quiz: QuizDetails, fallbackQuestions?: CreateQuizQuestion[]) {
  if (quiz?.id && Array.isArray(quiz.questions)) {
    const previous = quizzes.get(quiz.id) ?? readSnapshot(quiz.id);
    const normalized = normalizeQuizDetails(quiz, fallbackQuestions ?? previous?.questions);
    quizzes.set(quiz.id, normalized);
    try {
      if (typeof window !== "undefined") sessionStorage.setItem(storageKey(quiz.id), JSON.stringify(normalized));
    } catch {
      // Retain the in-memory copy if session storage is unavailable.
    }
  }
}

export async function loadPreviewQuiz(id: string): Promise<QuizDetails> {
  const cached = quizzes.get(id) ?? readSnapshot(id);
  if (cached && hasOptions(cached)) return cached;
  const response = await getQuizWithQuestions(id);
  const quiz: QuizDetails = response?.data ?? response;
  if (!quiz?.id || !Array.isArray(quiz.questions)) {
    throw new Error("The full quiz could not be loaded. Please try again.");
  }
  const completeQuiz = normalizeQuizDetails(quiz, cached?.questions);
  rememberQuiz(completeQuiz);
  return completeQuiz;
}

export function quizSummaryUrl(id: string) {
  return `/create/summary?id=${encodeURIComponent(id)}`;
}
