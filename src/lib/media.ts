const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
import { getToken } from "@/lib/auth";

export interface AuthSignature {
  signature: string;
  expire: number;
  token: string;
}

export async function uploadToImageKit(file: File): Promise<string> {
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

    // 3. Direct Upload to ImageKit
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
