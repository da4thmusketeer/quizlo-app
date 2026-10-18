import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";

export const multiplayerCard =
  "bg-white border-2 border-ink rounded-[20px] p-5 sm:p-7 shadow-none sm:shadow-[6px_6px_0_#16151d]";
export const multiplayerInput =
  "w-full p-3 bg-paper border-2 border-ink rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink";
export const multiplayerLabel =
  "block text-xs font-bold font-dm-mono uppercase tracking-wider text-muted mb-2";

export default function MultiplayerLayout({
  title,
  description,
  children,
  centered = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  centered?: boolean;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-pink selection:text-white">
      <DashboardNavbar />
      <main className={`${centered ? "max-w-[620px]" : "max-w-[1000px]"} w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-7`}>
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-sm font-bold hover:text-pink"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <header className={`space-y-3 ${centered ? "text-center pb-4" : ""}`}>
          <span className="inline-flex items-center gap-2 bg-lilac border border-ink rounded-full px-3 py-1 text-xs font-bold font-dm-mono">
            <Sparkles className="w-3.5 h-3.5" />
            Multiplayer · Coming soon
          </span>
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-[-0.05em]">
            {title}
          </h1>
          <p className="text-muted leading-relaxed max-w-xl">{description}</p>
        </header>
        {!centered && <div className="bg-lime/20 border-2 border-ink rounded-2xl p-4 text-sm leading-relaxed">
          <strong>Take a look around.</strong> Live multiplayer is coming soon.
          These setup screens are a preview; joining rooms, creating lobbies,
          and starting games are not available yet.
        </div>}
        {children}
      </main>
    </div>
  );
}
