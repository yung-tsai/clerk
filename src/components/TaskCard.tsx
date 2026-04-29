import { useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ClerkCol = "today" | "tomorrow" | "upcoming" | "someday";

export interface TaskCardData {
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
}

interface Props {
  task: TaskCardData;
  onComplete: () => void;
  onDelete: () => void;
  onMove: (col: ClerkCol) => void;
}

const ALL_COLS: ClerkCol[] = ["today", "tomorrow", "upcoming", "someday"];
const CAT_BG = ["#CEDAFF", "#FFF7CE", "#CEFFE7", "#FFCEFB"];

export function TaskCard({ task, onComplete, onDelete, onMove }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className={cn(
        "animate-card-in group cursor-pointer select-none",
        "w-full max-w-[380px] rounded-[12px] p-4 transition-shadow",
        "border border-[#D7D7D7] bg-white/50",
        expanded
          ? "shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          : "hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)]"
      )}
    >
      {/* Top row: title */}
      <div className="flex items-start justify-between gap-3">
        <h3
          className={cn(
            "font-plex font-medium text-[18px] leading-[1.28] text-[#2A2A2A] break-words flex-1",
            !expanded && "line-clamp-2"
          )}
        >
          {task.title}
        </h3>
      </div>

      {/* Meta row: time / location */}
      {(task.task_time || task.location) && (
        <div className="mt-2 flex items-center gap-2 font-plex-mono text-[12px] text-[#2A2A2A]">
          {task.task_time && <span>{task.task_time}</span>}
          {task.task_time && task.location && <span className="text-faint">·</span>}
          {task.location && <span>{task.location}</span>}
        </div>
      )}

      {/* Tags row */}
      {(task.category || task.due_date) && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {task.category && (
            <span
              className="font-plex-mono text-[12px] text-[#2A2A2A] rounded-md px-2 py-0.5"
              style={{ background: CAT_BG[task.cat_color % 4] }}
            >
              {task.category}
            </span>
          )}
          {task.due_date && (
            <span className="font-jb-mono text-[8.5px] uppercase tracking-[0.08em] text-[#2A2A2A] border border-[#E5E7EB] bg-[#F9FAFB] rounded-[3px] px-1.5 py-0.5">
              {task.due_date}
            </span>
          )}
        </div>
      )}

      {/* Reason (italic mono) */}
      {task.reason && (
        <div className="mt-2 font-plex-mono text-[11px] italic text-muted-foreground">
          {task.reason}
        </div>
      )}

      {/* Bottom row: complete circle */}
      <div className="mt-2 flex items-center justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          aria-label="Mark complete"
          className="h-[22px] w-[22px] rounded-full border border-[#939393] bg-white transition-colors hover:border-[#567CF8]"
        />
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#EBEBEB] flex items-center gap-1.5 flex-wrap">
          {ALL_COLS.filter((c) => c !== task.col).map((c) => (
            <button
              key={c}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMove(c);
              }}
              className="font-sans text-[11px] font-medium text-faint border border-[#EBEBEB] rounded-md px-2 py-1 hover:text-foreground hover:border-[#9CA3AF] hover:bg-[#F9FAFB] transition-colors whitespace-nowrap"
            >
              → {c}
            </button>
          ))}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete"
            className="ml-auto font-sans text-[11px] font-medium text-faint border border-[#EBEBEB] rounded-md px-2 py-1 hover:text-[#DC2626] hover:border-[#FCA5A5] hover:bg-[#FEF2F2] transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
