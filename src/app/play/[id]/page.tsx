"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Loader2, Play, RotateCcw, ShieldCheck, WifiOff, X } from "lucide-react";
import GameplayQuestion from "@/components/GameplayQuestion";
import QuestionMediaRenderer from "@/components/QuestionMediaRenderer";
import { useGameplayStore, recoverGame, beginGame, selectAnswer, advanceGame, finishGame, retryGame, resetGame, answerPayload } from "@/lib/gameplay";

export default function PlayPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  const game = useGameplayStore(state => state.games[id]);
  const [ready, setReady] = useState(false);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [online, setOnline] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const finishing = useRef(false);
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const question = game?.session?.questions[game.index];
  const remaining = Math.max(0, Math.ceil(((game?.deadline ?? 0) - now) / 1000));

  useEffect(() => {
    let active = true;
    setReady(false);
    setInitialError(null);
    recoverGame(id).catch(error => { if (active) setInitialError(error.message); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!leaving) return;
    const dialog = leaveDialog.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    return () => { dialog?.close(); if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
  }, [leaving]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); }
    catch (error) { setInitialError(error instanceof Error ? error.message : "Unable to start your session."); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    const update = () => { setOnline(navigator.onLine); setNow(Date.now()); };
    update();
    window.addEventListener("online", update); window.addEventListener("offline", update);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(clock); window.removeEventListener("online", update); window.removeEventListener("offline", update); document.removeEventListener("visibilitychange", update); };
  }, []);

  useEffect(() => {
    if (game?.phase === "completed") router.replace(`/play/${encodeURIComponent(id)}/results`);
  }, [game?.phase, id, router]);

  useEffect(() => {
    if (!ready || !game?.session || game.phase === "completed" || game.phase === "expired" || busy || finishing.current) return;
    if ((game.phase === "playing" && remaining === 0) || (game.phase === "submitting" && !game.error)) {
      finishing.current = true;
      void run(() => finishGame(id)).finally(() => { finishing.current = false; });
    }
  }, [ready, game?.phase, game?.session, remaining, busy, game?.error, id]);

  useEffect(() => {
    if (!game?.error || !online || (game.errorStatus !== 0 && (game.errorStatus ?? 0) < 500)) return;
    const retry = window.setTimeout(() => { void run(() => retryGame(id)); }, 5000);
    return () => clearTimeout(retry);
  }, [game?.error, game?.errorStatus, online, id, busy]);

  useEffect(() => {
    questionHeading.current?.focus();
  }, [question?.id, id]);

  useEffect(() => {
    if (!busy && question?.type === "OrderSequencing" && !game?.selections[question.id]) selectAnswer(id, { optionIds: question.answerOptions.map(option => option.id) });
  }, [question?.id, id, busy]);

  useEffect(() => {
    if (game?.phase !== "playing" && game?.phase !== "submitting") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [game?.phase]);

  const card = "bg-white border-2 border-ink rounded-[24px] p-6 sm:p-9 shadow-[6px_6px_0_#16151d]";
  const retry = () => void run(() => retryGame(id));
  return <div className="min-h-screen bg-paper text-ink selection:bg-lilac">
    <header className="max-w-5xl mx-auto px-5 sm:px-8 py-5 flex justify-between items-center gap-4">
      <Link href="/home" onClick={event => { if (game?.phase === "playing") { event.preventDefault(); setLeaving(true); } }} className="font-extrabold text-2xl tracking-tight">quiz<span className="text-pink">lo</span></Link>
      <span className="text-xs font-dm-mono uppercase tracking-widest text-muted">Your moment to shine</span>
      <button type="button" aria-label="Leave quiz" onClick={() => setLeaving(true)} className="bg-white border-2 border-ink rounded-xl p-2 hover:bg-lilac"><X className="w-5 h-5" /></button>
    </header>
    <main className="w-full max-w-3xl mx-auto px-5 sm:px-8 py-6 sm:py-10 space-y-6 pb-16">
      {!ready ? <div className={card} role="status"><Loader2 className="animate-spin inline mr-3" />Recovering your session...</div> : initialError ? <section className={card}><h1 className="text-2xl font-extrabold">Let’s get you signed in</h1><p role="alert" className="text-muted mt-3">{initialError}</p><Link href={`/login?redirect=${encodeURIComponent(`/play/${id}`)}`} className="button-3d button-lime mt-6">Log in to Play</Link></section> : <>
        {!online && <p role="status" className="flex gap-2 items-center bg-lilac p-4 rounded-xl text-sm"><WifiOff className="w-4 h-4 shrink-0" />You’re offline. Your progress is saved; submissions will retry when you reconnect.</p>}
        {game?.storageWarning && <p role="status" className="bg-lilac/30 p-4 rounded-xl text-sm">Browser storage is unavailable. Keep this tab open to retain your progress.</p>}
        {game?.error && <section role="alert" className="border-2 border-pink rounded-2xl bg-pink/10 p-5 space-y-3"><p className="font-bold">{game.error}</p>
          {game.errorStatus === 401 ? <Link href={`/login?redirect=${encodeURIComponent(`/play/${id}`)}`} className="underline font-bold">Log in again</Link> : game.phase !== "expired" && <button type="button" disabled={busy || !online} onClick={retry} className="underline font-bold disabled:opacity-50">{busy ? "Reconnecting..." : "Retry saved request"}</button>}
        </section>}
        {game?.phase === "expired" ? <section className={card}><Clock className="w-10 h-10 text-pink mb-4" /><h1 className="text-3xl font-extrabold">This session has ended</h1><p className="text-muted mt-3">The server can no longer accept this attempt. Start a fresh session when you’re ready.</p><button disabled={busy} onClick={() => { resetGame(id); void run(() => beginGame(id)); }} className="button-3d button-lime mt-6"><RotateCcw className="w-4 h-4" />Try Again</button></section> : !game?.session ? <section className={`${card} text-center space-y-6`}>
          <div className="mx-auto bg-lime w-20 h-20 rounded-3xl border-2 border-ink flex items-center justify-center rotate-[-6deg]"><Play className="w-9 h-9" /></div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ready to test yourself?</h1><p className="text-muted leading-relaxed">One question at a time. A race against the clock. Your answers are scored securely when you finish.</p>
          {game?.phase === "starting" && !busy && <p className="text-sm text-muted">A session start was interrupted. Retry to recover it with the same request key.</p>}
          <button type="button" disabled={busy || !online} onClick={() => void run(() => beginGame(id))} className="button-3d button-lime justify-center w-full py-4 disabled:opacity-50">{busy ? <><Loader2 className="animate-spin w-5 h-5" />Preparing your quiz...</> : "Let’s Play"}</button>
          <p className="text-xs text-muted flex gap-2 justify-center"><ShieldCheck className="w-4 h-4" />No answers revealed until you finish.</p>
        </section> : game.phase === "submitting" || game.phase === "completed" ? <section className={`${card} text-center space-y-5`} role="status"><div className="w-16 h-16 bg-lilac rounded-2xl mx-auto flex justify-center items-center"><Loader2 className="w-9 h-9 animate-spin motion-reduce:animate-none" /></div><h1 className="text-3xl font-extrabold">Grading your quiz...</h1><p className="text-muted">Your answers are with the server. Hang tight while we tally your results.</p></section> : question && <>
          <div className="flex justify-between items-end gap-4"><div><p className="text-xs text-muted font-dm-mono uppercase tracking-wider">In the zone</p><h1 className="text-lg font-bold mt-1 break-words">{game.session.quizTitle}</h1></div><div role="timer" aria-label={`${remaining} seconds remaining`} className={`shrink-0 flex gap-2 items-center border-2 border-ink rounded-xl px-3 py-2 font-dm-mono font-bold tabular-nums ${remaining <= 30 ? "bg-pink text-white" : "bg-white"}`}><Clock className="w-4 h-4" />{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</div></div>
          <div><div className="flex justify-between text-xs font-dm-mono text-muted mb-2"><span>Question {game.index + 1} of {game.session.questions.length}</span><span>{Math.round(game.index / game.session.questions.length * 100)}% complete</span></div><div role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={game.session.questions.length} aria-valuenow={game.index} className="h-3 bg-white border-2 border-ink rounded-full overflow-hidden"><div className="h-full bg-lime transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${game.index / game.session.questions.length * 100}%` }} /></div></div>
          <section key={question.id} className="space-y-6 animate-[question-in_250ms_ease-out] motion-reduce:animate-none">
            <h2 ref={questionHeading} tabIndex={-1} className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug whitespace-pre-wrap break-words outline-none">{question.text}</h2>
            {question.media && question.media.length > 0 && <QuestionMediaRenderer media={question.media} compact />}
            <GameplayQuestion question={question} value={game.selections[question.id] ?? {}} disabled={busy || remaining === 0 || !!game.pending} onChange={value => selectAnswer(id, value)} />
          </section>
          <div className="pt-4 flex flex-col-reverse sm:flex-row items-center gap-4 justify-between">
            <p className="text-xs text-muted">Answers lock when you move forward and are graded after finishing.</p>
            <button type="button" disabled={busy || remaining === 0} onClick={() => void run(() => advanceGame(id))} className="button-3d button-lime w-full sm:w-auto justify-center py-3 disabled:opacity-50">{busy ? <><Loader2 className="w-4 h-4 animate-spin" />Preparing answers...</> : <>{game.index === game.session.questions.length - 1 ? "Submit Quiz" : answerPayload(question, game.selections[question.id]) ? "Next Question" : "Skip Question"}<ArrowRight className="w-4 h-4" /></>}</button>
          </div>
        </>}
      </>}
    </main>
    {leaving && <dialog ref={leaveDialog} aria-labelledby="leave-title" onCancel={event => { event.preventDefault(); setLeaving(false); }} className="m-auto p-0 bg-transparent border-0 w-[calc(100%_-_2rem)] max-w-md backdrop:bg-ink/60"><section className={card}><h2 id="leave-title" className="text-2xl font-extrabold">Take a breather?</h2><p className="text-muted mt-3">Your progress stays in this tab’s session, but the timer keeps running.</p><div className="flex flex-wrap gap-3 mt-6"><button type="button" autoFocus onClick={() => setLeaving(false)} className="button-3d button-lime">Keep Playing</button><Link href="/explore" className="button-3d">Leave Quiz</Link></div></section></dialog>}
  </div>;
}
