"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, Loader2 } from "lucide-react";
import MultiplayerLayout, {
  multiplayerCard,
  multiplayerInput,
  multiplayerLabel,
} from "@/components/MultiplayerLayout";
import { useQuizStore } from "@/store/quizStore";

export default function HostPage() {
  const { quizzes, fetchQuizzes, isLoadingQuizzes, quizzesError } =
    useQuizStore();
  const [quizId, setQuizId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [pace, setPace] = useState("host");
  const selectedQuiz = quizzes.find((quiz) => quiz.id === quizId);
  const availableQuizzes = quizzes.filter((quiz) => !quiz.isDraft);

  useEffect(() => {
    void fetchQuizzes();
  }, [fetchQuizzes]);

  return (
    <MultiplayerLayout
      title="Host a game."
      description="Your quiz, your crowd. Explore the setup for a multiplayer quiz night with friends, classmates, or teammates."
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6 items-start">
        <section className={multiplayerCard} aria-labelledby="host-heading">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue/30 border border-ink rounded-xl">
              <Radio className="w-6 h-6" />
            </div>
            <h2 id="host-heading" className="text-xl font-extrabold">
              Set up your game
            </h2>
          </div>
          <div className="space-y-5">
            <div>
              <label htmlFor="room-name" className={multiplayerLabel}>
                Game name
              </label>
              <input
                id="room-name"
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                placeholder="e.g. Friday Quiz Night"
                maxLength={80}
                className={multiplayerInput}
              />
            </div>
            <div>
              <label htmlFor="host-quiz" className={multiplayerLabel}>
                Choose a quiz
              </label>
              <select
                id="host-quiz"
                value={quizId}
                onChange={(event) => setQuizId(event.target.value)}
                disabled={isLoadingQuizzes || availableQuizzes.length === 0}
                className={`${multiplayerInput} disabled:opacity-50`}
                aria-describedby="quiz-help"
              >
                <option value="">
                  {isLoadingQuizzes ? "Loading quizzes..." : "Select a quiz"}
                </option>
                {availableQuizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
              <div
                id="quiz-help"
                className="text-xs text-muted mt-2"
                aria-live="polite"
              >
                {isLoadingQuizzes ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading your quiz choices...
                  </span>
                ) : quizzesError ? (
                  <>
                    <span role="alert">Quizzes could not be loaded. </span>
                    <button
                      type="button"
                      className="underline font-bold"
                      onClick={() => void fetchQuizzes(true)}
                    >
                      Try again
                    </button>
                  </>
                ) : availableQuizzes.length === 0 ? (
                  <>
                    No published quizzes available.{" "}
                    <Link href="/create" className="underline font-bold">
                      Create a quiz
                    </Link>{" "}
                    to get ready.
                  </>
                ) : (
                  "Choose an existing quiz to preview your game setup."
                )}
              </div>
            </div>
            <div>
              <label htmlFor="game-pace" className={multiplayerLabel}>
                Question pace
              </label>
              <select
                id="game-pace"
                value={pace}
                onChange={(event) => setPace(event.target.value)}
                className={multiplayerInput}
              >
                <option value="host">Host advances each question</option>
                <option value="automatic">
                  Questions advance automatically
                </option>
              </select>
              <p className="text-xs text-muted mt-2">
                Preview setting. Your setup is not saved yet.
              </p>
            </div>
            <button
              type="button"
              disabled
              aria-describedby="host-unavailable"
              className="w-full button-3d button-lime justify-center py-3 opacity-50 cursor-not-allowed"
            >
              <Radio className="w-4 h-4" />
              Create Lobby
            </button>
            <p id="host-unavailable" className="text-xs text-muted text-center">
              Lobby creation and live hosting are coming soon.
            </p>
          </div>
        </section>
        <aside
          className={`${multiplayerCard} space-y-5`}
          aria-labelledby="lobby-preview-heading"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 id="lobby-preview-heading" className="text-lg font-extrabold">
              Lobby preview
            </h2>
            <span className="text-xs font-dm-mono bg-lilac border border-ink rounded-full px-2 py-1">
              Preview only
            </span>
          </div>
          <div className="bg-paper border-2 border-dashed border-ink/30 rounded-2xl p-5 text-center">
            <p className="text-xs font-dm-mono text-muted uppercase mb-2">
              Game code
            </p>
            <p
              className="text-3xl font-extrabold tracking-widest"
              aria-label="Game code not generated"
            >
              — — — — — —
            </p>
            <p className="text-xs text-muted mt-2">
              A shareable code will appear when live hosting is available.
            </p>
          </div>
          <dl className="space-y-4 text-sm break-words" aria-live="polite">
            <div>
              <dt className="text-muted text-xs font-dm-mono uppercase">
                Game
              </dt>
              <dd className="font-bold mt-1">
                {roomName.trim() || "Your quiz night"}
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs font-dm-mono uppercase">
                Quiz
              </dt>
              <dd className="font-bold mt-1">
                {selectedQuiz?.title || "Choose a quiz to get started"}
              </dd>
              {selectedQuiz && (
                <dd className="text-muted text-xs mt-1">
                  {selectedQuiz.difficulty} ·{" "}
                  {selectedQuiz._count?.questions ?? 0} questions
                </dd>
              )}
            </div>
            <div>
              <dt className="text-muted text-xs font-dm-mono uppercase">
                Pace
              </dt>
              <dd className="font-bold mt-1">
                {pace === "host" ? "Host controlled" : "Automatic"}
              </dd>
            </div>
          </dl>
          <p className="text-sm text-muted pt-4 border-t border-ink/15">
            When multiplayer launches, players will join using your code and
            wait here for you to start.
          </p>
          <Link
            href="/join"
            className="inline-block text-sm font-bold underline underline-offset-4 hover:text-pink"
          >
            Joining someone else? Enter a code
          </Link>
        </aside>
      </div>
    </MultiplayerLayout>
  );
}
