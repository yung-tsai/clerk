// Lightweight regex fallback that mirrors Clerk's tone when AI is unavailable.
export type ClerkCol = "today" | "tomorrow" | "upcoming" | "someday";

const SIG = {
  today: [/\btoday\b/, /\btonight\b/, /\bnow\b/, /\basap\b/, /\burgent\b/, /\bdue today\b/],
  someday: [/\bsomeday\b/, /\bsome day\b/, /\beventually\b/, /\bone day\b/, /\bmaybe\b/, /\bdream\b/, /\bwish\b/],
  high: [/\bimportant\b/, /\bcritical\b/, /\bdeadline\b/, /\bdue\b/, /\boverdue\b/],
  low: [/\bwhenever\b/, /\bno rush\b/, /\bsome time\b/, /\blater\b/, /\bif i get to it\b/],
  action: /\b(call|email|send|finish|write|file|pay|book|fix|reply)\b/,
};
const TIME_EXPLICIT = [/\b\d{1,2}(:\d{2})?\s?(am|pm)\b/, /\bnoon\b/, /\bmidnight\b/];

const REASONS = {
  today_explicit: "On the clock. Today.",
  today_high: "This one has teeth. Today.",
  today_action_high: "You've been putting this off. It's due soon. Do it first.",
  today_soft: "Move on it today.",
  tomorrow_future: "Tomorrow's problem. Not today's.",
  upcoming_soft: "On the radar. Not urgent yet.",
  someday_explicit: "No deadline. Someday where dreams live.",
  someday_low: "It can wait. Someday.",
  uncertain: "I'll put this in Today. Move it if I'm wrong.",
};

const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
function daysUntil(name: string) {
  const i = DAYS.indexOf(name);
  if (i < 0) return -1;
  const today = new Date().getDay();
  let d = i - today;
  if (d <= 0) d += 7;
  return d;
}

export function classify(title: string): { col: ClerkCol; reason: string } {
  const t = title.toLowerCase();
  const has = (k: keyof typeof SIG) =>
    Array.isArray(SIG[k]) ? (SIG[k] as RegExp[]).some((r) => r.test(t)) : (SIG[k] as RegExp).test(t);
  const hasTimeExplicit = TIME_EXPLICIT.some((r) => r.test(t));
  const hasTomorrow = /\btomorrow\b/.test(t);
  const hasUpcoming = [/\bthis week\b/,/\bnext week\b/,/\bupcoming\b/,/\bnext month\b/].some((r) => r.test(t));
  const dayMatch = t.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  let dayCol: ClerkCol | null = null;
  if (dayMatch) {
    const d = daysUntil(dayMatch[1]);
    if (d === 1) dayCol = "tomorrow";
    else if (d >= 2) dayCol = "upcoming";
  }

  if (has("someday") && !hasTimeExplicit) return { col: "someday", reason: REASONS.someday_explicit };
  if (hasTimeExplicit) return { col: "today", reason: REASONS.today_explicit };
  if (hasTomorrow || dayCol === "tomorrow") return { col: "tomorrow", reason: REASONS.tomorrow_future };
  if (dayCol === "upcoming" || hasUpcoming) return { col: "upcoming", reason: REASONS.upcoming_soft };
  if (has("today") || (has("high") && SIG.action.test(t))) {
    return {
      col: "today",
      reason: has("high") && SIG.action.test(t) ? REASONS.today_action_high : REASONS.today_soft,
    };
  }
  if (has("low")) return { col: "someday", reason: REASONS.someday_low };
  if (has("high")) return { col: "today", reason: REASONS.today_high };
  return { col: "today", reason: REASONS.uncertain };
}
