import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import type { CharacterVariant } from "@/lib/characters";
import { getLovableCloudClient } from "@/lib/lovable-cloud";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  variant: CharacterVariant;
}

interface CompletedRow {
  id: string;
  title: string;
  category: string | null;
  cat_color: number;
  completed_at: string;
}

const CAT_BG = ["#CEDAFF", "#FFF7CE", "#CEFFE7", "#FFCEFB"];

type Bucket = "Today" | "Yesterday" | "This week" | "Earlier";

function bucketFor(iso: string): Bucket {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This week";
  return "Earlier";
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CompletedModal({ open, onOpenChange, userId, variant }: Props) {
  const [rows, setRows] = useState<CompletedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const supabase = await getLovableCloudClient();
      const { data, error } = await supabase
        .from("completed_tasks")
        .select("id, title, category, cat_color, completed_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      if (error) {
        toast.error(error.message);
        setRows([]);
      } else {
        setRows((data as CompletedRow[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const buckets: Record<Bucket, CompletedRow[]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    Earlier: [],
  };
  for (const r of rows) buckets[bucketFor(r.completed_at)].push(r);
  const orderedBuckets: Bucket[] = ["Today", "Yesterday", "This week", "Earlier"];

  async function clearHistory() {
    setClearing(true);
    try {
      const supabase = await getLovableCloudClient();
      const { error } = await supabase.from("completed_tasks").delete().eq("user_id", userId);
      if (error) {
        toast.error(error.message);
      } else {
        setRows([]);
        toast.success("History cleared.");
      }
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[560px] p-0 gap-0 border-none shadow-none bg-transparent [&>button]:hidden">
          <div
            className="rounded-[20px] overflow-hidden max-h-[85vh] flex flex-col"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 10% 10%, rgba(206,255,231,0.4) 0%, transparent 100%), radial-gradient(ellipse 50% 45% at 90% 5%, rgba(185,205,255,0.3) 0%, transparent 100%), #F5F5F3",
            }}
          >
            {/* Header */}
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
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#1A1A1A]">
                Completed
                {!loading && rows.length > 0 && (
                  <span className="ml-2 font-mono-plex text-[11px] font-light text-[#9CA3AF]">
                    {rows.length}{rows.length === 200 ? "+" : ""}
                  </span>
                )}
              </span>
              {rows.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-[12px] font-medium text-[#DC2626] hover:opacity-70 transition-opacity"
                >
                  Clear
                </button>
              ) : (
                <span className="w-[40px]" aria-hidden />
              )}
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-5 pt-5 pb-7 flex-1">
              {loading ? (
                <p className="font-mono-plex text-[12px] text-[#9CA3AF] text-center py-12">Loading…</p>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <ClerkCharacter variant={variant} size={56} animated={false} />
                  <p className="font-plex text-[15px] text-[#6A7282] italic text-center">
                    Nothing yet. Go finish something.
                  </p>
                </div>
              ) : (
                orderedBuckets.map((b) =>
                  buckets[b].length === 0 ? null : (
                    <div key={b} className="mb-6 last:mb-0">
                      <div className="font-mono-plex text-[10px] font-normal text-[#9CA3AF] uppercase tracking-[0.1em] mb-2.5 px-0.5">
                        {b}
                      </div>
                      <div
                        className="rounded-[16px] overflow-hidden border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
                        style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)" }}
                      >
                        {buckets[b].map((r, i) => (
                          <div
                            key={r.id}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3",
                              i < buckets[b].length - 1 && "border-b border-black/[0.06]"
                            )}
                          >
                            <span className="text-[#567CF8] text-[14px] flex-shrink-0">✓</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-plex text-[14px] text-[#2A2A2A] line-through decoration-[#C4C8CC] truncate">
                                {r.title}
                              </div>
                            </div>
                            {r.category && (
                              <span
                                className="font-jb-mono text-[9px] uppercase tracking-[0.06em] text-[#2A2A2A] rounded-[3px] px-1.5 py-0.5 whitespace-nowrap flex-shrink-0"
                                style={{ background: CAT_BG[r.cat_color % 4] }}
                              >
                                {r.category}
                              </span>
                            )}
                            <span className="font-plex-mono text-[11px] text-[#9CA3AF] flex-shrink-0 w-[60px] text-right">
                              {timeLabel(r.completed_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear completed history?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {rows.length} completed task{rows.length === 1 ? "" : "s"} from your history. Streaks and totals stay. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                clearHistory();
              }}
              disabled={clearing}
              className="bg-[#DC2626] hover:bg-[#B91C1C]"
            >
              {clearing ? "Clearing…" : "Clear history"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
