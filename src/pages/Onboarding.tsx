import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { getLovableCloudClient } from "@/lib/lovable-cloud";
import { type CharacterVariant } from "@/lib/characters";
import { CharacterPicker } from "@/components/CharacterPicker";
import { classify } from "@/lib/clerk-classify";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const SCREENS = 4;

type DemoStep = "idle" | "callout1" | "typing" | "thinking" | "proposal" | "callout2";

const DEMO_TEXT =
  "finish the case study, it's due Friday, pick up groceries, call dentist to book appointment, learn Spanish someday";

const DEMO_TASKS: { text: string; col: "today" | "tomorrow" | "someday"; label: string; reason: string }[] = [
  { text: "finish the case study, it's due Friday", col: "today", label: "Today", reason: "Due Friday — that's close." },
  { text: "pick up groceries", col: "today", label: "Today", reason: "Practical. Get it done." },
  { text: "call dentist to book appointment", col: "tomorrow", label: "Tomorrow", reason: "Not urgent today." },
  { text: "learn Spanish someday", col: "someday", label: "Someday", reason: "Where dreams live." },
];

const COL_BG: Record<string, string> = {
  Today: "#CEDAFF",
  Tomorrow: "#FFF7CE",
  Someday: "#FFCEFB",
};

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [character, setCharacter] = useState<CharacterVariant>("wes:v1");
  const [tasksDraft, setTasksDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const next = () => setStep((s) => Math.min(s + 1, SCREENS - 1));
  const skipDemo = () => setStep(3);

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const supabase = await getLovableCloudClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name || null,
          character,
          onboarded: true,
          view_mode: "planner",
        })
        .eq("id", user.id);
      if (error) throw error;

      const seed = tasksDraft.trim();
      const parts = seed
        ? seed.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
        : [];

      if (!parts.length) {
        navigate("/app");
        return;
      }

      type Col = "today" | "tomorrow" | "upcoming" | "someday";
      type Proposal = {
        title: string;
        col: Col;
        reason: string;
        dueDate?: string;
        taskTime?: string;
        location?: string;
        category?: string;
      };

      // Onboarding demo runs entirely client-side via the local classifier.
      // Real AI sorting happens once the user is in the app and authenticated.
      const sorted: Proposal[] = parts.map((title) => {
        const { col, reason } = classify(title);
        return { title, col, reason };
      });

      track("onboarding_completed", { tasks_seeded: sorted.length, character });

      navigate("/app", { state: { pendingProposals: sorted } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not finish onboarding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen landing-bg overflow-x-hidden relative">
      {/* progress dots */}
      <div className="fixed top-6 sm:top-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {Array.from({ length: SCREENS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === step ? "w-[18px] bg-foreground" : "w-1.5 bg-foreground/15"
            )}
          />
        ))}
      </div>

      {/* skip-demo only on step 2 */}
      {step === 2 && (
        <button
          onClick={skipDemo}
          className="fixed top-5 right-5 sm:top-8 sm:right-6 font-plex-mono text-[11px] font-light tracking-[0.04em] text-faint hover:text-muted-foreground z-20"
        >
          skip demo
        </button>
      )}

      <div className="relative z-[1] min-h-screen flex flex-col items-center justify-start sm:justify-center pt-20 sm:pt-0 pb-10 sm:pb-0 px-5 sm:px-6">
        {step === 0 && <NameStep name={name} setName={setName} character={character} onNext={next} />}
        {step === 1 && (
          <CharacterStep name={name} character={character} setCharacter={setCharacter} onNext={next} />
        )}
        {step === 2 && <DemoStep character={character} onDone={next} />}
        {step === 3 && (
          <YourTurnStep
            name={name}
            character={character}
            value={tasksDraft}
            setValue={setTasksDraft}
            saving={saving}
            onFinish={finish}
          />
        )}
      </div>
    </div>
  );
}

/* ───────── SCREEN 1: NAME ───────── */
function NameStep({
  name,
  setName,
  character,
  onNext,
}: {
  name: string;
  setName: (v: string) => void;
  character: CharacterVariant;
  onNext: () => void;
}) {
  const isMobile = useIsMobile();
  return (
    <div className="animate-fade-up w-full max-w-full sm:max-w-[360px] flex flex-col items-start">
      <div className="flex items-end gap-2 sm:gap-3 mb-8 sm:mb-10">
        <ClerkCharacter variant={character} size={isMobile ? 52 : 58} />
        <div className="rounded-[4px_20px_20px_20px] bg-white border border-black/[0.08] px-4 py-3 text-[13px] sm:text-[14px] leading-[1.55] shadow-[0_4px_20px_rgba(0,0,0,0.08)] max-w-[calc(100vw-120px)] sm:max-w-none">
          Hi. I'm Clerk.
          <br />
          What should I call you?
        </div>
      </div>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && name.trim() && onNext()}
        placeholder="Your name"
        className="w-full font-plex text-[20px] sm:text-[22px] text-foreground bg-white/70 border-[1.5px] border-black/10 rounded-[14px] px-5 py-3.5 sm:py-4 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 mb-5 placeholder:text-[#C4C8CC]"
      />
      <button
        disabled={!name.trim()}
        onClick={onNext}
        className="w-full rounded-[14px] bg-foreground py-4 min-h-[52px] font-plex text-[15px] font-medium text-background disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#2A2A2A] transition-colors"
      >
        Continue →
      </button>
    </div>
  );
}

/* ───────── SCREEN 2: CHARACTER ───────── */
function CharacterStep({
  name,
  character,
  setCharacter,
  onNext,
}: {
  name: string;
  character: CharacterVariant;
  setCharacter: (c: CharacterVariant) => void;
  onNext: () => void;
}) {
  return (
    <div className="animate-fade-up w-full max-w-full sm:max-w-[380px] flex flex-col items-center">
      <h2 className="font-plex text-[22px] sm:text-[24px] font-semibold tracking-[-0.025em] mb-2 text-center">
        Pick your Clerk, {name || "friend"}.
      </h2>
      <p className="font-plex-mono text-[12px] font-light text-muted-foreground text-center mb-7 sm:mb-9">
        Three personalities. Two looks each. Pick what fits your vibe.
      </p>

      <div className="w-full mb-7 sm:mb-8">
        <CharacterPicker
          value={character}
          onChange={setCharacter}
          streak={0}
          tasksCompleted={0}
        />
      </div>

      <button
        onClick={onNext}
        className="w-full max-w-[320px] rounded-[14px] bg-foreground py-4 min-h-[52px] font-plex text-[15px] font-medium text-background hover:bg-[#2A2A2A] transition-colors"
      >
        This one →
      </button>
    </div>
  );
}

/* ───────── SCREEN 3: DEMO ───────── */
function DemoStep({ character, onDone }: { character: CharacterVariant; onDone: () => void }) {
  const [phase, setPhase] = useState<DemoStep>("idle");
  const [typed, setTyped] = useState("");
  const [callout, setCallout] = useState("");
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const add = (t: number) => timersRef.current.push(t as unknown as number);

    add(window.setTimeout(() => {
      setPhase("callout1");
      setCallout("Type your tasks — all at once, however they come to mind.");
    }, 600));

    add(window.setTimeout(() => {
      setCallout("");
      setPhase("typing");
      // type out
      let i = 0;
      const tick = () => {
        i++;
        setTyped(DEMO_TEXT.slice(0, i));
        if (i < DEMO_TEXT.length) add(window.setTimeout(tick, 28));
        else {
          add(window.setTimeout(() => setPhase("thinking"), 350));
        }
      };
      tick();
    }, 3000));
  }, []);

  useEffect(() => {
    if (phase === "thinking") {
      const t = window.setTimeout(() => setPhase("proposal"), 1800);
      timersRef.current.push(t as unknown as number);
    }
    if (phase === "proposal") {
      const t = window.setTimeout(() => {
        setPhase("callout2");
        setCallout("I explain every decision. You can always move a task if you disagree.");
      }, 700);
      timersRef.current.push(t as unknown as number);
    }
  }, [phase]);

  useEffect(() => () => timersRef.current.forEach((t) => clearTimeout(t)), []);

  const speech =
    phase === "thinking" ? "Give me a moment..." : phase === "idle" || phase === "callout1" ? "Watch me work." : phase === "typing" ? "Watch me work." : "Here's what I'd do.";

  const isMobile = useIsMobile();
  return (
    <div className="animate-fade-up w-full max-w-full sm:max-w-[380px] flex flex-col items-center">
      {/* Mascot + speech */}
      <div className="flex items-end gap-2 sm:gap-3 mb-6">
        <ClerkCharacter variant={character} size={isMobile ? 52 : 58} thinking={phase === "thinking"} />
        <div className="rounded-[4px_20px_20px_20px] bg-white border border-black/[0.08] px-4 py-3 text-[13px] sm:text-[14px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] max-w-[calc(100vw-120px)] sm:max-w-none">
          {speech}
        </div>
      </div>

      {/* Fake pill */}
      <div className="w-full bg-white border border-black/[0.08] rounded-full px-4 sm:px-5 py-3 flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)] mb-4">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
          <circle cx="8" cy="8" r="6" stroke="#C4C8CC" strokeWidth="1.5" />
          <path d="M8 5v3l2 2" stroke="#C4C8CC" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span
          className="font-sans text-[13px] sm:text-[14px] flex-1 truncate"
          style={{ color: typed ? "#1A1A1A" : "#C4C8CC" }}
        >
          {typed || "What needs doing?"}
        </span>
      </div>

      {/* Callout */}
      <div
        className={cn(
          "rounded-xl bg-foreground text-background px-4 py-3 max-w-[calc(100vw-48px)] sm:max-w-[300px] text-center text-[12px] sm:text-[13px] mb-3 transition-all duration-300",
          callout ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
        )}
      >
        {callout}
      </div>

      {/* Proposal */}
      <div
        className={cn(
          "w-full bg-white rounded-[16px] p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-300",
          phase === "proposal" || phase === "callout2"
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        )}
      >
        <div className="font-plex text-[14px] sm:text-[15px] font-semibold text-foreground mb-1">Sorted. Here's my reasoning.</div>
        <div className="font-plex-mono text-[11px] font-light text-muted-foreground mb-4">
          Tap a column to move anything.
        </div>
        <div className="flex flex-col gap-2.5 mb-4">
          {DEMO_TASKS.map((t, i) => (
            <div key={i} className="flex justify-between items-start gap-2.5">
              <span className="text-[12px] sm:text-[13px] text-foreground flex-1 leading-[1.4] line-clamp-2">{t.text}</span>
              <span
                className="font-plex-mono text-[9.5px] sm:text-[10px] font-normal px-2.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                style={{ background: COL_BG[t.label] ?? "#EEE" }}
              >
                {t.label}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onDone}
          className="w-full rounded-[10px] bg-foreground text-background font-sans text-[14px] font-medium py-3 min-h-[48px] hover:bg-[#2A2A2A] transition-colors"
        >
          Looks good →
        </button>
      </div>
    </div>
  );
}

/* ───────── SCREEN 4: YOUR TURN ───────── */
function YourTurnStep({
  name,
  character,
  value,
  setValue,
  saving,
  onFinish,
}: {
  name: string;
  character: CharacterVariant;
  value: string;
  setValue: (v: string) => void;
  saving: boolean;
  onFinish: () => void;
}) {
  const isMobile = useIsMobile();
  return (
    <div className="animate-fade-up w-full max-w-full sm:max-w-[360px] flex flex-col items-start">
      <div className="flex items-end gap-2 sm:gap-3 mb-7 sm:mb-9">
        <ClerkCharacter variant={character} size={isMobile ? 52 : 58} />
        <div className="rounded-[4px_20px_20px_20px] bg-white border border-black/[0.08] px-4 py-3 text-[13px] sm:text-[14px] leading-[1.55] shadow-[0_4px_20px_rgba(0,0,0,0.08)] max-w-[calc(100vw-120px)] sm:max-w-none">
          Your turn{name ? `, ${name}` : ""}.<br />Give me everything.
        </div>
      </div>
      <h2 className="font-plex text-[22px] sm:text-[26px] font-semibold tracking-[-0.025em] mb-2">What's on your mind?</h2>
      <p className="font-plex-mono text-[12px] font-light text-muted-foreground mb-5 sm:mb-6 leading-[1.6]">
        Work, home, errands — anything. Don't think, just type. I'll sort it out.
      </p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        placeholder="Call dentist, finish report by Friday, pick up groceries, learn guitar someday..."
        className="w-full font-plex text-[15px] sm:text-[16px] bg-white/70 border-[1.5px] border-black/10 rounded-[14px] px-5 py-4 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 mb-3 min-h-[110px] sm:min-h-[90px] leading-[1.5] placeholder:text-[#C4C8CC] resize-none"
      />
      <p className="font-plex-mono text-[11px] font-light text-faint mb-5 leading-[1.5]">
        Separate tasks with a comma, or just write naturally.
      </p>
      <button
        disabled={saving}
        onClick={onFinish}
        className="w-full rounded-[14px] bg-foreground py-4 min-h-[52px] font-plex text-[15px] font-medium text-background disabled:opacity-50 hover:bg-[#2A2A2A] transition-colors"
      >
        {saving ? "..." : "Let's go →"}
      </button>
    </div>
  );
}
