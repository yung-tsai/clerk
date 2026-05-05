import { cn } from "@/lib/utils";

/**
 * iOS-style sheet drag handle. Visual affordance only — tap-outside still
 * closes the sheet. Render at the very top of a mobile bottom-sheet body.
 */
export function MobileDragHandle({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "md:hidden flex justify-center pt-2.5 pb-1.5 shrink-0",
        className,
      )}
      aria-hidden
    >
      <span className="block h-1 w-9 rounded-full bg-black/20" />
    </div>
  );
}
