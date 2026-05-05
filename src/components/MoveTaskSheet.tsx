import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MobileDragHandle } from "@/components/ui/drag-handle";
import { cn } from "@/lib/utils";
import type { ClerkCol, TaskCardData } from "@/components/TaskCard";

const COL_LABEL: Record<ClerkCol, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  upcoming: "Upcoming",
  someday: "Someday",
};
const COL_BG: Record<ClerkCol, string> = {
  today: "#CEDAFF",
  tomorrow: "#FFF7CE",
  upcoming: "#CEFFE7",
  someday: "#FFCEFB",
};
const ALL_COLS: ClerkCol[] = ["today", "tomorrow", "upcoming", "someday"];

interface Props {
  task: TaskCardData | null;
  onOpenChange: (open: boolean) => void;
  onMove: (col: ClerkCol) => void;
}

export function MoveTaskSheet({ task, onOpenChange, onMove }: Props) {
  return (
    <Sheet open={!!task} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 rounded-t-[20px] border-t max-h-[80vh] [&>button]:hidden"
      >
        <MobileDragHandle />
        <div className="px-5 pt-1 pb-3 text-center text-[15px] font-semibold tracking-[-0.01em] text-[#1A1A1A] border-b border-black/[0.06]">
          Move task
        </div>
        {task && (
          <div className="px-5 pt-4 pb-6">
            <div className="font-plex text-[15px] text-[#2A2A2A] mb-4 line-clamp-2">
              {task.title || "Untitled"}
            </div>
            <div className="flex flex-col gap-2">
              {ALL_COLS.map((c) => {
                const isCurrent = c === task.col;
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => onMove(c)}
                    className={cn(
                      "flex items-center justify-between rounded-[12px] px-4 py-3.5 border border-[#D7D7D7] transition-colors text-left",
                      isCurrent
                        ? "opacity-50 cursor-default bg-white"
                        : "bg-white hover:bg-black/[0.03] active:bg-black/[0.05]"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ background: COL_BG[c] }}
                      />
                      <span className="font-plex text-[15px] font-medium text-[#2A2A2A]">
                        {COL_LABEL[c]}
                      </span>
                    </span>
                    {isCurrent && (
                      <span className="font-plex-mono text-[10px] uppercase tracking-wider text-faint">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
