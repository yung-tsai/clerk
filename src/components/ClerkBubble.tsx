import { useEffect, useRef, useState } from "react";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import { subscribeClerk } from "@/lib/clerk-say";
import type { CharacterVariant } from "@/lib/characters";
import { cn } from "@/lib/utils";

interface ClerkCornerProps {
  variant?: CharacterVariant;
}

/**
 * Persistent bottom-right Clerk that speaks via a speech bubble.
 * One message at a time — new messages replace the current.
 */
export function ClerkCorner({ variant = "blue" }: ClerkCornerProps) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return subscribeClerk((msg, duration) => {
      setMessage(msg);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setMessage(null);
        timerRef.current = null;
      }, duration);
    });
  }, []);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  function dismiss() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setMessage(null);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {message && (
        <button
          type="button"
          onClick={dismiss}
          className={cn(
            "pointer-events-auto relative max-w-[260px] text-left",
            "rounded-2xl rounded-br-sm bg-white border border-[#D7D7D7]",
            "shadow-[0_8px_24px_rgba(0,0,0,0.12)] px-4 py-2.5",
            "font-plex text-[14px] leading-[1.4] text-[#2A2A2A]",
            "animate-bubble-in cursor-pointer hover:shadow-[0_10px_28px_rgba(0,0,0,0.16)] transition-shadow"
          )}
          aria-live="polite"
        >
          {message}
          {/* Tail pointing down-right toward Clerk */}
          <span
            aria-hidden
            className="absolute -bottom-1.5 right-4 h-3 w-3 rotate-45 bg-white border-r border-b border-[#D7D7D7]"
          />
        </button>
      )}
      <div className="pointer-events-auto">
        <ClerkCharacter
          size={56}
          variant={variant}
          onClick={dismiss}
        />
      </div>
    </div>
  );
}
