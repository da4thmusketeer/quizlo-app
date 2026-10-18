"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Compass,
  Clock,
  HelpCircle,
  Play,
  X,
  RotateCcw,
} from "lucide-react";
import { getToken } from "@/lib/auth";
import { getProfileData, ProfileData } from "@/lib/user";
import DashboardNavbar from "@/components/DashboardNavbar";
import {
  Category,
} from "@/lib/quiz";
import { useQuizStore } from "@/store/quizStore";

const DEFAULT_CATEGORIES = [
  "All",
  "Trivia",
  "Science",
  "Tech",
  "History",
  "Geography",
  "Pop Culture",
];

const MOBILE_PAGE_SIZE = 5;

export default function ExplorePage() {
  const {
    quizzes,
    categories,
    isLoadingQuizzes,
    quizzesError,
    isQuizzesFetched,
    _hasHydrated,
    fetchExploreData,
  } = useQuizStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePage, setMobilePage] = useState(1);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Match Tailwind's single-column layout below the sm breakpoint.
    const media = window.matchMedia("(max-width: 639px)");
    const updateViewport = () => setIsMobile(media.matches);
    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    setMobilePage(1);
  }, [searchQuery, selectedCategory, selectedDifficulty, isMobile]);

  // Auth / Profile state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userXp, setUserXp] = useState(0);
  const [userStreak, setUserStreak] = useState(0);

  // Compute category list dynamically from cached categories in Zustand store
  const categoryList = useMemo(() => {
    if (categories && categories.length > 0) {
      const dynamicCatNames = categories
        .map((c: Category) => c.name)
        .filter(Boolean);

      if (dynamicCatNames.length > 0) {
        return Array.from(
          new Set(["All", ...dynamicCatNames, ...DEFAULT_CATEGORIES.slice(1)])
        );
      }
    }
    return DEFAULT_CATEGORIES;
  }, [categories]);

  // Loading state: true if quizzes are not yet loaded and hydration/fetch is underway
  const isLoading =
    quizzes.length === 0 &&
    (!_hasHydrated || isLoadingQuizzes || (!isQuizzesFetched && !quizzesError));

  // Load auth state and fetch/load cached explore data via Zustand store
  useEffect(() => {
    let isMounted = true;
    const token = getToken();

    if (token) {
      getProfileData()
        .then((profileRes) => {
          if (isMounted && profileRes?.success && profileRes.data) {
            setProfile(profileRes.data);
            setUserXp(profileRes.data.xp ?? 0);
            setUserStreak(profileRes.data.streak ?? 0);
          }
        })
        .catch(() => {});
    }

    // fetchExploreData checks cache first; if already cached, skips network calls
    fetchExploreData();

    return () => {
      isMounted = false;
    };
  }, [fetchExploreData]);

  // Filter quizzes by search query, category, and difficulty
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const title = quiz.title || "";
      const description = quiz.description || "";
      const categoryName = quiz.category?.name || "";
      const difficulty = quiz.difficulty || "";

      const matchesSearch =
        searchQuery.trim() === "" ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        categoryName.toLowerCase() === selectedCategory.toLowerCase();

      const matchesDifficulty =
        selectedDifficulty === "All" ||
        difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [quizzes, searchQuery, selectedCategory, selectedDifficulty]);

  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / MOBILE_PAGE_SIZE));
  const currentPage = Math.min(mobilePage, totalPages);
  const pageStart = (currentPage - 1) * MOBILE_PAGE_SIZE;
  const visibleQuizzes = isMobile
    ? filteredQuizzes.slice(pageStart, pageStart + MOBILE_PAGE_SIZE)
    : filteredQuizzes;

  useEffect(() => {
    setMobilePage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const changeMobilePage = (page: number) => {
    setMobilePage(Math.max(1, Math.min(page, totalPages)));
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-pink selection:text-white">
      {/* Background grain texture */}
      <div className="grain" aria-hidden="true" />

      {/* Universal DashboardNavbar */}
      <DashboardNavbar
        userName={profile?.username || profile?.firstName || "Quizzer"}
        userXp={userXp}
        userStreak={userStreak}
        userLevel={profile?.level || 1}
        profilePicture={profile?.profilePicture}
        email={profile?.email}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search quizzes..."
      />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        {/* Page Hero Header */}
        <section className="mb-8 sm:mb-10 text-center sm:text-left">
          {/* <div className="inline-flex items-center gap-2 font-dm-mono text-[0.66rem] sm:text-[0.72rem] tracking-[0.08em] uppercase text-muted mb-2">
            <span className="w-2 h-2 rounded-full bg-pink animate-pulse" />
            <span>KNOWLEDGE ARCHIVE</span>
            <span className="text-muted/40">•</span>
            <span>
              {isLoading
                ? "Loading quizzes..."
                : `${quizzes.length} Quizzes Available`}
            </span>
          </div> */}

          <h1 className="text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold tracking-[-0.06em] leading-[1.05] m-0 mb-3">
            Explore <span className="highlight">quizzes.</span>
          </h1>

          <p className="text-muted text-[0.92rem] sm:text-[1rem] leading-[1.6] max-w-xl m-0 mx-auto sm:mx-0">
            Pick a topic, challenge your instincts, and flex your knowledge. Bite-sized and always fun.
          </p>
        </section>

        {/* Search & Filters Bar */}
        <section className="space-y-4 mb-8">
          {/* Search Input & Difficulty Selector */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, questions, or keywords..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border-2 border-ink rounded-xl font-medium text-ink placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all shadow-[2px_2px_0_#16151d]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-ink cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
              <span className="text-xs font-dm-mono uppercase text-muted font-bold mr-1 hidden sm:inline">
                Difficulty:
              </span>
              {["All", "Easy", "Medium", "Hard"].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border-2 border-ink cursor-pointer shrink-0 ${
                    selectedDifficulty === diff
                      ? "bg-ink text-white shadow-[2px_2px_0_#ff5277]"
                      : "bg-white text-ink hover:bg-paper shadow-[2px_2px_0_#16151d]"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Category Pills from getCategoryData() (horizontally scrollable on mobile) */}
          <div className="flex items-center  gap-2 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {categoryList.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 mt-4 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 border-[1.5px] border-ink ${
                    isActive
                      ? "bg-pink text-white shadow-[2px_2px_0_#16151d] -translate-y-0.5"
                      : "bg-white text-ink hover:bg-paper hover:border-ink/80 shadow-[1.5px_1.5px_0_#16151d]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Results Counter */}
        <div ref={resultsRef} className="flex items-center justify-between text-xs font-dm-mono text-muted mb-4 px-1 scroll-mt-6">
          <span aria-live="polite" aria-atomic="true">
            {isLoading
              ? "Fetching quizzes..."
              : quizzesError && quizzes.length === 0
              ? "Quizzes unavailable"
              : isMobile && filteredQuizzes.length > 0
              ? `Showing ${pageStart + 1}–${Math.min(pageStart + MOBILE_PAGE_SIZE, filteredQuizzes.length)} of ${filteredQuizzes.length} quizzes`
              : `Showing ${filteredQuizzes.length} ${
                  filteredQuizzes.length === 1 ? "quiz" : "quizzes"
                }`}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchExploreData(true)}
              className="hover:text-ink transition-colors cursor-pointer flex items-center gap-1 font-bold"
              title="Refresh cache from server"
            >
              <RotateCcw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            {(searchQuery ||
              selectedCategory !== "All" ||
              selectedDifficulty !== "All") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedDifficulty("All");
                }}
                className="text-pink font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Quizzes Grid / Loading Skeletons */}
        {quizzesError && !isLoading && (
          <div role="alert" className="bg-pink/10 border-2 border-ink rounded-2xl p-5 mb-5">
            <h2 className="font-extrabold">Unable to refresh quizzes</h2>
            <p className="text-sm text-muted mt-2">{quizzesError}</p>
            {quizzes.length > 0 && <p className="text-sm text-muted mt-2">Showing previously loaded quizzes.</p>}
            <button type="button" onClick={() => void fetchExploreData(true)} className="mt-3 font-bold underline">Try again</button>
          </div>
        )}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border-2 border-ink rounded-2xl p-5 shadow-[4px_4px_0_#16151d] animate-pulse flex flex-col justify-between h-[210px]"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="w-16 h-4 bg-paper rounded-md border border-ink/20" />
                    <div className="w-12 h-4 bg-paper rounded-md border border-ink/20" />
                  </div>
                  <div className="w-3/4 h-5 bg-paper rounded mb-2.5 border border-ink/10" />
                  <div className="w-full h-3.5 bg-paper/60 rounded mb-1.5" />
                  <div className="w-2/3 h-3.5 bg-paper/60 rounded" />
                </div>
                <div className="pt-4 border-t border-ink/10 flex justify-between items-center">
                  <div className="w-20 h-3 bg-paper rounded" />
                  <div className="w-8 h-8 rounded-lg bg-paper border border-ink/30" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {visibleQuizzes.map((quiz) => {
              const diff = quiz.difficulty || "Medium";
              const badgeColor =
                diff.toLowerCase() === "easy"
                  ? "bg-lime text-ink"
                  : diff.toLowerCase() === "hard"
                  ? "bg-pink text-white"
                  : "bg-lilac text-purple-900";
              const questionCount =
                quiz._count?.questions ?? (quiz as any).questionCount ?? 0;
              const timeEstimate = `${Math.ceil(
                (quiz.timeAllocated || 180) / 60
              )} mins`;

              return (
                <Link
                  key={quiz.id}
                  href={`/play/${encodeURIComponent(quiz.id)}`}
                  className="group bg-white border-2 border-ink rounded-2xl p-5 shadow-[4px_4px_0_#16151d] hover:shadow-[6px_6px_0_#16151d] hover:-translate-y-1 transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <img
                      src={quiz.coverPicture?.trim() || "/quiz-placeholder.svg"}
                      alt={`Cover for ${quiz.title}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-video object-cover rounded-xl border border-ink/20 mb-4"
                      onError={(event) => {
                        if (event.currentTarget.getAttribute("src") !== "/quiz-placeholder.svg") {
                          event.currentTarget.src = "/quiz-placeholder.svg";
                        }
                      }}
                    />

                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-paper border border-ink font-dm-mono text-[0.66rem] font-bold uppercase tracking-wider text-muted">
                        {quiz.category?.name || "General"}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-md font-dm-mono text-[0.66rem] font-extrabold uppercase border border-ink/40 ${badgeColor}`}
                      >
                        {diff}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h2 className="text-[1.18rem] font-extrabold tracking-[-0.04em] leading-[1.25] text-ink mb-2 group-hover:text-pink transition-colors">
                      {quiz.title}
                    </h2>
                    <p className="text-muted text-[0.84rem] leading-[1.55] m-0 line-clamp-2">
                      {quiz.description || "Test your knowledge on this quiz."}
                    </p>
                  </div>

                  {/* Footer metadata & Action button */}
                  <div className="mt-5 pt-4 border-t border-ink/10 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[0.72rem] font-dm-mono text-muted">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        {questionCount} Qs
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {timeEstimate}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-pink text-white flex items-center justify-center border border-ink group-hover:bg-lime group-hover:text-ink transition-colors shadow-[2px_2px_0_#16151d]">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : quizzesError ? null : (
          /* Empty State */
          <div className="p-10 text-center items-center my-6">
            <h3 className="font-extrabold text-lg mb-1">No quizzes matched</h3>
            <p className="text-muted text-sm max-w-sm mx-auto mb-4">
              We couldn't find any quizzes matching your search or filters. Try adjusting your query or resetting.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedDifficulty("All");
              }}
              className="bg-ink text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-pink transition-colors shadow-[2px_2px_0_#ff5277] cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
        {!isLoading && isMobile && totalPages > 1 && (
          <nav aria-label="Quiz pagination" className="flex items-center justify-between gap-3 mt-6 sm:hidden">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => changeMobilePage(currentPage - 1)}
              className="min-h-11 px-4 py-2 bg-white border-2 border-ink rounded-xl text-sm font-bold shadow-[2px_2px_0_#16151d] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-dm-mono text-muted" aria-live="polite" aria-atomic="true">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => changeMobilePage(currentPage + 1)}
              className="min-h-11 px-4 py-2 bg-lime border-2 border-ink rounded-xl text-sm font-bold shadow-[2px_2px_0_#16151d] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </nav>
        )}
      </main>

      {/* Footer */}
      {/* <footer className="py-6 px-4 sm:px-6 md:px-10 border-t border-ink/10 flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-3">
        <Link
          href="/"
          className="font-extrabold text-[1.2rem] tracking-[-1.5px] no-underline text-ink"
        >
          quiz<i className="not-italic text-pink">lo</i>
        </Link>
        <span>Made for curious minds.</span>
        <span>© 2026 Quizlo</span>
      </footer> */}

    </div>
  );
}
