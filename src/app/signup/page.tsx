"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import { User, Mail, Lock, Eye, EyeOff, Check, ArrowRight } from "lucide-react";
import { signup, storeToken } from "@/lib/auth";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { goeyToast } from "goey-toast";

function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak ", color: "bg-pink text-pink" };
    if (score <= 3) return { score: 2, label: "Good ", color: "bg-lilac text-purple-700" };
    return { score: 3, label: "Strong ", color: "bg-lime text-ink" };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await signup({
        username,
        email,
        password,
      });

      if (response.token) {
        storeToken(response.token);
      }

      setIsSuccess(true);
      goeyToast.success("Account Created!", {
        description: `Welcome to Quizlo, ${username}! Redirecting to your homepage...`,
      });

      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } catch (err) {
      //const resError = response.error
      const errMsg = err instanceof Error ? err.message : "Signup failed. Please try again.";
      setError(errMsg);
      goeyToast.error("Signup Failed", { description: errMsg });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start creating instant quizzes and power up your memory today."
      badgeText="Join and have fun "
    >
      
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-400 p-3 rounded-[12px] text-red-700 text-[0.85rem] font-medium">
              {error}
            </div>
          )}
          {/* Full Name Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="fullName"
              className="block text-[0.82rem] font-bold font-dm-mono uppercase tracking-wider text-ink"
            >
              UserName
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <User className="w-4 h-4" />
              </div>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                      strength.score >= 1
                        ? strength.color.split(" ")[0]
                        : "bg-transparent"
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
                <a
                  href="#terms"
                  onClick={(e) => {
                    e.preventDefault();
                    goeyToast.info("Terms of Service 📄", {
                      description: "Terms of Service details modal demo.",
                    });
                  }}
                  className="underline font-bold text-ink hover:text-pink"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    goeyToast.info("Privacy Policy ", {
                      description: "Privacy Policy details modal demo.",
                    });
                  }}
                  className="underline font-bold text-ink hover:text-pink"
                >
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
            {isLoading ? "Creating Account..." : "Create Account"}
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

          {/* Social Signup */}
          <GoogleAuthButton mode="signup" />

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
    </AuthLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink border-t-transparent" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
