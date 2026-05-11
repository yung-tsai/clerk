import { useEffect, useMemo, useRef, useState } from "react";
import type { ClerkCol, TaskCardData } from "@/components/TaskCard";
import type { ActionBubbleData } from "@/components/ActionBubble";
import { localDateStr } from "@/lib/carry-over";

type Task = TaskCardData & { position: number; created_at: string };

type NudgeType = "avoidance" | "overload" | "lightDay";

interface Params {
  tasks: Task[];
  ready: boolean;
  /** Don't fire while a modal/sheet is open. */
  suppressed: boolean;
  /** Move oldest Today task to Someday (avoidance "Move to Someday"). */
  onMoveToSomeday: (task: Task) => void;
  /** Open the existing Move sheet for this task (overload "Sure"). */
  onOpenMoveSheet: (task: Task) => void;
  /** Pull oldest Tomorrow (or fallback Upcoming) item into Today (light day "Yes please"). */
  onPullForward: (task: Task) => void;
}

const OVERLOAD_THRESHOLD = 7;
const LIGHT_DAY_MAX = 1;
const AVOIDANCE_DAYS = 3;
const DEBOUNCE_MS = 500;

/**
 * Proactive nudges that surface as a single ActionBubble.
 * Priority: avoidance → overload → light day. Once dismissed, that type
 * doesn't re-fire this session (avoidance is per-task-id).
 *
 * COPY: Claude review — strings below are spec placeholders.
 */
export function useProactiveNudges({
  tasks,
  ready,
  suppressed,
  onMoveToSomeday,
  onOpenMoveSheet,
  onPullForward,
}: Params) {
  const [bubble, setBubble] = useState<ActionBubbleData | null>(null);
  const dismissedTypes = useRef<Set<NudgeType>>(new Set());
  const dismissedAvoidanceIds = useRef<Set<string>>(new Set());
  const debounceRef = useRef<number | null>(null);

  const todayTasks = useMemo(() => tasks.filter((t) => t.col === "today"), [tasks]);
  const tomorrowTasks = useMemo(() => tasks.filter((t) => t.col === "tomorrow"), [tasks]);
  const upcomingTasks = useMemo(() => tasks.filter((t) => t.col === "upcoming"), [tasks]);

  useEffect(() => {
    if (!ready) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      // Don't replace an active bubble or fire while a modal is open
      if (bubble || suppressed) return;

      // 1. Avoidance — oldest Today task ≥ 3 local days old
      const todayLocal = localDateStr();
      const stale = [...todayTasks]
        .filter((t) => !dismissedAvoidanceIds.current.has(t.id))
        .map((t) => ({ t, age: daysBetween(localDateStr(new Date(t.created_at)), todayLocal) }))
        .filter((x) => x.age >= AVOIDANCE_DAYS)
        .sort((a, b) => b.age - a.age);

      if (stale.length > 0) {
        const t = stale[0].t;
        setBubble({
          id: `avoidance:${t.id}`,
          // COPY: Claude review
          message: `"${t.title || "This task"}" has been here for ${stale[0].age} days. Still on?`,
          primary: {
            label: "Yes, keep it",
            onClick: () => dismissedAvoidanceIds.current.add(t.id),
          },
          secondary: {
            label: "Move to Someday",
            onClick: () => {
              dismissedAvoidanceIds.current.add(t.id);
              onMoveToSomeday(t);
            },
          },
        });
        return;
      }

      // 2. Overload — Today ≥ 7
      if (!dismissedTypes.current.has("overload") && todayTasks.length >= OVERLOAD_THRESHOLD) {
        // Open Move sheet on the oldest Today task as a starting point.
        const oldest = [...todayTasks].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
        setBubble({
          id: "overload",
          // COPY: Claude review
          message: `You have ${todayTasks.length} things today. That's a lot. Want me to suggest moving some?`,
          primary: {
            label: "Sure",
            onClick: () => {
              dismissedTypes.current.add("overload");
              if (oldest) onOpenMoveSheet(oldest);
            },
          },
          secondary: {
            label: "I've got this",
            onClick: () => dismissedTypes.current.add("overload"),
          },
        });
        return;
      }

      // 3. Light day — Today ≤ 1 AND something queued
      if (
        !dismissedTypes.current.has("lightDay") &&
        todayTasks.length <= LIGHT_DAY_MAX &&
        tomorrowTasks.length + upcomingTasks.length > 0
      ) {
        const candidate =
          [...tomorrowTasks].sort((a, b) => a.created_at.localeCompare(b.created_at))[0] ??
          [...upcomingTasks].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
        if (candidate) {
          setBubble({
            id: "lightDay",
            // COPY: Claude review
            message: "Today is looking light. Want me to pull something forward?",
            primary: {
              label: "Yes please",
              onClick: () => {
                dismissedTypes.current.add("lightDay");
                onPullForward(candidate);
              },
            },
            secondary: {
              label: "I'm good",
              onClick: () => dismissedTypes.current.add("lightDay"),
            },
          });
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // bubble intentionally in deps so we re-evaluate after dismissal
  }, [ready, suppressed, todayTasks, tomorrowTasks, upcomingTasks, bubble, onMoveToSomeday, onOpenMoveSheet, onPullForward]);

  return {
    bubble,
    dismiss: () => setBubble(null),
  };
}

function daysBetween(fromYmd: string, toYmd: string): number {
  const a = new Date(fromYmd + "T00:00:00");
  const b = new Date(toYmd + "T00:00:00");
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}
