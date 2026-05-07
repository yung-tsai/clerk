import { cn } from "@/lib/utils";

interface SheetHeaderProps {
  title: React.ReactNode;
  onClose: () => void;
  right?: React.ReactNode;
  className?: string;
}

/**
 * Mobile bottom-sheet header — Settings-style.
 * Render conditionally (e.g. `md:hidden`) so desktop dialogs keep their corner X.
 */
export function MobileSheetHeader({ title, onClose, right, className }: SheetHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-5 py-4 border-b border-black/[0.06]",
        className,
      )}
      style={{ background: "rgba(245,245,243,0.85)", backdropFilter: "blur(12px)" }}
    >
      <button
        type="button"
        onClick={onClose}
        className="font-mono-plex text-[12px] font-light text-[#6A7282] hover:text-[#1A1A1A] transition-colors flex items-center gap-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Close
      </button>
      <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#1A1A1A]">{title}</span>
      <div className="min-w-[44px] flex justify-end">{right}</div>
    </div>
  );
}
