export default function Marquee() {
  return (
    <div className="overflow-hidden border-t-[1.5px] border-b-[1.5px] border-ink bg-lilac py-2.5 sm:py-[15px] whitespace-nowrap select-none" aria-hidden="true">
      <div className="marquee-track font-extrabold text-[0.88rem] sm:text-[1.05rem] tracking-[-0.03em] sm:tracking-[-0.04em]">
        QUIZZES THAT HIT DIFFERENT <b className="mx-3 sm:mx-[24px] text-pink">✦</b> QUIZZES THAT HIT DIFFERENT <b className="mx-3 sm:mx-[24px] text-pink">✦</b> QUIZZES THAT HIT DIFFERENT <b className="mx-3 sm:mx-[24px] text-pink">✦</b> QUIZZES THAT HIT DIFFERENT <b className="mx-3 sm:mx-[24px] text-pink">✦</b> QUIZZES THAT HIT DIFFERENT <b className="mx-3 sm:mx-[24px] text-pink">✦</b> QUIZZES THAT HIT DIFFERENT <b className="mx-3 sm:mx-[24px] text-pink">✦</b>
      </div>
    </div>
  );
}
