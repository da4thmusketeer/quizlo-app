import Link from "next/link";
import Reveal from "./Reveal";

export default function PosterBanner() {
  return (
    <Reveal className="mx-[28px] md:mx-[max(5vw,28px)] mb-[75px] md:mb-[120px]" id="why">
      <div className="poster min-h-[540px] md:min-h-[500px] bg-ink rounded-[24px] p-[clamp(30px,6vw,85px)] text-white overflow-hidden relative flex flex-col justify-between group">
        <div className="bubble" aria-hidden="true" />
        
        <span className="font-dm-mono text-[0.68rem] tracking-[0.08em] uppercase text-[#b6b3be] relative z-10">
          For curious minds with short attention spans
        </span>

        <h2 className="max-w-[760px] text-[clamp(3rem,6.2vw,6.3rem)] font-extrabold relative z-10 leading-[0.9] my-4">
          Knowledge is
          <br />
          <em className="not-italic text-lime">kind of a flex.</em>
        </h2>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end relative z-10 gap-5">
          <p className="max-w-[290px] text-[#bbb8c2] text-[0.9rem] leading-[1.6] m-0">
            Quizlo turns “I should probably study” into “okay, one more.” No dusty textbooks energy required.
          </p>
          <Link href="#join" className="button-3d button-lime">
            Join Quizlo <span>→</span>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
