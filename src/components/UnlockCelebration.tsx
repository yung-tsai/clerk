import { useEffect } from "react";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import {
  CHARACTER_LABELS,
  CHARACTER_TAGLINES,
  serializeVariant,
  type Character,
} from "@/lib/characters";
import { cn } from "@/lib/utils";

interface UnlockCelebrationProps {
  character: Character;
  /** Speech-bubble line. Voice is Claude's territory — keep wording short. */
  message: string;
  open: boolean;
  onDismiss: () => void;
}

/**
 * Full-screen overlay shown when the user unlocks Rex (7-day streak) or
 * Frank (30 lifetime tasks). One mascot, one bubble, one button.
 */
export function UnlockCelebration({ character, message, open, onDismiss }: UnlockCelebrationProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center px-6",
        "bg-black/40 backdrop-blur-sm animate-fade-in",
      )}
      onClick={onDismiss}
    >
      <div
        className="relative w-full max-w-[400px] rounded-[24px] p-8 text-center animate-scale-in"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 10% 10%, rgba(255,190,130,0.4) 0%, transparent 100%), radial-gradient(ellipse 50% 45% at 90% 5%, rgba(185,205,255,0.45) 0%, transparent 100%), #FFFFFF",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-mono-plex text-[10px] font-medium tracking-[0.12em] uppercase text-[#9CA3AF] mb-1">
          New Clerk unlocked
        </div>
        <div className="font-plex text-[24px] font-bold tracking-[-0.02em] text-[#1A1A1A] mb-1">
          Meet {CHARACTER_LABELS[character]}
        </div>
        <div className="font-mono-plex text-[11px] font-light text-[#6A7282] mb-6">
          {CHARACTER_TAGLINES[character]}
        </div>

        <div className="flex justify-center mb-5">
          <ClerkCharacter variant={serializeVariant(character, "v1")} size={120} />
        </div>

        <div className="rounded-[4px_18px_18px_18px] bg-white border border-black/[0.08] px-4 py-3 text-[13px] leading-[1.55] shadow-[0_4px_20px_rgba(0,0,0,0.06)] mx-auto inline-block max-w-[300px] text-left mb-7">
          {message}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full rounded-[14px] bg-[#1A1A1A] py-3.5 font-plex text-[14px] font-medium text-white hover:bg-[#2A2A2A] transition-colors"
        >
          Try {CHARACTER_LABELS[character]}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 font-mono-plex text-[11px] font-light text-[#9CA3AF] hover:text-[#6A7282] transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
