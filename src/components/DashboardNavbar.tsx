"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Sparkles,
  LogOut,
  User,
  Flame,
  Trophy,
  Zap,
  Compass,
  PlusCircle,
} from "lucide-react";
import { goeyToast } from "goey-toast";
import { logout, getToken } from "@/lib/auth";
import { getLevelLabel } from "@/lib/user";

interface DashboardNavbarProps {
  userName?: string;
  userXp?: number;
  userStreak?: number;
  userLevel?: number;
  profilePicture?: string;
  email?: string;
  onCreateQuizClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
}

export default function DashboardNavbar({
  userName = "Quizzer",
  userXp = 0,
  userStreak = 0,
  userLevel = 1,
  profilePicture,
  email,
  onCreateQuizClick,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
}: DashboardNavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [internalSearch, setInternalSearch] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(Boolean(token || email));
  }, [email]);

  const handleLogout = async () => {
    await logout();
    goeyToast.success("Logged out successfully", {
      description: "You have been logged out successfully",
    });
    router.push("/login");
  };

  const currentSearch = searchQuery !== undefined ? searchQuery : internalSearch;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !onSearchChange) {
      if (internalSearch.trim()) {
        router.push(`/explore?q=${encodeURIComponent(internalSearch.trim())}`);
      }
    }
  };

  const levelLabel = getLevelLabel(userLevel);

  return (
    <header className="h-[80px] px-[max(4vw,20px)] bg-paper/90 backdrop-blur-md border-b-2 border-ink flex items-center justify-between sticky top-0 z-30">
      {/* Left: Brand & Navigation Tabs */}
      <div className="flex items-center gap-3 sm:gap-6 flex-1">
        <Link
          href="/home"
          className="font-extrabold text-[1.4rem] sm:text-[1.5rem] tracking-[-1.5px] no-underline text-ink flex items-center group"
        >
          <span>quiz</span>
          <i className="not-italic text-pink group-hover:rotate-12 transition-transform inline-block">
            lo
          </i>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden sm:flex items-center gap-1.5 font-bold text-xs">
          <Link
            href="/home"
            className={`px-3 py-1.5 rounded-[10px] transition-all no-underline ${
              pathname === "/home"
                ? "bg-white border-2 border-ink text-ink shadow-[2px_2px_0_#16151d]"
                : "text-muted hover:text-ink hover:bg-white/60"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/create"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] transition-all no-underline ${
              pathname === "/create"
                ? "bg-white border-2 border-ink text-ink shadow-[2px_2px_0_#16151d]"
                : "text-muted hover:text-ink hover:bg-white/60"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-pink" />
            <span>Create</span>
          </Link>
          <Link
            href="/explore"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] transition-all no-underline ${
              pathname === "/explore"
                ? "bg-white border-2 border-ink text-ink shadow-[2px_2px_0_#16151d]"
                : "text-muted hover:text-ink hover:bg-white/60"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-pink" />
            <span>Explore</span>
          </Link>
        </nav>
      </div>

      {/* Center: Search Bar */}
      <div className="flex flex-1 justify-center px-1 sm:px-2">
        <div className="relative w-[130px] sm:w-[220px] md:w-[280px] lg:w-[360px]">
          <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none text-muted">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <input
            type="text"
            value={currentSearch}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            className="w-full pl-7 sm:pl-9 pr-2 sm:pr-4 py-1.5 sm:py-2 bg-white border-2 border-ink rounded-[10px] sm:rounded-[12px] font-medium text-ink placeholder:text-muted/60 text-[0.75rem] sm:text-[0.85rem] focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all shadow-[2px_2px_0_#16151d]"
          />
        </div>
      </div>

      {/* Right Controls: Authenticated user stats OR Guest Login/Signup */}
      <div className="flex items-center justify-end gap-2 sm:gap-4 flex-1">
        {!isAuthenticated ? (
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-[0.82rem] font-bold">
            <Link
              href="/login"
              className="text-ink no-underline hover:text-pink transition-colors px-2.5 py-1.5"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-ink text-white px-3 sm:px-4 py-2 rounded-[10px] no-underline hover:bg-pink transition-colors shadow-[2px_2px_0_#ff5277] active:translate-y-0.5"
            >
              Sign up
            </Link>
          </div>
        ) : (
          <>
            {/* Streak Pill */}
            <div className="hidden sm:flex items-center gap-1.5 bg-white border-2 border-ink px-3 py-1.5 rounded-[12px] shadow-[2px_2px_0_#16151d] text-[0.82rem] font-bold text-ink">
              <Flame className="w-4 h-4 text-pink fill-pink" />
              <span>{userStreak} Days</span>
            </div>

            {/* XP Pill */}
            <div className="hidden sm:flex items-center gap-1.5 bg-lime/40 border-2 border-ink px-3 py-1.5 rounded-[12px] shadow-[2px_2px_0_#16151d] text-[0.82rem] font-bold text-ink font-dm-mono">
              <Zap className="w-4 h-4 text-ink fill-lime" />
              <span>{userXp} XP</span>
            </div>

            {/* Level Pill */}
            <div className="hidden md:flex items-center gap-1.5 bg-lilac/40 border-2 border-ink px-3 py-1.5 rounded-[12px] shadow-[2px_2px_0_#16151d] text-[0.82rem] font-bold text-ink">
              <Trophy className="w-4 h-4 text-purple-700" />
              <span>Lvl {userLevel}</span>
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 bg-white border-2 border-ink rounded-[12px] shadow-[3px_3px_0_#16151d] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer overflow-hidden"
                aria-label="User Profile Menu"
              >
                <img
                  src={profilePicture || "https://placehold.net/avatar.svg"}
                  alt={userName}
                  className="w-8 h-8 rounded-[8px] object-cover border border-ink/20 bg-lilac"
                />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white border-2 border-ink rounded-[16px] p-2.5 shadow-[6px_6px_0_#16151d] z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2.5 border-b border-ink/10 mb-1 flex items-center gap-3">
                    <img
                      src={profilePicture || "https://placehold.net/avatar.svg"}
                      alt={userName}
                      className="w-10 h-10 rounded-[10px] object-cover border-2 border-ink shrink-0 bg-lilac"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-[0.9rem] text-ink truncate">
                        {userName}
                      </div>
                      {email && (
                        <div className="text-[0.73rem] text-muted font-medium truncate">
                          {email}
                        </div>
                      )}
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-lime text-ink text-[0.68rem] font-bold font-dm-mono uppercase rounded-md border border-ink">
                        Lvl {userLevel} • {levelLabel}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Stats Row (Visible only on small screens) */}
                  <div className="sm:hidden grid grid-cols-3 gap-1 p-2 my-2 bg-paper rounded-[10px] border border-ink/20 text-center text-[0.72rem] font-bold text-ink">
                    <div className="flex flex-col items-center">
                      <Flame className="w-3.5 h-3.5 text-pink fill-pink mb-0.5" />
                      <span>{userStreak}d</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Zap className="w-3.5 h-3.5 text-ink fill-lime mb-0.5" />
                      <span>{userXp} XP</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Trophy className="w-3.5 h-3.5 text-purple-700 mb-0.5" />
                      <span>Lvl {userLevel}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <Link
                      href="/home"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-2.5 py-2 text-[0.82rem] font-bold text-ink rounded-[8px] hover:bg-lilac/30 transition-colors no-underline"
                    >
                      <User className="w-4 h-4 text-ink" /> My Dashboard
                    </Link>
                    <Link
                      href="/create"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-2.5 py-2 text-[0.82rem] font-bold text-ink rounded-[8px] hover:bg-lime/30 transition-colors no-underline"
                    >
                      <PlusCircle className="w-4 h-4 text-ink" /> Create Quiz
                    </Link>
                    <Link
                      href="/explore"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-2.5 py-2 text-[0.82rem] font-bold text-ink rounded-[8px] hover:bg-lilac/30 transition-colors no-underline"
                    >
                      <Compass className="w-4 h-4 text-ink" /> Explore Quizzes
                    </Link>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onCreateQuizClick) {
                          onCreateQuizClick();
                        } else {
                          goeyToast.info("AI Quiz Generator ⚡", {
                            description: "Opening AI Quiz Generator...",
                          });
                        }
                      }}
                      className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-[0.82rem] font-bold text-ink rounded-[8px] hover:bg-lime/30 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-ink" /> AI Quiz Generator
                    </button>
                  </div>

                  <div className="border-t border-ink/10 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-[0.82rem] font-bold text-pink rounded-[8px] hover:bg-pink/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-pink" /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
