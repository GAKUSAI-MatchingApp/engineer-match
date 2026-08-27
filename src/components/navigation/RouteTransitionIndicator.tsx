"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Keeps the indicator visible for at least this long once shown. Some
 * navigations in this app resolve synchronously (prefetched / instant nav),
 * committing within the same click dispatch -- without a floor, "show" and
 * "hide" would land back to back and the spinner would never actually paint.
 */
const MIN_VISIBLE_MS = 400;

/**
 * Safety net in case a click looked like an internal navigation but never
 * actually committed (e.g. navigation was cancelled, or the link opened a
 * confirm dialog first) -- without this the spinner would stay on forever.
 */
const FALLBACK_HIDE_MS = 8000;

function isModifiedClick(event: MouseEvent) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/**
 * App Router has no public "navigation start" event, so this infers intent
 * from same-origin <a> clicks (how next/link renders) and clears itself once
 * usePathname/useSearchParams reflect the destination -- i.e. the navigation
 * has committed. Purely visual; does not touch routing or auth.
 *
 * The click listener runs in the CAPTURE phase, not bubble: some navigations
 * in this Next.js version commit synchronously (history + URL update) as
 * part of the same click dispatch, before it would reach a bubble-phase
 * listener on document. Capturing ahead of that keeps window.location read
 * below accurate (still the pre-navigation URL) instead of racing it.
 */
export function RouteTransitionIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = `${pathname}?${searchParams.toString()}`;

  const [isNavigating, setIsNavigating] = useState(false);
  const navStartedAtRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedClick(event)) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      let destination: URL;
      try {
        destination = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (destination.origin !== window.location.origin) return;
      if (destination.pathname + destination.search === window.location.pathname + window.location.search) {
        return;
      }

      navStartedAtRef.current = performance.now();
      setIsNavigating(true);

      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = setTimeout(() => setIsNavigating(false), FALLBACK_HIDE_MS);
    }

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  // Runs whenever the committed URL changes, including the very first
  // navigation to complete after a click. Hides the indicator once it has
  // been visible for at least MIN_VISIBLE_MS, deferred via setTimeout so the
  // "hide" update never lands in the same commit as the "show" update above.
  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    const startedAt = navStartedAtRef.current;
    if (startedAt === null) return;
    navStartedAtRef.current = null;

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    const remaining = Math.max(MIN_VISIBLE_MS - (performance.now() - startedAt), 0);
    hideTimerRef.current = setTimeout(() => setIsNavigating(false), remaining);
  }, [currentUrl]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-background/30"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">ページを読み込んでいます</span>
    </div>
  );
}
