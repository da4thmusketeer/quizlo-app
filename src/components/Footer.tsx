import Link from "next/link";

export default function Footer() {
  return (
    <footer id="join" className="py-[25px] pb-[35px] px-[max(5vw,28px)] flex flex-col sm:flex-row justify-between items-center gap-4 text-[0.72rem] text-muted border-t border-ink/10">
      <Link href="#top" className="font-extrabold text-[1.45rem] tracking-[-1.5px] no-underline text-ink">
        quiz<i className="not-italic text-pink">lo</i>.
      </Link>
      <span className="font-medium">Made for the endlessly curious.</span>
      <span className="font-medium">© 2026 Quizlo</span>
    </footer>
  );
}
