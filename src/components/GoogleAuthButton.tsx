"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { googleAuth, storeToken, AuthResponse } from "@/lib/auth";
import { goeyToast } from "goey-toast";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number | string;
            },
          ) => void;
          prompt: (notification?: (notification: unknown) => void) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  mode?: "login" | "signup";
  text?: string;
}

export default function GoogleAuthButton({
  mode = "login",
  text = "Continue with Google",
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const hiddenBtnRef = useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  const handleAuthSuccess = (res: AuthResponse) => {
    if (res.token) {
      storeToken(res.token);
    }

    const successTitle =
      mode === "signup" ? "Account Created!" : "Login Successful!";
    const successDesc =
      mode === "signup"
        ? "Welcome to Quizlo! Redirecting to your homepage..."
        : "Welcome back! Redirecting to your Quizlo dashboard...";

    goeyToast.success(successTitle, {
      description: successDesc,
    });

    const redirectTo =
      mode === "login" ? searchParams?.get("redirect") || "/home" : "/home";

    setTimeout(() => {
      router.push(redirectTo);
    }, 800);
  };

  const handleCredentialResponse = async (response: { credential?: string }) => {
    if (!response.credential) {
      goeyToast.error("Google Auth Failed", {
        description: "No credential received from Google.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await googleAuth({ credential: response.credential });
      handleAuthSuccess(res);
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : "Google authentication failed. Please try again.";
      goeyToast.error("Google Auth Failed", { description: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Google Identity Services when script is ready and clientId exists
  useEffect(() => {
    if (!isGsiLoaded || !clientId || typeof window === "undefined" || !window.google) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (hiddenBtnRef.current) {
        hiddenBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(hiddenBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: mode === "signup" ? "signup_with" : "continue_with",
          shape: "rectangular",
          width: 380,
        });
      }
    } catch (error) {
      console.error("Failed to initialize Google Identity Services:", error);
    }
  }, [isGsiLoaded, clientId, mode]);

  const handleClick = () => {
    if (isLoading) return;

    if (!clientId) {
      goeyToast.error("Google Client ID Missing 🔑", {
        description:
          "Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env file to enable Google authentication.",
      });
      return;
    }

    if (!window.google) {
      goeyToast.error("Google Script Loading", {
        description: "Google Sign-In is still initializing. Please try again in a moment.",
      });
      return;
    }

    // Trigger OAuth2 Token Client popup as direct click fallback
    try {
      if (window.google.accounts.oauth2) {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              goeyToast.error("Google Auth Error", {
                description:
                  tokenResponse.error_description || tokenResponse.error,
              });
              return;
            }

            if (tokenResponse.access_token) {
              setIsLoading(true);
              try {
                const res = await googleAuth({
                  token: tokenResponse.access_token,
                });
                handleAuthSuccess(res);
              } catch (err) {
                const errMsg =
                  err instanceof Error
                    ? err.message
                    : "Google authentication failed.";
                goeyToast.error("Google Auth Failed", { description: errMsg });
              } finally {
                setIsLoading(false);
              }
            }
          },
        });
        tokenClient.requestAccessToken();
      } else if (window.google.accounts.id) {
        window.google.accounts.id.prompt();
      }
    } catch (err) {
      console.error("Google click error:", err);
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setIsGsiLoaded(true)}
      />

      <div className="relative w-full overflow-hidden rounded-[12px]">
        {/* Custom Styled Button */}
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border-2 border-ink rounded-[12px] font-bold text-[0.85rem] text-ink shadow-[3px_3px_0_#16151d] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#16151d] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.4 0 15.2c0 2.8.7 5.5 1.9 7.9l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
          )}
          <span>{isLoading ? "Authenticating..." : text}</span>
        </button>

        {/* Hidden/Transparent Google Native Button Overlay for Seamless GIS Click */}
        {Boolean(clientId && !isLoading) && (
          <div
            ref={hiddenBtnRef}
            className="absolute inset-0 opacity-[0.0001] cursor-pointer flex items-center justify-center pointer-events-auto overflow-hidden"
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );
}
