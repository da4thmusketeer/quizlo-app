"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Compass,
  Loader2,
  RotateCcw,
  Share2,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import {
  useGameplayStore,
  recoverGame,
  loadGameReview,
  resetGame,
  Selection,
} from "@/lib/gameplay";
import { SanitizedQuestion } from "@/lib/quiz";

function selectionText(question: SanitizedQuestion, selection: Selection = {}) {
  const label = (id: string) =>
    question.answerOptions.find((option) => option.id === id)?.text ?? id;
  if (selection.optionId) return label(selection.optionId);
  if (selection.optionIds?.length)
    return selection.optionIds
      .map(label)
      .join(question.type === "OrderSequencing" ? " → " : ", ");
  if (selection.matches && Object.keys(selection.matches).length)
    return Object.entries(selection.matches)
      .map(([id, text]) => `${label(id)} → ${text}`)
      .join("; ");
  return selection.text?.trim() || "No answer submitted";
}

function formatCorrectData(value: unknown): string {
  if (value === null || value === undefined)
    return "Answer review was not returned.";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return String(value);
  if (Array.isArray(value)) return value.map(formatCorrectData).join(", ");
  if (typeof value === "object")
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${formatCorrectData(item)}`)
      .join("; ");
  return "Review unavailable";
}

export default function ResultsPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  const game = useGameplayStore((state) => state.games[id]);
  const [ready, setReady] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    let active = true;
    recoverGame(id)
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const results = game?.phase === "completed" ? game.results : undefined;
  const title = game?.session?.quizTitle ?? "Your quiz";
  const unanswered = results
    ? Math.max(
        0,
        Math.min(
          results.totalQuestions - results.questionsAnsweredCorrectly,
          results.totalQuestions - (game?.submitted.length ?? 0),
        ),
      )
    : 0;
  const incorrect = results
    ? Math.max(
        0,
        results.totalQuestions -
          results.questionsAnsweredCorrectly -
          unanswered,
      )
    : 0;
  const card =
    "bg-white border-2 border-ink rounded-[22px] p-5 sm:p-7 shadow-[5px_5px_0_#16151d]";

  const share = async () => {
    if (!results) return;
    const text = `I scored ${results.score}% on ${title} with Quizlo!`;
    const url = `${window.location.origin}/play/${encodeURIComponent(id)}`;
    try {
      if (navigator.share)
        await navigator.share({ title: "My Quizlo results", text, url });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareMessage("Result copied. Share it with your friends!");
      } else setShareMessage(`${text} ${url}`);
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setShareMessage(
          "Sharing was unavailable. Try again or copy this page’s quiz link.",
        );
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink relative overflow-hidden selection:bg-lilac">
      {results && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden motion-reduce:hidden"
        >
          {Array.from({ length: 24 }, (_, index) => (
            <span
              key={index}
              className={`absolute w-2 h-4 rounded-sm animate-[confetti-fall_3s_ease-in_both] ${["bg-pink", "bg-lime", "bg-lilac", "bg-ink"][index % 4]}`}
              style={{
                left: `${(index * 37) % 100}%`,
                animationDelay: `${(index % 6) * 0.12}s`,
                transform: `rotate(${index * 29}deg)`,
              }}
            />
          ))}
        </div>
      )}
      <header className="max-w-5xl mx-auto px-5 sm:px-8 py-5">
        <Link href="/home" className="font-extrabold text-2xl tracking-tight">
          quiz<span className="text-pink">lo</span>
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-12 space-y-7 relative">
        {!ready ? (
          <div className={card} role="status">
            <Loader2 className="animate-spin inline mr-2" />
            Loading your results...
          </div>
        ) : !results || !game?.session ? (
          <section className={`${card} space-y-4`}>
            <h1 className="text-3xl font-extrabold">
              Your results aren’t here yet
            </h1>
            <p className="text-muted">
              Finish the quiz in this browser tab to see your score. Results
              from other sessions are not stored on this device.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href={`/play/${encodeURIComponent(id)}`}
                className="button-3d button-lime"
              >
                {game?.session ? "Resume Quiz" : "Start Quiz"}
              </Link>
              <Link href="/explore" className="button-3d">
                Explore Quizzes
              </Link>
            </div>
          </section>
        ) : (
          <>
            <header className="text-center space-y-4">
              <div className="w-20 h-20 bg-lime border-2 border-ink rounded-3xl shadow-[5px_5px_0_#16151d] mx-auto flex items-center justify-center rotate-[-6deg] animate-[result-pop_500ms_ease-out] motion-reduce:animate-none">
                <Trophy className="w-10 h-10" />
              </div>
              <p className="text-xs font-dm-mono text-muted uppercase tracking-[0.2em]">
                Quiz complete
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                {results.score >= 80
                  ? "You crushed it!"
                  : results.score >= 50
                    ? "Nicely played!"
                    : "Every round is progress."}
              </h1>
              <p className="text-muted break-words">{title}</p>
            </header>
            <section className={`${card} text-center`} aria-label="Final score">
              <p className="text-7xl sm:text-8xl font-extrabold tracking-tighter tabular-nums">
                {results.score}
                <span className="text-3xl text-muted">%</span>
              </p>
              <p className="text-xs font-dm-mono uppercase text-muted mt-2">
                Final score · graded by Quizlo
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-7 pt-6 border-t border-ink/15">
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold">
                    {results.totalQuestions > 0
                      ? Math.round(
                          (results.questionsAnsweredCorrectly /
                            results.totalQuestions) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-muted mt-1">Accuracy</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold">
                    {results.questionsAnsweredCorrectly}/
                    {results.totalQuestions}
                  </p>
                  <p className="text-xs text-muted mt-1">Correct</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold flex items-center justify-center gap-1">
                    <Zap className="w-4 h-4 text-pink" />+{results.xpEarned}
                  </p>
                  <p className="text-xs text-muted mt-1">XP earned</p>
                </div>
              </div>
              {results.levelUp && (
                <p className="mt-5 bg-lilac border border-ink rounded-xl p-3 font-bold">
                  Level up! You’re now level {results.newLevel}.
                </p>
              )}
            </section>
            <section
              className="grid grid-cols-3 gap-2 sm:gap-4"
              aria-label="Answer breakdown"
            >
              <div className="bg-lime/30 border-2 border-ink rounded-2xl p-3 sm:p-5 min-w-0">
                <Check className="w-5 h-5 mb-2" />
                <p className="font-extrabold text-2xl">
                  {results.questionsAnsweredCorrectly}
                </p>
                <p className="text-[0.65rem] sm:text-sm text-muted">Correct</p>
              </div>
              <div className="bg-pink/10 border-2 border-ink rounded-2xl p-3 sm:p-5 min-w-0">
                <X className="w-5 h-5 mb-2 text-pink" />
                <p className="font-extrabold text-2xl">{incorrect}</p>
                <p className="text-[0.65rem] sm:text-sm text-muted">
                  Incorrect
                </p>
              </div>
              <div className="bg-lilac/30 border-2 border-ink rounded-2xl p-3 sm:p-5 min-w-0">
                <span className="block font-bold mb-2 h-5">—</span>
                <p className="font-extrabold text-2xl">{unanswered}</p>
                <p className="text-[0.65rem] sm:text-sm text-muted">
                  Unanswered
                </p>
              </div>
            </section>
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  resetGame(id);
                  router.push(`/play/${encodeURIComponent(id)}`);
                }}
                className="button-3d button-lime justify-center min-w-0 !whitespace-normal !gap-2"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                Play Again
              </button>
              <Link
                href="/explore"
                className="button-3d justify-center min-w-0 !whitespace-normal !gap-2"
              >
                <Compass className="w-4 h-4 shrink-0" />
                Explore More Quizzes
              </Link>
              <button
                type="button"
                onClick={() => void share()}
                className="button-3d justify-center min-w-0 !whitespace-normal !gap-2"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                Share Results
              </button>
            </div>
            <p role="status" className="text-sm text-muted text-center">
              {shareMessage}
            </p>
            <section className="space-y-4">
              <button
                type="button"
                aria-expanded={reviewOpen}
                aria-controls="answer-review"
                onClick={() => {
                  setReviewOpen(!reviewOpen);
                  if (!reviewOpen && !game.review) {
                    setReviewLoading(true);
                    void loadGameReview(id).finally(() =>
                      setReviewLoading(false),
                    );
                  }
                }}
                className="w-full flex justify-between items-center border-2 border-ink rounded-2xl p-5 bg-white font-extrabold text-lg"
              >
                Review Your Answers
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${reviewOpen ? "rotate-180" : ""}`}
                />
              </button>
              {reviewOpen && (
                <div id="answer-review" className="space-y-4">
                  {reviewLoading && (
                    <p role="status" className="text-muted text-sm">
                      Loading answer explanations...
                    </p>
                  )}
                  {game.session.questions.map((question, index) => {
                    const official = game.review?.questions.find(
                      (item) => item.id === question.id,
                    );
                    const graded = results.correctAnswers?.find(
                      (item) => item.questionId === question.id,
                    );
                    const correctOptions = official?.answerOptions?.filter(
                      (option) => option.isCorrect,
                    );
                    const explanation =
                      graded?.explanation ?? official?.explanation;
                    const correctText =
                      official?.type === "Matching"
                        ? official.answerOptions
                            .map(
                              (option) =>
                                `${option.text} → ${option.matchingText ?? (option as { matchText?: string }).matchText ?? ""}`,
                            )
                            .join("; ")
                        : official?.type === "OrderSequencing"
                          ? official.answerOptions
                              .map((option) => option.text)
                              .join(" → ")
                          : correctOptions?.length
                            ? correctOptions
                                .map((option) => option.text)
                                .join(", ")
                            : formatCorrectData(graded?.correctData);
                    return (
                      <article
                        key={question.id}
                        className={`${card} space-y-4`}
                      >
                        <div className="flex justify-between gap-3 items-center">
                          <span className="text-xs font-dm-mono text-muted uppercase">
                            Question {index + 1}
                          </span>
                          <span className="text-xs font-bold">
                            {!game.submitted.includes(question.id)
                              ? "Unanswered"
                              : graded?.isCorrect === true
                                ? "Correct"
                                : graded?.isCorrect === false
                                  ? "Incorrect"
                                  : "Answer submitted"}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-lg whitespace-pre-wrap break-words">
                          {question.text}
                        </h3>
                        <div className="bg-paper rounded-xl p-4">
                          <p className="text-xs font-dm-mono text-muted uppercase mb-2">
                            Your answer
                          </p>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {game.submitted.includes(question.id)
                              ? selectionText(
                                  question,
                                  game.selections[question.id],
                                )
                              : "No answer submitted"}
                          </p>
                        </div>
                        <div className="bg-lime/20 rounded-xl p-4">
                          <p className="text-xs font-dm-mono text-muted uppercase mb-2">
                            {question.type === "LongAnswer"
                              ? "Sample answer / rubric"
                              : "Correct answer"}
                          </p>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {correctText}
                          </p>
                        </div>
                        <p className="text-sm text-muted whitespace-pre-wrap break-words">
                          <strong className="text-ink">Explanation: </strong>
                          {explanation ||
                            "An explanation was not included for this question's answer."}
                        </p>
                      </article>
                    );
                  })}
                  {!game.review && !reviewLoading && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewLoading(true);
                        void loadGameReview(id).finally(() =>
                          setReviewLoading(false),
                        );
                      }}
                      className="font-bold text-sm underline"
                    >
                      Retry loading detailed answer review
                      <ArrowRight className="inline ml-2 w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
