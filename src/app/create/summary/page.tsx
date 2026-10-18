"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Compass, Loader2, Pencil, Play } from "lucide-react";
import QuizReview from "@/components/QuizReview";
import DashboardNavbar from "@/components/DashboardNavbar";
import { QuizDetails } from "@/lib/quiz";
import { loadPreviewQuiz } from "@/lib/quizPreview";

export default function QuizSummaryPage() {
  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const id = new URLSearchParams(window.location.search).get("id");
    setLoading(true);
    setError(null);
    if (!id) {
      setError("Create a quiz first to see its summary here.");
      setLoading(false);
      return;
    }
    loadPreviewQuiz(id)
      .then((data) => {
        if (active) setQuiz(data);
      })
      .catch((err: unknown) => {
        if (active)
          setError(err instanceof Error ? err.message : "Unable to load quiz.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const card = "bg-white  p-5 sm:p-7 ";

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-pink selection:text-white">
      <DashboardNavbar />
      <main className="max-w-[1000px] mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-7">
        {loading ? (
          <div className={`${card} flex items-center gap-3`} role="status">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading your quiz...
          </div>
        ) : error || !quiz ? (
          <section className={card}>
            <h1 className="text-2xl font-extrabold mb-3">Quiz summary unavailable</h1>
            <p role="alert" className="text-muted">{error}</p>
            <div className="flex flex-wrap gap-4 mt-6">
              <button className="button-3d" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
              <Link className="button-3d button-lime" href="/create">Create a Quiz</Link>
              <Link className="button-3d" href="/explore">Go to Explore</Link>
            </div>
          </section>
        ) : (
          <>
            <header className="space-y-3">
              <p className="inline-flex items-center gap-2 bg-lime border-2 border-ink rounded-full px-3 py-1 text-xs font-bold font-dm-mono">
                <CheckCircle2 className="w-4 h-4" />
                Quiz published
              </p>
              <h1 className="text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-[-0.05em]">
                Meet your <span className="highlight">quiz.</span>
              </h1>
              <p className="text-muted">Review every question and answer. You can make changes whenever you need.</p>
              <Link href={`/create?edit=${encodeURIComponent(quiz.id)}`} className="inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4">
                <Pencil className="w-4 h-4" />
                Edit Quiz
              </Link>
            </header>

            <QuizReview quiz={quiz} />

            <section className={`${card} flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4`} aria-label="Quiz actions">
              <Link href={`/create?edit=${encodeURIComponent(quiz.id)}`} className="button-3d justify-center sm:flex-1">
                <Pencil className="w-4 h-4" />
                Edit Quiz
              </Link>
              <Link href="/explore" className="button-3d button-lime justify-center sm:flex-1">
                <Compass className="w-4 h-4" />
                Go to Explore
              </Link>
              <Link href={`/play/${encodeURIComponent(quiz.id)}`} className="button-3d justify-center sm:flex-1">
                <Play className="w-4 h-4" />
                Play Quiz
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
