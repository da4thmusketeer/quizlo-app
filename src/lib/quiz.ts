/**
 * Quiz API Service
 * Handles quiz related API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
import { getToken } from "@/lib/auth";

// Type definitions
export interface Category {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  timeAllocated: number;
  isPrivate: boolean;
  isDraft: boolean;
  creationMode: string;
  plays: number;
  rating: number;
  categoryId: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  coverPicture: string;
  creator: {
    username: string;
    profilePicture: string | null;
  };
  category: {
    name: string;
  };
  _count: {
    questions: number;
  };
}

export type QuestionType =
  | "Mcq"
  | "TrueFalse"
  | "MultipleSelect"
  | "ShortAnswer"
  | "FillInTheBlank"
  | "Numeric"
  | "LongAnswer"
  | "OrderSequencing"
  | "Matching";

export interface SanitizedQuestion {
  id: string;
  text: string;
  media?: any[];
  type: QuestionType;
  answerOptions: {
    id: string;
    text: string;
    matchingText?: string; // For matching questions
  }[];
  matchingTargets?: { id: string; text: string }[];
}

export interface QuizSession {
  attemptId: string;
  quizTitle: string;
  timeAllocated: number;
  questions: SanitizedQuestion[];
  startedAt?: string;
  expiresAt?: string;
}

export type SubmitAnswerPayload = {
  questionId: string;
  timeSpent: number;
} & (
  | { type: "Mcq" | "TrueFalse"; selectedOptionId: string }
  | { type: "MultipleSelect"; selectedOptionIds: string[] }
  | {
      type: "ShortAnswer" | "FillInTheBlank" | "Numeric" | "LongAnswer";
      textResponse: string;
    }
  | { type: "OrderSequencing"; selectedOptionIds: string[] }
  | { type: "Matching"; responseJson: Record<string, string> }
);

export interface AnswerSubmissionResponse {
  accepted?: boolean;
  isCorrect?: boolean;
  pointsEarned?: number;
  correctOptionId?: string | null; // For legacy MCQ support
  correctData?: any; // Legacy API field; the gameplay facade strips this.
}

export interface QuizResults {
  score: number; // percentage 0–100
  questionsAnsweredCorrectly: number;
  totalQuestions: number;
  xpEarned: number;
  levelUp: boolean;
  newLevel: number;
  correctAnswers?: {
    questionId: string;
    type: string;
    correctData: any;
    isCorrect?: boolean;
    explanation?: string;
  }[];
}

export class QuizApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "QuizApiError";
  }
}

async function gameplayRequest<T>(path: string, operationId: string, body?: SubmitAnswerPayload, local = false): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(local ? path : `${API_BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": operationId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new QuizApiError("Connection interrupted. Your progress is saved. Reconnect and retry.", 0);
  }
  let result;
  try { result = await response.json(); } catch {
    throw new QuizApiError("The server returned an unreadable response. Your progress is saved.", response.status);
  }
  if (!result || typeof result !== "object") throw new QuizApiError("The server returned an invalid quiz response.", response.status);
  if (!response.ok || result.success === false) {
    // Some backends return the original completed result on a repeated completion.
    if (response.status === 409 && path.endsWith("/complete") && typeof result.data?.score === "number") return result.data;
    throw new QuizApiError(typeof result.message === "string" ? result.message : "The quiz request failed. Please retry.", response.status);
  }
  return result.data ?? result;
}

// ==== Functions ====

export async function getAllQuizzes(): Promise<Quiz[]> {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/quiz/all`, {
      method: "GET",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Failed to fetch quizzes.");
    }

    const quizzes = Array.isArray(result)
      ? result
      : Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.quizzes)
          ? result.quizzes
          : [];

    return quizzes;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while fetching quizzes.");
  }
}

/**
 * Get category data for quizzes
 */
export async function getCategoryData(): Promise<Category[]> {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/quiz/categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch category data.");
    }

    // The API may return a wrapped response like { data: [...] } or a raw array
    const categories = Array.isArray(result)
      ? result
      : Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.categories)
          ? result.categories
          : [];

    return categories;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error(
      "An unexpected error occurred while fetching category data.",
    );
  }
}

export interface CreateQuizQuestionOption {
  text: string;
  isCorrect?: boolean;
  matchingText?: string;
}

export interface CreateQuizQuestion {
  text: string;
  type: QuestionType;
  explanation?: string | null;
  media?: any[];
  answerOptions: CreateQuizQuestionOption[];
}

export interface QuizDetails {
  id: string;
  title: string;
  description?: string | null;
  coverPicture?: string | null;
  categoryId: string;
  category?: { name: string };
  difficulty: "Easy" | "Medium" | "Hard";
  timeAllocated: number;
  isPrivate: boolean;
  isDraft: boolean;
  creationMode: string;
  questions: (CreateQuizQuestion & {
    id?: string;
    order?: number;
    answerOptions: (CreateQuizQuestionOption & { matchText?: string | null; order?: number })[];
  })[];
}

export interface CreateQuizPayload {
  title: string;
  description?: string;
  coverPicture?: string;
  categoryId: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  timeAllocated: number;
  isPrivate?: boolean;
  isDraft?: boolean;
  creationMode?: "Manual" | "AI" | string;
  questions?: CreateQuizQuestion[];
  aiPrompt?: string;
  questionCount?: number;
}

export interface CreateAiQuizPayload {
  title: string;
  topic: string;
  categoryId: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timeAllocated: number;
  isPrivate: boolean;
  numberOfQuestions?: number;
  description?: string;
  isDraft?: boolean;
  coverPicture?: string | null;
  creationMode?: "Manual" | "Ai" | "manual" | "ai";
}

/** Create and save a quiz with AI-generated questions. */
export async function createAiQuiz(data: CreateAiQuizPayload) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/quiz/create-ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(
      (typeof result.error === "string" && result.error) ||
        (typeof result.message === "string" && result.message) ||
        "Failed to generate AI quiz.",
    );
  }

  return result;
}

/**
 * Create a new quiz
 */
export async function createQuiz(data: CreateQuizPayload | any): Promise<any> {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/quiz/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMsg =
        (typeof result.error === "string" ? result.error : null) ||
        (typeof result.message === "string" ? result.message : null) ||
        (Array.isArray(result.errors) ? result.errors.join(", ") : null) ||
        (result.error?.message ? result.error.message : null) ||
        "Failed to create quiz.";
      throw new Error(errorMsg);
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while creating the quiz.");
  }
}

/**
 * Get a single quiz by ID
 */
export async function getQuizById(id: string): Promise<Quiz> {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/quiz/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch quiz.");
    }

    // The API returns { success: true, message: "...", data: quiz }
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while fetching the quiz.");
  }
}

/**
 * Start a quiz session
 */
export async function startQuiz(id: string, operationId = crypto.randomUUID()): Promise<QuizSession> {
  return gameplayRequest<QuizSession>(`/api/gameplay/${encodeURIComponent(id)}/start`, operationId, undefined, true);
}

export async function submitAnswer(attemptId: string, data: SubmitAnswerPayload, operationId = crypto.randomUUID()): Promise<AnswerSubmissionResponse> {
  return gameplayRequest<AnswerSubmissionResponse>(`/api/gameplay/attempts/${encodeURIComponent(attemptId)}/submit-answer`, operationId, data, true);
}

export async function completeQuiz(attemptId: string, operationId = crypto.randomUUID()): Promise<QuizResults> {
  return gameplayRequest<QuizResults>(`/api/gameplay/attempts/${encodeURIComponent(attemptId)}/complete`, operationId, undefined, true);
}
/**
 * Delete a quiz by ID
 */
export async function deleteQuiz(
  id: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/quiz/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to delete quiz.");
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while deleting the quiz.");
  }
}

/**
 * Get a quiz by ID including its full questions and answer options
 * Used for the edit page so we can pre-populate all fields.
 */
export async function getQuizWithQuestions(id: string, signal?: AbortSignal): Promise<any> {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/quiz/${id}`, {
      method: "GET",
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch quiz.");
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while fetching the quiz.");
  }
}

/**
 * Update an existing quiz (details + questions)
 */
export async function updateQuiz(id: string, data: any): Promise<any> {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/quiz/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || result.message || "Failed to update quiz.",
      );
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while updating the quiz.");
  }
}

/**
 * Rate a quiz after completion
 */
export async function rateQuiz(data: {
  quizId: string;
  rating: number;
  comment?: string;
}): Promise<any> {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/user/rate-quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to submit rating.");
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error(
      "An unexpected error occurred while submitting the rating.",
    );
  }
}
