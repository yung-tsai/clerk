// Clerk's microcopy lives here. Tone-keyed per character so each Clerk
// (Wes / Rex / Frank) speaks in its own voice without touching call sites.
//
// Call sites pass the active `Character` (resolved from the user's selected
// variant) to `quip()` / `quipForMove()`. Missing keys for a character fall
// back to Wes's "collegial" tone so we never render an empty bubble.

import type { ClerkCol } from "@/components/TaskCard";
import type { Character } from "@/lib/characters";

export type ClerkTone = Character; // "wes" | "rex" | "frank"

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
  wes: {
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

  rex: {
    "greeting.morning": [
      "GOOD MORNING. Let's absolutely crush today.",
      "Morning! Today is going to be INCREDIBLE. I can feel it.",
      "Rise and grind, {name}! Your tasks are waiting and so am I.",
      "Good morning! Yesterday was great. Today is going to be better.",
      "LET'S GO. New day, new wins. Add your tasks!",
      "MORNING! Let's make today count.",
    ],
    "greeting.afternoon": [
      "Afternoon check-in! Still time to WIN today, {name}!",
      "Hey {name}! The day isn't over. Let's finish strong!",
      "Afternoon! Still plenty of time to crush it.",
      "Second half starts NOW. Let's go!",
    ],
    "greeting.evening": [
      "Evening, {name}! End the day strong — what's left?",
      "Almost there, {name}! Finish what you started!",
      "Evening! Don't stop now — finish strong!",
      "Last push of the day. You've got this!",
    ],
    "greeting.anon": [
      "LET'S GO. New day, new wins. Add your tasks!",
      "Drop your tasks — I'll hype you the whole way!",
      "Ready when you are. Let's WIN today!",
    ],

    accept: [
      "YES! Let's absolutely GET IT. You've got this!",
      "SORTED! Now go be unstoppable!",
      "That's the plan! Time to execute and DOMINATE!",
      "LET'S GO! Every task is a win waiting to happen!",
      "Perfect! I believe in you more than you believe in yourself!",
    ],
    "accept.allToday": [
      "ALL IN TODAY! I love it! Big day energy! You've GOT this!",
      "Full Today! That's AMBITIOUS and I am HERE FOR IT!",
    ],

    "move.today": [
      "YES! Bring it to TODAY! Attack it head on!",
      "TODAY it is! I love the energy!",
      "That's the spirit! Pull it forward and CRUSH IT!",
      "Bold move! I'm here for it. Let's GO!",
    ],
    "move.tomorrow": [
      "Smart play! Rest up tonight and ATTACK it tomorrow!",
      "Tomorrow is another chance to WIN! Good thinking!",
      "Strategic! Tomorrow you're going to nail this!",
    ],
    "move.upcoming": [
      "It's on the horizon and I'm EXCITED for you!",
      "Coming up! I'll be cheering when you get there!",
      "Building the pipeline! Love the planning energy!",
    ],
    "move.someday": [
      "Dreams are valid! Someday is just Today with a longer runway!",
      "Someday is still a PLAN! We'll get there!",
      "The vision board is real! Someday, {name}, someday!",
    ],
    "move.today.fromFuture": [
      "PULLING IT FORWARD! I love the urgency! Let's ATTACK!",
      "Bringing it in EARLY! Proactive! I love this for you!",
      "Ahead of schedule? ICONIC behavior!",
    ],
    "move.someday.fromToday": [
      "Strategic retreat! Rest now, WIN later!",
      "It'll wait and you'll come back STRONGER!",
      "Someday is still the plan! Regroup and return!",
    ],
    "move.disagree": [
      "Your call! You know what you need and I RESPECT THAT!",
      "Adjustment made! You're the captain of this ship!",
      "Love the self-awareness! Trust your gut, {name}!",
    ],

    "complete.normal": [
      "YES! ONE DOWN! You're on FIRE!",
      "INCREDIBLE! That's what I'm talking about!",
      "WIN! Keep going, you're unstoppable!",
      "DONE! You absolute legend!",
      "That's it! That's the energy!",
    ],
    "complete.allToday": [
      "YOU DID IT! TODAY IS CLEAR! I am SO proud of you right now!",
      "CLEAN SLATE! You absolute CHAMPION! That's incredible work!",
      "ALL DONE! {name}, you just WON today. Seriously. AMAZING!",
      "EVERYTHING. DONE. I don't have words. Actually I always have words — YOU ARE INCREDIBLE!",
    ],

    "milestone.streak.7": [
      "SEVEN DAYS STRAIGHT! You showed up every single day! That's not luck — that's CHARACTER! Meet someone who matches your energy...",
    ],
    "milestone.streak.30": [
      "THIRTY DAYS! This is who you are now. Unstoppable!",
    ],
    "milestone.tasks.10": [
      "TEN TASKS! You're rolling and I LOVE IT!",
    ],
    "milestone.tasks.50": [
      "FIFTY! {name}, this is HISTORIC! I've never been more inspired!",
    ],

    "error.ai": [
      "Technical timeout! No worries — champions adapt! Add manually and we'll sort it soon!",
      "Brief pause! Even legends take a breather! Back soon!",
      "Quick break on my end! You keep going — I'll catch up!",
    ],
  },

  frank: {
    "greeting.morning": [
      "Morning, {name}. Tasks aren't going to do themselves. You know this.",
      "Oh good, you're here. Your list has been waiting. So have I.",
      "Morning. Let's see what you're avoiding today.",
      "Morning. Add your tasks. Let's see what's really going on.",
      "New day. Same tasks, probably. Let's get into it.",
    ],
    "greeting.afternoon": [
      "Afternoon, {name}. How's that thing you were supposed to do this morning going?",
      "Still here. Still waiting. What are we working with today?",
      "Afternoon check-in. Be honest — how much did you actually do?",
      "Half the day gone. Let's talk about what's left.",
    ],
    "greeting.evening": [
      "Evening, {name}. Anything from this morning still haunting you?",
      "End of day. Time to be honest about what actually happened.",
      "Evening. Let's do an honest recap, shall we?",
      "Day's almost done. What really got done?",
    ],
    "greeting.anon": [
      "Add your tasks. Let's see what's really going on.",
      "New day. Same tasks, probably. Let's get into it.",
    ],

    accept: [
      "Fine. Now actually do them.",
      "Sorted. The hard part was always doing them, not sorting them.",
      "Great. You have a plan. Plans only work if you execute.",
      "Done. I've done my part. Now do yours.",
      "Accepted. Don't make me sort these again tomorrow.",
    ],
    "accept.allToday": [
      "Everything in Today. Bold. Hope you mean it.",
      "All Today. That's either very productive or very optimistic.",
    ],

    "move.today": [
      "Today. Good. It was always today.",
      "Finally. It belongs here. You know it does.",
      "Today it is. Don't move it again.",
      "About time.",
    ],
    "move.tomorrow": [
      "Tomorrow. Classic. Just make sure tomorrow actually happens.",
      "Fine. But we both know what happens to tomorrow's tasks.",
      "One more day. That's fair. One.",
    ],
    "move.upcoming": [
      "Upcoming. Sure.",
      "On the list. Eventually.",
      "It'll get there. Probably.",
    ],
    "move.someday": [
      "Someday. We both know what that means.",
      "Filed under 'probably never'. I'm not judging. Actually I am, a little.",
      "Someday. Where good intentions go to rest.",
      "The honest name for this column is 'not really'.",
    ],
    "move.today.fromFuture": [
      "Pulling it forward. Okay. Don't move it back tomorrow.",
      "Early arrival. Let's hope it stays.",
      "It wasn't due yet but sure. Just actually do it.",
    ],
    "move.someday.fromToday": [
      "Avoiding it. Classic move.",
      "Into the void it goes. We'll see it again.",
      "Someday. You've moved this before, haven't you.",
      "That's the third time this week. Not that I'm counting.",
    ],
    "move.disagree": [
      "Fair enough. You know your life better than I do. Probably.",
      "Noted. I had reasons. But okay.",
      "Your call. I'm just here to sort, not to fight.",
      "Overruled. Fine.",
    ],

    "complete.normal": [
      "Done. One down.",
      "Good. Keep going.",
      "About time. Next.",
      "That one's gone. Finally.",
      "Progress. Actual progress.",
    ],
    "complete.allToday": [
      "Today is clear. Genuinely didn't see that coming. Well done.",
      "Everything done. That's rare. Appreciate the effort, {name}.",
      "Clean slate. I'll admit it — impressive.",
      "All of it. Done. I won't make a big deal out of it but I noticed.",
    ],

    "milestone.streak.7": [
      "Seven days. You actually showed up. I'll be honest — I wasn't sure you would. There's someone else I want you to meet.",
    ],
    "milestone.streak.30": [
      "Thirty days straight. Even I have to admit that's something.",
    ],
    "milestone.tasks.10": [
      "Ten tasks. You're past the warm-up now.",
    ],
    "milestone.tasks.50": [
      "Fifty. {name}, I've seen a lot of task lists. This one's real. Respect.",
    ],

    "error.ai": [
      "Something broke on my end. Not ideal. Add tasks manually for now.",
      "I'm having a moment. It happens. Try again.",
      "Technical issue. Not my finest hour. Back soon.",
    ],
  },
};

const FALLBACK_TONE: ClerkTone = "wes";

// Active tone is set per call from the user's selected character. The module
// keeps a default so legacy call sites (none currently) still work.
let activeTone: ClerkTone = "wes";

export function setActiveTone(tone: ClerkTone) {
  activeTone = tone;
}

export function getActiveTone(): ClerkTone {
  return activeTone;
}

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
  return line
    .replace(/,\s*\{name\}/g, "")
    .replace(/\s*\{name\}/g, "")
    .replace(/\s+([.,!?])/g, "$1");
}

export function quip(
  key: QuipKey,
  vars?: { name?: string | null; tone?: ClerkTone }
): string {
  const tone = vars?.tone ?? activeTone;
  const lines =
    QUIPS[tone]?.[key] ?? QUIPS[FALLBACK_TONE]?.[key] ?? [""];
  return fillName(pick(lines), vars?.name);
}

export function quipForMove(
  prevCol: ClerkCol,
  nextCol: ClerkCol,
  opts: { withinDisagreeWindow: boolean; name?: string | null; tone?: ClerkTone }
): string {
  const tone = opts.tone ?? activeTone;
  const v = { name: opts.name, tone };
  if (opts.withinDisagreeWindow) return quip("move.disagree", v);
  if (nextCol === "today" && (prevCol === "upcoming" || prevCol === "someday")) {
    return quip("move.today.fromFuture", v);
  }
  if (prevCol === "today" && nextCol === "someday") {
    return quip("move.someday.fromToday", v);
  }
  switch (nextCol) {
    case "today":
      return quip("move.today", v);
    case "tomorrow":
      return quip("move.tomorrow", v);
    case "upcoming":
      return quip("move.upcoming", v);
    case "someday":
      return quip("move.someday", v);
  }
}
