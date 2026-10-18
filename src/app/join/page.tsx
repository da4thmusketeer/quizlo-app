"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { LogIn, PlusCircle } from "lucide-react";
import MultiplayerLayout, { multiplayerCard } from "@/components/MultiplayerLayout";

const CODE_LENGTH = 6;

export default function JoinPage() {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const enterDigits = (index: number, value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!numbers) return;
    // A complete code pasted or autofilled into any box fills the whole group.
    const start = numbers.length === CODE_LENGTH ? 0 : index;
    const entered = numbers.slice(0, CODE_LENGTH - start).split("");
    setDigits((previous) => {
      const next = [...previous];
      entered.forEach((digit, offset) => { next[start + offset] = digit; });
      return next;
    });
    inputs.current[Math.min(start + entered.length, CODE_LENGTH - 1)]?.focus();
  };

  return (
    <MultiplayerLayout centered title="Join a Room" description="Play with your friends live and compete for quiz-night glory.">
      <section className={`${multiplayerCard} text-center space-y-7 sm:py-9`} aria-labelledby="join-heading">
        <div className="space-y-2">
          <h2 id="join-heading" className="text-lg font-extrabold">Enter Room Code</h2>
          <p id="code-help" className="text-sm text-muted">Enter the 6-digit code shared by your host.</p>
        </div>
        <div role="group" aria-labelledby="join-heading" aria-describedby="code-help" className="grid grid-cols-6 gap-2 sm:gap-3 max-w-[440px] mx-auto">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => { inputs.current[index] = element; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={CODE_LENGTH}
              value={digit}
              aria-label={`Room code digit ${index + 1} of ${CODE_LENGTH}`}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => {
                if (event.target.value === "") {
                  setDigits((previous) => previous.map((value, i) => i === index ? "" : value));
                } else {
                  enterDigits(index, event.target.value);
                }
              }}
              onPaste={(event) => {
                event.preventDefault();
                enterDigits(index, event.clipboardData.getData("text"));
              }}
              onKeyDown={(event) => {
                if (event.key === "Backspace") {
                  event.preventDefault();
                  const target = digit || index === 0 ? index : index - 1;
                  setDigits((previous) => previous.map((value, i) => i === target ? "" : value));
                  inputs.current[target]?.focus();
                } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                  event.preventDefault();
                  inputs.current[Math.max(0, Math.min(CODE_LENGTH - 1, index + (event.key === "ArrowLeft" ? -1 : 1)))]?.focus();
                }
              }}
              className={`min-w-0 w-full h-14 sm:h-[72px] text-center text-2xl sm:text-3xl font-extrabold font-dm-mono border-2 rounded-xl transition-colors caret-pink focus:outline-none focus:border-pink focus:ring-2 focus:ring-pink/20 ${digit ? "border-ink bg-lime/20" : "bg-white border-dashed border-ink"}`}
            />
          ))}
        </div>
        <div className="space-y-3">
          <button type="button"  aria-describedby="join-unavailable" className="w-full button-3d button-lime justify-center py-4 text-base font-extrabold  ">
            Join Room
          </button>
          <p id="join-unavailable" className="text-xs text-muted leading-relaxed">Live rooms are coming soon. You can try entering a code, but joining is not available yet.</p>
        </div>
      </section>
      <div className="text-center space-y-3 pt-3">
        <p className="text-sm text-muted">Or create your own room</p>
        <Link href="/host" className="button-3d inline-flex justify-center">Host a Game</Link>
      </div>
    </MultiplayerLayout>
  );
}
