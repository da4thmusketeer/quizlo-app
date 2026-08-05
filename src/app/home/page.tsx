"use client";

import React, { useState } from "react";
import Link from "next/link";
import DashboardNavbar from "@/components/DashboardNavbar";
import {
  Sparkles,
  BookOpen,
  PlusCircle,
  Flame,
  Trophy,
  CheckCircle2,
  ArrowRight,
  Zap,
  Play,
  FileText,
  HelpCircle,
  X,
  Check,
} from "lucide-react";

interface QuizDeck {
  id: string;
  title: string;
  category: string;
  questionCount: number;
  timeEstimate: string;
  difficulty: "Easy" | "Medium" | "Hard";
  badgeColor: string;
  questions: { question: string; options: string[]; answer: number }[];
}

const STARTER_DECKS: QuizDeck[] = [
  {
    id: "gk-warmup",
    title: "General Knowledge Warmup",
    category: "Trivia & Fun",
    questionCount: 5,
    timeEstimate: "3 mins",
    difficulty: "Easy",
    badgeColor: "bg-lime text-ink",
    questions: [
      {
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        answer: 1,
      },
      {
        question: "What is the capital of Japan?",
        options: ["Kyoto", "Osaka", "Tokyo", "Hiroshima"],
        answer: 2,
      },
      {
        question: "Which chemical element has the symbol 'O'?",
        options: ["Gold", "Oxygen", "Osmium", "Silver"],
        answer: 1,
      },
      {
        question: "How many continents are there on Earth?",
        options: ["5", "6", "7", "8"],
        answer: 2,
      },
      {
        question: "What is the hardest natural substance on Earth?",
        options: ["Gold", "Iron", "Diamond", "Titanium"],
        answer: 2,
      },
    ],
  },
  {
    id: "science-universe",
    title: "Science & Universe Trivia",
    category: "Science",
    questionCount: 4,
    timeEstimate: "3 mins",
    difficulty: "Medium",
    badgeColor: "bg-lilac text-purple-900",
    questions: [
      {
        question: "What force keeps planets in orbit around the Sun?",
        options: ["Magnetism", "Gravity", "Friction", "Nuclear Force"],
        answer: 1,
      },
      {
        question: "What gas do plants absorb from the atmosphere for photosynthesis?",
        options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
        answer: 2,
      },
      {
        question: "What speed does light travel in a vacuum?",
        options: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s", "50,000 km/s"],
        answer: 0,
      },
      {
        question: "What is the center of an atom called?",
        options: ["Electron", "Proton", "Nucleus", "Neutron"],
        answer: 2,
      },
    ],
  },
  {
    id: "js-web",
    title: "JavaScript & Web Fundamentals",
    category: "Technology",
    questionCount: 4,
    timeEstimate: "4 mins",
    difficulty: "Easy",
    badgeColor: "bg-blue text-blue-950",
    questions: [
      {
        question: "Which HTML element is used to include JavaScript code?",
        options: ["<js>", "<script>", "<javascript>", "<code>"],
        answer: 1,
      },
      {
        question: "Which keyword declares a block-scoped variable in modern JS?",
        options: ["var", "let", "def", "global"],
        answer: 1,
      },
      {
        question: "What does CSS stand for?",
        options: [
          "Computer Style Sheets",
          "Cascading Style Sheets",
          "Creative Style System",
          "Colorful Sheet Styles",
        ],
        answer: 1,
      },
      {
        question: "Which method logs text to the browser developer console?",
        options: ["print()", "log.write()", "console.log()", "debug()"],
        answer: 2,
      },
    ],
  },
];

export default function HomePage() {
  const [userXp, setUserXp] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [completedQuizCount, setCompletedQuizCount] = useState(0);

  // Modals & Active Quiz state
  const [activeDeck, setActiveDeck] = useState<QuizDeck | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // AI Modal generator form state
  const [aiNotes, setAiNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const startQuiz = (deck: QuizDeck) => {
    setActiveDeck(deck);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setScore(0);
    setQuizFinished(false);
  };

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null) return; // Prevent changing after selected
    setSelectedOption(index);
    if (activeDeck && index === activeDeck.questions[currentQuestionIdx].answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!activeDeck) return;
    if (currentQuestionIdx + 1 < activeDeck.questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
      setUserXp((prev) => prev + score * 20 + 50);
      setCompletedQuizCount((prev) => prev + 1);
      if (userStreak === 0) setUserStreak(1);
    }
  };

  const handleAiGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiNotes.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      setIsGenerating(false);
      setShowAiModal(false);

      // Create generated deck
      const customDeck: QuizDeck = {
        id: `ai-${Date.now()}`,
        title: "AI Generated Notes Quiz",
        category: "Custom AI",
        questionCount: 3,
        timeEstimate: "3 mins",
        difficulty: "Medium",
        badgeColor: "bg-pink text-white",
        questions: [
          {
            question: "Based on your notes: What is the core takeaway?",
            options: [
              "Active recall boosts long-term retention",
              "Passive reading is the most effective method",
              "Cramming 1 hour before exams leads to 100% mastery",
              "Sleep is not required for memory consolidation",
            ],
            answer: 0,
          },
          {
            question: "Which studying habit yields the highest memory retention rate?",
            options: [
              "Re-reading textbooks 5 times",
              "Highlighting entire pages in yellow",
              "Self-testing with flashcards & quizzes",
              "Listening to background noise",
            ],
            answer: 2,
          },
          {
            question: "How does spaced repetition optimize brain learning?",
            options: [
              "It forces you to study 10 hours a day",
              "It reviews material right before you forget it",
              "It relies on rote memorization only",
              "It replaces sleep with extra study time",
            ],
            answer: 1,
          },
        ],
      };

      setAiNotes("");
      startQuiz(customDeck);
    }, 1400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-pink selection:text-white">
      <DashboardNavbar
        userName="Alex Rivers"
        userXp={userXp}
        userStreak={userStreak}
        onCreateQuizClick={() => setShowAiModal(true)}
      />

      <main className="flex-1 px-[max(4vw,20px)] py-8 max-w-[1200px] mx-auto w-full space-y-8">
        {/* Onboarding Welcome Banner */}
        <section className="bg-lilac/30 border-2 border-ink rounded-[24px] p-6 sm:p-8 shadow-[8px_8px_0_#16151d] relative overflow-hidden">
          <div className="orbit pointer-events-none opacity-20 scale-50 -right-20 -top-20" aria-hidden="true" />
          <div className="relative z-10 max-w-[800px]">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-lime text-ink text-[0.72rem] font-bold font-dm-mono uppercase rounded-full border border-ink mb-3 shadow-[2px_2px_0_#16151d]">
              🌱 Account Ready & Onboarded
            </div>
            <h1 className="text-[2.2rem] sm:text-[2.8rem] font-extrabold tracking-[-0.04em] leading-[1.1] text-ink">
              Welcome aboard, <span className="highlight">Alex!</span> 👋
            </h1>
            <p className="text-muted text-[0.98rem] mt-2 leading-[1.6]">
              Your brain glow-up starts now. Choose a quick action below or test your skills with a 3-minute starter quiz to unlock your 1-day study streak!
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
            <Zap className="w-5 h-5 text-pink fill-pink" /> Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: AI Builder */}
            <div
              onClick={() => setShowAiModal(true)}
              className="bg-lime/30 border-2 border-ink rounded-[20px] p-6 shadow-[6px_6px_0_#16151d] hover:translate-y-[-3px] hover:shadow-[9px_9px_0_#16151d] transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-[14px] bg-lime border-2 border-ink flex items-center justify-center text-ink text-xl font-bold mb-4 shadow-[3px_3px_0_#16151d]">
                  ⚡
                </div>
                <span className="font-dm-mono text-[0.7rem] font-bold text-ink uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-ink inline-block mb-2">
                  Instant AI
                </span>
                <h3 className="text-[1.25rem] font-extrabold text-ink group-hover:text-pink transition-colors">
                  AI Quiz Generator
                </h3>
                <p className="text-muted text-[0.85rem] mt-1.5 leading-[1.5]">
                  Paste lecture notes, articles, or topics. Get a custom quiz generated in 5 seconds.
                </p>
              </div>
              <div className="mt-5 pt-3 flex items-center text-[0.85rem] font-extrabold text-ink group-hover:translate-x-1 transition-transform">
                Generate Now <ArrowRight className="w-4 h-4 ml-1 text-pink" />
              </div>
            </div>

            {/* Card 2: Explore Community */}
            <div
              onClick={() => alert("Exploring community library...")}
              className="bg-lilac/30 border-2 border-ink rounded-[20px] p-6 shadow-[6px_6px_0_#16151d] hover:translate-y-[-3px] hover:shadow-[9px_9px_0_#16151d] transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-[14px] bg-lilac border-2 border-ink flex items-center justify-center text-purple-950 text-xl font-bold mb-4 shadow-[3px_3px_0_#16151d]">
                  📚
                </div>
                <span className="font-dm-mono text-[0.7rem] font-bold text-purple-950 uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-ink inline-block mb-2">
                  50,000+ Decks
                </span>
                <h3 className="text-[1.25rem] font-extrabold text-ink group-hover:text-pink transition-colors">
                  Explore Community Decks
                </h3>
                <p className="text-muted text-[0.85rem] mt-1.5 leading-[1.5]">
                  Browse pre-made quizzes created by students in Science, Coding, History, and Languages.
                </p>
              </div>
              <div className="mt-5 pt-3 flex items-center text-[0.85rem] font-extrabold text-ink group-hover:translate-x-1 transition-transform">
                Browse Library <ArrowRight className="w-4 h-4 ml-1 text-pink" />
              </div>
            </div>

            {/* Card 3: Custom Builder */}
            <div
              onClick={() => alert("Opening manual quiz builder...")}
              className="bg-pink/15 border-2 border-ink rounded-[20px] p-6 shadow-[6px_6px_0_#16151d] hover:translate-y-[-3px] hover:shadow-[9px_9px_0_#16151d] transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-[14px] bg-pink text-white border-2 border-ink flex items-center justify-center text-xl font-bold mb-4 shadow-[3px_3px_0_#16151d]">
                  ✏️
                </div>
                <span className="font-dm-mono text-[0.7rem] font-bold text-pink uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-ink inline-block mb-2">
                  Custom Cards
                </span>
                <h3 className="text-[1.25rem] font-extrabold text-ink group-hover:text-pink transition-colors">
                  Manual Deck Builder
                </h3>
                <p className="text-muted text-[0.85rem] mt-1.5 leading-[1.5]">
                  Handcraft custom multiple-choice and flashcard decks with your own answers.
                </p>
              </div>
              <div className="mt-5 pt-3 flex items-center text-[0.85rem] font-extrabold text-ink group-hover:translate-x-1 transition-transform">
                Create Manual Deck <ArrowRight className="w-4 h-4 ml-1 text-pink" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Summary Panel */}
        <section className="bg-white border-2 border-ink rounded-[20px] p-6 shadow-[6px_6px_0_#16151d] grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-paper rounded-[14px] border border-ink/20 flex flex-col">
            <span className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted">Daily Streak</span>
            <div className="text-[1.8rem] font-extrabold text-ink flex items-center gap-2 mt-1">
              <Flame className="w-6 h-6 text-pink fill-pink" /> {userStreak} <span className="text-xs font-normal text-muted">Days</span>
            </div>
          </div>

          <div className="p-4 bg-paper rounded-[14px] border border-ink/20 flex flex-col">
            <span className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted">Total XP</span>
            <div className="text-[1.8rem] font-extrabold text-ink flex items-center gap-1.5 mt-1 font-dm-mono">
              ⚡ {userXp}
            </div>
          </div>

          <div className="p-4 bg-paper rounded-[14px] border border-ink/20 flex flex-col">
            <span className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted">Quizzes Played</span>
            <div className="text-[1.8rem] font-extrabold text-ink flex items-center gap-2 mt-1">
              🏆 {completedQuizCount}
            </div>
          </div>

          <div className="p-4 bg-paper rounded-[14px] border border-ink/20 flex flex-col">
            <span className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted">Rank</span>
            <div className="text-[1.1rem] font-extrabold text-ink flex items-center gap-2 mt-2">
              🌱 Novice
            </div>
          </div>
        </section>

        {/* Recommended Starter Quizzes */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-[1.35rem] font-extrabold tracking-[-0.03em] text-ink flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-pink" /> Starter Decks For You
              </h2>
              <p className="text-muted text-[0.85rem] mt-0.5">
                Pick a deck to test your knowledge right now.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STARTER_DECKS.map((deck) => (
              <div
                key={deck.id}
                className="bg-white border-2 border-ink rounded-[20px] p-5 shadow-[5px_5px_0_#16151d] flex flex-col justify-between hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#16151d] transition-all"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold font-dm-mono border border-ink ${deck.badgeColor}`}>
                      {deck.category}
                    </span>
                    <span className="text-[0.75rem] text-muted font-semibold font-dm-mono">
                      {deck.timeEstimate}
                    </span>
                  </div>

                  <h3 className="text-[1.1rem] font-extrabold text-ink mb-1.5 leading-snug">
                    {deck.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[0.78rem] text-muted font-medium mb-4">
                    <span>{deck.questionCount} Questions</span>
                    <span>•</span>
                    <span>{deck.difficulty}</span>
                  </div>
                </div>

                <button
                  onClick={() => startQuiz(deck)}
                  className="w-full button-3d justify-center py-2.5 text-[0.85rem] font-extrabold"
                >
                  Start Quiz <span>→</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Interactive Quiz Modal */}
      {activeDeck && (
        <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-ink rounded-[24px] p-6 sm:p-8 max-w-[560px] w-full shadow-[10px_10px_0_#16151d] relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setActiveDeck(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-paper border border-ink flex items-center justify-center text-ink hover:bg-pink hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {!quizFinished ? (
              <div>
                {/* Header Info */}
                <div className="mb-5 border-b border-ink/10 pb-4">
                  <span className="text-[0.72rem] font-bold font-dm-mono uppercase text-pink">
                    {activeDeck.title}
                  </span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[0.82rem] font-extrabold text-ink">
                      Question {currentQuestionIdx + 1} of {activeDeck.questions.length}
                    </span>
                    <span className="text-[0.75rem] font-dm-mono font-bold text-muted">
                      Score: {score}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-paper border border-ink rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-lime transition-all duration-300"
                      style={{
                        width: `${((currentQuestionIdx + 1) / activeDeck.questions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Question Text */}
                <h3 className="text-[1.2rem] font-extrabold text-ink mb-6">
                  {activeDeck.questions[currentQuestionIdx].question}
                </h3>

                {/* Options List */}
                <div className="space-y-3 mb-6">
                  {activeDeck.questions[currentQuestionIdx].options.map((opt, idx) => {
                    const isCorrect = idx === activeDeck.questions[currentQuestionIdx].answer;
                    const isSelected = selectedOption === idx;

                    let optionStyle = "bg-paper border-2 border-ink text-ink hover:bg-lilac/30";
                    if (selectedOption !== null) {
                      if (isCorrect) {
                        optionStyle = "bg-lime border-2 border-ink text-ink font-bold shadow-[2px_2px_0_#16151d]";
                      } else if (isSelected && !isCorrect) {
                        optionStyle = "bg-pink/20 border-2 border-pink text-pink font-bold";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={selectedOption !== null}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full text-left p-3.5 rounded-[14px] text-[0.9rem] font-medium transition-all flex items-center justify-between ${optionStyle}`}
                      >
                        <span>{opt}</span>
                        {selectedOption !== null && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-ink shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Next Action Button */}
                {selectedOption !== null && (
                  <button
                    onClick={handleNextQuestion}
                    className="w-full button-3d button-lime justify-center py-3 text-[0.9rem]"
                  >
                    {currentQuestionIdx + 1 < activeDeck.questions.length ? (
                      <>
                        Next Question <span>→</span>
                      </>
                    ) : (
                      <>
                        Finish Quiz <span>🏆</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              /* Quiz Finished View */
              <div className="text-center space-y-4 py-2">
                <div className="text-4xl">🎉</div>
                <h3 className="text-[1.6rem] font-extrabold text-ink">Quiz Completed!</h3>
                <p className="text-muted text-[0.9rem]">
                  You scored <span className="font-bold text-ink">{score}</span> out of{" "}
                  <span className="font-bold text-ink">{activeDeck.questions.length}</span>!
                </p>

                <div className="p-4 bg-lime/30 border-2 border-ink rounded-[16px] text-[0.88rem] font-bold text-ink space-y-1">
                  <div>⚡ Earned +{score * 20 + 50} XP</div>
                  <div>🔥 1-Day Streak Active!</div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => setActiveDeck(null)}
                    className="button-3d justify-center w-full py-3 text-[0.9rem]"
                  >
                    Back to Dashboard <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Quiz Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-ink rounded-[24px] p-6 sm:p-8 max-w-[520px] w-full shadow-[10px_10px_0_#16151d] relative">
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-paper border border-ink flex items-center justify-center text-ink hover:bg-pink hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-lime text-ink text-[0.72rem] font-bold font-dm-mono uppercase rounded-full border border-ink mb-2">
                ⚡ Quizlo AI Engine
              </span>
              <h3 className="text-[1.5rem] font-extrabold text-ink">Generate AI Quiz</h3>
              <p className="text-muted text-[0.85rem] mt-1">
                Paste lecture notes, article excerpts, or topics below.
              </p>
            </div>

            <form onSubmit={handleAiGenerate} className="space-y-4">
              <div>
                <textarea
                  rows={5}
                  required
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="Paste your study notes here (e.g. 'Active recall and spaced repetition are cognitive science techniques that improve memory retention...')"
                  className="w-full p-3.5 bg-paper border-2 border-ink rounded-[14px] font-medium text-[0.88rem] text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating || !aiNotes.trim()}
                className="w-full button-3d button-lime justify-center py-3.5 text-[0.9rem] font-extrabold disabled:opacity-60"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-ink" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Questions...
                  </span>
                ) : (
                  <>
                    Build Quiz Now <span>⚡</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="py-6 border-t border-ink/10 text-center text-[0.78rem] text-muted font-medium">
        © 2026 Quizlo. Made for the endlessly curious.
      </footer>
    </div>
  );
}
