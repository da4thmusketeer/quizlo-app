"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { QuizDetails } from "@/lib/quiz";
import QuizReview from "@/components/QuizReview";

export default function QuizPreviewModal({ quiz, onClose, onPublish, isPublishing = false, publishError }: {
  quiz: QuizDetails;
  onClose: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  publishError?: string | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="quiz-preview-heading"
      onCancel={(event) => { event.preventDefault(); if (!isPublishing) onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !isPublishing) onClose(); }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-[950px] max-h-[90dvh] overflow-y-auto overscroll-contain p-0 bg-paper text-ink border-2 border-ink rounded-[20px] shadow-[6px_6px_0_#16151d] backdrop:bg-ink/70 backdrop:backdrop-blur-sm"
    >
      <div className="sticky top-0 z-10 bg-paper border-b-2 border-ink p-4 sm:p-6 flex justify-between items-start gap-4">
        <div>
          <h2 id="quiz-preview-heading" className="text-xl font-extrabold">Preview Quiz</h2>
          <p className="text-sm text-muted mt-1">Preview only. Close this window to keep editing.</p>
        </div>
        <button type="button" autoFocus disabled={isPublishing} aria-label="Close preview" onClick={onClose} className="p-2 bg-white border-2 border-ink rounded-xl hover:bg-pink hover:text-white shrink-0 disabled:opacity-50"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-4 sm:p-6 space-y-6"><QuizReview quiz={quiz} /></div>
      <div className="p-4 sm:p-6 border-t border-ink/20">
        {publishError && <p role="alert" className="text-pink text-sm mb-4">{publishError}</p>}
        <div className="flex flex-col sm:flex-row gap-4" aria-busy={isPublishing}>
          <button type="button" onClick={onClose} disabled={isPublishing} className={`button-3d justify-center w-full disabled:opacity-50 ${onPublish ? "" : "button-lime"}`}>{onPublish ? "Back to Edit" : "Back to Editing"}</button>
          {onPublish && <button type="button" onClick={onPublish} disabled={isPublishing} className="button-3d button-lime justify-center w-full disabled:opacity-50 disabled:cursor-not-allowed">{isPublishing ? "Publishing Quiz..." : "Publish Quiz"}</button>}
        </div>
      </div>
    </dialog>
  );
}
