import { ClerkCharacter } from "@/components/ClerkCharacter";
import {
  CHARACTERS,
  CHARACTER_LABELS,
  CHARACTER_TAGLINES,
  VARIANTS,
  isCharacterUnlocked,
  parseVariant,
  serializeVariant,
  unlockHint,
  type Character,
  type CharacterVariant,
} from "@/lib/characters";
import { cn } from "@/lib/utils";

interface CharacterPickerProps {
  value: CharacterVariant;
  onChange: (next: CharacterVariant) => void;
  streak: number;
  tasksCompleted: number;
  /** Compact = onboarding/settings cards. */
  size?: "sm" | "md";
}

/**
 * Two-row picker:
 *  Row 1 — three character tiles (Wes, Rex, Frank). Locked tiles disabled.
 *  Row 2 — variant toggle (v1/v2) for the currently-selected character.
 */
export function CharacterPicker({
  value,
  onChange,
  streak,
  tasksCompleted,
  size = "md",
}: CharacterPickerProps) {
  const { character: selectedChar, variant: selectedVar } = parseVariant(value);
  const unlockState = { streak, tasksCompleted };
  const tileCharSize = size === "sm" ? 40 : 48;

  const pickCharacter = (c: Character) => {
    if (!isCharacterUnlocked(c, unlockState)) return;
    // Keep the user's variant pick if possible; otherwise default to v1.
    onChange(serializeVariant(c, selectedVar));
  };

  const pickVariant = (v: typeof VARIANTS[number]) => {
    onChange(serializeVariant(selectedChar, v));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {CHARACTERS.map((c) => {
          const unlocked = isCharacterUnlocked(c, unlockState);
          const isSelected = c === selectedChar;
          const hint = unlockHint(c);
          // For tile preview, show the user's variant if it's the selected
          // character; otherwise show v1.
          const previewVariant: CharacterVariant = isSelected
            ? value
            : serializeVariant(c, "v1");
          return (
            <button
              key={c}
              type="button"
              disabled={!unlocked}
              onClick={() => pickCharacter(c)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 px-1.5 pt-3 pb-2.5 rounded-[14px] border-2 transition-all",
                !unlocked && "opacity-50 cursor-not-allowed bg-white/30 border-transparent",
                unlocked && isSelected && "bg-white/90 border-[#1A1A1A]",
                unlocked && !isSelected && "bg-white/40 border-transparent hover:bg-white/80 hover:-translate-y-0.5",
              )}
            >
              {!unlocked && (
                <span className="absolute top-1.5 right-1.5 text-[10px]" aria-hidden>🔒</span>
              )}
              <ClerkCharacter variant={previewVariant} size={tileCharSize} animated={false} />
              <span className="font-mono-plex text-[10px] font-medium text-[#1A1A1A] tracking-[0.04em]">
                {CHARACTER_LABELS[c]}
              </span>
              <span
                className={cn(
                  "font-mono-plex text-[9px] font-light tracking-[0.04em] leading-tight text-center px-1",
                  unlocked ? "text-[#9CA3AF]" : "text-[#9CA3AF]",
                )}
              >
                {unlocked ? CHARACTER_TAGLINES[c] : hint}
              </span>
            </button>
          );
        })}
      </div>

      {/* Variant toggle — only shown when a usable character is selected */}
      {isCharacterUnlocked(selectedChar, unlockState) && (
        <div className="flex items-center justify-center gap-2">
          <span className="font-mono-plex text-[10px] font-light text-[#9CA3AF] tracking-[0.04em] mr-1">
            Style
          </span>
          <div className="inline-flex bg-white/60 border border-black/[0.06] rounded-full p-0.5">
            {VARIANTS.map((v) => {
              const isOn = v === selectedVar;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => pickVariant(v)}
                  className={cn(
                    "px-3.5 py-1 rounded-full font-mono-plex text-[11px] font-medium tracking-[0.04em] transition-all min-h-[28px]",
                    isOn ? "bg-[#1A1A1A] text-white" : "text-[#6A7282] hover:text-[#1A1A1A]",
                  )}
                  aria-pressed={isOn}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
