import { getQuizWithQuestions, QuizDetails } from "@/lib/quiz";

// Keep the creation response available during client navigation. Reloads use the API.
const quizzes = new Map<string, QuizDetails>();

export function rememberQuiz(quiz: QuizDetails) {
  if (quiz?.id && Array.isArray(quiz.questions)) quizzes.set(quiz.id, quiz);
}

export async function loadPreviewQuiz(id: string): Promise<QuizDetails> {
  const cached = quizzes.get(id);
  if (cached) return cached;
  const quiz: QuizDetails = await getQuizWithQuestions(id);
  if (!quiz?.id || !Array.isArray(quiz.questions)) {
    throw new Error("The full quiz could not be loaded. Please try again.");
  }
  rememberQuiz(quiz);
  return quiz;
}

export function quizPreviewUrl(id: string) {
  return `/create/preview?id=${encodeURIComponent(id)}`;
}
