import Link from "next/link";
import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  badgeText?: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  badgeText = "Welcome to Quizlo 🚀",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-pink selection:text-white relative overflow-hidden">
      {/* Background orbit accent */}
      <div
        className="orbit pointer-events-none opacity-40 scale-75 lg:scale-100 hidden sm:block"
        aria-hidden="true"
      />

      {/* Top Header */}
      <header className="h-[80px] px-[max(5vw,28px)] flex items-center justify-between relative z-20">
        <Link
          href="/"
          className="font-extrabold text-[1.5rem] tracking-[-1.5px] no-underline text-ink flex items-center gap-1 group"
        >
          <span>quiz</span>
          <i className="not-italic text-pink group-hover:rotate-12 transition-transform inline-block">
            lo
          </i>
          <span>.</span>
        </Link>
        <Link
          href="/"
          className="text-[0.82rem] font-bold text-muted hover:text-ink transition-colors flex items-center gap-1 no-underline"
        >
          ← Back to home
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-[max(4vw,20px)] py-8 relative z-10">
        <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Branding Section (Visible on LG screens) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 bg-lilac/30 border-2 border-ink rounded-[24px] shadow-[8px_8px_0_#16151d] relative min-h-[540px]">
            <div>
              <div className="font-dm-mono text-[0.72rem] font-medium tracking-[0.09em] uppercase flex items-center gap-2 mb-6">
                <span className="w-[26px] h-[2px] bg-pink inline-block" />
                {badgeText}
              </div>

              <h2 className="text-[2.5rem] tracking-[-0.05em] leading-[1.05] font-extrabold text-ink mb-4">
                Make your <span className="highlight">brain</span> proud every single day.
              </h2>
              <p className="text-muted text-[0.95rem] leading-[1.6]">
                Join thousands of students and curious minds turning boring study material into interactive, high-retention quizzes.
              </p>
            </div>

            {/* Micro Feature Highlights */}
            <div className="space-y-3 my-6">
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm p-3.5 rounded-[14px] border border-ink/20 shadow-[4px_4px_0_#16151d]">
                <div className="w-9 h-9 rounded-full bg-lime border border-ink flex items-center justify-center font-bold text-ink">
                  ⚡
                </div>
                <div>
                  <div className="text-[0.85rem] font-extrabold text-ink">AI Quiz Generation</div>
                  <div className="text-[0.75rem] text-muted">Convert notes into quizzes in 5s</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm p-3.5 rounded-[14px] border border-ink/20 shadow-[4px_4px_0_#16151d]">
                <div className="w-9 h-9 rounded-full bg-pink text-white border border-ink flex items-center justify-center font-bold">
                  🔥
                </div>
                <div>
                  <div className="text-[0.85rem] font-extrabold text-ink">Gamified Retention</div>
                  <div className="text-[0.75rem] text-muted">Streaks, XP & instant feedback</div>
                </div>
              </div>
            </div>

            {/* Testimonial pill */}
            <div className="pt-4 border-t border-ink/10 flex items-center justify-between text-[0.78rem] text-ink font-medium">
              <span>⭐️⭐️⭐️⭐️⭐️ 4.9/5 student rating</span>
              <span className="font-dm-mono text-pink font-bold">#StudySmarter</span>
            </div>
          </div>

          {/* Right Form Container */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-[480px] bg-white border-2 border-ink rounded-[24px] p-7 sm:p-10 shadow-[10px_10px_0_#16151d] relative">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-lime text-ink text-[0.72rem] font-bold font-dm-mono uppercase tracking-wider rounded-full border border-ink mb-3 shadow-[2px_2px_0_#16151d]">
                  {badgeText}
                </span>
                <h1 className="text-[2rem] font-extrabold tracking-[-0.04em] text-ink">
                  {title}
                </h1>
                <p className="text-muted text-[0.88rem] mt-1">{subtitle}</p>
              </div>

              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="py-4 text-center text-[0.75rem] text-muted font-medium">
        © 2026 Quizlo. All rights reserved.
      </footer>
    </div>
  );
}
