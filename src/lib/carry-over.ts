// Day-rollover logic. Pure date math + DB update — no AI involved.
// Rules:
// - tomorrow → today when the calendar day changes
// - upcoming → tomorrow when its named day is now 1 day away
// - upcoming → today when its named day is today
// - someday and today never move

import type { ClerkCol } from "@/components/TaskCard";

type CarryTask = {
  id: string;
  col: ClerkCol;
  title: string;
  due_date?: string | null;
  created_at?: string | null;
};

// True if the ISO timestamp falls on the same local calendar day as `today`.
function isSameLocalDay(iso: string | null | undefined, today: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function daysUntilNamedDay(name: string, today: Date): number | null {
  const i = DAYS.indexOf(name.toLowerCase());
  if (i < 0) return null;
  let d = i - today.getDay();
  if (d < 0) d += 7;
  // d === 0 means today; d === 1 means tomorrow; etc.
  return d;
}

/**
 * Inspect a task and decide what column it should roll to today.
 * Returns null if no change needed.
 */
function nextColForTask(t: CarryTask, today: Date): ClerkCol | null {
  // tomorrow always becomes today on a new day
  if (t.col === "tomorrow") return "today";

  if (t.col === "upcoming") {
    // Try due_date first if present (YYYY-MM-DD format expected; free text falls back to title scan)
    if (t.due_date) {
      const parsed = new Date(t.due_date);
      if (!isNaN(parsed.getTime())) {
        const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dueMid = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        const diffDays = Math.round((dueMid.getTime() - todayMid.getTime()) / 86_400_000);
        if (diffDays <= 0) return "today";
        if (diffDays === 1) return "tomorrow";
        return null; // still upcoming
      }
    }
    // Fall back to scanning title for a named day
    const match = t.title.toLowerCase().match(
      /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/
    );
    if (match) {
      const d = daysUntilNamedDay(match[1], today);
      if (d === null) return null;
      if (d === 0) return "today";
      if (d === 1) return "tomorrow";
      return null;
    }
  }

  return null;
}

export type CarryOverPlan = { id: string; from: ClerkCol; to: ClerkCol }[];

export function planCarryOver(tasks: CarryTask[], today = new Date()): CarryOverPlan {
  const plan: CarryOverPlan = [];
  for (const t of tasks) {
    const next = nextColForTask(t, today);
    if (next && next !== t.col) {
      plan.push({ id: t.id, from: t.col, to: next });
    }
  }
  return plan;
}

/**
 * Returns true if today differs from the stored last_active_date.
 * If lastActive is null, treat as a new day (first ever load won't carry over,
 * but we'll still update last_active_date downstream).
 */
export function isNewDay(lastActive: string | null, today = new Date()): boolean {
  const todayStr = today.toISOString().slice(0, 10);
  if (!lastActive) return false; // first load — nothing to carry yet
  return lastActive !== todayStr;
}
