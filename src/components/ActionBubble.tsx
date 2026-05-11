import { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ActionBubbleData {
  /** Stable key per nudge type so we don't re-fire while one is showing. */
  id: string;
  message: string;
  primary: { label: string; onClick: () => void };
  secondary: { label: string; onClick: () => void };
}

interface Props {
  bubble: ActionBubbleData | null;
  onDismiss: () => void;
  /** Auto-dismiss after this many ms (default 8000). */
  durationMs?: number;
}

/**
 * Interactive two-button speech bubble that floats above Wes.
 * Non-blocking — pointer events only on the buttons.
 * Auto-dismisses after `durationMs` (default 8s) and on Escape.
 */
export function ActionBubble({ bubble, onDismiss, durationMs = 8000 }: Props) {
  useEffect(() => {
    if (!bubble) return;
    const timer = window.setTimeout(onDismiss, durationMs);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [bubble, durationMs, onDismiss]);

  return (
    <div
      className={cn(
        "absolute right-0 z-[400] w-[280px] rounded-[12px] bg-[#1A1A1A] px-3.5 py-2.5 text-left font-sans text-[12px] font-normal leading-[1.4] text-white transition-all duration-200",
        bubble ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-1.5 pointer-events-none",
      )}
      style={{ bottom: "calc(100% + 8px)" }}
      role="dialog"
      aria-live="polite"
    >
      {bubble && (
        <>
          <div className="mb-2.5">{bubble.message}</div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                bubble.primary.onClick();
                onDismiss();
              }}
              className="flex-1 rounded-[8px] bg-white text-[#1A1A1A] px-2.5 py-1.5 font-medium text-[11px] hover:bg-white/90 transition-colors"
            >
              {bubble.primary.label}
            </button>
            <button
              type="button"
              onClick={() => {
                bubble.secondary.onClick();
                onDismiss();
              }}
              className="flex-1 rounded-[8px] bg-white/10 text-white px-2.5 py-1.5 font-medium text-[11px] hover:bg-white/20 transition-colors"
            >
              {bubble.secondary.label}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
