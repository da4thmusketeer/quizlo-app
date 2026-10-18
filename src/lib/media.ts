const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
import { getToken } from "@/lib/auth";

export interface AuthSignature {
  signature: string;
  expire: number;
  token: string;
}

/* ── Media type helpers ─────────────────────────── */

export type MediaType = "image" | "audio" | "video";

export interface QuestionMedia {
  url: string;
  type: MediaType;
  name?: string;
  size?: number;
}

/** Maps MIME prefixes to our media types. */
export function getMediaType(file: File): MediaType | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

const ACCEPTED_EXTENSIONS: Record<MediaType, string[]> = {
  image: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"],
  audio: [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"],
  video: [".mp4", ".webm", ".mov", ".avi"],
};

const MAX_FILE_SIZES: Record<MediaType, number> = {
  image: 5 * 1024 * 1024, // 5 MB
  audio: 15 * 1024 * 1024, // 15 MB
  video: 50 * 1024 * 1024, // 50 MB
};

const ACCEPT_STRING = Object.values(ACCEPTED_EXTENSIONS).flat().join(",") +
  ",image/*,audio/*,video/*";

export { ACCEPTED_EXTENSIONS, MAX_FILE_SIZES, ACCEPT_STRING };

export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Validate a file for question-media upload.
 * Returns null if valid, otherwise returns an error message.
 */
export function validateMediaFile(file: File): string | null {
  const mediaType = getMediaType(file);
  if (!mediaType) {
    return `Unsupported file type "${file.type || "unknown"}". Upload an image, audio, or video file.`;
  }
  const maxSize = MAX_FILE_SIZES[mediaType];
  if (file.size > maxSize) {
    return `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} files must be under ${humanFileSize(maxSize)}. This file is ${humanFileSize(file.size)}.`;
  }
  return null;
}

/* ── Upload functions ───────────────────────────── */

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * Upload a file to ImageKit via the backend auth endpoint.
 * Supports optional progress reporting via XMLHttpRequest.
 */
export async function uploadToImageKit(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
): Promise<string> {
  try {
    const token = getToken();

    // 1. Request Auth Signature from your backend
    const authResponse = await fetch(`${API_BASE_URL}/media/auth`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const authData = await authResponse.json();

    if (!authResponse.ok) {
      throw new Error(authData.message || "Failed to get auth signature.");
    }

    // ImageKit auth data can be directly in authData or nested in authData.data
    const signature = authData.signature || authData.data?.signature;
    const expire = authData.expire || authData.data?.expire;
    const ikToken = authData.token || authData.data?.token;

    if (!signature || !expire || !ikToken) {
      console.error(
        "Missing ImageKit auth data from backend. Received:",
        JSON.stringify(authData),
      );
      throw new Error(
        `Upload authentication failed: Server returned incomplete signature data. ` +
          `Available keys: ${Object.keys(authData).join(", ")}` +
          (authData.data
            ? ` (data keys: ${Object.keys(authData.data).join(", ")})`
            : ""),
      );
    }

    // 2. Prepare Form Data for ImageKit
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);

    // Check for public key
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    if (!publicKey) {
      console.warn(
        "NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is not defined in environment variables.",
      );
    }

    formData.append("publicKey", publicKey || "");
    formData.append("signature", signature);
    formData.append("expire", expire.toString());
    formData.append("token", ikToken);
    formData.append("useUniqueFileName", "true");

    // 3. Upload with progress tracking via XHR when callback is provided
    if (onProgress) {
      return await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percent: Math.round((e.loaded / e.total) * 100),
            });
          }
        });

        xhr.addEventListener("load", () => {
          try {
            const result = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(result.url);
            } else {
              reject(
                new Error(
                  result.message || "Failed to upload file to ImageKit",
                ),
              );
            }
          } catch {
            reject(new Error("Failed to parse upload response."));
          }
        });

        xhr.addEventListener("error", () =>
          reject(new Error("Upload failed due to a network error.")),
        );
        xhr.addEventListener("abort", () =>
          reject(new Error("Upload was cancelled.")),
        );

        xhr.send(formData);
      });
    }

    // 3b. Fallback to fetch when no progress callback
    const ikResponse = await fetch(
      "https://upload.imagekit.io/api/v1/files/upload",
      {
        method: "POST",
        body: formData,
      },
    );

    const result = await ikResponse.json();

    if (!ikResponse.ok) {
      throw new Error(result.message || "Failed to upload image to ImageKit");
    }

    return result.url;
  } catch (error) {
    if (error instanceof Error) {
      console.error("uploadToImageKit error:", error);
      throw error;
    }
    throw new Error("An unexpected error occurred while uploading the image.");
  }
}
