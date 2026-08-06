"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import { Lock, Eye, EyeOff, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { resetPassword } from "@/lib/auth";
import { goeyToast } from "goey-toast";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength logic matching Signup page
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak ⚠️", color: "bg-pink text-pink" };
    if (score <= 3) return { score: 2, label: "Good 👍", color: "bg-lilac text-purple-700" };
    return { score: 3, label: "Strong 💪", color: "bg-lime text-ink" };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Reset token is missing or invalid. Please request a new link.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please check and try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await resetPassword({ token, password });
      setIsSuccess(true);
      goeyToast.success("Password Reset Successful! 🎉", {
        description: "Your password has been updated. Redirecting to log in...",
      });

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : "Password reset failed. The link may have expired.";
      setError(errMsg);
      goeyToast.error("Reset Failed", { description: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create new password"
      subtitle="Set a strong new password for your Quizlo account."
      badgeText="Security Center 🔐"
    >
      {!token ? (
        <div className="bg-red-50 border-2 border-ink p-6 rounded-[16px] space-y-4 shadow-[4px_4px_0_#16151d]">
          <div className="flex items-center gap-3 text-red-700">
            <ShieldAlert className="w-7 h-7 shrink-0 text-pink" />
            <div>
              <h3 className="font-extrabold text-[1.1rem] text-ink">
                Invalid or Missing Reset Token
              </h3>
              <p className="text-muted text-[0.85rem] mt-0.5">
                We couldn't find a valid reset token in the link. Please request a new password reset.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Link
              href="/forgot-password"
              className="button-3d button-lime w-full justify-center inline-flex text-[0.88rem] py-3"
            >
              Request New Reset Link <ArrowRight className="w-4 h-4 ml-1 inline" />
            </Link>
          </div>
        </div>
      ) : isSuccess ? (
        <div className="bg-lime/30 border-2 border-ink p-6 rounded-[16px] text-center space-y-4 shadow-[4px_4px_0_#16151d] animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-lime border-2 border-ink flex items-center justify-center text-ink text-2xl mx-auto shadow-[2px_2px_0_#16151d]">
            🎉
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-[1.25rem] text-ink">
              Password Reset Complete!
            </h3>
            <p className="text-muted text-[0.88rem]">
              Your password has been successfully reset. You can now log in with your new credentials.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="button-3d w-full justify-center inline-flex text-[0.9rem] py-3"
            >
              Go to Log In <ArrowRight className="w-4 h-4 ml-1 inline" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border-2 border-red-400 p-3 rounded-[12px] text-red-700 text-[0.85rem] font-medium">
              {error}
            </div>
          )}

          {/* New Password Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-[0.82rem] font-bold font-dm-mono uppercase tracking-wider text-ink"
            >
              New Password
            </label>
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
                placeholder="Enter new password"
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

            {/* Password Strength Indicator */}
            {password && (
              <div className="pt-1 space-y-1">
                <div className="flex justify-between items-center text-[0.75rem] font-bold">
                  <span className="text-muted">Password Strength</span>
                  <span className={strength.color.split(" ")[1]}>
                    {strength.label}
                  </span>
                </div>
                <div className="w-full h-2 bg-paper border border-ink/30 rounded-full overflow-hidden flex gap-1 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      strength.score >= 1 ? strength.color.split(" ")[0] : "bg-transparent"
                    } ${strength.score === 1 ? "w-1/3" : strength.score === 2 ? "w-2/3" : "w-full"}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="block text-[0.82rem] font-bold font-dm-mono uppercase tracking-wider text-ink"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-11 py-3 bg-paper border-2 border-ink rounded-[12px] font-medium text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all text-[0.9rem]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-ink transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[0.78rem] font-medium text-red-600 pt-0.5">
                Passwords do not match
              </p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="text-[0.78rem] font-medium text-emerald-600 pt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 inline" /> Passwords match
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
            className="w-full button-3d button-lime justify-center py-3.5 mt-2 font-extrabold text-[0.95rem] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-ink"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Resetting Password...
              </span>
            ) : (
              <>
                Reset Password <ArrowRight className="w-4 h-4 ml-1 inline" />
              </>
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
