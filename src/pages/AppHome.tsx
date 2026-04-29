import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import { classify, type ClerkCol } from "@/lib/clerk-classify";
import { getLovableCloudClient } from "@/lib/lovable-cloud";
import { toast } from "sonner";
import { Trash2, Settings, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Task = {
  id: string;
  title: string;
  col: ClerkCol;
  task_time: string | null;
  location: string | null;
  category: string | null;
  cat_color: number;
  due_date: string | null;
  reason: string | null;
  note: string | null;
  position: number;
  created_at: string;
};

type Proposal = {
  title: string;
  col: ClerkCol;
  reason: string;
};

const COL_TITLES: Record<ClerkCol, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  upcoming: "Upcoming",
  someday: "Someday",
};
const COLS: ClerkCol[] = ["today", "tomorrow", "upcoming", "someday"];


const GREETINGS = [
  "Add your tasks. I'll figure out where they go.",
  "What's on your mind?",
  "Brain dump time.",
  "Type. I'll sort.",
];

export default function App() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [bubble, setBubble] = useState<string>("");
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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
        supabase.from("profiles").select("display_name, onboarded").eq("id", user.id).single(),
      ]);
      setTasks((t as Task[]) ?? []);
      setProfile(p);
      if (p && !p.onboarded) navigate("/onboarding");
      // Greeting
      const g = p?.display_name
        ? `Morning, ${p.display_name}. ${GREETINGS[Math.floor(Math.random() * GREETINGS.length)]}`
        : GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      showBubble(g, 4500);
    })();
  }, [user, navigate]);

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

  async function processInput(raw: string) {
    if (!user) return;
    const parts = raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setThinking(true);
    showBubble("Thinking...", 60_000);

    let sorted: Proposal[] = [];
    try {
      const { data, error } = await supabase.functions.invoke("sort-tasks", {
        body: { titles: parts },
      });
      if (error) throw error;
      if (data?.tasks?.length) {
        sorted = data.tasks;
      } else {
        throw new Error("Empty AI response");
      }
    } catch (err: any) {
      // Surface known errors
      if (err?.context?.status === 429 || /rate/i.test(err?.message ?? "")) {
        toast.error("Rate limited. Using local sort.");
      } else if (err?.context?.status === 402) {
        toast.error("AI credits exhausted. Using local sort.");
      }
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
    inputRef.current?.focus();
    showBubble("Sorted.");
  }

  function updateProposalCol(idx: number, col: ClerkCol) {
    setProposals((p) =>
      p ? p.map((x, i) => (i === idx ? { ...x, col } : x)) : p
    );
  }

  async function completeTask(t: Task) {
    if (!user) return;
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    await Promise.all([
      supabase.from("tasks").delete().eq("id", t.id),
      supabase.from("completed_tasks").insert({
        user_id: user.id,
        title: t.title,
        category: t.category,
        cat_color: t.cat_color,
      }),
    ]);
    showBubble("Done. Next.");
  }

  async function deleteTask(t: Task) {
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    await supabase.from("tasks").delete().eq("id", t.id);
  }

  async function moveTask(t: Task, col: ClerkCol) {
    if (col === t.col) return;
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, col } : x)));
    await supabase.from("tasks").update({ col }).eq("id", t.id);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || thinking) return;
    processInput(input);
  }

  return (
    <div className="min-h-screen app-bg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <ClerkCharacter size={26} />
          <span className="font-mono-plex text-[11px] font-semibold uppercase tracking-[0.1em]">
            Clerk
          </span>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="rounded-full p-2 hover:bg-foreground/5 transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </header>

      {/* Date */}
      <div className="text-center pb-2">
        <div className="font-plex text-[26px] font-bold tracking-[-0.02em] leading-none">
          {new Date().toLocaleDateString("en-US", { weekday: "long" })}
        </div>
        <div className="text-[12px] text-muted-foreground mt-1.5">
          {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Columns */}
      <main className="flex-1 overflow-x-auto px-4 pb-[180px] pt-6">
        <div className="grid grid-flow-col auto-cols-[min(420px,90vw)] gap-6 mx-auto max-w-[1280px]">
          {COLS.map((col) => (
            <Column
              key={col}
              col={col}
              title={COL_TITLES[col]}
              tasks={grouped[col]}
              onComplete={completeTask}
              onDelete={deleteTask}
              onMove={moveTask}
            />
          ))}
        </div>
      </main>

      {/* Bottom pill input + character */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[500px] px-4">
        {/* Speech bubble */}
        <div
          className={`mx-auto mb-3 max-w-[340px] rounded-2xl bg-foreground px-4 py-2.5 text-center text-[12px] font-medium text-background shadow-lg transition-all duration-300 ${
            bubbleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          {bubble}
        </div>

        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 rounded-full bg-white border border-border shadow-[0_4px_24px_rgba(0,0,0,0.08)] pr-2 pl-4 py-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={thinking ? "Thinking..." : "What needs doing?"}
            disabled={thinking}
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
          />
          <ClerkCharacter
            size={42}
            thinking={thinking}
            onClick={() => inputRef.current?.focus()}
          />
        </form>
      </div>

      {/* Proposal modal */}
      <Dialog open={!!proposals} onOpenChange={(o) => !o && setProposals(null)}>
        <DialogContent className="max-w-[440px] p-0 overflow-hidden bg-background">
          <div className="px-6 pt-6 pb-3 flex items-center gap-3">
            <ClerkCharacter size={36} />
            <div>
              <div className="font-plex text-[15px] font-medium">Here's where I'd put these.</div>
              <div className="text-[12px] text-muted-foreground">Tap a column to change it.</div>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto px-6 pb-2 space-y-3">
            {proposals?.map((p, i) => (
              <div key={i} className="clerk-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-plex text-[16px] font-medium leading-snug">
                      {p.title}
                    </div>
                    <div className="font-mono-plex text-[11px] text-muted-foreground mt-1.5 italic">
                      {p.reason}
                    </div>
                  </div>
                  <select
                    value={p.col}
                    onChange={(e) => updateProposalCol(i, e.target.value as ClerkCol)}
                    className="font-mono-plex text-[11px] uppercase tracking-wider bg-secondary px-2.5 py-1 rounded-md border border-border outline-none cursor-pointer"
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

      {/* Settings sheet */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle className="font-plex">Settings</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <section>
              <div className="font-mono-plex text-[10px] uppercase tracking-[0.1em] text-faint mb-2">
                Account
              </div>
              <div className="clerk-card p-4 space-y-1">
                <div className="text-[13px] font-medium">{profile?.display_name ?? "Anonymous"}</div>
                <div className="font-mono-plex text-[11px] text-muted-foreground">
                  {user?.email}
                </div>
              </div>
            </section>
            <section>
              <div className="font-mono-plex text-[10px] uppercase tracking-[0.1em] text-faint mb-2">
                Stats
              </div>
              <div className="clerk-card p-4 grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="font-plex text-[22px] font-light">{tasks.length}</div>
                  <div className="font-mono-plex text-[10px] uppercase tracking-wider text-faint">
                    Open
                  </div>
                </div>
                <div>
                  <div className="font-plex text-[22px] font-light">
                    {grouped.today.length}
                  </div>
                  <div className="font-mono-plex text-[10px] uppercase tracking-wider text-faint">
                    Today
                  </div>
                </div>
              </div>
            </section>
            <button
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              className="w-full flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-[13px] font-medium hover:bg-secondary"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Column({
  col,
  title,
  tasks,
  onComplete,
  onDelete,
  onMove,
}: {
  col: ClerkCol;
  title: string;
  tasks: Task[];
  onComplete: (t: Task) => void;
  onDelete: (t: Task) => void;
  onMove: (t: Task, c: ClerkCol) => void;
}) {
  return (
    <section className="flex flex-col">
      <header className="flex items-baseline justify-between border-b border-divider pb-3 mb-3 px-1">
        <h2 className="font-plex text-[20px] font-normal tracking-[-0.02em] text-[#3F3F3F]">
          {title}
        </h2>
        <span className="font-mono-plex text-[16px] font-light text-foreground">
          {tasks.length}
        </span>
      </header>
      <div className="flex flex-col gap-2 px-1">
        {tasks.length === 0 ? (
          <p className="text-[12px] text-faint py-6">Nothing here.</p>
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
    </section>
  );
}

function TaskCard({
  task,
  onComplete,
  onDelete,
  onMove,
}: {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
  onMove: (c: ClerkCol) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`clerk-card p-4 cursor-pointer transition-shadow ${
        expanded ? "shadow-[0_4px_16px_rgba(0,0,0,0.08)]" : "hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)]"
      }`}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-plex text-[18px] font-medium leading-[1.28] text-[#2A2A2A] break-words flex-1">
          {task.title}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className="h-[22px] w-[22px] shrink-0 rounded-full border border-[#939393] bg-white hover:border-primary transition-colors"
          aria-label="Complete"
        />
      </div>
      {(task.task_time || task.location) && (
        <div className="mt-2 flex items-center gap-2 font-mono-plex text-[12px] text-[#2A2A2A]">
          {task.task_time && <span>{task.task_time}</span>}
          {task.location && <span>· {task.location}</span>}
        </div>
      )}
      {task.reason && (
        <div className="mt-2 font-mono-plex text-[11px] italic text-muted-foreground">
          {task.reason}
        </div>
      )}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 flex-wrap">
          {COLS.filter((c) => c !== task.col).map((c) => (
            <button
              key={c}
              onClick={(e) => {
                e.stopPropagation();
                onMove(c);
              }}
              className="font-mono-plex text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              → {c}
            </button>
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="ml-auto rounded-md border border-border p-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
