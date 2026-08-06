"use client";

import React, { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "@/lib/auth";
import { goeyToast } from "goey-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      await forgotPassword(email);
      setIsSuccess(true);
      goeyToast.success("Reset Link Sent! 📧", {
        description: `Instructions sent to ${email}. Check your inbox!`,
      });
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : "Failed to send reset link. Please try again.";
      setError(errMsg);
      goeyToast.error("Reset Failed", { description: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter the email associated with your account and we'll send you a link to reset your password."
      badgeText="Password Recovery "
    >
      {isSuccess ? (
        <div className="bg-lime/20 border-2 border-ink p-6 rounded-[16px] text-center space-y-4 shadow-[4px_4px_0_#16151d] animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-lime border-2 border-ink flex items-center justify-center text-ink text-2xl mx-auto shadow-[2px_2px_0_#16151d]">
            📧
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-[1.25rem] text-ink">
              Check your email
            </h3>
            <p className="text-muted text-[0.88rem] leading-relaxed">
              We have sent a password reset link to{" "}
              <span className="font-bold text-ink underline">{email}</span>.
            </p>
          </div>

          <div className="p-3 bg-white border border-ink/20 rounded-[12px] text-[0.8rem] text-muted text-left flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-pink shrink-0 mt-0.5" />
            <span>
              If you don't see the email within a few minutes, check your spam folder or try requesting again.
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setIsSuccess(false)}
              className="py-2.5 px-4 bg-white border-2 border-ink rounded-[12px] font-bold text-[0.85rem] text-ink shadow-[3px_3px_0_#16151d] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#16151d] transition-all cursor-pointer"
            >
              Try another email
            </button>
            <Link
              href="/login"
              className="button-3d inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-[0.85rem]"
            >
              Back to Log In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full button-3d justify-center py-3.5 font-extrabold text-[0.95rem] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                Sending Link...
              </span>
            ) : (
              <>
                Send Reset Link <ArrowRight className="w-4 h-4 ml-1 inline" />
              </>
            )}
          </button>

          {/* Back to Login */}
          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[0.85rem] font-bold text-muted hover:text-ink transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Remember password? Log in
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
