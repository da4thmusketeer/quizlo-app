"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Compass,
  Clock,
  HelpCircle,
  Trophy,
  Flame,
  Zap,
  Play,
  X,
  Check,
  RotateCcw,
  User,
  Loader2,
} from "lucide-react";
import { goeyToast } from "goey-toast";
import { getToken } from "@/lib/auth";
import { getProfileData, ProfileData } from "@/lib/user";
import DashboardNavbar from "@/components/DashboardNavbar";
import {
  getQuizWithQuestions,
  Category,
  Quiz,
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

interface ActiveQuestion {
  question: string;
  options: string[];
  answer: number;
}

export default function ExplorePage() {
  const {
    quizzes,
    categories,
    isLoadingQuizzes,
    isLoadingCategories,
    isQuizzesFetched,
    _hasHydrated,
    fetchExploreData,
  } = useQuizStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false);

  // Auth / Profile state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userXp, setUserXp] = useState(0);
  const [userStreak, setUserStreak] = useState(0);

  // Active Quiz Modal state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<ActiveQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

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
    (!_hasHydrated || !isQuizzesFetched || isLoadingQuizzes || isLoadingCategories);

  // Load auth state and fetch/load cached explore data via Zustand store
  useEffect(() => {
    let isMounted = true;
    const token = getToken();

    if (token) {
      setIsLoggedIn(true);
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

  // Quiz Player handlers
  const handleStartQuiz = async (quiz: Quiz) => {
    setIsLoadingQuiz(true);
    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setScore(0);
    setQuizFinished(false);

    try {
      const fullQuiz = await getQuizWithQuestions(quiz.id);
      const questionsSource =
        fullQuiz?.questions || fullQuiz?.data?.questions || fullQuiz?.data;

      if (Array.isArray(questionsSource) && questionsSource.length > 0) {
        const parsedQuestions: ActiveQuestion[] = questionsSource.map((q: any) => ({
          question: q.text || q.question || "Quiz question",
          options: (q.answerOptions || q.options || []).map((opt: any) =>
            typeof opt === "string" ? opt : opt.text || "Option"
          ),
          answer:
            Array.isArray(q.answerOptions) &&
            q.answerOptions.findIndex((opt: any) => opt.isCorrect) !== -1
              ? q.answerOptions.findIndex((opt: any) => opt.isCorrect)
              : 0,
        }));

        setActiveQuestions(parsedQuestions);
      } else {
        // Fallback questions for this quiz
        setActiveQuestions([
          {
            question: `What is the core focus of "${quiz.title}"?`,
            options: [
              "Mastering key principles and concepts",
              "Unrelated trivia and speculation",
              "Temporary memorization without understanding",
              "Random computational algorithms",
            ],
            answer: 0,
          },
          {
            question: `Which learning habit is scientifically proven to boost retention in ${
              quiz.category?.name || "this topic"
            }?`,
            options: [
              "Passive re-reading of textbooks",
              "Active recall through spaced testing",
              "Cramming late the night before",
              "Skipping practice questions",
            ],
            answer: 1,
          },
          {
            question: `How would you best describe the target difficulty of this deck?`,
            options: [
              "Novice",
              quiz.difficulty || "Medium",
              "Unmeasured",
              "Extraterrestrial",
            ],
            answer: 1,
          },
        ]);
      }
    } catch (err) {
      console.warn("Could not fetch remote questions, using default questions:", err);
      setActiveQuestions([
        {
          question: `What is the primary objective of "${quiz.title}"?`,
          options: [
            "Understanding core subject concepts",
            "Random guesses",
            "Passive memorization",
            "Unrelated formulas",
          ],
          answer: 0,
        },
        {
          question: `What is the best way to retain information about ${
            quiz.category?.name || "this subject"
          }?`,
          options: [
            "Passive skimming",
            "Active recall & practice quizzes",
            "Ignoring difficult topics",
            "Studying once a year",
          ],
          answer: 1,
        },
      ]);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (
      activeQuestions.length > 0 &&
      idx === activeQuestions[currentQuestionIdx]?.answer
    ) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx + 1 < activeQuestions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      const earnedXp = score * 25 + 50;
      setQuizFinished(true);
      setUserXp((prev) => prev + earnedXp);
      if (userStreak === 0) setUserStreak(1);

      goeyToast.success("Quiz Completed! 🏆", {
        description: `You scored ${score}/${activeQuestions.length} and earned +${earnedXp} XP!`,
      });
    }
  };

  const handleCloseQuiz = () => {
    setActiveQuiz(null);
    setActiveQuestions([]);
    setSelectedOption(null);
    setQuizFinished(false);
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
        <div className="flex items-center justify-between text-xs font-dm-mono text-muted mb-4 px-1">
          <span>
            {isLoading
              ? "Fetching quizzes..."
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
            {filteredQuizzes.map((quiz) => {
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
                <article
                  key={quiz.id}
                  onClick={() => handleStartQuiz(quiz)}
                  className="group bg-white border-2 border-ink rounded-2xl p-5 shadow-[4px_4px_0_#16151d] hover:shadow-[6px_6px_0_#16151d] hover:-translate-y-1 transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
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
                </article>
              );
            })}
          </div>
        ) : (
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

      {/* Interactive Quiz Runner Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-paper border-2 border-ink rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-[8px_8px_0_#16151d] relative max-h-[90vh] overflow-y-auto">
            {/* Modal Close Button */}
            <button
              onClick={handleCloseQuiz}
              className="absolute top-4 right-4 p-1.5 bg-white border border-ink rounded-lg text-ink hover:bg-pink hover:text-white transition-colors cursor-pointer"
              aria-label="Close quiz"
            >
              <X className="w-4 h-4" />
            </button>

            {isLoadingQuiz ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 text-pink animate-spin mb-3" />
                <p className="font-extrabold text-sm text-ink">
                  Preparing quiz questions...
                </p>
              </div>
            ) : !quizFinished ? (
              <div>
                {/* Header metadata */}
                <div className="flex items-center gap-2 font-dm-mono text-[0.66rem] font-bold text-muted mb-3">
                  <span className="px-2 py-0.5 bg-white border border-ink/40 rounded uppercase text-ink">
                    {activeQuiz.category?.name || "General"}
                  </span>
                  <span>•</span>
                  <span>
                    Question {currentQuestionIdx + 1} of{" "}
                    {activeQuestions.length}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white border border-ink rounded-full h-2 mb-5 overflow-hidden">
                  <div
                    className="bg-pink h-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentQuestionIdx + 1) /
                          Math.max(activeQuestions.length, 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>

                {/* Question Text */}
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight leading-snug mb-5 text-ink">
                  {activeQuestions[currentQuestionIdx]?.question}
                </h3>

                {/* Answer Options */}
                <div className="space-y-2.5 mb-6">
                  {activeQuestions[currentQuestionIdx]?.options.map(
                    (option, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect =
                        idx === activeQuestions[currentQuestionIdx]?.answer;

                      let btnStyle =
                        "bg-white border-2 border-ink text-ink hover:bg-gray-50";

                      if (selectedOption !== null) {
                        if (isCorrect) {
                          btnStyle =
                            "bg-lime border-2 border-ink text-ink font-bold shadow-[2px_2px_0_#16151d]";
                        } else if (isSelected) {
                          btnStyle =
                            "bg-pink border-2 border-ink text-white font-bold";
                        } else {
                          btnStyle =
                            "bg-white/50 border border-ink/30 text-muted";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={selectedOption !== null}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full text-left p-3.5 rounded-xl font-medium text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <span>{option}</span>
                          {selectedOption !== null && isCorrect && (
                            <Check className="w-4 h-4 text-ink shrink-0 ml-2" />
                          )}
                          {selectedOption !== null &&
                            isSelected &&
                            !isCorrect && (
                              <X className="w-4 h-4 text-white shrink-0 ml-2" />
                            )}
                        </button>
                      );
                    }
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-ink/10">
                  <span className="font-dm-mono text-xs text-muted">
                    Score: {score}/{activeQuestions.length}
                  </span>
                  <button
                    disabled={selectedOption === null}
                    onClick={handleNextQuestion}
                    className="button-3d py-2.5 px-4 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>
                      {currentQuestionIdx + 1 === activeQuestions.length
                        ? "Finish Quiz"
                        : "Next Question"}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Quiz Finished View */
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-lime border-2 border-ink rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[3px_3px_0_#16151d]">
                  <Trophy className="w-7 h-7 text-ink" />
                </div>

                <h3 className="text-2xl font-extrabold mb-1">
                  Quiz Completed!
                </h3>
                <p className="text-muted text-sm mb-4">
                  You scored <strong className="text-ink">{score}</strong> out of{" "}
                  <strong>{activeQuestions.length}</strong>!
                </p>

                <div className="inline-flex items-center gap-2 bg-white border-2 border-ink rounded-xl px-4 py-2 font-dm-mono text-sm font-bold text-ink mb-6 shadow-[2px_2px_0_#16151d]">
                  <Zap className="w-4 h-4 text-ink fill-lime" />
                  <span>+{score * 25 + 50} XP Earned</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => activeQuiz && handleStartQuiz(activeQuiz)}
                    className="flex-1 bg-white hover:bg-paper border-2 border-ink text-ink font-bold py-2.5 rounded-xl transition-all shadow-[2px_2px_0_#16151d] active:translate-y-0.5 flex items-center justify-center gap-1.5 text-sm cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Play Again
                  </button>

                  <button
                    onClick={handleCloseQuiz}
                    className="flex-1 bg-ink hover:bg-pink text-white font-bold py-2.5 rounded-xl transition-colors shadow-[2px_2px_0_#ff5277] active:translate-y-0.5 text-sm cursor-pointer"
                  >
                    Back to Explore
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
