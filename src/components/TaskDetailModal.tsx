import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MobileSheetHeader } from "@/components/ui/sheet-header";
import { cn } from "@/lib/utils";
import type { ClerkCol, TaskCardData } from "@/components/TaskCard";

const COL_TITLES: Record<ClerkCol, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  upcoming: "Upcoming",
  someday: "Someday",
};
const COLS: ClerkCol[] = ["today", "tomorrow", "upcoming", "someday"];
const SWATCHES = ["#CEDAFF", "#FFF7CE", "#CEFFE7", "#FFCEFB"];

export type TaskPatch = Partial<
  Pick<TaskCardData, "title" | "task_time" | "location" | "category" | "cat_color" | "due_date">
>;

interface Props {
  task: TaskCardData | null;
  onOpenChange: (open: boolean) => void;
  onPatch: (id: string, patch: TaskPatch) => void;
  onMove: (task: TaskCardData, col: ClerkCol) => void;
  onDelete: (task: TaskCardData) => void;
}

export function TaskDetailModal({ task, onOpenChange, onPatch, onMove, onDelete }: Props) {
  const [local, setLocal] = useState<TaskCardData | null>(task);
  const debounceRef = useRef<number | null>(null);
  const titleRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // Only re-sync when the modal opens with a different task. This prevents
    // wiping in-flight typed input when the parent swaps a draft for the
    // freshly-inserted real task (different id, same logical task).
    setLocal((prev) => {
      if (prev && task && prev.id !== task.id && task.id.startsWith("draft-") === false && prev.id.startsWith("draft-")) {
        // Draft → real task swap: keep the user's local edits, adopt new id/fields they haven't touched.
        return { ...task, title: prev.title, task_time: prev.task_time, location: prev.location, category: prev.category, cat_color: prev.cat_color, due_date: prev.due_date };
      }
      return task;
    });
    // Autofocus title when opened with an empty title (per-column add flow)
    if (task && task.title === "") {
      window.setTimeout(() => titleRef.current?.focus(), 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  function update(patch: TaskPatch) {
    if (!local) return;
    const next = { ...local, ...patch };
    setLocal(next);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      onPatch(local.id, patch);
    }, 400);
  }

  if (!local) return null;
  const otherCols = COLS.filter((c) => c !== local.col);

  return (
    <Dialog open={!!task} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] p-0 overflow-hidden bg-background [&>button]:hidden md:[&>button]:inline-flex">
        {/* Mobile-only sheet header (Settings-style); desktop keeps the corner X */}
        <div className="md:hidden">
          <MobileSheetHeader title="Task" onClose={() => onOpenChange(false)} />
        </div>
        <div className="overflow-y-auto max-h-[92vh] md:max-h-none pb-28 md:pb-0">
        <div className="grid md:grid-cols-[1fr_280px] gap-0">
          {/* Left */}
          <div className="p-7 pr-5 flex flex-col gap-7 min-w-0">
            <textarea
              ref={titleRef}
              value={local.title}
              onChange={(e) => update({ title: e.target.value })}
              rows={2}
              placeholder="Task name"
              className="font-plex font-medium text-[24px] leading-[1.2] text-[#2A2A2A] bg-transparent border-none outline-none resize-none w-full placeholder:text-[#D1D5DB]"
            />
            {local.reason && (
              <div className="rounded-[12px] bg-[#F7F7F5] border border-[#EBEBEB] px-4 py-3">
                <div className="font-jb-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <span>✦</span> Clerk's reasoning
                </div>
                <p className="font-plex text-[14px] italic text-[#4A4A4A] leading-[1.5]">
                  {local.reason}
                </p>
              </div>
            )}
            <div>
              <div className="font-jb-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-2.5">
                Move to
              </div>
              <div className="flex flex-wrap gap-1.5">
                {otherCols.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onMove(local, c)}
                    className="font-sans text-[12px] font-medium text-[#2A2A2A] border border-[#EBEBEB] rounded-md px-2.5 py-1.5 hover:bg-foreground hover:text-background hover:border-foreground transition-colors"
                  >
                    → {COL_TITLES[c]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="p-7 pl-5 md:border-l border-divider flex flex-col">
            <Field label="Time">
              <input
                value={local.task_time ?? ""}
                onChange={(e) => update({ task_time: e.target.value || null })}
                placeholder="e.g. 9:00 AM"
                className="w-full bg-transparent border-none outline-none font-plex text-[14px] text-[#2A2A2A] placeholder:text-[#C4C8CC]"
              />
            </Field>
            <Field label="Location">
              <input
                value={local.location ?? ""}
                onChange={(e) => update({ location: e.target.value || null })}
                placeholder="e.g. Target"
                className="w-full bg-transparent border-none outline-none font-plex text-[14px] text-[#2A2A2A] placeholder:text-[#C4C8CC]"
              />
            </Field>
            <Field label="Tag">
              <div className="flex items-center gap-2">
                <input
                  value={local.category ?? ""}
                  onChange={(e) => update({ category: e.target.value || null })}
                  placeholder="e.g. Work"
                  className="flex-1 min-w-0 bg-transparent border-none outline-none font-plex text-[14px] text-[#2A2A2A] placeholder:text-[#C4C8CC]"
                />
                <div className="flex items-center gap-1">
                  {SWATCHES.map((bg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => update({ cat_color: i })}
                      aria-label={`Color ${i + 1}`}
                      className={cn(
                        "h-4 w-4 rounded-full border transition-transform hover:scale-110",
                        local.cat_color === i ? "border-[#6B7280]" : "border-transparent"
                      )}
                      style={{ background: bg }}
                    />
                  ))}
                </div>
              </div>
            </Field>
            <Field label="Date" last>
              <input
                value={local.due_date ?? ""}
                onChange={(e) => update({ due_date: e.target.value || null })}
                placeholder="e.g. Friday"
                className="w-full bg-transparent border-none outline-none font-plex text-[14px] text-[#2A2A2A] placeholder:text-[#C4C8CC]"
              />
            </Field>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => onDelete(local)}
                className="font-sans text-[13px] font-medium text-[#DC2626] border border-[#FCA5A5] rounded-full px-4 py-2 hover:bg-[#FEF2F2] transition-colors"
              >
                Delete task
              </button>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("py-2.5", !last && "border-b border-[#F0F0EF]")}>
      <div className="font-jb-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
