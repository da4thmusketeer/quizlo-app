import Reveal from "./Reveal";

interface StepItem {
  num: string;
  title: string;
  description: string;
}

const steps: StepItem[] = [
  {
    num: "01 / PICK A VIBE",
    title: "Choose your rabbit hole.",
    description: "History? K-pop? Your actual coursework? There’s a quiz for that.",
  },
  {
    num: "02 / GET CURIOUS",
    title: "Tap. Think. Nail it.",
    description: "Bite-size questions, instant feedback and just enough challenge to keep you locked in.",
  },
  {
    num: "03 / FLEX YOUR SCORE",
    title: "See what sticks.",
    description: "Track your streaks, collect your wins, and quietly become the smartest friend in the group chat.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-[100px] md:py-[145px] px-[max(5vw,28px)]" id="how">
      <Reveal className="flex flex-col md:flex-row justify-between items-start md:items-end mb-[40px] md:mb-[58px]">
        <div>
          <span className="font-dm-mono text-[0.68rem] tracking-[0.08em] uppercase text-muted">
            Tiny wins, big brain energy
          </span>
          <h2 className="text-[clamp(2.4rem,5vw,5.2rem)] leading-[0.94] tracking-[-0.07em] mt-[14px] mb-0 max-w-[680px] font-extrabold">
            Your study break just got a personality.
          </h2>
        </div>
        <span className="hidden md:inline-block font-dm-mono text-[0.7rem] -rotate-7 text-pink mr-[8vw]">
          no boring bits
          <br />
          promised ↗
        </span>
      </Reveal>

      <Reveal className="grid grid-cols-1 md:grid-cols-3 border-t-[1.5px] border-ink">
        {steps.map((step, idx) => (
          <article
            key={idx}
            className={`py-[22px] md:py-[28px] pr-0 md:pr-[28px] min-h-0 md:min-h-[245px] border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-ink relative ${
              idx > 0 ? "md:pl-[28px]" : ""
            } ${idx === steps.length - 1 ? "md:border-r-0 border-b-0" : ""}`}
          >
            <span className="font-dm-mono text-[0.7rem] text-pink font-medium">
              {step.num}
            </span>
            <h3 className="text-[1.3rem] tracking-[-0.05em] mt-[28px] md:mt-[48px] mb-[11px] font-bold">
              {step.title}
            </h3>
            <p className="text-muted text-[0.88rem] leading-[1.6] max-w-[240px] m-0">
              {step.description}
            </p>
          </article>
        ))}
      </Reveal>
    </section>
  );
}
