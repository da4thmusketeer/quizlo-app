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
    <div className="floating-card select-none">
      <div className="flex justify-between font-dm-mono text-[0.64rem] font-medium text-muted mb-3">
        <span>SCIENCE POP</span>
        <span>04 / 10</span>
      </div>
      <p className="m-0 mb-[15px] text-ink font-bold text-[0.84rem] leading-[1.35]">
        Which planet has the most moons?
      </p>
      <div className="grid grid-cols-2 gap-[7px]">
        {defaultAnswers.map((answer) => {
          const isSelected = selectedId === answer.id;
          const isOk = isSelected && answer.isCorrect;
          
          return (
            <button
              key={answer.id}
              onClick={() => setSelectedId(answer.id)}
              className={`border p-[7px] text-[0.66rem] rounded-[6px] text-left transition-all cursor-pointer font-medium ${
                isOk
                  ? "bg-lime border-ink text-ink font-bold shadow-sm"
                  : isSelected
                  ? "bg-pink text-white border-pink font-bold"
                  : "border-[#ddd] text-ink hover:border-ink bg-white"
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
