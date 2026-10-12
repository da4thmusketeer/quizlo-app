"use client";

import { useState } from "react";

interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

const defaultAnswers: AnswerOption[] = [
  { id: "1", text: "Jupiter", isCorrect: false },
  { id: "2", text: "Saturn", isCorrect: true },
  { id: "3", text: "Neptune", isCorrect: false },
  { id: "4", text: "Earth", isCorrect: false },
];

export default function InteractiveQuizCard() {
  const [selectedId, setSelectedId] = useState<string>("2"); // default Saturn selected as in original mock

  return (
    <div className="floating-card select-none w-full max-w-[320px] mx-auto lg:mx-0 lg:max-w-[240px]">
      <div className="flex justify-between items-center font-dm-mono text-[0.62rem] sm:text-[0.64rem] font-medium text-muted mb-2.5 sm:mb-3">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-pink animate-pulse" />
          SCIENCE POP
        </span>
        <span>04 / 10</span>
      </div>
      <p className="m-0 mb-3 sm:mb-[15px] text-ink font-bold text-[0.85rem] sm:text-[0.84rem] leading-[1.35]">
        Which planet has the most moons?
      </p>
      <div className="grid grid-cols-2 gap-2 sm:gap-[7px]">
        {defaultAnswers.map((answer) => {
          const isSelected = selectedId === answer.id;
          const isOk = isSelected && answer.isCorrect;
          
          return (
            <button
              key={answer.id}
              onClick={() => setSelectedId(answer.id)}
              className={`border p-2 sm:p-[7px] text-[0.72rem] sm:text-[0.66rem] rounded-[7px] text-left transition-all cursor-pointer font-medium active:scale-95 ${
                isOk
                  ? "bg-lime border-ink text-ink font-bold shadow-sm"
                  : isSelected
                  ? "bg-pink text-white border-pink font-bold"
                  : "border-[#ddd] text-ink hover:border-ink bg-white active:bg-gray-50"
              }`}
            >
              {answer.text} {isOk ? "✓" : isSelected ? "✕" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
