import Link from "next/link";
import InteractiveQuizCard from "./InteractiveQuizCard";

export default function Hero() {
  return (
    <section className="min-h-[calc(100svh-68px)] sm:min-h-[calc(100vh-84px)] px-4 sm:px-6 md:px-[max(5vw,28px)] pt-6 sm:pt-[8vh] pb-10 sm:pb-[70px] relative flex flex-col justify-center overflow-hidden lg:overflow-visible">
      {/* Orbit Graphic */}
      <div className="orbit pointer-events-none select-none" aria-hidden="true" />

      {/* Eyebrow tag */}
      <div className="font-dm-mono text-[0.62rem] sm:text-[0.68rem] font-medium tracking-[0.08em] uppercase flex items-center gap-2 mb-4 sm:mb-[24px]">
        <span className="w-5 sm:w-[26px] h-[2px] bg-pink inline-block" />
        Your new study sidekick
      </div>

      {/* Hero Headline */}
      <h1 className="text-[clamp(2.5rem,8.2vw,8.6rem)] tracking-[-0.06em] sm:tracking-[-0.085em] leading-[0.92] sm:leading-[0.88] max-w-[1000px] m-0 font-extrabold relative z-10">
        Less <span className="highlight">cram.</span>
        <br />
        More <span className="highlight">damn,</span>
        <br />I know this.
      </h1>

      {/* Interactive Quiz Widget: Flows inline on mobile/tablet, floats on desktop */}
      <div className="my-6 sm:my-8 lg:my-0 relative z-10">
        <InteractiveQuizCard />
      </div>

      {/* Hero Subtitle & CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between mt-2 sm:mt-[58px] gap-6 sm:gap-[32px] relative z-10">
        <p className="max-w-[360px] text-muted text-[0.92rem] sm:text-[1rem] leading-[1.6] sm:leading-[1.65] m-0">
          Turn anything you’re learning into quick, surprisingly fun quizzes. The brain glow-up starts here.
        </p>
        <Link href="/signup" className="button-3d w-full sm:w-auto justify-center text-center">
          Take a quiz
        </Link>
      </div>
    </section>
  );
}
