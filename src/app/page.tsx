import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import HowItWorks from "@/components/HowItWorks";
import PosterBanner from "@/components/PosterBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink overflow-x-hidden selection:bg-pink selection:text-white">
      <Navbar />
      <main id="top" className="flex-1 w-full overflow-x-hidden">
        <Hero />
        <Marquee />
        <HowItWorks />
        <PosterBanner />
      </main>
      <Footer />
    </div>
  );
}
