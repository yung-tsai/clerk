import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ClerkCharacterProps {
  size?: number;
  thinking?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Clerk's mascot — blue star with two eyes.
 * Pupils follow cursor; eyelids blink every 3-5s.
 */
export const ClerkCharacter = forwardRef<HTMLButtonElement, ClerkCharacterProps>(function ClerkCharacter(
  { size = 60, thinking = false, onClick, className },
  forwardedRef
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pupilLRef = useRef<SVGEllipseElement>(null);
  const pupilRRef = useRef<SVGEllipseElement>(null);
  const lidLRef = useRef<SVGRectElement>(null);
  const lidRRef = useRef<SVGRectElement>(null);
  const [squish, setSquish] = useState(false);

  // Eyes follow cursor
  useEffect(() => {
    const baseL = { cx: 54.5, cy: 73 };
    const baseR = { cx: 73.6385, cy: 72.2419 };
    const handle = (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.min(Math.hypot(dx, dy), 220);
      const k = (dist / 220) * 4; // max 4 svg units
      const angle = Math.atan2(dy, dx);
      const ox = Math.cos(angle) * k;
      const oy = Math.sin(angle) * k;
      pupilLRef.current?.setAttribute("cx", (baseL.cx + ox).toString());
      pupilLRef.current?.setAttribute("cy", (baseL.cy + oy).toString());
      pupilRRef.current?.setAttribute("cx", (baseR.cx + ox).toString());
      pupilRRef.current?.setAttribute("cy", (baseR.cy + oy).toString());
    };
    window.addEventListener("pointermove", handle);
    return () => window.removeEventListener("pointermove", handle);
  }, []);

  // Blink loop
  useEffect(() => {
    let raf: number;
    let nextBlink = performance.now() + 2500 + Math.random() * 2000;
    let blinking = false;
    let blinkStart = 0;
    const BLINK_MS = 140;

    const tick = (t: number) => {
      if (!blinking && t >= nextBlink) {
        blinking = true;
        blinkStart = t;
      }
      if (blinking) {
        const p = Math.min(Math.max((t - blinkStart) / BLINK_MS, 0), 1);
        // 0->1->0
        const h = (p < 0.5 ? p * 2 : (1 - p) * 2) * 22;
        lidLRef.current?.setAttribute("height", h.toString());
        lidRRef.current?.setAttribute("height", h.toString());
        if (p >= 1) {
          blinking = false;
          lidLRef.current?.setAttribute("height", "0");
          lidRRef.current?.setAttribute("height", "0");
          nextBlink = t + 2500 + Math.random() * 2500;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClick = () => {
    setSquish(true);
    setTimeout(() => setSquish(false), 220);
    onClick?.();
  };

  const w = size;
  const h = (size / 137) * 115;

  return (
    <button
      ref={forwardedRef}
      type="button"
      onClick={handleClick}
      aria-label="Clerk"
      className={cn(
        "inline-flex items-center justify-center bg-transparent border-0 p-0 cursor-pointer",
        "animate-float transition-transform",
        squish && "scale-90",
        thinking && "animate-pulse",
        className
      )}
    >
      <svg
        ref={svgRef}
        width={w}
        height={h}
        viewBox="0 0 137 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <path
          d="M60.5962 39.5038L78.1603 0L93.9679 39.5038L119.436 35.9924L111.532 57.0611L137 74.6183L103.628 83.3969L111.532 113.244L72.0128 96.5649L63.2308 115L45.6667 96.5649L16.6859 108.855L30.7372 80.7634L0 57.0611L33.3718 55.3053L30.7372 21.0687L60.5962 39.5038Z"
          fill="hsl(var(--primary))"
        />
        <path
          d="M29.4484 51.6281C33.128 48.284 44.4827 41.4071 60.4649 40.6519C76.4471 39.8967 90.7304 45.5622 95.8743 48.4893"
          stroke="#1A1A1A"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <ellipse cx="50" cy="67.4998" rx="15" ry="19.5" fill="white" />
        <ellipse ref={pupilLRef} cx="54.5" cy="73" rx="7.5" ry="10" fill="#1A1A1A" />
        <ellipse
          cx="76.6471"
          cy="66.4999"
          rx="15.1057"
          ry="19.2597"
          transform="rotate(-4.98711 76.6471 66.4999)"
          fill="white"
        />
        <ellipse
          ref={pupilRRef}
          cx="73.6385"
          cy="72.2419"
          rx="7.93048"
          ry="10.1963"
          transform="rotate(-7.4301 73.6385 72.2419)"
          fill="#1A1A1A"
        />
        <clipPath id="clerk-clip-l">
          <ellipse cx="50" cy="67.4998" rx="15" ry="19.5" />
        </clipPath>
        <clipPath id="clerk-clip-r">
          <ellipse
            cx="76.6471"
            cy="66.4999"
            rx="15.1057"
            ry="19.2597"
            transform="rotate(-4.98711 76.6471 66.4999)"
          />
        </clipPath>
        <rect
          ref={lidLRef}
          x="35"
          y="48"
          width="30"
          height="0"
          fill="hsl(var(--primary))"
          clipPath="url(#clerk-clip-l)"
        />
        <rect
          ref={lidRRef}
          x="61"
          y="47"
          width="32"
          height="0"
          fill="hsl(var(--primary))"
          clipPath="url(#clerk-clip-r)"
        />
      </svg>
    </button>
  );
});
