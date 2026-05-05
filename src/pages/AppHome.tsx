import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import clerkLogo from "@/assets/clerk-logo.svg";
import { useAuth } from "@/contexts/AuthContext";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import { TaskCard, type ClerkCol, type TaskCardData } from "@/components/TaskCard";
import { AddTaskCard } from "@/components/AddTaskCard";
import { AppBar } from "@/components/AppBar";
import { MoveTaskSheet } from "@/components/MoveTaskSheet";
import { LongPressHint } from "@/components/LongPressHint";
import { type CharacterVariant, normalizeCharacter, LEGACY_CHARACTERS } from "@/lib/characters";
import { classify } from "@/lib/clerk-classify";
import { isNewDay, planCarryOver } from "@/lib/carry-over";
import { getLovableCloudClient } from "@/lib/lovable-cloud";
import { toast } from "sonner";
import { clerkSay, subscribeClerk } from "@/lib/clerk-say";
import { quip, quipForMove } from "@/lib/clerk-quips";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SettingsModal } from "@/components/SettingsModal";
import { CompletedModal } from "@/components/CompletedModal";
import { TaskDetailModal, type TaskPatch } from "@/components/TaskDetailModal";
import { cn } from "@/lib/utils";
import { track, identify, resetAnalytics } from "@/lib/analytics";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIdle } from "@/hooks/use-idle";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  closestCorners,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  type CollisionDetection,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

type Task = TaskCardData & { position: number; created_at: string };

type Proposal = {
  title: string;
  col: ClerkCol;
  reason: string;
  dueDate?: string;
  taskTime?: string;
  location?: string;
  category?: string;
};

type ViewMode = "focus" | "planner";

const COL_TITLES: Record<ClerkCol, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  upcoming: "Upcoming",
  someday: "Someday",
};
const COLS: ClerkCol[] = ["today", "tomorrow", "upcoming", "someday"];
const COL_PILL_BG: Record<ClerkCol, string> = {
  today: "#CEDAFF",
  tomorrow: "#FFF7CE",
  upcoming: "#CEFFE7",
  someday: "#FFCEFB",
};

export default function AppHome() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<{
    display_name: string | null;
    character: CharacterVariant;
    view_mode: ViewMode;
    streak: number;
    tasks_completed: number;
    last_active_date: string | null;
  } | null>(null);
  const [view, setView] = useState<ViewMode>("focus");
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [bubble, setBubble] = useState("");
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [moveSheetTask, setMoveSheetTask] = useState<Task | null>(null);
  const [showLongPressHint, setShowLongPressHint] = useState(false);
  const [firstCardEl, setFirstCardEl] = useState<HTMLDivElement | null>(null);
  const bubbleTimer = useRef<number | null>(null);
  const loadedOnce = useRef(false);
  // When the user moves a task within ~10s of accepting a sort, treat it
  // as disagreement with Clerk's choice (fires `move.disagree`).
  // Cleared after first use so it only fires once per sort.
  const lastSortAcceptedAt = useRef<number | null>(null);
  const DISAGREE_WINDOW_MS = 10_000;
  // Tracks draft ids whose insert is in flight, to prevent double-insert when
  // the debounced onPatch fires again before the promotion completes.
  const promotingDrafts = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  // Identify the current user in analytics whenever auth state lands.
  useEffect(() => {
    if (user) identify(user.id, { email: user.email ?? undefined });
  }, [user]);

  // Load tasks + profile (only once per mount; tab refocus shouldn't re-trigger)
  useEffect(() => {
    if (!user) return;
    if (loadedOnce.current) return;
    loadedOnce.current = true;

    // Capture and immediately clear router state so a re-mount/refresh won't reopen the modal
    const pending = (location.state as { pendingProposals?: Proposal[] } | null)?.pendingProposals;
    if (pending && pending.length) {
      navigate(location.pathname, { replace: true, state: null });
    }

    (async () => {
      const supabase = await getLovableCloudClient();
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .order("position", { ascending: true })
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("display_name, character, view_mode, onboarded, streak, tasks_completed, last_active_date")
          .eq("id", user.id)
          .single(),
      ]);

      // Day-rollover: shift tomorrow→today and upcoming→tomorrow/today on a new day.
      // Pure date logic — does not touch the AI's reason text.
      let loadedTasks = (t as Task[]) ?? [];
      if (p && isNewDay(p.last_active_date ?? null)) {
        const plan = planCarryOver(loadedTasks);
        if (plan.length) {
          // Apply locally first for instant render
          const byId = new Map(plan.map((m) => [m.id, m.to]));
          loadedTasks = loadedTasks.map((task) =>
            byId.has(task.id) ? { ...task, col: byId.get(task.id)! } : task
          );
          // Persist in background, grouped by destination column
          const byTo = new Map<ClerkCol, string[]>();
          for (const m of plan) {
            const arr = byTo.get(m.to) ?? [];
            arr.push(m.id);
            byTo.set(m.to, arr);
          }
          for (const [to, ids] of byTo) {
            supabase.from("tasks").update({ col: to }).in("id", ids);
          }
        }
      }
      // Always stamp last_active_date on load so tomorrow's load knows a day passed.
      const todayStr = new Date().toISOString().slice(0, 10);
      if (p && p.last_active_date !== todayStr) {
        supabase.from("profiles").update({ last_active_date: todayStr }).eq("id", user.id);
      }

      setTasks(loadedTasks);
      if (p) {
        if (!p.onboarded) {
          navigate("/onboarding");
          return;
        }
        const char = normalizeCharacter(p.character);
        // Silent migration: legacy 'blue' / 'coral' values get persisted as 'wes'.
        if (p.character && LEGACY_CHARACTERS.has(p.character)) {
          supabase.from("profiles").update({ character: "wes" }).eq("id", user.id);
        }
        const vm = (p.view_mode as ViewMode) ?? "focus";
        setProfile({
          display_name: p.display_name,
          character: char,
          view_mode: vm,
          streak: p.streak ?? 0,
          tasks_completed: p.tasks_completed ?? 0,
          last_active_date: p.last_active_date ?? null,
        });

        if (pending && pending.length) {
          setView("planner");
          setProposals(pending);
          supabase.from("profiles").update({ view_mode: "planner" }).eq("id", user.id);
        } else {
          setView(vm);
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const localHour = Number(
            new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              hour12: false,
              timeZone: tz,
            }).format(new Date())
          );
          const timeOfDay =
            localHour < 12 ? "Morning" : localHour < 18 ? "Afternoon" : "Evening";
          const greetKey = p.display_name
            ? (`greeting.${timeOfDay.toLowerCase()}` as
                | "greeting.morning"
                | "greeting.afternoon"
                | "greeting.evening")
            : "greeting.anon";
          showBubble(quip(greetKey, { name: p.display_name }), 4500);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function showBubble(text: string, ms = 3500) {
    setBubble(text);
    setBubbleVisible(true);
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubbleVisible(false), ms);
  }

  // Route global clerkSay() messages through the in-input Clerk bubble.
  useEffect(() => {
    return subscribeClerk((msg, duration) => showBubble(msg, duration));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const g: Record<ClerkCol, Task[]> = { today: [], tomorrow: [], upcoming: [], someday: [] };
    for (const t of tasks) g[t.col].push(t);
    return g;
  }, [tasks]);

  async function persistView(v: ViewMode) {
    if (v !== view) track("view_changed", { to: v, from: view });
    setView(v);
    if (!user) return;
    const supabase = await getLovableCloudClient();
    await supabase.from("profiles").update({ view_mode: v }).eq("id", user.id);
  }

  async function processInput(raw: string) {
    if (!user) return;
    if (!raw.trim()) return;
    // Local fallback only — AI now handles extraction from the raw string.
    const parts = raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    setThinking(true);
    showBubble("Thinking...", 60_000);

    let sorted: Proposal[] = [];
    try {
      const supabase = await getLovableCloudClient();
      const { data, error } = await supabase.functions.invoke("sort-tasks", {
        body: {
          input: raw,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      if (error) throw error;
      if (data?.tasks?.length) {
        sorted = data.tasks;
        // Diagnostic: confirms the AI returned the new fields per proposal.
        console.log("[sort-tasks] proposals from AI:", sorted);
        track("tasks_sorted", { count: sorted.length, source: "ai" });
      } else throw new Error("Empty AI response");
    } catch (err: any) {
      // AI sort failed (network, 429, 402, empty response). Fall back to local
      // classify and surface a clear toast so the user knows the AI is offline.
      const msg = typeof err?.message === "string" ? err.message : "";
      const friendly = msg.toLowerCase().includes("rate")
        ? "AI rate-limited. Used a quick local sort instead."
        : msg.toLowerCase().includes("credit")
        ? "AI credits exhausted. Used a quick local sort instead."
        : "AI offline. Used a quick local sort — you can drag tasks to fix anything.";
      toast.error(friendly);
      showBubble(quip("error.ai"), 4500);
      sorted = parts.map((title) => {
        const { col, reason } = classify(title);
        return { title, col, reason };
      });
      track("tasks_sorted", { count: sorted.length, source: "fallback" });
    }
    setThinking(false);
    setBubbleVisible(false);
    setProposals(sorted);
  }

  async function acceptProposals() {
    if (!proposals || !user) return;
    const supabase = await getLovableCloudClient();
    const baseSec = Math.floor(Date.now() / 1000);
    const norm = (s?: string) => (s && s.trim() ? s.trim() : null);
    const colorFor = (cat: string | null) => {
      if (!cat) return 0;
      let h = 0;
      for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) | 0;
      return Math.abs(h) % 4;
    };
    const rows = proposals.map((p, i) => {
      const category = norm(p.category);
      return {
        user_id: user.id,
        title: p.title,
        col: p.col,
        reason: p.reason,
        position: baseSec + i,
        due_date: norm(p.dueDate),
        task_time: norm(p.taskTime),
        location: norm(p.location),
        category,
        cat_color: colorFor(category),
      };
    });
    const { data, error } = await supabase.from("tasks").insert(rows).select();
    if (error) {
      toast.error(error.message);
      return;
    }
    setTasks((prev) => [...((data as Task[]) ?? []), ...prev]);
    for (const p of proposals) track("task_added", { source: "ai_sort", col: p.col });
    const allToday = proposals.every((p) => p.col === "today");
    setProposals(null);
    setInput("");
    lastSortAcceptedAt.current = Date.now();
    showBubble(quip(allToday ? "accept.allToday" : "accept"));
  }

  function updateProposalCol(idx: number, col: ClerkCol) {
    setProposals((p) => (p ? p.map((x, i) => (i === idx ? { ...x, col } : x)) : p));
  }

  async function completeTask(t: Task) {
    if (!user) return;
    const supabase = await getLovableCloudClient();
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    track("task_completed", { col: t.col, has_category: !!t.category });

    // Compute new streak / counters
    const today = new Date().toISOString().slice(0, 10);
    const last = profile?.last_active_date ?? null;
    const prevStreak = profile?.streak ?? 0;
    let nextStreak = prevStreak;
    if (last !== today) {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      nextStreak = last === yesterday ? prevStreak + 1 : 1;
    }
    const prevCompleted = profile?.tasks_completed ?? 0;
    const nextCompleted = prevCompleted + 1;

    if (profile) {
      setProfile({
        ...profile,
        streak: nextStreak,
        tasks_completed: nextCompleted,
        last_active_date: today,
      });
    }

    // Pick a quip. Priority:
    //   1. Milestone (streak or task count) — most notable
    //   2. Cleared the today column — bigger moment
    //   3. Normal "done" line
    type MilestoneKey =
      | "milestone.streak.3" | "milestone.streak.7" | "milestone.streak.30"
      | "milestone.tasks.5" | "milestone.tasks.10" | "milestone.tasks.50";
    const STREAK_KEYS: Record<number, MilestoneKey> = {
      3: "milestone.streak.3",
      7: "milestone.streak.7",
      30: "milestone.streak.30",
    };
    const TASK_KEYS: Record<number, MilestoneKey> = {
      5: "milestone.tasks.5",
      10: "milestone.tasks.10",
      50: "milestone.tasks.50",
    };
    const name = profile?.display_name ?? null;
    let milestoneKey: MilestoneKey | null = null;
    if (nextStreak !== prevStreak && STREAK_KEYS[nextStreak]) {
      milestoneKey = STREAK_KEYS[nextStreak];
    } else if (TASK_KEYS[nextCompleted]) {
      milestoneKey = TASK_KEYS[nextCompleted];
    }

    const clearedToday =
      t.col === "today" &&
      tasks.filter((x) => x.col === "today" && x.id !== t.id).length === 0;

    if (milestoneKey) {
      showBubble(quip(milestoneKey, { name }), 5000);
    } else if (clearedToday) {
      showBubble(quip("complete.allToday", { name }), 5000);
    } else {
      showBubble(quip("complete.normal"));
    }

    // One-shot Wes v3 unlock celebration when crossing 10 completed tasks.
    if (
      prevCompleted < 10 &&
      nextCompleted >= 10 &&
      typeof window !== "undefined" &&
      localStorage.getItem("wes_v3_unlocked_seen") !== "1"
    ) {
      localStorage.setItem("wes_v3_unlocked_seen", "1");
      toast.success("You unlocked Wes v3. Try it in Settings.");
    }

    await Promise.all([
      supabase.from("tasks").delete().eq("id", t.id),
      supabase.from("completed_tasks").insert({
        user_id: user.id,
        title: t.title,
        category: t.category,
        cat_color: t.cat_color,
      }),
      supabase
        .from("profiles")
        .update({
          streak: nextStreak,
          tasks_completed: nextCompleted,
          last_active_date: today,
        })
        .eq("id", user.id),
    ]);
  }

  async function deleteTask(t: Task) {
    const supabase = await getLovableCloudClient();
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    track("task_deleted", { col: t.col, has_category: !!t.category });
    await supabase.from("tasks").delete().eq("id", t.id);
  }

  async function moveTask(t: Task, col: ClerkCol) {
    if (col === t.col) return;
    const prevCol = t.col;
    const supabase = await getLovableCloudClient();
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, col } : x)));
    track("task_moved", { from: prevCol, to: col, source: "modal" });
    fireMoveQuip(prevCol, col);
    await supabase.from("tasks").update({ col }).eq("id", t.id);
  }

  function handleAddToColumn(col: ClerkCol) {
    if (!user) return;
    // Draft-first: don't insert yet. The row is only persisted when the user
    // types a non-empty title in the modal (see TaskDetailModal onPatch handler).
    const draft: Task = {
      id: `draft-${Date.now()}`,
      user_id: user.id,
      title: "",
      col,
      position: Math.floor(Date.now() / 1000),
      task_time: null,
      location: null,
      category: null,
      cat_color: 0,
      due_date: null,
      reason: null,
      note: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Task;
    setSelectedTask(draft);
  }
  function fireMoveQuip(prevCol: ClerkCol, nextCol: ClerkCol) {
    const within =
      lastSortAcceptedAt.current !== null &&
      Date.now() - lastSortAcceptedAt.current < DISAGREE_WINDOW_MS;
    if (within) lastSortAcceptedAt.current = null; // one-shot per sort
    showBubble(
      quipForMove(prevCol, nextCol, {
        withinDisagreeWindow: within,
        name: profile?.display_name ?? null,
      })
    );
  }

  // ─── Drag & drop ───
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } })
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ col: ClerkCol; index: number } | null>(null);

  const activeTaskOverlay = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;

  // pointerWithin → rectIntersection → closestCorners
  const collisionDetection: CollisionDetection = (args) => {
    const pw = pointerWithin(args);
    if (pw.length) return pw;
    const ri = rectIntersection(args);
    if (ri.length) return ri;
    return closestCorners(args);
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function computeDropTarget(activeId: string, overId: string | null): { col: ClerkCol; index: number } | null {
    if (!overId) return null;
    const activeTask = tasks.find((x) => x.id === activeId);
    if (!activeTask) return null;
    let targetCol: ClerkCol;
    let overTask: Task | undefined;
    if (overId.startsWith("col:")) {
      targetCol = overId.slice(4) as ClerkCol;
    } else {
      overTask = tasks.find((x) => x.id === overId);
      if (!overTask) return null;
      targetCol = overTask.col;
    }
    const colTasks = tasks.filter((x) => x.col === targetCol && x.id !== activeId);
    let insertIdx = colTasks.length;
    if (overTask) {
      insertIdx = colTasks.findIndex((x) => x.id === overTask!.id);
      if (insertIdx < 0) insertIdx = colTasks.length;
    }
    return { col: targetCol, index: insertIdx };
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    const target = computeDropTarget(String(active.id), over ? String(over.id) : null);
    setDropTarget(target);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setDropTarget(null);
    if (!over || !user) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeTask = tasks.find((x) => x.id === activeId);
    if (!activeTask) return;

    const target = computeDropTarget(activeId, overId);
    if (!target) return;
    const { col: targetCol, index: insertIdx } = target;

    const colTasks = tasks.filter((x) => x.col === targetCol && x.id !== activeId);
    const before = colTasks[insertIdx - 1];
    const after = colTasks[insertIdx];
    const newPos = before && after
      ? Math.floor((before.position + after.position) / 2)
      : before
        ? before.position + 1000
        : after
          ? after.position - 1000
          : Math.floor(Date.now() / 1000);

    setTasks((prev) =>
      prev
        .map((x) => (x.id === activeId ? { ...x, col: targetCol, position: newPos } : x))
        .sort((a, b) => a.position - b.position)
    );

    // Only fire a quip when the column actually changed — pure reordering
    // within a column shouldn't trigger Clerk.
    if (activeTask.col !== targetCol) {
      track("task_moved", { from: activeTask.col, to: targetCol, source: "drag" });
      fireMoveQuip(activeTask.col, targetCol);
    }

    const supabase = await getLovableCloudClient();
    await supabase
      .from("tasks")
      .update({ col: targetCol, position: newPos })
      .eq("id", activeId);
  }


  function previewCharacter(c: CharacterVariant) {
    if (profile) setProfile({ ...profile, character: c });
  }

  async function saveSettings(next: { display_name: string; character: CharacterVariant }) {
    if (!user || !profile) return;
    setProfile({ ...profile, display_name: next.display_name || null, character: next.character });
    const supabase = await getLovableCloudClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: next.display_name || null, character: next.character })
      .eq("id", user.id);
    if (error) toast.error(error.message);
  }

  const variant: CharacterVariant = normalizeCharacter(profile?.character);
  const isMobile = useIsMobile();

  // Idle fade — Focus view only; bubble visibility forces chrome back.
  const anyModalOpen = !!proposals || settingsOpen || completedOpen || !!selectedTask;
  const idleEnabled = view === "focus" && !anyModalOpen;
  const idle = useIdle(4000, idleEnabled);
  const focusIdleHidden = view === "focus" && idle && !bubbleVisible && !anyModalOpen;
  const headerHiddenOnMobilePlanner = isMobile && view === "planner";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Fixed header ── (hidden on mobile when in Planner; faded when Focus is idle) */}
      {!anyModalOpen && !headerHiddenOnMobilePlanner && (
        <header
          className={cn(
            "fixed top-0 left-0 right-0 z-[100] flex items-center bg-background border-b border-divider transition-opacity duration-500",
            focusIdleHidden && "opacity-0 pointer-events-none",
          )}
          style={{ height: 64 }}
        >
          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10 flex justify-between items-center">
            <img src={clerkLogo} alt="Clerk" className="h-[36px] w-auto select-none" draggable={false} />

            {/* Streak badge — only when ≥ 2 days */}
            {(profile?.streak ?? 0) >= 2 ? (
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                title={`${profile?.streak}-day streak`}
                className="font-plex-mono text-[12px] font-medium text-[#2A2A2A] bg-[#FFF7CE] hover:bg-[#FFEFA8] transition-colors rounded-full px-2.5 py-1 leading-none"
              >
                🔥 {profile?.streak}
              </button>
            ) : (
              <div className="w-[26px]" aria-hidden />
            )}
          </div>

          {/* Toggle Focus | Planner — true viewport-centered */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              onClick={() => persistView("focus")}
              className={cn(
                "font-sans text-[12px] font-medium px-2 py-1 transition-colors",
                view === "focus" ? "text-foreground" : "text-faint hover:text-muted-foreground"
              )}
            >
              Focus
            </button>
            <span className="text-faint text-[12px]">|</span>
            <button
              onClick={() => persistView("planner")}
              className={cn(
                "font-sans text-[12px] font-medium px-2 py-1 transition-colors",
                view === "planner" ? "text-foreground" : "text-faint hover:text-muted-foreground"
              )}
            >
              Planner
            </button>
          </div>
        </header>
      )}

      {/* ── Views ── */}
      <main
        className={cn(
          "fixed inset-0 overflow-hidden",
          headerHiddenOnMobilePlanner ? "pt-0 pb-[96px]" : "pt-16 pb-[120px] overflow-y-auto",
        )}
      >

        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => { setActiveId(null); setDropTarget(null); }}
        >
          {view === "focus" ? (
            <FocusView tasks={grouped.today} onComplete={completeTask} onOpen={setSelectedTask} dropTarget={dropTarget} activeId={activeId} onAddTask={handleAddToColumn} onMoveCol={moveTask} />
          ) : (
            <PlannerView grouped={grouped} onComplete={completeTask} onOpen={setSelectedTask} dropTarget={dropTarget} activeId={activeId} onAddTask={handleAddToColumn} onMoveCol={moveTask} />
          )}
          <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
            {activeTaskOverlay ? (
              <TaskCard
                task={activeTaskOverlay}
                onComplete={() => {}}
                onOpen={() => {}}
                draggable={false}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* ── Bottom bar (hidden while any modal/sheet is open; faded when Focus is idle) ── */}
      {!anyModalOpen && (
        <div
          className={cn(
            "transition-opacity duration-500",
            focusIdleHidden && "opacity-0 pointer-events-none",
          )}
        >
          <AppBar
            variant={variant}
            thinking={thinking}
            bubble={bubble}
            bubbleVisible={bubbleVisible}
            view={view}
            inputValue={input}
            onInputChange={setInput}
            onSubmit={() => processInput(input)}
            onSetView={persistView}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenCompleted={() => setCompletedOpen(true)}
            onSignOut={async () => {
              await signOut();
              navigate("/");
            }}
          />
        </div>
      )}


      {/* ── Proposal modal ── */}
      <Dialog
        open={!!proposals}
        onOpenChange={(o) => {
          if (!o && proposals) acceptProposals();
        }}
      >
        <DialogContent className="max-w-[440px] p-0 overflow-hidden bg-background">
          <div className="px-6 pt-6 pb-3 flex items-center gap-3">
            <ClerkCharacter variant={variant} size={36} />
            <div>
              <div className="font-plex text-[15px] font-medium">Here's where I'd put these.</div>
              <div className="font-plex-mono text-[11px] text-muted-foreground">
                Tap a column to change it.
              </div>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto px-6 pb-2 space-y-3">
            {proposals?.map((p, i) => (
              <div key={i} className="rounded-[12px] border border-[#D7D7D7] bg-white/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-plex text-[16px] font-medium leading-snug text-[#2A2A2A]">
                      {p.title}
                    </div>
                    {p.reason && (
                      <div className="font-plex-mono text-[11px] text-muted-foreground italic mt-1.5">
                        {p.reason}
                      </div>
                    )}
                    {(p.taskTime || p.dueDate || p.location || p.category) && (
                      <div className="font-plex-mono text-[11px] text-muted-foreground mt-1">
                        {[p.taskTime, p.dueDate, p.location && `@${p.location}`, p.category]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    )}
                  </div>
                  <select
                    value={p.col}
                    onChange={(e) => updateProposalCol(i, e.target.value as ClerkCol)}
                    className="font-plex-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md border border-border outline-none cursor-pointer"
                    style={{ background: COL_PILL_BG[p.col] }}
                  >
                    {COLS.map((c) => (
                      <option key={c} value={c}>
                        {COL_TITLES[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 px-6 py-4 border-t border-divider">
            <button
              onClick={acceptProposals}
              className="flex-1 rounded-full bg-foreground py-2.5 text-[13px] font-medium text-background"
            >
              Looks good
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Task detail modal ── */}
      <TaskDetailModal
        task={selectedTask}
        onOpenChange={(o) => {
          if (!o) {
            // Discard empty drafts on close — never persisted
            setSelectedTask(null);
          }
        }}
        onPatch={(id, patch) => {
          const isDraft = id.startsWith("draft-");
          if (isDraft) {
            // Only persist once the user types a non-empty title
            const nextTitle = patch.title !== undefined ? patch.title : selectedTask?.title;
            if (!nextTitle || !nextTitle.trim()) {
              // Update local draft state (for tag/time/etc typed before title)
              setSelectedTask((prev) => (prev ? { ...prev, ...patch } : prev));
              return;
            }
            // If insert is already in flight for this draft, just merge the
            // patch into local state — the in-flight promotion will pick it up
            // via selectedTask when it resolves.
            if (promotingDrafts.current.has(id)) {
              setSelectedTask((prev) => (prev ? { ...prev, ...patch } : prev));
              return;
            }
            // Promote draft → real task
            const draft = selectedTask;
            if (!draft || !user) return;
            promotingDrafts.current.add(id);
            (async () => {
              const supabase = await getLovableCloudClient();
              const { data, error } = await supabase
                .from("tasks")
                .insert({
                  user_id: user.id,
                  title: nextTitle.trim(),
                  col: draft.col,
                  position: draft.position,
                  task_time: patch.task_time ?? draft.task_time,
                  location: patch.location ?? draft.location,
                  category: patch.category ?? draft.category,
                  cat_color: patch.cat_color ?? draft.cat_color,
                  due_date: patch.due_date ?? draft.due_date,
                })
                .select()
                .single();
              promotingDrafts.current.delete(id);
              if (error) {
                toast.error(error.message);
                return;
              }
              const newTask = data as Task;
              setTasks((prev) => [newTask, ...prev]);
              track("task_added", { source: "manual", col: newTask.col });
              // Swap selected task to the real one so subsequent patches use
              // the normal update path (no second insert).
              setSelectedTask((prev) =>
                prev && prev.id === id ? { ...newTask, title: prev.title } : prev
              );
            })();
            return;
          }
          setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
          (async () => {
            const supabase = await getLovableCloudClient();
            await supabase.from("tasks").update(patch).eq("id", id);
          })();
        }}
        onMove={(t, col) => {
          if (t.id.startsWith("draft-")) return; // can't move an unsaved draft
          moveTask(t as Task, col);
          setSelectedTask(null);
        }}
        onDelete={(t) => {
          if (t.id.startsWith("draft-")) {
            setSelectedTask(null);
            return;
          }
          deleteTask(t as Task);
          setSelectedTask(null);
        }}
      />

      {/* ── Settings modal ── */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        data={{
          display_name: profile?.display_name ?? null,
          character: variant,
          streak: profile?.streak ?? 0,
          tasks_completed: profile?.tasks_completed ?? 0,
          email: user?.email ?? null,
          active_task_count: tasks.length,
        }}
        onSave={saveSettings}
        onCharacterPreview={previewCharacter}
        onClearAllTasks={async () => {
          if (!user) return;
          const supabase = await getLovableCloudClient();
          const { error } = await supabase.from("tasks").delete().eq("user_id", user.id);
          if (error) {
            toast.error(error.message);
          } else {
            setTasks([]);
            clerkSay("All tasks cleared.");
          }
        }}
        onSignOut={async () => {
          setSettingsOpen(false);
          track("signed_out");
          resetAnalytics();
          await signOut();
          navigate("/");
        }}
        onDeleteAccount={async () => {
          if (!user) return;
          try {
            const supabase = await getLovableCloudClient();
            const { error } = await supabase.functions.invoke("delete-account", { body: {} });
            if (error) throw error;
            track("account_deleted");
            resetAnalytics();
            await signOut();
            toast.success("Account deleted.");
            navigate("/");
          } catch (err: any) {
            toast.error(err?.message || "Could not delete account");
          }
        }}
      />

      {/* ── Completed modal ── */}
      {user && (
        <CompletedModal
          open={completedOpen}
          onOpenChange={setCompletedOpen}
          userId={user.id}
          variant={variant}
        />
      )}
    </div>
  );
}

/* ───────── FOCUS VIEW ───────── */
function FocusView({
  tasks,
  onComplete,
  onOpen,
  dropTarget,
  activeId,
  onAddTask,
  onMoveCol,
}: {
  tasks: Task[];
  onComplete: (t: Task) => void;
  onOpen: (t: Task) => void;
  dropTarget: { col: ClerkCol; index: number } | null;
  activeId: string | null;
  onAddTask: (col: ClerkCol) => void;
  onMoveCol?: (t: Task, col: ClerkCol) => void;
}) {
  const today = new Date();
  return (
    <div className="max-w-[1280px] mx-auto px-4 pt-5 pb-8 md:px-10 md:pt-7 md:pb-10">
      <div className="w-full max-w-[420px] mx-auto flex flex-col">
        <div className="text-center pb-5 md:pb-6">
          <div
            className="font-plex font-bold text-foreground text-[24px] md:text-[28px]"
            style={{ letterSpacing: "-0.02em", lineHeight: 1 }}
          >
            {today.toLocaleDateString("en-US", { weekday: "long" })}
          </div>
          <div className="font-sans text-[13px] text-muted-foreground mt-1.5">
            {today.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </div>
        </div>

        <DroppableColumn
          col="today"
          tasks={tasks}
          onComplete={onComplete}
          onOpen={onOpen}
          dropTarget={dropTarget}
          activeId={activeId}
          onAddTask={onAddTask}
          onMoveCol={onMoveCol}
        />
      </div>
    </div>
  );
}

/* ───────── PLANNER VIEW ───────── */
function PlannerView(props: {
  grouped: Record<ClerkCol, Task[]>;
  onComplete: (t: Task) => void;
  onOpen: (t: Task) => void;
  dropTarget: { col: ClerkCol; index: number } | null;
  activeId: string | null;
  onAddTask: (col: ClerkCol) => void;
  onMoveCol?: (t: Task, col: ClerkCol) => void;
}) {
  const isMobile = useIsMobile();
  return isMobile ? <PlannerMobile {...props} /> : <PlannerDesktop {...props} />;
}

/* ───────── PLANNER (MOBILE) ───────── */
function PlannerMobile({
  grouped,
  onComplete,
  onOpen,
  dropTarget,
  activeId,
  onAddTask,
  onMoveCol,
}: {
  grouped: Record<ClerkCol, Task[]>;
  onComplete: (t: Task) => void;
  onOpen: (t: Task) => void;
  dropTarget: { col: ClerkCol; index: number } | null;
  activeId: string | null;
  onAddTask: (col: ClerkCol) => void;
  onMoveCol?: (t: Task, col: ClerkCol) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const programmaticScroll = useRef(false);

  // Update active tab as user swipes
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (programmaticScroll.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const left = el.scrollLeft;
        const w = el.clientWidth;
        // Snap width = first column's offsetWidth + gap; use clientWidth*0.85 approx
        let nearest = 0;
        let best = Infinity;
        colRefs.current.forEach((c, i) => {
          if (!c) return;
          const d = Math.abs(c.offsetLeft - left);
          if (d < best) {
            best = d;
            nearest = i;
          }
        });
        setActiveIdx(nearest);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = (idx: number) => {
    const el = scrollerRef.current;
    const target = colRefs.current[idx];
    if (!el || !target) return;
    setActiveIdx(idx);
    programmaticScroll.current = true;
    el.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
    window.setTimeout(() => {
      programmaticScroll.current = false;
    }, 500);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Tab bar — fixed to top of viewport on mobile */}
      <div className="fixed top-0 inset-x-0 z-[150] bg-background/95 backdrop-blur-md border-b border-divider">
        <div className="flex items-end h-[48px] px-1">
          {COLS.map((col, i) => {
            const active = i === activeIdx;
            return (
              <button
                key={col}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  "flex-1 px-2 pb-2.5 pt-3 font-sans text-[12px] font-medium transition-colors border-b-2 -mb-px text-center",
                  active
                    ? "text-foreground border-primary"
                    : "text-muted-foreground border-transparent"
                )}
              >
                {COL_TITLES[col]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Spacer for the fixed tab bar */}
      <div className="h-[48px] shrink-0" aria-hidden />

      {/* Horizontal snap scroller — fills remaining space; columns scroll vertically inside */}
      <div
        ref={scrollerRef}
        className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden no-scrollbar"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex gap-2 pr-5 h-full">
          {COLS.map((col, i) => (
            <div
              key={col}
              ref={(el) => (colRefs.current[i] = el)}
              className="shrink-0 pl-5 h-full flex flex-col"
              style={{ width: "92vw", maxWidth: 380, scrollSnapAlign: "start" }}
            >
              <div className="shrink-0 flex items-baseline justify-between pt-4 pb-3">
                <span
                  className="font-plex"
                  style={{ fontSize: 20, fontWeight: 400, color: "#3F3F3F", letterSpacing: "-0.02em", lineHeight: "26px" }}
                >
                  {COL_TITLES[col]}
                </span>
                <span
                  className="font-plex-mono"
                  style={{ fontSize: 16, fontWeight: 300, color: "#11181C", letterSpacing: "-0.02em", lineHeight: "21px" }}
                >
                  {String(grouped[col].length).padStart(2, "0")}
                </span>
              </div>
              {/* Column body — internal vertical scroll so the page itself never grows */}
              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-4">
                <DroppableColumn
                  col={col}
                  tasks={grouped[col]}
                  onComplete={onComplete}
                  onOpen={onOpen}
                  dropTarget={dropTarget}
                  activeId={activeId}
                  onAddTask={onAddTask}
                  onMoveCol={onMoveCol}
                />
              </div>
            </div>
          ))}
          {/* Trailing spacer so last column can snap to start */}
          <div className="shrink-0 h-full" style={{ width: "8vw" }} aria-hidden />
        </div>
      </div>
    </div>
  );
}

/* ───────── PLANNER (DESKTOP) ───────── */
function PlannerDesktop({
  grouped,
  onComplete,
  onOpen,
  dropTarget,
  activeId,
  onAddTask,
  onMoveCol,
}: {
  grouped: Record<ClerkCol, Task[]>;
  onComplete: (t: Task) => void;
  onOpen: (t: Task) => void;
  dropTarget: { col: ClerkCol; index: number } | null;
  activeId: string | null;
  onAddTask: (col: ClerkCol) => void;
  onMoveCol?: (t: Task, col: ClerkCol) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="max-w-[1440px] mx-auto px-10 pt-7 pb-10">
      <div ref={scrollerRef} className="overflow-x-auto overflow-y-hidden no-scrollbar">
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))", minWidth: "100%" }}
        >
          {COLS.map((col, i) => (
            <div
              key={col}
              className={cn(
                "min-w-0",
                i < COLS.length - 1 && "border-r border-divider pr-5",
                i > 0 && "pl-5"
              )}
            >
              <div className="flex items-baseline justify-between pb-3 mb-3">
                <span
                  className="font-plex"
                  style={{ fontSize: 20, fontWeight: 400, color: "#3F3F3F", letterSpacing: "-0.02em", lineHeight: "26px" }}
                >
                  {COL_TITLES[col]}
                </span>
                <span
                  className="font-plex-mono"
                  style={{ fontSize: 16, fontWeight: 300, color: "#11181C", letterSpacing: "-0.02em", lineHeight: "21px" }}
                >
                  {String(grouped[col].length).padStart(2, "0")}
                </span>
              </div>
              <DroppableColumn
                col={col}
                tasks={grouped[col]}
                onComplete={onComplete}
                onOpen={onOpen}
                dropTarget={dropTarget}
                activeId={activeId}
                onAddTask={onAddTask}
                onMoveCol={onMoveCol}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── DROP INDICATOR ───────── */
function DropIndicator() {
  return (
    <div
      aria-hidden
      className="h-[3px] w-full rounded-full bg-primary shadow-[0_0_8px_rgba(86,124,248,0.5)] -my-1"
    />
  );
}

/* ───────── DROPPABLE COLUMN ───────── */
function DroppableColumn({
  col,
  tasks,
  onComplete,
  onOpen,
  dropTarget,
  activeId,
  onAddTask,
  onMoveCol,
}: {
  col: ClerkCol;
  tasks: Task[];
  onComplete: (t: Task) => void;
  onOpen: (t: Task) => void;
  dropTarget: { col: ClerkCol; index: number } | null;
  activeId: string | null;
  onAddTask?: (col: ClerkCol) => void;
  onMoveCol?: (t: Task, col: ClerkCol) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${col}` });
  // Visible tasks exclude the active dragging card (it's in the overlay)
  const visible = tasks.filter((t) => t.id !== activeId);
  const showIndicator = !!activeId && dropTarget?.col === col;
  const indicatorIdx = showIndicator ? Math.min(Math.max(dropTarget!.index, 0), visible.length) : -1;

  return (
    <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 min-h-[120px] pb-6 rounded-md transition-colors",
          isOver && "bg-black/[0.02]"
        )}
      >
        {visible.length === 0 ? (
          showIndicator && <DropIndicator />
        ) : (
          visible.map((t, idx) => (
            <div key={t.id} className="flex flex-col gap-2">
              {showIndicator && indicatorIdx === idx && <DropIndicator />}
              <TaskCard
                task={t}
                onComplete={() => onComplete(t)}
                onOpen={() => onOpen(t)}
                onMoveCol={onMoveCol ? (c) => onMoveCol(t, c) : undefined}
              />
              {showIndicator && idx === visible.length - 1 && indicatorIdx === visible.length && (
                <DropIndicator />
              )}
            </div>
          ))
        )}
        {onAddTask && (
          <AddTaskCard onAdd={() => onAddTask(col)} className="mt-1" />
        )}
      </div>
    </SortableContext>
  );
}

