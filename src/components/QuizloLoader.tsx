"use client";

import React from "react";
import { Sparkles, Zap, Flame, Rocket } from "lucide-react";

interface QuizloLoaderProps {
  /** Optional custom loading message */
  message?: string;
  /** Whether this loader covers the full viewport (default: true) */
  fullScreen?: boolean;
  /** Compact mode for smaller container embeddings */
  compact?: boolean;
}

/**
 * Quizlo's consistent, global loading animation component.
 * Follows the neobrutalist aesthetic: high-contrast ink borders, tactile shadows,
 * playful brand colors (lime, lilac, pink), Plus Jakarta Sans + DM Mono typography,
 * and smooth bouncy micro-animations.
 */
export default function QuizloLoader({
  message = "Loading Quizlo...",
  fullScreen = true,
  compact = false,
}: QuizloLoaderProps) {
  const content = (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={`bg-white border-2 border-ink shadow-[6px_6px_0_#16151d] rounded-2xl flex flex-col items-center gap-4 text-center select-none animate-[question-in_200ms_ease-out] motion-reduce:animate-none ${
        compact ? "p-4 max-w-[260px]" : "p-6 sm:p-8 max-w-xs sm:max-w-sm w-full"
      }`}
    >
      {/* Brand Mark with animated bouncy "lo" */}
      <div className="font-extrabold text-2xl sm:text-3xl tracking-[-1.5px] text-ink flex items-center justify-center">
        <span>quiz</span>
        <span className="text-pink italic inline-block animate-[quizlo-bounce-item_1s_ease-in-out_infinite] motion-reduce:animate-none">
          lo
        </span>
      </div>

      {/* Playful Trio of Neobrutalist Badges */}
      <div className="flex items-center gap-2.5 sm:gap-3 my-1">
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-lime text-ink border-2 border-ink shadow-[2px_2px_0_#16151d] flex items-center justify-center animate-[quizlo-bounce-item_1.2s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{ animationDelay: "0ms" }}
          aria-hidden="true"
        >
          <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-ink" />
        </div>
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-lilac text-purple-950 border-2 border-ink shadow-[2px_2px_0_#16151d] flex items-center justify-center animate-[quizlo-bounce-item_1.2s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{ animationDelay: "200ms" }}
          aria-hidden="true"
        >
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-ink" />
        </div>
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-pink text-white border-2 border-ink shadow-[2px_2px_0_#16151d] flex items-center justify-center animate-[quizlo-bounce-item_1.2s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{ animationDelay: "400ms" }}
          aria-hidden="true"
        >
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>

      {/* Tactile animated progress bar */}
      <div
        className="w-44 sm:w-52 h-2.5 bg-paper border-2 border-ink rounded-full overflow-hidden relative shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]"
        aria-hidden="true"
      >
        <div className="h-full w-full bg-gradient-to-r from-lime via-lilac to-pink animate-[quizlo-bar-slide_1.4s_ease-in-out_infinite] motion-reduce:animate-none rounded-full" />
      </div>

      {/* Status Message */}
      <p className="text-[0.72rem] sm:text-xs font-dm-mono uppercase tracking-wider text-muted font-bold">
        {message}
      </p>
    </div>
  );

  if (!fullScreen) {
    return (
      <div className="w-full flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper/85 backdrop-blur-sm transition-opacity duration-200">
      {content}
    </div>
  );
}
