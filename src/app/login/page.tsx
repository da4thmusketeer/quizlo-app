"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { login, storeToken } from "@/lib/auth";
import { goeyToast } from "goey-toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await login({ email, password });

      if (response.token) {
        storeToken(response.token);
      }

      setIsSuccess(true);
      goeyToast.success("Login Successful!", {
        description: "Welcome back, champion! Redirecting to your Quizlo home page...",
      });

      const redirectTo = searchParams.get("redirect") || "/home";
      setTimeout(() => {
        router.push(redirectTo);
      }, 800);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(errMsg);
      goeyToast.error("Login Failed", { description: errMsg });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthLayout
      title="Welcome back!"
      subtitle="Log in to access your quizzes, study decks, and daily streaks."
      badgeText="Ready to study? "
    >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-400 p-3 rounded-[12px] text-red-700 text-[0.85rem] font-medium">
              {error}
            </div>
          )}
          {/* Email Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-[0.82rem] font-bold font-dm-mono uppercase tracking-wider text-ink"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full pl-10 pr-4 py-3 bg-paper border-2 border-ink rounded-[12px] font-medium text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all text-[0.9rem]"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label
                htmlFor="password"
                className="block text-[0.82rem] font-bold font-dm-mono uppercase tracking-wider text-ink"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[0.78rem] font-bold text-pink hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-3 bg-paper border-2 border-ink rounded-[12px] font-medium text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all text-[0.9rem]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-ink transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-[0.85rem] font-medium text-ink select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-ink text-pink focus:ring-pink accent-pink cursor-pointer"
              />
              Keep me logged in for 30 days
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full button-3d justify-center py-3.5 mt-2 font-extrabold text-[0.95rem] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink/15" />
            </div>
            <span className="relative px-3 bg-white text-[0.75rem] font-bold font-dm-mono text-muted uppercase">
              Or continue with
            </span>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                goeyToast.info("Social Login 🔑", {
                  description: "Google Login demo triggered!",
                })
              }
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border-2 border-ink rounded-[12px] font-bold text-[0.85rem] text-ink shadow-[3px_3px_0_#16151d] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#16151d] transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              Google
            </button>

            <button
              type="button"
              onClick={() =>
                goeyToast.info("Social Login 🔑", {
                  description: "GitHub Login demo triggered!",
                })
              }
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border-2 border-ink rounded-[12px] font-bold text-[0.85rem] text-ink shadow-[3px_3px_0_#16151d] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#16151d] transition-all cursor-pointer"
            >
              <svg
                className="w-4 h-4 fill-current text-ink"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Toggle to Signup */}
          <p className="text-center text-[0.85rem] text-muted pt-4">
            Don't have an account yet?{" "}
            <Link
              href="/signup"
              className="font-extrabold text-pink hover:underline inline-flex items-center gap-1"
            >
              Sign up free <ArrowRight className="w-3.5 h-3.5 inline" />
            </Link>
          </p>
        </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
