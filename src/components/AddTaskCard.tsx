import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onAdd: () => void;
  className?: string;
}

/**
 * Per-column "Add task" affordance. Dashed card matching TaskCard width/radius.
 * Click → caller creates a blank task in that column and opens the detail modal.
 */
export function AddTaskCard({ onAdd, className }: Props) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label="Add task to this column"
      className={cn(
        "group w-full max-w-[380px] rounded-[12px] border border-dashed border-[#D7D7D7] bg-transparent",
        "h-[56px] flex items-center justify-center",
        "transition-colors hover:border-[#9CA3AF] hover:bg-white/40",
        className
      )}
    >
      <Plus className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#4B5563] transition-colors" />
    </button>
  );
}
