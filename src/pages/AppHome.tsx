import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import { TaskCard, type ClerkCol, type TaskCardData } from "@/components/TaskCard";
import { AppBar } from "@/components/AppBar";
import { type CharacterVariant } from "@/lib/characters";
import { classify } from "@/lib/clerk-classify";
import { getLovableCloudClient } from "@/lib/lovable-cloud";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SettingsModal } from "@/components/SettingsModal";
import { cn } from "@/lib/utils";

type Task = TaskCardData & { position: number; created_at: string };

type Proposal = { title: string; col: ClerkCol; reason: string };

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

const GREETINGS = [
  "Add your tasks. I'll figure out where they go.",
  "What's on your mind?",
  "Brain dump time.",
  "Type. I'll sort.",
];

export default function AppHome() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
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
  const bubbleTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  // Load tasks + profile
  useEffect(() => {
    if (!user) return;
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
      setTasks((t as Task[]) ?? []);
      if (p) {
        if (!p.onboarded) {
          navigate("/onboarding");
          return;
        }
        const char = (p.character as CharacterVariant) ?? "blue";
        const vm = (p.view_mode as ViewMode) ?? "focus";
        setProfile({
          display_name: p.display_name,
          character: char,
          view_mode: vm,
          streak: p.streak ?? 0,
          tasks_completed: p.tasks_completed ?? 0,
          last_active_date: p.last_active_date ?? null,
        });
        setView(vm);
      }
      const greet = p?.display_name
        ? `Morning, ${p.display_name}.`
        : GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      showBubble(greet, 4500);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function showBubble(text: string, ms = 3500) {
    setBubble(text);
    setBubbleVisible(true);
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubbleVisible(false), ms);
  }

  const grouped = useMemo(() => {
    const g: Record<ClerkCol, Task[]> = { today: [], tomorrow: [], upcoming: [], someday: [] };
    for (const t of tasks) g[t.col].push(t);
    return g;
  }, [tasks]);

  async function persistView(v: ViewMode) {
    setView(v);
    if (!user) return;
    const supabase = await getLovableCloudClient();
    await supabase.from("profiles").update({ view_mode: v }).eq("id", user.id);
  }

  async function processInput(raw: string) {
    if (!user) return;
    const parts = raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setThinking(true);
    showBubble("Thinking...", 60_000);

    let sorted: Proposal[] = [];
    try {
      const supabase = await getLovableCloudClient();
      const { data, error } = await supabase.functions.invoke("sort-tasks", {
        body: { titles: parts },
      });
      if (error) throw error;
      if (data?.tasks?.length) sorted = data.tasks;
      else throw new Error("Empty AI response");
    } catch (err: any) {
      if (err?.context?.status === 429) toast.error("Rate limited. Using local sort.");
      else if (err?.context?.status === 402) toast.error("AI credits exhausted. Using local sort.");
      sorted = parts.map((title) => {
        const { col, reason } = classify(title);
        return { title, col, reason };
      });
    }
    setThinking(false);
    setBubbleVisible(false);
    setProposals(sorted);
  }

  async function acceptProposals() {
    if (!proposals || !user) return;
    const supabase = await getLovableCloudClient();
    const rows = proposals.map((p, i) => ({
      user_id: user.id,
      title: p.title,
      col: p.col,
      reason: p.reason,
      position: Date.now() + i,
    }));
    const { data, error } = await supabase.from("tasks").insert(rows).select();
    if (error) {
      toast.error(error.message);
      return;
    }
    setTasks((prev) => [...((data as Task[]) ?? []), ...prev]);
    setProposals(null);
    setInput("");
    showBubble("Sorted.");
  }

  function updateProposalCol(idx: number, col: ClerkCol) {
    setProposals((p) => (p ? p.map((x, i) => (i === idx ? { ...x, col } : x)) : p));
  }

  async function completeTask(t: Task) {
    if (!user) return;
    const supabase = await getLovableCloudClient();
    setTasks((prev) => prev.filter((x) => x.id !== t.id));

    // Compute new streak / counters
    const today = new Date().toISOString().slice(0, 10);
    const last = profile?.last_active_date ?? null;
    let nextStreak = profile?.streak ?? 0;
    if (last !== today) {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      nextStreak = last === yesterday ? nextStreak + 1 : 1;
    }
    const nextCompleted = (profile?.tasks_completed ?? 0) + 1;

    if (profile) {
      setProfile({
        ...profile,
        streak: nextStreak,
        tasks_completed: nextCompleted,
        last_active_date: today,
      });
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
    showBubble("Done. Next.");
  }

  async function deleteTask(t: Task) {
    const supabase = await getLovableCloudClient();
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    await supabase.from("tasks").delete().eq("id", t.id);
  }

  async function moveTask(t: Task, col: ClerkCol) {
    if (col === t.col) return;
    const supabase = await getLovableCloudClient();
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, col } : x)));
    await supabase.from("tasks").update({ col }).eq("id", t.id);
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

  const variant = profile?.character ?? "blue";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Fixed header ── */}
      <header
        className="fixed top-0 left-0 right-0 z-[100] flex items-center bg-background border-b border-divider"
        style={{ height: 64 }}
      >
        <div className="w-full max-w-[1280px] mx-auto px-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClerkCharacter variant={variant} size={26} />
            <span className="font-plex-mono text-[11px] font-medium uppercase tracking-[0.1em]">
              Clerk
            </span>
          </div>

          {/* Toggle Focus | Planner */}
          <div className="flex items-center gap-1">
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

          {/* Spacer to balance header (settings is reachable from the bottom-bar menu) */}
          <div className="w-[26px]" aria-hidden />

        </div>
      </header>

      {/* ── Views ── */}
      <main
        className="fixed inset-0 overflow-y-auto"
        style={{ paddingTop: 64, paddingBottom: 120 }}
      >
        {view === "focus" ? (
          <FocusView tasks={grouped.today} onComplete={completeTask} onDelete={deleteTask} onMove={moveTask} />
        ) : (
          <PlannerView grouped={grouped} onComplete={completeTask} onDelete={deleteTask} onMove={moveTask} />
        )}
      </main>

      {/* ── Bottom bar ── */}
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
        onSignOut={async () => {
          await signOut();
          navigate("/");
        }}
      />

      {/* ── Proposal modal ── */}
      <Dialog open={!!proposals} onOpenChange={(o) => !o && setProposals(null)}>
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
              onClick={() => setProposals(null)}
              className="flex-1 rounded-full border border-border py-2.5 text-[13px] font-medium hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              onClick={acceptProposals}
              className="flex-1 rounded-full bg-foreground py-2.5 text-[13px] font-medium text-background"
            >
              Looks good
            </button>
          </div>
        </DialogContent>
      </Dialog>

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
        }}
        onSave={saveSettings}
        onCharacterPreview={previewCharacter}
      />
    </div>
  );
}

/* ───────── FOCUS VIEW ───────── */
function FocusView({
  tasks,
  onComplete,
  onDelete,
  onMove,
}: {
  tasks: Task[];
  onComplete: (t: Task) => void;
  onDelete: (t: Task) => void;
  onMove: (t: Task, c: ClerkCol) => void;
}) {
  const today = new Date();
  return (
    <div className="max-w-[1280px] mx-auto px-10 pt-7 pb-10">
      <div className="w-full max-w-[420px] mx-auto flex flex-col">
        {/* Today date header */}
        <div className="text-center pb-6">
          <div
            className="font-plex font-bold text-foreground"
            style={{ fontSize: 28, letterSpacing: "-0.02em", lineHeight: 1 }}
          >
            {today.toLocaleDateString("en-US", { weekday: "long" })}
          </div>
          <div className="font-sans text-[13px] text-muted-foreground mt-1.5">
            {today.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Card list */}
        <div className="flex flex-col gap-2">
          {tasks.length === 0 ? (
            <p className="py-6 text-[12px]" style={{ color: "#D1D5DB" }}>
              Nothing yet. Add tasks below.
            </p>
          ) : (
            tasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onComplete={() => onComplete(t)}
                onDelete={() => onDelete(t)}
                onMove={(c) => onMove(t, c)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── PLANNER VIEW ───────── */
function PlannerView({
  grouped,
  onComplete,
  onDelete,
  onMove,
}: {
  grouped: Record<ClerkCol, Task[]>;
  onComplete: (t: Task) => void;
  onDelete: (t: Task) => void;
  onMove: (t: Task, c: ClerkCol) => void;
}) {
  return (
    <div className="max-w-[1280px] mx-auto px-10 pt-7 pb-10">
      <div className="overflow-x-auto overflow-y-hidden no-scrollbar">
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(4, 280px)", minWidth: "100%" }}
        >
          {COLS.map((col, i) => (
            <div
              key={col}
              className={cn(
                "min-w-0",
                i < COLS.length - 1 && "border-r border-divider pr-7",
                i > 0 && "pl-7"
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
              <div className="flex flex-col gap-2">
                {grouped[col].length === 0 ? (
                  <p className="py-6 text-[12px]" style={{ color: "#D1D5DB" }}>
                    Nothing yet.
                  </p>
                ) : (
                  grouped[col].map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onComplete={() => onComplete(t)}
                      onDelete={() => onDelete(t)}
                      onMove={(c) => onMove(t, c)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
