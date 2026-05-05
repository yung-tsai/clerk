import { useEffect, useState } from "react";

/**
 * Polls /version.json for a newer build hash. When one is detected, shows a
 * small bottom-center banner inviting the user to refresh. No service worker.
 *
 * Note: only meaningful in production builds. In dev, /version.json doesn't
 * exist (it's emitted at build time), so the fetch quietly fails.
 */
export function UpdateBanner() {
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    let alive = true;

    async function check() {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const j = (await res.json()) as { hash?: string };
        if (!alive) return;
        if (j.hash && j.hash !== __BUILD_HASH__) setHasUpdate(true);
      } catch {
        // network/dev: ignore
      }
    }

    // Initial check + on tab focus + every 5 min
    check();
    const onVis = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVis);
    const id = window.setInterval(check, 5 * 60 * 1000);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(id);
    };
  }, []);

  if (!hasUpdate) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[500] bottom-[calc(env(safe-area-inset-bottom)+16px)] md:bottom-6 flex items-center gap-3 rounded-full bg-[#1A1A1A] text-white px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] font-sans text-[13px]"
      role="status"
    >
      <span>New version of Clerk is available.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="font-medium underline-offset-2 hover:underline"
      >
        Refresh
      </button>
    </div>
  );
}
