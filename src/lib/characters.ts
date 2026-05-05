/**
 * Three Clerk personalities — each with two body variants.
 *
 * - Wes (default): unlocked, the friendly steady one
 * - Rex: locked until 7-day streak, "hype coach" energy
 * - Frank: locked until 30 lifetime tasks, "brutally honest" energy
 *
 * `CharacterVariant` is the serialized form (`"wes:v1"`) stored in
 * `profiles.character` and passed through `<ClerkCharacter variant=...>`.
 */

export type Character = "wes" | "rex" | "frank";
export type Variant = "v1" | "v2";

export type CharacterVariant =
  | "wes:v1" | "wes:v2"
  | "rex:v1" | "rex:v2"
  | "frank:v1" | "frank:v2";

export const CHARACTERS: Character[] = ["wes", "rex", "frank"];
export const VARIANTS: Variant[] = ["v1", "v2"];

export const ALL_CHARACTER_VARIANTS: CharacterVariant[] = [
  "wes:v1", "wes:v2",
  "rex:v1", "rex:v2",
  "frank:v1", "frank:v2",
];

export const CHARACTER_LABELS: Record<Character, string> = {
  wes: "Wes",
  rex: "Rex",
  frank: "Frank",
};

export const CHARACTER_TAGLINES: Record<Character, string> = {
  wes: "Friendly. Steady. Always here.",
  rex: "Hype coach. Big energy.",
  frank: "Brutally honest. No fluff.",
};

/** Unlock rule per character. Wes is always unlocked. */
export type UnlockRule =
  | { type: "none" }
  | { type: "streak"; value: number }
  | { type: "tasks"; value: number };

export const UNLOCK_RULES: Record<Character, UnlockRule> = {
  wes: { type: "none" },
  rex: { type: "streak", value: 7 },
  frank: { type: "tasks", value: 30 },
};

export interface UnlockState {
  streak: number;
  tasksCompleted: number;
}

export function isCharacterUnlocked(c: Character, s: UnlockState): boolean {
  const r = UNLOCK_RULES[c];
  if (r.type === "none") return true;
  if (r.type === "streak") return s.streak >= r.value;
  return s.tasksCompleted >= r.value;
}

/** Short copy shown under a locked tile, e.g. "7-day streak". */
export function unlockHint(c: Character): string | null {
  const r = UNLOCK_RULES[c];
  if (r.type === "none") return null;
  if (r.type === "streak") return `${r.value}-day streak`;
  return `${r.value} tasks done`;
}

/** Legacy values still on some profile rows. Migrate silently. */
const LEGACY_TO_NEW: Record<string, CharacterVariant> = {
  blue: "wes:v1",
  coral: "wes:v1",
  wes: "wes:v1",
  "wes-v2": "wes:v2",
  "wes-v3": "wes:v1", // v3 retired
};

export const LEGACY_CHARACTERS = new Set(Object.keys(LEGACY_TO_NEW));

export function normalizeCharacter(raw: string | null | undefined): CharacterVariant {
  if (!raw) return "wes:v1";
  if ((ALL_CHARACTER_VARIANTS as string[]).includes(raw)) return raw as CharacterVariant;
  if (raw in LEGACY_TO_NEW) return LEGACY_TO_NEW[raw];
  return "wes:v1";
}

export function parseVariant(v: CharacterVariant): { character: Character; variant: Variant } {
  const [character, variant] = v.split(":") as [Character, Variant];
  return { character, variant };
}

export function serializeVariant(character: Character, variant: Variant): CharacterVariant {
  return `${character}:${variant}` as CharacterVariant;
}
