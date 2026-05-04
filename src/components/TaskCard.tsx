import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  draggable?: boolean;
  /** When true, render as a static "lifted" card for DragOverlay */
  overlay?: boolean;
  /** Mobile-only: tap-to-move column chip handler */
  onMoveCol?: (col: ClerkCol) => void;
}

const CAT_BG = ["#CEDAFF", "#FFF7CE", "#CEFFE7", "#FFCEFB"];

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

export function TaskCard({ task, onComplete, onOpen, draggable = true, overlay = false, onMoveCol }: Props) {
  const sortable = useSortable({ id: task.id, disabled: !draggable || overlay });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const isMobile = useIsMobile();
  const [pickerOpen, setPickerOpen] = useState(false);

  const style = overlay
    ? undefined
    : draggable
      ? {
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.4 : 1,
        }
      : undefined;

  return (
    <div
      ref={overlay ? undefined : draggable ? setNodeRef : undefined}
      style={style}
      {...(!overlay && draggable ? attributes : {})}
      {...(!overlay && draggable ? listeners : {})}
      onPointerDown={(e) => {
        downPos.current = { x: e.clientX, y: e.clientY };
        movedRef.current = false;
      }}
      onPointerMove={(e) => {
        if (!downPos.current) return;
        const dx = e.clientX - downPos.current.x;
        const dy = e.clientY - downPos.current.y;
        if (Math.hypot(dx, dy) > 4) movedRef.current = true;
      }}
      onClick={(e) => {
        // Suppress click if a real drag happened
        if (movedRef.current || isDragging) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onOpen();
      }}
      className={cn(
        "animate-card-in group select-none",
        "w-full max-w-[380px] rounded-[12px] p-4 transition-shadow",
        "border border-[#D7D7D7] bg-white/50",
        !overlay && "cursor-grab active:cursor-grabbing hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)]",
        isDragging && !overlay && "shadow-[0_8px_24px_rgba(0,0,0,0.15)]",
        overlay && "cursor-grabbing shadow-[0_18px_40px_rgba(0,0,0,0.22)] scale-[1.02] -rotate-1 bg-white"
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
          onPointerDown={(e) => e.stopPropagation()}
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
