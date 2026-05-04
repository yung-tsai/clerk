export type CharacterVariant = "wes" | "wes-v2" | "wes-v3";

export const CHARACTER_LABELS: Record<CharacterVariant, string> = {
  wes: "Wes",
  "wes-v2": "Wes v2",
  "wes-v3": "Wes v3",
};

export const CHARACTERS: CharacterVariant[] = ["wes", "wes-v2", "wes-v3"];

/** Tasks-completed required to unlock a variant. Missing key = always unlocked. */
export const UNLOCK_THRESHOLDS: Partial<Record<CharacterVariant, number>> = {
  "wes-v3": 10,
};

export function isUnlocked(v: CharacterVariant, tasksCompleted: number): boolean {
  const t = UNLOCK_THRESHOLDS[v];
  return t === undefined || tasksCompleted >= t;
}

/** Legacy values that still exist on some profile rows. Migrate silently to "wes". */
export const LEGACY_CHARACTERS = new Set(["blue", "coral"]);

export function normalizeCharacter(raw: string | null | undefined): CharacterVariant {
  if (!raw || LEGACY_CHARACTERS.has(raw)) return "wes";
  if ((CHARACTERS as string[]).includes(raw)) return raw as CharacterVariant;
  return "wes";
}
