export default function Marquee() {
  return (
    <div className="overflow-hidden border-t-[1.5px] border-b-[1.5px] border-ink bg-lilac py-[15px] whitespace-nowrap" aria-hidden="true">
      <div className="marquee-track font-extrabold text-[1.05rem] tracking-[-0.04em]">
        QUIZZES THAT HIT DIFFERENT <b className="mx-[24px] text-pink">✦</b> QUIZZES THAT HIT DIFFERENT <b className="mx-[24px] text-pink">✦</b> QUIZZES THAT HIT DIFFERENT <b className="mx-[24px] text-pink">✦</b> QUIZZES THAT HIT DIFFERENT <b className="mx-[24px] text-pink">✦</b> QUIZZES THAT HIT DIFFERENT <b className="mx-[24px] text-pink">✦</b> QUIZZES THAT HIT DIFFERENT <b className="mx-[24px] text-pink">✦</b>
      </div>
    </div>
  );
}
