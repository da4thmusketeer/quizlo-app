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
}

export interface QuizSession {
  attemptId: string;
  quizTitle: string;
  timeAllocated: number;
  questions: SanitizedQuestion[];
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
  isCorrect: boolean;
  pointsEarned: number;
  correctOptionId?: string | null; // For legacy MCQ support
  correctData: any; // Dynamic correct answer data
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
  }[];
}

// ==== Functions ====

export async function getAllQuizzes(): Promise<Quiz[]> {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/quiz/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await response.json();

    if (!response.ok) {
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
  media?: any[];
  answerOptions: CreateQuizQuestionOption[];
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
export async function startQuiz(id: string): Promise<QuizSession> {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/quiz/${id}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to start quiz.");
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while starting the quiz.");
  }
}

/**
 * Submit an answer for a question
 */
export async function submitAnswer(
  attemptId: string,
  data: SubmitAnswerPayload,
): Promise<AnswerSubmissionResponse> {
  try {
    const token = getToken();
    const response = await fetch(
      `${API_BASE_URL}/quiz/attempts/${attemptId}/submit-answer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to submit answer.");
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error(
      "An unexpected error occurred while submitting the answer.",
    );
  }
}

/**
 * Complete a quiz session
 */
export async function completeQuiz(attemptId: string): Promise<QuizResults> {
  try {
    const token = getToken();
    const response = await fetch(
      `${API_BASE_URL}/quiz/attempts/${attemptId}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to complete quiz.");
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while completing the quiz.");
  }
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
export async function getQuizWithQuestions(id: string): Promise<any> {
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
