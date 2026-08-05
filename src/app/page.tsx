import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import HowItWorks from "@/components/HowItWorks";
import PosterBanner from "@/components/PosterBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Navbar />
      <main id="top" className="flex-1">
        <Hero />
        <Marquee />
        <HowItWorks />
        <PosterBanner />
      </main>
      <Footer />
    </div>
  );
}
