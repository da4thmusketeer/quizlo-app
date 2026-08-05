"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, Sparkles, LogOut, User, Flame } from "lucide-react";

interface DashboardNavbarProps {
  userName?: string;
  userXp?: number;
  userStreak?: number;
  onCreateQuizClick?: () => void;
}

export default function DashboardNavbar({
  userName = "Alex Rivers",
  userXp = 0,
  userStreak = 0,
  onCreateQuizClick,
}: DashboardNavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-[80px] px-[max(4vw,20px)] bg-paper/90 backdrop-blur-md border-b-2 border-ink flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Search */}
      <div className="flex items-center gap-6 sm:gap-8">
        <Link
          href="/home"
          className="font-extrabold text-[1.5rem] tracking-[-1.5px] no-underline text-ink flex items-center group"
        >
          <span>quiz</span>
          <i className="not-italic text-pink group-hover:rotate-12 transition-transform inline-block">
            lo
          </i>
          <span>.</span>
        </Link>

        {/* Search Bar */}
        <div className="relative hidden md:block w-[280px] lg:w-[360px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quizzes, decks, topics..."
            className="w-full pl-9 pr-4 py-2 bg-white border-2 border-ink rounded-[12px] font-medium text-ink placeholder:text-muted/60 text-[0.85rem] focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all shadow-[2px_2px_0_#16151d]"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Streak Pill */}
        <div className="hidden sm:flex items-center gap-1.5 bg-white border-2 border-ink px-3 py-1.5 rounded-[12px] shadow-[2px_2px_0_#16151d] text-[0.82rem] font-bold text-ink">
          <Flame className="w-4 h-4 text-pink fill-pink" />
          <span>{userStreak} Days</span>
        </div>

        {/* XP Pill */}
        <div className="hidden sm:flex items-center gap-1.5 bg-lime/40 border-2 border-ink px-3 py-1.5 rounded-[12px] shadow-[2px_2px_0_#16151d] text-[0.82rem] font-bold text-ink font-dm-mono">
          <span>⚡ {userXp} XP</span>
        </div>

        {/* Create Quiz Button */}
        <button
          onClick={onCreateQuizClick}
          className="button-3d button-lime py-2 px-3.5 sm:px-4 text-[0.82rem] font-extrabold flex items-center gap-1.5 rounded-[12px]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Quiz</span>
          <span className="sm:hidden">Create</span>
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 bg-white border-2 border-ink rounded-[12px] shadow-[3px_3px_0_#16151d] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-[8px] bg-lilac border border-ink flex items-center justify-center font-extrabold text-[0.85rem] text-ink">
              AR
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-ink rounded-[16px] p-2 shadow-[6px_6px_0_#16151d] z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-2.5 border-b border-ink/10 mb-1">
                <div className="font-extrabold text-[0.9rem] text-ink">{userName}</div>
                <div className="text-[0.75rem] text-muted font-medium">alex@example.com</div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-lime text-ink text-[0.68rem] font-bold font-dm-mono uppercase rounded-md border border-ink">
                  🌱 Newbie Quizzer
                </div>
              </div>

              <div className="space-y-0.5">
                <Link
                  href="/home"
                  className="flex items-center gap-2 px-2.5 py-2 text-[0.82rem] font-bold text-ink rounded-[8px] hover:bg-lilac/30 transition-colors"
                >
                  <User className="w-4 h-4 text-ink" /> My Dashboard
                </Link>
                <button
                  onClick={() => alert("Creating custom quiz modal...")}
                  className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-[0.82rem] font-bold text-ink rounded-[8px] hover:bg-lime/30 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-ink" /> AI Quiz Generator
                </button>
              </div>

              <div className="border-t border-ink/10 mt-1 pt-1">
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-2.5 py-2 text-[0.82rem] font-bold text-pink rounded-[8px] hover:bg-pink/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-pink" /> Log Out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
