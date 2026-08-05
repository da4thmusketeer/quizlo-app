import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="h-[84px] flex items-center justify-between px-[max(5vw,28px)] relative z-10">
      <Link href="/" className="font-extrabold text-[1.45rem] tracking-[-1.5px] no-underline text-ink">
        quiz<i className="not-italic text-pink">lo</i>.
      </Link>
      <div className="flex items-center gap-[20px] sm:gap-[28px] text-[0.82rem] font-bold">
        <Link href="/#how" className="text-ink no-underline hover:text-pink transition-colors hidden sm:inline-block">
          How it works
        </Link>
        <Link href="/#why" className="text-ink no-underline hover:text-pink transition-colors hidden sm:inline-block">
          Why Quizlo
        </Link>
        <Link href="/login" className="text-ink no-underline hover:text-pink transition-colors px-2 py-1">
          Log in
        </Link>
        <Link href="/signup" className="bg-ink text-white px-4 py-[11px] rounded-[10px] no-underline hover:bg-pink transition-colors shadow-[3px_3px_0_#ff5277]">
          Sign up free →
        </Link>
      </div>
    </nav>
  );
}

