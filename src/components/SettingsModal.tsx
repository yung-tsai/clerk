import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import { CHARACTERS, CHARACTER_LABELS, type CharacterVariant } from "@/lib/characters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface SettingsData {
  display_name: string | null;
  character: CharacterVariant;
  streak: number;
  tasks_completed: number;
  email: string | null;
}

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SettingsData;
  onSave: (next: { display_name: string; character: CharacterVariant }) => Promise<void> | void;
  /** Live preview when the user picks a character — updates the AppBar mascot immediately */
  onCharacterPreview?: (c: CharacterVariant) => void;
}

const MILESTONES = [
  { id: "first_task", icon: "⚡", name: "First task sorted", desc: "Let Clerk do its thing.", threshold: 1, key: "tasks" as const },
  { id: "ten_tasks", icon: "🎯", name: "10 tasks completed", desc: "You're getting the hang of this.", threshold: 10, key: "tasks" as const },
  { id: "fifty_tasks", icon: "🏆", name: "50 tasks completed", desc: "Seriously impressive.", threshold: 50, key: "tasks" as const },
  { id: "streak_3", icon: "🔥", name: "3-day streak", desc: "Three days cleared. Keep going.", threshold: 3, key: "streak" as const },
  { id: "streak_7", icon: "💫", name: "7-day streak", desc: "A full week. Clerk noticed.", threshold: 7, key: "streak" as const },
  { id: "streak_30", icon: "👑", name: "30-day streak", desc: "This is a lifestyle now.", threshold: 30, key: "streak" as const },
];

export function SettingsModal({ open, onOpenChange, data, onSave, onCharacterPreview }: SettingsModalProps) {
  const [name, setName] = useState(data.display_name ?? "");
  const [character, setCharacter] = useState<CharacterVariant>(data.character);
  const [saving, setSaving] = useState(false);

  // Re-sync when modal reopens with fresh data
  useEffect(() => {
    if (open) {
      setName(data.display_name ?? "");
      setCharacter(data.character);
    }
  }, [open, data.display_name, data.character]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ display_name: name.trim(), character });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const pickChar = (c: CharacterVariant) => {
    setCharacter(c);
    onCharacterPreview?.(c);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[640px] p-0 gap-0 border-none shadow-none bg-transparent [&>button]:hidden"
      >
        <div
          className="rounded-[20px] overflow-hidden max-h-[88vh] flex flex-col"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 10% 10%, rgba(255,190,130,0.3) 0%, transparent 100%), radial-gradient(ellipse 50% 45% at 90% 5%, rgba(185,205,255,0.35) 0%, transparent 100%), #F5F5F3",
          }}
        >
          {/* ── HEADER ── */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]"
            style={{ background: "rgba(245,245,243,0.85)", backdropFilter: "blur(12px)" }}
          >
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="font-mono-plex text-[12px] font-light text-[#6A7282] hover:text-[#1A1A1A] transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Close
            </button>
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#1A1A1A]">Settings</span>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-[13px] font-medium text-[#567CF8] hover:opacity-70 transition-opacity disabled:opacity-40"
            >
              {saving ? "..." : "Save"}
            </button>
          </div>

          <div className="overflow-y-auto px-5 pt-5 pb-7">
            {/* ── PROFILE ── */}
            <SectionLabel>Profile</SectionLabel>
            <Card>
              <div className="flex items-center gap-4 p-5 border-b border-black/[0.07]">
                <div className="flex-shrink-0">
                  <ClerkCharacter variant={character} size={52} />
                </div>
                <div className="flex-1 min-w-0">
                  <FieldLabel>Name</FieldLabel>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="off"
                    className="w-full font-sans-plex text-[17px] font-medium text-[#1A1A1A] bg-transparent border-none outline-none p-0 placeholder:text-[#C4C8CC] tracking-[-0.01em]"
                  />
                </div>
              </div>

              <div className="p-4">
                <FieldLabel className="mb-2.5">Your Clerk</FieldLabel>
                <div className="grid grid-cols-4 gap-2">
                  {CHARACTERS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => pickChar(c)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 px-1.5 pt-3 pb-2.5 rounded-[14px] border-2 transition-all",
                        character === c
                          ? "bg-white/90 border-[#1A1A1A]"
                          : "bg-white/40 border-transparent hover:bg-white/80 hover:-translate-y-0.5"
                      )}
                    >
                      <ClerkCharacter variant={c} size={36} animated={false} />
                      <span className="font-mono-plex text-[9px] font-light text-[#6A7282] tracking-[0.04em]">
                        {CHARACTER_LABELS[c]}
                      </span>
                    </button>
                  ))}
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="relative flex flex-col items-center gap-1.5 px-1.5 pt-3 pb-2.5 rounded-[14px] bg-white/40 border-2 border-transparent opacity-45 cursor-not-allowed"
                    >
                      <span className="absolute top-1.5 right-1.5 text-[10px]">🔒</span>
                      <div className="h-[30px] w-9 rounded-full bg-gray-300/40" />
                      <span className="font-mono-plex text-[9px] font-light tracking-[0.04em]" style={{ color: "#C4C8CC" }}>
                        Soon
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* ── PROGRESS ── */}
            <SectionLabel className="mt-7">Your Progress</SectionLabel>
            <Card>
              <div className="flex">
                <Stat value={data.streak} label="🔥 day streak" />
                <div className="w-px bg-black/[0.07]" />
                <Stat value={data.tasks_completed} label="✓ tasks done" />
              </div>

              <div className="border-t border-black/[0.07] py-1">
                {MILESTONES.map((m, i) => {
                  const val = m.key === "streak" ? data.streak : data.tasks_completed;
                  const earned = val >= m.threshold;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex items-center gap-3.5 px-5 py-3.5",
                        i < MILESTONES.length - 1 && "border-b border-black/[0.07]"
                      )}
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-[10px] flex items-center justify-center text-[18px] flex-shrink-0",
                          earned ? "bg-[#567CF8]/10" : "bg-black/[0.04] grayscale opacity-40"
                        )}
                      >
                        {m.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "text-[13px] font-medium tracking-[-0.005em] mb-0.5",
                            earned ? "text-[#1A1A1A]" : "text-[#9CA3AF]"
                          )}
                        >
                          {m.name}
                        </div>
                        <div className="font-mono-plex text-[10px] font-light text-[#9CA3AF] leading-[1.4]">
                          {earned
                            ? m.desc
                            : `Complete ${m.threshold}${m.key === "streak" ? "-day streak" : " tasks"} to unlock`}
                        </div>
                      </div>
                      <div className="text-[14px] flex-shrink-0 text-[#567CF8]">{earned ? "✓" : ""}</div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* ── ACCOUNT ── */}
            <SectionLabel className="mt-7">Account</SectionLabel>
            <Card>
              <div className="flex items-center justify-between p-5 gap-4">
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-[#1A1A1A] mb-0.5 tracking-[-0.005em]">
                    {data.email ? "Signed in" : "Back up your tasks"}
                  </div>
                  <div className="font-mono-plex text-[11px] font-light text-[#9CA3AF] leading-[1.4] truncate">
                    {data.email ?? (
                      <>
                        Saved on this device only.<br />
                        Create an account to sync everywhere.
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toast("Coming soon — account sync is on the way.")
                  }
                  className="text-[13px] font-medium text-white bg-[#1A1A1A] rounded-[10px] px-4 py-2.5 hover:bg-[#2A2A2A] transition-colors flex-shrink-0"
                >
                  {data.email ? "Manage" : "Back up"}
                </button>
              </div>
            </Card>

            <p className="text-center font-mono-plex text-[10px] font-light text-[#9CA3AF] tracking-[0.04em] mt-8">
              Clerk · Early Access
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "font-mono-plex text-[10px] font-normal text-[#9CA3AF] uppercase tracking-[0.1em] mb-2.5 px-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "font-mono-plex text-[10px] font-normal text-[#9CA3AF] uppercase tracking-[0.08em] mb-1.5",
        className
      )}
    >
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[16px] overflow-hidden border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
      style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)" }}
    >
      {children}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 px-5 py-[18px] flex flex-col gap-1">
      <span
        className="font-mono-plex text-[28px] font-light text-[#1A1A1A] leading-none"
        style={{ letterSpacing: "-0.03em" }}
      >
        {value}
      </span>
      <span className="font-mono-plex text-[10px] font-light text-[#9CA3AF] tracking-[0.05em]">{label}</span>
    </div>
  );
}
