import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "goey-toast/styles.css";
import ToasterProvider from "@/components/ToasterProvider";
import PageTransitionProvider from "@/components/PageTransitionProvider";

const plusJakartaSans = localFont({
  src: "./fonts/PlusJakartaSans.ttf",
  weight: "200 800",
  variable: "--font-plus-jakarta",
  display: "swap",
  preload: false,
});

const dmMono = localFont({
  src: [
    { path: "./fonts/DMMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/DMMono-Medium.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-dm-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Quizlo — make your brain proud",
  description: "Quizlo — the quiz app that makes studying feel like play.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${dmMono.variable}`}>
      <body className="antialiased">
        <div className="grain" aria-hidden="true" />
        <PageTransitionProvider>
          {children}
        </PageTransitionProvider>
        <ToasterProvider />
      </body>
    </html>
  );
}
