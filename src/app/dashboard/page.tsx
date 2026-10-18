"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Loader2, Plus, Target, Trophy, Zap } from "lucide-react";
import AccountLayout, { accountCard } from "@/components/AccountLayout";
import { getDashboardData, getLevelLabel, type DashboardData } from "@/lib/user";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getDashboardData().then(result => {
      if (!result.success || !result.data) throw new Error(result.message || "Unable to load your dashboard.");
      if (active) setData(result.data);
    }).catch(err => { if (active) setError(err.message || "Unable to load your dashboard."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  const progress = data?.goals?.xpProgress;
  return (
    <AccountLayout title="Dashboard" description="Track your progress, revisit your quizzes, and keep your curiosity going." profile={data?.profile}>
      {loading ? <div className={`${accountCard} flex items-center gap-3`} role="status"><Loader2 className="w-5 h-5 animate-spin" />Loading your dashboard...</div>
        : error || !data ? <section className={accountCard}><p role="alert">{error || "Your dashboard is unavailable."}</p><button onClick={() => setAttempt(value => value + 1)} className="button-3d mt-5">Try again</button></section>
        : <>
          <section className={`${accountCard} !bg-lilac/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6`}>
            <div className="min-w-0"><p className="font-dm-mono text-xs uppercase mb-2">Keep the momentum</p><h2 className="font-extrabold text-2xl sm:text-3xl break-words">Looking good, {data.profile.username || data.profile.firstName}!</h2><p className="text-muted mt-2 flex items-center gap-2"><Flame className="w-5 h-5 text-pink shrink-0" />{data.profile.streak} day streak. Your next challenge is waiting.</p></div>
            <Link href="/explore" className="button-3d button-lime justify-center shrink-0">Find a Quiz<ArrowRight className="w-4 h-4" /></Link>
          </section>
          <section aria-label="Your statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[{ label: "Quizzes played", value: data.statistics.totalQuizzesPlayed, Icon: BookOpen, color: "bg-lime/30" }, { label: "Quizzes created", value: data.statistics.totalQuizzesCreated, Icon: Plus, color: "bg-lilac/30" }, { label: "Average accuracy", value: `${data.statistics.averageAccuracy}%`, Icon: Target, color: "bg-pink/15" }, { label: "XP earned", value: data.statistics.totalXPEarned, Icon: Zap, color: "bg-lime/30" }].map(({ label, value, Icon, color }) => <div key={label} className={accountCard}><Icon className={`w-9 h-9 p-2 border border-ink rounded-lg ${color}`} /><p className="font-extrabold text-2xl sm:text-3xl mt-4 break-words">{value}</p><p className="text-xs sm:text-sm text-muted mt-1">{label}</p></div>)}
          </section>
          <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
            <section className={`${accountCard} min-w-0`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5"><h2 className="font-extrabold text-xl">My quizzes</h2><Link href="/create" className="inline-flex items-center gap-1 text-sm font-bold text-pink"><Plus className="w-4 h-4" />Create Quiz</Link></div>
              {data.myQuizzes.length ? <div className="space-y-3">{data.myQuizzes.map(quiz => <article key={quiz.id} className="border border-ink/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="min-w-0 flex-1"><h3 className="font-bold break-words">{quiz.title}</h3><p className="text-muted text-xs mt-1">{quiz._count?.questions ?? 0} questions · {quiz.difficulty} · {quiz.isDraft ? "Draft" : quiz.isPrivate ? "Private" : "Published"}</p></div>
                <Link href={quiz.isDraft ? `/create?edit=${encodeURIComponent(quiz.id)}` : `/create/summary?id=${encodeURIComponent(quiz.id)}`} className="text-sm font-bold inline-flex items-center gap-2 shrink-0 hover:text-pink">{quiz.isDraft ? "Continue editing" : "View quiz"}<ArrowRight className="w-4 h-4" /></Link>
              </article>)}</div> : <div className="bg-paper rounded-xl p-6 text-center"><BookOpen className="w-8 h-8 mx-auto text-muted mb-3" /><p className="font-bold">Your first quiz starts here</p><p className="text-sm text-muted mt-2 mb-5">Build your own questions or try the AI generator.</p><Link href="/create" className="button-3d button-lime justify-center">Create a Quiz</Link></div>}
            </section>
            <aside className="space-y-6 min-w-0">
              <section className={`${accountCard} !bg-lime/20`}><Trophy className="w-6 h-6 mb-3" /><h2 className="font-extrabold text-xl">Level {data.profile.level}</h2><p className="text-muted text-sm mt-1">{getLevelLabel(data.profile.level)} · {data.profile.xp} XP</p>{progress && <><div role="progressbar" aria-label="Progress to next level" aria-valuenow={Math.round(Math.min(100, Math.max(0, progress.progressPercentage)))} aria-valuemin={0} aria-valuemax={100} className="h-3 bg-white border border-ink rounded-full overflow-hidden mt-5"><div className="h-full bg-pink" style={{ width: `${Math.min(100, Math.max(0, progress.progressPercentage))}%` }} /></div><p className="text-xs text-muted mt-2">{progress.xpToNextLevel === null ? "You've reached the highest level!" : `${progress.xpToNextLevel} XP to your next level`}</p></>}</section>
              <section className={accountCard}><h2 className="font-extrabold text-xl mb-4">Recent activity</h2>{data.recentActivity.length ? <ul className="space-y-4">{data.recentActivity.slice(0, 5).map(activity => <li key={activity.id} className="border-b border-ink/10 pb-3 last:border-0 last:pb-0"><p className="font-bold text-sm break-words">{activity.quiz.title}</p><p className="text-xs text-muted mt-1">{activity.accuracy}% accuracy · {activity.score} points</p><p className="text-xs text-muted mt-1">{new Date(activity.completedAt).toLocaleDateString()}</p></li>)}</ul> : <p className="text-sm text-muted">Complete a quiz to see your activity here.</p>}</section>
            </aside>
          </div>
        </>}
    </AccountLayout>
  );
}
