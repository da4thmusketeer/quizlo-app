"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, ArrowLeft } from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";
import type { ProfileData } from "@/lib/user";

export const accountCard =
  "bg-white border-2 border-ink rounded-[20px] p-5 sm:p-7 shadow-[3px_3px_0_#16151d] sm:shadow-[6px_6px_0_#16151d]";

export default function AccountLayout({
  title,
  description,
  profile,
  children,
}: {
  title: string;
  description: string;
  profile?: Pick<
    ProfileData,
    | "username"
    | "firstName"
    | "email"
    | "profilePicture"
    | "xp"
    | "level"
    | "streak"
  >;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-pink selection:text-white">
      <DashboardNavbar
        userName={profile?.username || profile?.firstName}
        userXp={profile?.xp}
        userLevel={profile?.level}
        userStreak={profile?.streak}
        email={profile?.email}
        profilePicture={profile?.profilePicture}
      />
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-7 sm:py-10 space-y-7">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-sm font-bold hover:text-pink"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <header>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.05em]">
            {title}
          </h1>
          <p className="mt-3 text-muted max-w-xl">{description}</p>
        </header>
        {/* <nav aria-label="Account" className="flex gap-3 flex-wrap">
          {[
            { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
            { href: "/settings", label: "Settings", Icon: Settings },
          ].map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-5 py-3 border-2 border-ink rounded-xl text-sm font-bold ${pathname === href ? "bg-lime shadow-[3px_3px_0_#16151d]" : "bg-white hover:bg-lilac/30"}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav> */}
        {children}
      </main>
    </div>
  );
}
