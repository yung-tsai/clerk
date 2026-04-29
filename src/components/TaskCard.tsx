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
  onOpen: () => void;
}

const CAT_BG = ["#CEDAFF", "#FFF7CE", "#CEFFE7", "#FFCEFB"];

export function TaskCard({ task, onComplete, onOpen }: Props) {
  return (
    <div
      onClick={onOpen}
      className={cn(
        "animate-card-in group cursor-pointer select-none",
        "w-full max-w-[380px] rounded-[12px] p-4 transition-shadow",
        "border border-[#D7D7D7] bg-white/50",
        "hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)]"
      )}
    >
      {/* Top row: time | tag */}
      <div className="flex items-center justify-between gap-3 mb-2 min-h-[18px]">
        <span className="font-plex-mono text-[12px] text-[#2A2A2A] truncate">
          {task.task_time
            ? `${task.task_time}${task.due_date ? ` | ${task.due_date}` : ""}`
            : task.due_date
              ? task.due_date
              : <span className="text-faint">Add time</span>}
        </span>
        {task.category ? (
          <span
            className="font-jb-mono text-[9px] uppercase tracking-[0.06em] text-[#2A2A2A] rounded-[3px] px-1.5 py-0.5 whitespace-nowrap"
            style={{ background: CAT_BG[task.cat_color % 4] }}
          >
            {task.category}
          </span>
        ) : (
          <span className="font-plex-mono text-[12px] text-faint whitespace-nowrap">Add tag</span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-plex font-medium text-[18px] leading-[1.28] text-[#2A2A2A] break-words line-clamp-2">
        {task.title}
      </h3>

      {/* Bottom row: location | check */}
      <div className="mt-2 flex items-center justify-between gap-3 min-h-[22px]">
        <span className="font-plex-mono text-[12px] text-[#2A2A2A] truncate">
          {task.location ? `@${task.location}` : <span className="text-faint">Add location</span>}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          aria-label="Mark complete"
          className="h-[22px] w-[22px] rounded-full border border-[#939393] bg-white transition-colors hover:border-[#567CF8] flex-shrink-0"
        />
      </div>
    </div>
  );
}
