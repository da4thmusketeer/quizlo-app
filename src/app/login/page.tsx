"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { login, storeToken } from "@/lib/auth";
import GoogleAuthButton from "@/components/GoogleAuthButton";
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

          {/* Social Login */}
          <GoogleAuthButton mode="login" />

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
