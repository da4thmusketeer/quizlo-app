"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import { User, Mail, Lock, Eye, EyeOff, Check, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Simple password strength calculation
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;
    setIsLoading(true);

    // Simulate registration API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    }, 1000);
  };


  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start creating instant quizzes and power up your memory today."
      badgeText="Join 50,000+ Students ⚡"
    >
      {isSuccess ? (
        <div className="bg-lime/30 border-2 border-ink p-6 rounded-[16px] text-center space-y-3 shadow-[4px_4px_0_#16151d]">
          <div className="text-3xl">🚀</div>
          <h3 className="font-extrabold text-[1.25rem] text-ink">
            Account Created!
          </h3>
          <p className="text-muted text-[0.88rem]">
            Welcome to Quizlo, <span className="font-bold text-ink">{fullName}</span>! Check your inbox to verify your account or jump right in.
          </p>
          <div className="pt-2">
            <Link href="/login" className="button-3d inline-flex text-[0.85rem]">
              Go to Login <span>→</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="fullName"
              className="block text-[0.82rem] font-bold font-dm-mono uppercase tracking-wider text-ink"
            >
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <User className="w-4 h-4" />
              </div>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Rivers"
                className="w-full pl-10 pr-4 py-3 bg-paper border-2 border-ink rounded-[12px] font-medium text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all text-[0.9rem]"
              />
            </div>
          </div>

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
            <label
              htmlFor="password"
              className="block text-[0.82rem] font-bold font-dm-mono uppercase tracking-wider text-ink"
            >
              Password
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
                placeholder="Create a strong password"
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

            {/* Dynamic Password Strength Indicator */}
            {password && (
              <div className="pt-1.5 space-y-1">
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

          {/* Terms & Conditions Checkbox */}
          <div className="flex items-start pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-[0.82rem] font-medium text-ink select-none leading-tight">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-2 border-ink text-pink focus:ring-pink accent-pink cursor-pointer shrink-0"
              />
              <span>
                I agree to Quizlo's{" "}
                <a href="#terms" onClick={(e) => { e.preventDefault(); alert("Terms of Service modal"); }} className="underline font-bold text-ink hover:text-pink">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("Privacy Policy modal"); }} className="underline font-bold text-ink hover:text-pink">
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !agreeTerms}
            className="w-full button-3d button-lime justify-center py-3.5 mt-2 font-extrabold text-[0.95rem] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-ink" viewBox="0 0 24 24">
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
                Creating Account...
              </span>
            ) : (
              <>
                Create Free Account <span>→</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink/15" />
            </div>
            <span className="relative px-3 bg-white text-[0.75rem] font-bold font-dm-mono text-muted uppercase">
              Or sign up with
            </span>
          </div>

          {/* Social Signups */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => alert("Google Signup demo triggered!")}
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
              onClick={() => alert("GitHub Signup demo triggered!")}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border-2 border-ink rounded-[12px] font-bold text-[0.85rem] text-ink shadow-[3px_3px_0_#16151d] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#16151d] transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current text-ink" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Toggle to Login */}
          <p className="text-center text-[0.85rem] text-muted pt-3">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-extrabold text-pink hover:underline inline-flex items-center gap-1"
            >
              Log in <ArrowRight className="w-3.5 h-3.5 inline" />
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
