"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
  Suspense,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import QuizloLoader from "@/components/QuizloLoader";

interface PageTransitionContextType {
  isTransitioning: boolean;
  startTransition: (message?: string) => void;
  completeTransition: () => void;
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  isTransitioning: false,
  startTransition: () => {},
  completeTransition: () => {},
});

export const usePageTransition = () => useContext(PageTransitionContext);

/** Time before displaying full overlay (prevents flashes on fast transitions) */
const FLASH_THRESHOLD_MS = 150;
/** Safety timeout to avoid getting stuck if navigation is aborted */
const SAFETY_TIMEOUT_MS = 8000;

function NavigationListener({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onNavigate();
  }, [pathname, searchParams, onNavigate]);

  return null;
}

export default function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading Quizlo...");
  const [progress, setProgress] = useState(0);
  const [progressBarVisible, setProgressBarVisible] = useState(false);

  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupTimers = useCallback(() => {
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
  }, []);

  const completeTransition = useCallback(() => {
    cleanupTimers();

    // Quickly finish progress bar to 100%
    setProgress(100);

    // Fade out smoothly
    finishTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
      setShowOverlay(false);
      setProgressBarVisible(false);
      setProgress(0);
    }, 200);
  }, [cleanupTimers]);

  const startTransition = useCallback(
    (message = "Loading Quizlo...") => {
      cleanupTimers();
      setLoadingMessage(message);
      setIsNavigating(true);
      setProgressBarVisible(true);
      setProgress(25);

      // Smooth progress bar trickle (up to ~85%)
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev;
          const step = Math.max(1, (85 - prev) * 0.15);
          return Math.min(85, prev + step);
        });
      }, 150);

      // Only show full-screen overlay if navigation takes longer than threshold
      // to avoid annoying flashes during instant/cached navigation
      flashTimerRef.current = setTimeout(() => {
        setShowOverlay(true);
      }, FLASH_THRESHOLD_MS);

      // Safety timeout in case navigation is interrupted or errors
      safetyTimerRef.current = setTimeout(() => {
        completeTransition();
      }, SAFETY_TIMEOUT_MS);
    },
    [cleanupTimers, completeTransition],
  );

  // Global click interception for internal links
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Don't intercept modified clicks (open in new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return; // Only primary clicks

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref) return;

      // Ignore anchor fragments, phone, mail, or script links
      if (
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:")
      ) {
        return;
      }

      // Ignore links with target="_blank" or download attribute
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Ignore external navigation
        if (targetUrl.origin !== currentUrl.origin) return;

        // Ignore if clicking the exact same URL (pathname + search + hash)
        // or same page with just an anchor jump
        const isSamePage =
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search;
        if (isSamePage) return;

        // Valid internal navigation: trigger transition animation
        startTransition("Loading...");
      } catch {
        // Fallback for malformed URLs
      }
    };

    // Capture phase ensures we detect the click before React Router's internal handler
    document.addEventListener("click", handleLinkClick, true);
    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [startTransition]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      startTransition("Loading Quizlo...");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [startTransition]);

  // Ensure timers are cleaned up on unmount
  useEffect(() => {
    return () => cleanupTimers();
  }, [cleanupTimers]);

  return (
    <PageTransitionContext.Provider
      value={{ isTransitioning: isNavigating, startTransition, completeTransition }}
    >
      <Suspense fallback={null}>
        <NavigationListener onNavigate={completeTransition} />
      </Suspense>

      {/* Top Progress Bar: instant tactile feedback without full screen obstruction */}
      {progressBarVisible && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Page loading progress"
          className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3.5px] bg-transparent"
        >
          <div
            className="h-full bg-pink border-b border-ink/40 relative shadow-[0_2px_10px_rgba(255,82,119,0.5)] transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          >
            {/* Glowing Lime Leading Tip */}
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-lime shadow-[0_0_8px_#d8ff72]" />
          </div>
        </div>
      )}

      {/* Reusable Full-Screen Branded Overlay (rendered when transition > FLASH_THRESHOLD_MS) */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 pointer-events-auto transition-opacity duration-150">
          <QuizloLoader fullScreen message={loadingMessage} />
        </div>
      )}

      {children}
    </PageTransitionContext.Provider>
  );
}
