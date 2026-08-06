/**
 * User API Service
 * Handles all API calls for authenticated user account management
 * (e.g., profile, change password, upload picture)
 */

import { getToken } from "@/lib/auth";

// XP Level labels — index 0 = Level 1, index 29 = Level 30
export const LEVEL_LABELS = [
  "Novice",
  "Initiate",
  "Apprentice",
  "Student",
  "Scholar",
  "Thinker",
  "Analyst",
  "Researcher",
  "Debater",
  "Expert",
  "Veteran",
  "Specialist",
  "Intellectual",
  "Prodigy",
  "Sage",
  "Master",
  "Champion",
  "Virtuoso",
  "Luminary",
  "Grandmaster",
  "Titan",
  "Prodigy Elite",
  "Oracle",
  "Visionary",
  "Legend",
  "Mythic",
  "Transcendent",
  "Ascendant",
  "Eternal",
  "Omniscient",
] as const;

/** Returns the level label for a given 1-based level number */
export function getLevelLabel(level: number): string {
  return LEVEL_LABELS[Math.min(Math.max(level, 1), 30) - 1];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

// Type definitions
export interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profilePicture?: string;
  createdAt?: string;
  level?: number;
  xp?: number;
  streak?: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  data?: ProfileData;
  /** XP awarded for the first GET /user/me call of the calendar day (0 = already claimed today) */
  dailyLoginXP?: number;
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
  categoryId: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  coverPicture?: string;
  category: {
    name: string;
  };
  _count: {
    questions: number;
  };
}

export interface UserQuizzesResponse {
  success: boolean;
  message?: string;
  data?: Quiz[];
}

export interface XpProgress {
  currentLevel: number;
  label: string;
  tier: string;
  xpIntoLevel: number;
  xpToNextLevel: number | null; // null at max level (30)
  progressPercentage: number;
}

export interface DashboardData {
  profile: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    xp: number;
    level: number;
    streak: number;
    profilePicture?: string;
  };
  goals?: {
    xpProgress: XpProgress;
  };
  myQuizzes: Quiz[];
  statistics: {
    totalQuizzesPlayed: number;
    totalQuizzesCreated: number;
    averageAccuracy: number;
    totalXPEarned: number;
  };
  recentActivity: {
    id: string;
    quiz: { title: string };
    score: number;
    accuracy: number;
    completedAt: string;
  }[];
}

export interface DashboardResponse {
  success: boolean;
  message?: string;
  data: DashboardData;
}

/**
 * Fetch current user profile
 */
export async function getProfile(): Promise<UserResponse> {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/user/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch profile.");
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while fetching profile.");
  }
}

/**
 * Update user username
 */
export async function updateUsername(username: string): Promise<UserResponse> {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/user/update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ username }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update username.");
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while updating username.");
  }
}

/**
 * Update user email
 */
export async function updateEmail(
  email: string,
  password: string,
): Promise<UserResponse> {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/user/update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update email.");
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while updating email.");
  }
}

/**
 * Change password for an authenticated user
 */
export async function changePassword(
  data: ChangePasswordRequest,
): Promise<{ success: boolean; message: string }> {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/user/change-password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to change password. Please try again.",
      );
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while changing password.");
  }
}

/**
 * Upload a profile picture for the authenticated user
 * Sends a PATCH request with FormData (multipart/form-data)
 */
export async function uploadProfilePicture(file: File): Promise<{
  success: boolean;
  message: string;
  data?: { profilePicture: string };
}> {
  try {
    const token = getToken();

    const formData = new FormData();
    formData.append("profilePicture", file);

    const response = await fetch(`${API_BASE_URL}/user/profile-picture`, {
      method: "PATCH",
      headers: {
        // Do NOT set Content-Type — the browser sets it automatically
        // with the correct multipart boundary
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to upload profile picture. Please try again.",
      );
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error(
      "An unexpected error occurred while uploading profile picture.",
    );
  }
}

export async function deleteProfilePicture(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/user/profile-picture`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to delete profile picture. Please try again.",
      );
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error(
      "An unexpected error occurred while deleting profile picture.",
    );
  }
}

export async function getUserQuizzes(): Promise<UserQuizzesResponse> {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/user/quizzes`, {
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

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while fetching quizzes.");
  }
}

/*
Change username
*/
export async function changeUsername(username: string): Promise<UserResponse> {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/user/change-username`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ username }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update username.");
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while updating username.");
  }
}

/**
 * Fetch dashboard data for the authenticated user
 */
export async function getDashboardData(): Promise<DashboardResponse> {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/user/dashboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch dashboard data.");
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error(
      "An unexpected error occurred while fetching dashboard data.",
    );
  }
}

/**
 * Fetch current user profile data
 */
export async function getProfileData(): Promise<UserResponse> {
  return getProfile();
}
