import Link from "next/link";
import InteractiveQuizCard from "./InteractiveQuizCard";

export default function Hero() {
  return (
    <section className="min-h-[calc(100vh-84px)] px-[max(5vw,28px)] pt-[8vh] pb-[70px] relative flex flex-col justify-center">
      {/* Orbit Graphic */}
      <div className="orbit" aria-hidden="true" />

      {/* Eyebrow tag */}
      <div className="font-dm-mono text-[0.68rem] font-medium tracking-[0.09em] uppercase flex items-center gap-2 mb-[24px]">
        <span className="w-[26px] h-[2px] bg-pink inline-block" />
        Your new study sidekick
      </div>

      {/* Hero Headline */}
      <h1 className="text-[clamp(3.4rem,8vw,8.6rem)] tracking-[-0.085em] leading-[0.88] max-w-[1000px] m-0 font-extrabold relative z-10">
        Less <span className="highlight">cram.</span>
        <br />
        More <span className="highlight">damn,</span>
        <br />I know this.
      </h1>

      {/* Floating Interactive Quiz Widget */}
      <InteractiveQuizCard />

      {/* Hero Subtitle & CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mt-[42px] sm:mt-[58px] gap-[32px] relative z-10">
        <p className="max-w-[360px] text-muted text-[1rem] leading-[1.65] m-0">
          Turn anything you’re learning into quick, surprisingly fun quizzes. The brain glow-up starts here.
        </p>
        <Link href="#join" className="button-3d">
          Take a quiz <span>→</span>
        </Link>
      </div>
    </section>
  );
}
