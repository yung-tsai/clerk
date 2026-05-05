import { useEffect, useState } from "react";

interface Props {
  targetEl: HTMLElement | null;
  onDismiss: () => void;
}

/**
 * One-time mobile coachmark teaching the long-press gesture on a task card.
 * Anchors a small pill above the target card; light backdrop keeps card tappable.
 */
export function LongPressHint({ targetEl, onDismiss }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!targetEl) return;
    const update = () => setRect(targetEl.getBoundingClientRect());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const interval = window.setInterval(update, 250); // pick up layout shifts
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.clearInterval(interval);
    };
  }, [targetEl]);

  if (!rect) return null;

  // Place pill above the card if there's room, else below
  const pillHeight = 88;
  const placeAbove = rect.top > pillHeight + 16;
  const top = placeAbove ? rect.top - pillHeight - 8 : rect.bottom + 8;
  const left = Math.max(12, Math.min(window.innerWidth - 280 - 12, rect.left + rect.width / 2 - 140));

  return (
    <div
      className="fixed inset-0 z-[400]"
      style={{ background: "rgba(0,0,0,0.18)" }}
      onClick={onDismiss}
    >
      <div
        className="absolute rounded-[14px] bg-white shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-[#D7D7D7] px-4 py-3"
        style={{ top, left, width: 280 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-plex text-[14px] font-medium text-[#2A2A2A] leading-snug">
          Hold a task to move it {placeAbove ? "↓" : "↑"}
        </div>
        <div className="font-plex-mono text-[11px] text-muted-foreground mt-1 leading-snug">
          Long-press any card to send it to a different column.
        </div>
        <div className="mt-2.5 flex justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="font-sans text-[12px] font-medium text-foreground bg-black/[0.05] hover:bg-black/[0.08] rounded-full px-3 py-1.5"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
