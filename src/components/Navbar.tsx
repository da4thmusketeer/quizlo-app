import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="h-[68px] sm:h-[84px] flex items-center justify-between px-4 sm:px-6 md:px-[max(5vw,28px)] relative z-20">
      <Link 
        href="/" 
        className="font-extrabold text-[1.35rem] sm:text-[1.45rem] tracking-[-1.5px] no-underline text-ink"
      >
        quiz<i className="not-italic text-pink">lo</i>
      </Link>

      {/* Auth Actions: Log in and Sign up only */}
      <div className="flex items-center gap-2.5 sm:gap-4 text-[0.8rem] sm:text-[0.82rem] font-bold">
        <Link 
          href="/login" 
          className="text-ink no-underline hover:text-pink transition-colors px-2 sm:px-3 py-1.5"
        >
          Log in
        </Link>
        <Link 
          href="/signup" 
          className="bg-ink text-white px-3.5 sm:px-4 py-2 sm:py-[11px] rounded-[10px] no-underline hover:bg-pink transition-colors shadow-[2.5px_2.5px_0_#ff5277] sm:shadow-[3px_3px_0_#ff5277] active:translate-y-0.5"
        >
          Sign up
        </Link>
      </div>
    </nav>
  );
}

