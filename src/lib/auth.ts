/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

// Type definitions for API requests and responses
export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  data?: ProfileData;
  user?: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/**
 * Sign up a new user
 */
export async function signup(data: SignupRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || result.message || "Signup failed. Please try again.",
      );
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred during signup.");
  }
}

/**
 * Login an existing user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || result.message || "Login failed. Please check your credentials.",
      );
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred during login.");
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    // Clear token regardless of response status
    clearToken();

    if (!response.ok) {
      console.warn("Logout request failed, but token was cleared locally");
    }
  } catch (error) {
    // Always clear token even if request fails
    clearToken();
    console.error("Logout error:", error);
  }
}

/**
 * Request a password reset email
 */
export async function forgotPassword(
  email: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || result.message || "Failed to send reset email. Please try again.",
      );
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred.");
  }
}

/**
 * Reset a user's password using a valid token
 */
export async function resetPassword(
  data: ResetPasswordRequest,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Password reset failed. The link may have expired.",
      );
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred.");
  }
}

/**
 * Store authentication token in both localStorage and cookies
 * Cookie is used for server-side middleware authentication
 * localStorage is used for client-side API calls
 */
export function storeToken(token: string): void {
  if (typeof window !== "undefined") {
    // Store in localStorage for client-side use
    localStorage.setItem("auth_token", token);

    // Store in cookie for server-side middleware access
    // Set cookie with 7 days expiration
    const expiryDays = 7;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    // Only use Secure flag in production (requires HTTPS)
    const isProduction = process.env.NODE_ENV === "production";
    const secureFlag = isProduction ? "; Secure" : "";

    document.cookie = `auth_token=${token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict${secureFlag}`;
  }
}

/**
 * Get authentication token from localStorage
 */
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}

/**
 * Remove authentication token from both localStorage and cookies
 */
export function clearToken(): void {
  if (typeof window !== "undefined") {
    // Remove from localStorage
    localStorage.removeItem("auth_token");

    // Remove cookie by setting expiry date in the past
    const isProduction = process.env.NODE_ENV === "production";
    const secureFlag = isProduction ? "; Secure" : "";

    document.cookie = `auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict${secureFlag}`;
  }
}

/**
 * Check if the user is authenticated (has a valid token)
 * Returns true if token exists, false otherwise
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}
