// Clerk's microcopy lives here. Tone-keyed so we can add premium tones later
// (e.g. "drill", "soft", "deadpan") without touching call sites — flip
// ACTIVE_TONE and the bank does the rest.
//
// Future tones can be partial; missing keys fall back to "collegial".

import type { ClerkCol } from "@/components/TaskCard";

export type ClerkTone = "collegial";

export type QuipKey =
  | "greeting.morning"
  | "greeting.afternoon"
  | "greeting.evening"
  | "greeting.anon"
  | "accept"
  | "accept.allToday"
  | "move.today"
  | "move.tomorrow"
  | "move.upcoming"
  | "move.someday"
  | "move.today.fromFuture"
  | "move.someday.fromToday"
  | "move.disagree"
  | "complete.normal"
  | "complete.allToday"
  | "milestone.tasks.5"
  | "milestone.tasks.10"
  | "milestone.tasks.50"
  | "milestone.streak.3"
  | "milestone.streak.7"
  | "milestone.streak.30"
  | "error.ai";

type QuipBank = Record<ClerkTone, Partial<Record<QuipKey, string[]>>>;

const QUIPS: QuipBank = {
  collegial: {
    "greeting.morning": ["Morning, {name}. What's on your plate?"],
    "greeting.afternoon": ["Afternoon, {name}. What needs doing?"],
    "greeting.evening": ["Evening, {name}. Still going?"],
    "greeting.anon": [
      "Add your tasks. I'll figure out where they go.",
      "What needs doing today?",
      "Drop your tasks here. I'll handle the rest.",
    ],

    accept: [
      "Done. Go do something about it.",
      "Sorted. Your move.",
      "That's the plan. Stick to it.",
      "All set. You know what to do.",
      "Good. Now actually do them.",
    ],
    "accept.allToday": [
      "All today. Let's go.",
      "Everything for today. Get to it.",
      "All on today's plate. Start anywhere.",
    ],

    "move.today": [
      "Okay. Today it is.",
      "Bold move. Make it count.",
      "Added to the list. Don't ignore it.",
      "It's on today. No excuses now.",
    ],
    "move.tomorrow": [
      "Tomorrow's problem.",
      "Fair enough. Tomorrow it is.",
      "Pushing it. Just once though.",
    ],
    "move.upcoming": [
      "On the horizon.",
      "It'll get there.",
      "Not urgent. Noted.",
    ],
    "move.someday": [
      "Someday. Where dreams live.",
      "No rush apparently.",
      'Filed under "eventually".',
      "One day. Maybe.",
    ],
    "move.today.fromFuture": [
      "You sure? That's still a few days out.",
      "Pulling it forward. Okay.",
      "Early bird. Respect.",
      "It wasn't due yet. But sure.",
    ],
    "move.someday.fromToday": [
      "Avoiding it. Noted.",
      "Tomorrow you'll deal with it. Or someday.",
      "Classic move.",
      "It'll wait. Apparently.",
    ],
    "move.disagree": [
      "Fair. You know your day better than I do.",
      "Noted. Moving on.",
      "I had my reasons. But okay.",
      "Disagree noted.",
    ],

    "complete.normal": [
      "Done. Next.",
      "One down.",
      "Good.",
      "That one's gone.",
      "Handled.",
    ],
    "complete.allToday": [
      "That's everything, {name}. Nice.",
      "Today is clear. Rare.",
      "All done. Seriously impressive.",
      "Nothing left for today. Go outside.",
      "Clean slate. Don't waste it.",
    ],

    "milestone.tasks.5": ["Five down. You're getting somewhere."],
    "milestone.tasks.10": ["Ten tasks done. I'm almost impressed."],
    "milestone.tasks.50": ["Fifty. We've been through a lot, {name}."],
    "milestone.streak.3": ["Three days straight. Don't break it now."],
    "milestone.streak.7": ["A week. You're actually doing this."],
    "milestone.streak.30": ["Thirty days. This is just your life now."],

    "error.ai": [
      "Something went wrong on my end. Try again.",
      "Can't sort right now. Add manually for now.",
      "I'm having a moment. Back in a sec.",
    ],
  },
};

const ACTIVE_TONE: ClerkTone = "collegial";
const FALLBACK_TONE: ClerkTone = "collegial";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Replaces "{name}" placeholder. If no name, also strips a leading
 * ", {name}" or " {name}" so the line reads cleanly without it.
 *   "Morning, {name}. What's on your plate?" + no name
 *   → "Morning. What's on your plate?"
 */
function fillName(line: string, name?: string | null): string {
  if (name && name.trim()) {
    return line.replace(/\{name\}/g, name.trim());
  }
  // Drop ", {name}" or " {name}" gracefully
  return line
    .replace(/,\s*\{name\}/g, "")
    .replace(/\s*\{name\}/g, "")
    .replace(/\s+([.,!?])/g, "$1");
}

export function quip(key: QuipKey, vars?: { name?: string | null }): string {
  const lines =
    QUIPS[ACTIVE_TONE]?.[key] ?? QUIPS[FALLBACK_TONE]?.[key] ?? [""];
  return fillName(pick(lines), vars?.name);
}

export function quipForMove(
  prevCol: ClerkCol,
  nextCol: ClerkCol,
  opts: { withinDisagreeWindow: boolean; name?: string | null }
): string {
  if (opts.withinDisagreeWindow) return quip("move.disagree", { name: opts.name });
  if (
    nextCol === "today" &&
    (prevCol === "upcoming" || prevCol === "someday")
  ) {
    return quip("move.today.fromFuture", { name: opts.name });
  }
  if (prevCol === "today" && nextCol === "someday") {
    return quip("move.someday.fromToday", { name: opts.name });
  }
  switch (nextCol) {
    case "today":
      return quip("move.today", { name: opts.name });
    case "tomorrow":
      return quip("move.tomorrow", { name: opts.name });
    case "upcoming":
      return quip("move.upcoming", { name: opts.name });
    case "someday":
      return quip("move.someday", { name: opts.name });
  }
}
