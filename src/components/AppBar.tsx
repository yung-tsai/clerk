import { useEffect, useRef, useState } from "react";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import type { CharacterVariant } from "@/lib/characters";
import { cn } from "@/lib/utils";
import { Calendar, Columns3, CheckCircle2, Settings, LogOut } from "lucide-react";

interface AppBarProps {
  variant: CharacterVariant;
  thinking: boolean;
  bubble: string;
  bubbleVisible: boolean;
  view: "focus" | "planner";
  inputValue: string;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
  onSetView: (v: "focus" | "planner") => void;
  onOpenSettings: () => void;
  onOpenCompleted: () => void;
  onSignOut: () => void;
}

export function AppBar({
  variant,
  thinking,
  bubble,
  bubbleVisible,
  view,
  inputValue,
  onInputChange,
  onSubmit,
  onSetView,
  onOpenSettings,
  onOpenCompleted,
  onSignOut,
}: AppBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDoc);
    return () => window.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  return (
    <div
      ref={containerRef}
      className="fixed left-1/2 z-[200] -translate-x-1/2"
      style={{ bottom: 28 }}
    >
      <div className="relative flex flex-col items-center gap-2.5">
        {/* Speech bubble */}
        <div
          className={cn(
            "absolute right-0 z-[400] max-w-[280px] rounded-[10px] bg-[#1A1A1A] px-3 py-2 text-center font-sans text-[12px] font-normal leading-[1.4] text-white pointer-events-none transition-all duration-200",
            bubbleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"
          )}
          style={{ bottom: "calc(100% + 8px)" }}
        >
          {bubble}
        </div>

        {/* Glass pill */}
        <div
          className={cn(
            "flex flex-col overflow-hidden bg-white border border-black/10 shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-[border-radius] duration-300",
            menuOpen ? "rounded-[20px]" : "rounded-[28px]"
          )}
          style={{ width: "min(500px, calc(100vw - 32px))" }}
        >
          {/* Upward menu panel */}
          <div
            className={cn(
              "w-full overflow-hidden transition-all duration-300",
              menuOpen ? "max-h-[260px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <MenuItem
              icon={<Calendar className="w-[15px] h-[15px] opacity-45" />}
              label="Focus"
              active={view === "focus"}
              onClick={() => {
                onSetView("focus");
                setMenuOpen(false);
              }}
            />
            <MenuItem
              icon={<Columns3 className="w-[15px] h-[15px] opacity-45" />}
              label="Planner"
              active={view === "planner"}
              onClick={() => {
                onSetView("planner");
                setMenuOpen(false);
              }}
            />
            <MenuItem
              icon={<CheckCircle2 className="w-[15px] h-[15px] opacity-45" />}
              label="Completed"
              onClick={() => {
                onOpenCompleted();
                setMenuOpen(false);
              }}
            />
            <MenuItem
              icon={<Settings className="w-[15px] h-[15px] opacity-45" />}
              label="Settings"
              onClick={() => {
                onOpenSettings();
                setMenuOpen(false);
              }}
            />
            <MenuItem
              icon={<LogOut className="w-[15px] h-[15px] opacity-45" />}
              label="Sign out"
              danger
              onClick={() => {
                onSignOut();
                setMenuOpen(false);
              }}
            />
          </div>

          {/* Pill row */}
          <div className="flex items-center w-full px-2.5 py-1 gap-2 overflow-hidden">
            {/* Hamburger */}
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex flex-col gap-1 pr-2 py-1.5 hover:opacity-60 transition-opacity flex-shrink-0"
            >
              <span className="block w-[18px] h-0.5 bg-[#444] rounded" />
              <span className="block w-[18px] h-0.5 bg-[#444] rounded" />
              <span className="block w-[18px] h-0.5 bg-[#444] rounded" />
            </button>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              disabled={thinking}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !thinking && inputValue.trim()) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              placeholder={thinking ? "Thinking..." : "What needs doing?"}
              className="flex-1 min-w-0 w-0 border-none bg-transparent font-sans text-[14px] text-[#2A2A2A] placeholder:text-[#B0B0B0] outline-none px-2 py-1"
            />

            {/* Character */}
            <div className="flex-shrink-0">
              <ClerkCharacter
                variant={variant}
                size={40}
                thinking={thinking}
                onClick={() => inputRef.current?.focus()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  active,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-4 py-[11px] font-sans text-[13px] font-medium text-left whitespace-nowrap border-b border-black/5 last:border-b-0 hover:bg-black/[0.03] transition-colors",
        active && "text-[#567CF8]",
        danger && "text-[#DC2626]",
        !active && !danger && "text-[#1A1A1A]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
