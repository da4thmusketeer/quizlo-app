"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/DashboardNavbar";
import { goeyToast } from "goey-toast";
import { getProfileData, getDashboardData, ProfileData } from "@/lib/user";
import { useQuizStore } from "@/store/quizStore";
import {
  BookOpen,
  Flame,
  ArrowRight,
  Check,
  Users,
  Radio,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { quizzes, fetchQuizzes, isLoadingQuizzes, quizzesError, isQuizzesFetched, _hasHydrated } = useQuizStore();
  const starterQuizzes = quizzes.filter((quiz) => !quiz.isDraft && !quiz.isPrivate).slice(0, 4);
  const loadingStarterQuizzes = starterQuizzes.length === 0 &&
    (!_hasHydrated || isLoadingQuizzes || (!isQuizzesFetched && !quizzesError));

  useEffect(() => { void fetchQuizzes(); }, [fetchQuizzes]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userXp, setUserXp] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [completedQuizCount, setCompletedQuizCount] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        const res = await getProfileData();
        if (isMounted && res.success && res.data) {
          setProfile(res.data);
          setUserXp(res.data.xp ?? 0);
          setUserStreak(res.data.streak ?? 0);
          setUserLevel(res.data.level ?? 1);

          if (res.dailyLoginXP && res.dailyLoginXP > 0) {
            goeyToast.success("Daily Login Bonus! 🎁", {
              description: `You earned +${res.dailyLoginXP} XP for logging in today!`,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile data on homepage:", err);
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadProfile();
    getDashboardData().then((response) => {
      if (isMounted && response.success) setCompletedQuizCount(response.data.statistics.totalQuizzesPlayed);
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const usernameDisplay =
    profile?.username || profile?.firstName || (isLoadingProfile ? "Quizzer" : "Quizzer");

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-pink selection:text-white">
      <DashboardNavbar
        userName={usernameDisplay}
        userXp={userXp}
        userStreak={userStreak}
        userLevel={userLevel}
        profilePicture={profile?.profilePicture}
        email={profile?.email}
        onCreateQuizClick={() => router.push("/create")}
      />

      <main className="flex-1 px-[max(4vw,20px)] py-8 max-w-[1200px] mx-auto w-full space-y-8">
        {/* Onboarding Welcome Banner */}
        <section className="bg-lilac/30 border-2 border-ink rounded-[24px] p-6 sm:p-8 shadow-[8px_8px_0_#16151d] relative overflow-hidden">
          <div className="orbit pointer-events-none opacity-20 scale-50 -right-20 -top-20" aria-hidden="true" />
          <div className="relative z-10 max-w-[800px]">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-lime text-ink text-[0.72rem] font-bold font-dm-mono uppercase rounded-full border border-ink mb-3 shadow-[2px_2px_0_#16151d]">
              Account Ready & Onboarded
            </div>
            <h1 className="text-[2.2rem] sm:text-[2.8rem] font-extrabold tracking-[-0.04em] leading-[1.1] text-ink">
              Welcome aboard, <span className="highlight">{usernameDisplay}!</span> 👋
            </h1>
            <p className="text-muted text-[0.98rem] mt-2 leading-[1.6]">
              Your brain glow-up starts now. Choose a quick action below or test your skills with a community quiz!
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-ink/15">
              <div className="flex items-center gap-3 bg-white/90 p-3 rounded-[14px] border border-ink/20 shadow-[3px_3px_0_#16151d]">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-ink ${completedQuizCount > 0 ? "bg-lime text-ink" : "bg-paper text-muted"}`}>
                  {completedQuizCount > 0 ? <Check className="w-4 h-4" /> : "1"}
                </div>
                <span className="text-[0.82rem] font-extrabold text-ink leading-tight">
                  Take your 1st quiz
                </span>
              </div>

              <div className="flex items-center gap-3 bg-white/90 p-3 rounded-[14px] border border-ink/20 shadow-[3px_3px_0_#16151d]">
                <div className="w-7 h-7 rounded-full bg-paper text-muted flex items-center justify-center font-bold text-xs shrink-0 border border-ink">
                  2
                </div>
                <span className="text-[0.82rem] font-extrabold text-ink leading-tight">
                  Generate AI quiz notes
                </span>
              </div>

              <div className="flex items-center gap-3 bg-white/90 p-3 rounded-[14px] border border-ink/20 shadow-[3px_3px_0_#16151d]">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-ink ${userStreak > 0 ? "bg-pink text-white" : "bg-paper text-muted"}`}>
                  {userStreak > 0 ? <Flame className="w-4 h-4 fill-white" /> : "3"}
                </div>
                <span className="text-[0.82rem] font-extrabold text-ink leading-tight">
                  Unlock 1-day streak 🔥
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Action Grid */}
        <section className="space-y-4">
          <h2 className="text-[1.35rem] font-extrabold tracking-[-0.03em] text-ink flex items-center gap-2">
             Quick Actions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Create Quiz */}
            <Link
              href="/create"
              className="bg-lime/30 border-2 border-ink rounded-[20px] p-6 shadow-[6px_6px_0_#16151d] hover:translate-y-[-3px] hover:shadow-[9px_9px_0_#16151d] transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <span className="font-dm-mono text-[0.7rem] font-bold text-ink uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-ink inline-block mb-2">
                  Your next challenge
                </span>
                <h3 className="text-[1.25rem] font-extrabold text-ink group-hover:text-pink transition-colors">
                  Create Quiz
                </h3>
                <p className="text-muted text-[0.85rem] mt-1.5 leading-[1.5]">
                  Build a quiz yourself or let AI turn a topic into questions.
                </p>
              </div>
              <div className="mt-5 pt-3 flex items-center text-[0.85rem] font-extrabold text-ink group-hover:translate-x-1 transition-transform">
                Start Creating <ArrowRight className="w-4 h-4 ml-1 text-pink" />
              </div>
            </Link>

            {/* Card 2: Explore Community */}
            <Link
              href="/explore"
              className="bg-lilac/30 border-2 border-ink rounded-[20px] p-6 shadow-[6px_6px_0_#16151d] hover:translate-y-[-3px] hover:shadow-[9px_9px_0_#16151d] transition-all cursor-pointer flex flex-col justify-between group no-underline text-ink"
            >
              <div>
                <span className="font-dm-mono text-[0.7rem] font-bold text-purple-950 uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-ink inline-block mb-2">
                  Knowledge Archive
                </span>
                <h3 className="text-[1.25rem] font-extrabold text-ink group-hover:text-pink transition-colors">
                  Explore Community
                </h3>
                <p className="text-muted text-[0.85rem] mt-1.5 leading-[1.5]">
                  Browse pre-made quizzes across Science, Coding, Trivia, History, and Geography.
                </p>
              </div>
              <div className="mt-5 pt-3 flex items-center text-[0.85rem] font-extrabold text-ink group-hover:translate-x-1 transition-transform">
                Browse Library <ArrowRight className="w-4 h-4 ml-1 text-pink" />
              </div>
            </Link>

            {/* Join a Game */}
            <Link
              href="/join"
              className="bg-pink/15 border-2 border-ink rounded-[20px] p-6 shadow-[6px_6px_0_#16151d] hover:translate-y-[-3px] hover:shadow-[9px_9px_0_#16151d] transition-all cursor-pointer flex flex-col justify-between group no-underline text-ink"
            >
              <div>
                <span className="font-dm-mono text-[0.7rem] font-bold text-pink uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-ink inline-block mb-2">
                  <Users className="w-3 h-3 inline mr-1" /> Play together
                </span>
                <h3 className="text-[1.25rem] font-extrabold text-ink group-hover:text-pink transition-colors">
                  Join a Game
                </h3>
                <p className="text-muted text-[0.85rem] mt-1.5 leading-[1.5]">
                  Have a game code? Get ready to join friends for a quiz challenge.
                </p>
              </div>
              <div className="mt-5 pt-3 flex items-center text-[0.85rem] font-extrabold text-ink group-hover:translate-x-1 transition-transform">
                Enter Game Code <ArrowRight className="w-4 h-4 ml-1 text-pink" />
              </div>
            </Link>

            {/* Host a Game */}
            <Link
              href="/host"
              className="bg-blue/30 border-2 border-ink rounded-[20px] p-6 shadow-[6px_6px_0_#16151d] hover:translate-y-[-3px] hover:shadow-[9px_9px_0_#16151d] transition-all cursor-pointer flex flex-col justify-between group no-underline text-ink"
            >
              <div>
                <span className="font-dm-mono text-[0.7rem] font-bold text-ink uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-ink inline-block mb-2">
                  <Radio className="w-3 h-3 inline mr-1" /> Take the lead
                </span>
                <h3 className="text-[1.25rem] font-extrabold text-ink group-hover:text-pink transition-colors">Host a Game</h3>
                <p className="text-muted text-[0.85rem] mt-1.5 leading-[1.5]">Pick a quiz and set the stage for your next multiplayer game.</p>
              </div>
              <div className="mt-5 pt-3 flex items-center text-[0.85rem] font-extrabold text-ink group-hover:translate-x-1 transition-transform">
                Set Up a Game <ArrowRight className="w-4 h-4 ml-1 text-pink" />
              </div>
            </Link>
          </div>
        </section>

        {/* Stats Summary Panel */}
        <section className="bg-white border-2 border-ink rounded-[20px] p-6 shadow-[6px_6px_0_#16151d] grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-paper rounded-[14px] border border-ink/20 flex flex-col justify-between">
            <span className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted">Daily Streak</span>
            <div className="text-[1.8rem] font-extrabold text-ink flex items-center gap-2 mt-1">
              {/* <Flame className="w-6 h-6 text-pink fill-pink" />  */}
              {userStreak} <span className="text-xs font-normal text-muted">Days</span>
            </div>
          </div>

          <div className="p-4 bg-paper rounded-[14px] border border-ink/20 flex flex-col justify-between">
            <span className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted">Total XP</span>
            <div className="text-[1.8rem] font-extrabold text-ink flex items-center gap-1.5 mt-1 font-dm-mono">
              {/* <Zap className="w-5 h-5 text-ink fill-lime shrink-0" />  */}
              {userXp}
            </div>
          </div>

          <div className="p-4 bg-paper rounded-[14px] border border-ink/20 flex flex-col justify-between">
            <span className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted">Quizzes Played</span>
            <div className="text-[1.8rem] font-extrabold text-ink flex items-center gap-2 mt-1">
               {completedQuizCount}
            </div>
          </div>

          <div className="p-4 bg-paper rounded-[14px] border border-ink/20 flex flex-col justify-between">
            <span className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted">Level / Rank</span>
            <div className="text-[1.1rem] font-extrabold text-ink flex items-center gap-1.5 mt-2">
              {/* <Trophy className="w-5 h-5 text-purple-700 shrink-0" /> */}
              <span className="truncate">Lvl {userLevel}</span>
            </div>
          </div>
        </section>

        {/* Recommended Starter Quizzes */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-[1.35rem] font-extrabold tracking-[-0.03em] text-ink flex items-center gap-2">
                Starter Decks For You
              </h2>
              <p className="text-muted text-[0.85rem] mt-0.5">
                Pick a deck to test your knowledge right now.
              </p>
            </div>
            <Link
              href="/explore"
              className="text-xs font-bold text-pink hover:text-ink transition-colors flex items-center gap-1 font-dm-mono uppercase"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingStarterQuizzes ? (
            <div role="status" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <span className="sr-only">Loading starter quizzes...</span>
              {[1, 2, 3, 4].map((item) => <div key={item} className="h-52 bg-white border-2 border-ink/20 rounded-[20px] animate-pulse" />)}
            </div>
          ) : starterQuizzes.length === 0 ? (
            <div className="bg-white border-2 border-ink rounded-[20px] p-6 text-sm">
              <p className="text-muted" role={quizzesError ? "alert" : "status"}>{quizzesError ? "Starter quizzes could not be loaded." : "No community quizzes available yet. Create one to get started!"}</p>
              {quizzesError ? <button type="button" className="mt-3 font-bold underline" onClick={() => void fetchQuizzes(true)}>Try again</button> : <Link href="/create" className="inline-block mt-3 font-bold underline">Create Quiz</Link>}
            </div>
          ) : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {starterQuizzes.map((deck) => (
              <div
                key={deck.id}
                className="bg-white border-2 border-ink rounded-[20px] p-5 shadow-[5px_5px_0_#16151d] flex flex-col justify-between hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#16151d] transition-all"
              >
                <div>
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold font-dm-mono border border-ink ${deck.difficulty === "Easy" ? "bg-lime text-ink" : deck.difficulty === "Hard" ? "bg-pink text-white" : "bg-lilac text-purple-900"}`}>
                      {deck.category?.name || "General"}
                    </span>
                    <span className="text-[0.75rem] text-muted font-semibold font-dm-mono">
                      {Math.ceil((deck.timeAllocated || 180) / 60)} mins
                    </span>
                  </div>

                  <h3 className="text-[1.1rem] font-extrabold text-ink mb-1.5 leading-snug">
                    {deck.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[0.78rem] text-muted font-medium mb-4">
                    <span>{deck._count?.questions ?? 0} Questions</span>
                    <span>•</span>
                    <span>{deck.difficulty}</span>
                  </div>
                </div>

                <Link
                  href={`/play/${encodeURIComponent(deck.id)}`}
                  className="w-full button-3d justify-center py-2.5 text-[0.85rem] font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Quiz <span>→</span>
                </Link>
              </div>
            ))}
          </div>}
        </section>
      </main>

    </div>
  );
}
