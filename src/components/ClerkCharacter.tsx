import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CharacterVariant } from "@/lib/characters";

interface ClerkCharacterProps {
  size?: number;
  thinking?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: CharacterVariant;
  /** Use the float/blink animation (default true). Disable for static contexts. */
  animated?: boolean;
}

/**
 * Clerk's mascot. Two unlocked variants: blue star, coral blob.
 * Pupils follow cursor; eyelids blink every few seconds.
 */
export const ClerkCharacter = forwardRef<HTMLButtonElement, ClerkCharacterProps>(function ClerkCharacter(
  { size = 60, thinking = false, onClick, className, variant = "blue", animated = true },
  forwardedRef
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pupilLRef = useRef<SVGEllipseElement>(null);
  const pupilRRef = useRef<SVGEllipseElement>(null);
  const lidLRef = useRef<SVGRectElement>(null);
  const lidRRef = useRef<SVGRectElement>(null);
  const [squish, setSquish] = useState(false);

  const cfg = variant === "coral" ? CORAL : BLUE;

  // Eyes follow cursor
  useEffect(() => {
    const handle = (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.min(Math.hypot(dx, dy), 220);
      const k = (dist / 220) * 4;
      const angle = Math.atan2(dy, dx);
      const ox = Math.cos(angle) * k;
      const oy = Math.sin(angle) * k;
      pupilLRef.current?.setAttribute("cx", (cfg.pupilL.cx + ox).toString());
      pupilLRef.current?.setAttribute("cy", (cfg.pupilL.cy + oy).toString());
      pupilRRef.current?.setAttribute("cx", (cfg.pupilR.cx + ox).toString());
      pupilRRef.current?.setAttribute("cy", (cfg.pupilR.cy + oy).toString());
    };
    window.addEventListener("pointermove", handle);
    return () => window.removeEventListener("pointermove", handle);
  }, [cfg]);

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
    setTimeout(() => setSquish(false), 300);
    onClick?.();
  };

  const w = size;
  const h = (size / cfg.viewW) * cfg.viewH;
  const clipIdL = `clerk-clip-l-${variant}`;
  const clipIdR = `clerk-clip-r-${variant}`;

  return (
    <button
      ref={forwardedRef}
      type="button"
      onClick={handleClick}
      aria-label="Clerk"
      className={cn(
        "inline-flex items-center justify-center bg-transparent border-0 p-0 cursor-pointer",
        animated && !squish && "char-float",
        thinking && "char-thinking",
        squish && "char-squish",
        className
      )}
    >
      <svg
        ref={svgRef}
        width={w}
        height={h}
        viewBox={`0 0 ${cfg.viewW} ${cfg.viewH}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        {/* Body */}
        <path d={cfg.body} fill={cfg.bodyFill} />
        {/* Mouth/smile */}
        <path d={cfg.smile} stroke="#1A1A1A" strokeWidth={cfg.smileW} strokeLinecap="round" />
        {/* Left eye */}
        <ellipse cx={cfg.eyeL.cx} cy={cfg.eyeL.cy} rx={cfg.eyeL.rx} ry={cfg.eyeL.ry} fill="white" />
        <ellipse
          ref={pupilLRef}
          cx={cfg.pupilL.cx}
          cy={cfg.pupilL.cy}
          rx={cfg.pupilL.rx}
          ry={cfg.pupilL.ry}
          fill="#1A1A1A"
        />
        {/* Right eye */}
        <ellipse
          cx={cfg.eyeR.cx}
          cy={cfg.eyeR.cy}
          rx={cfg.eyeR.rx}
          ry={cfg.eyeR.ry}
          transform={cfg.eyeR.transform}
          fill="white"
        />
        <ellipse
          ref={pupilRRef}
          cx={cfg.pupilR.cx}
          cy={cfg.pupilR.cy}
          rx={cfg.pupilR.rx}
          ry={cfg.pupilR.ry}
          transform={cfg.pupilR.transform}
          fill="#1A1A1A"
        />
        {/* Lids */}
        <clipPath id={clipIdL}>
          <ellipse cx={cfg.eyeL.cx} cy={cfg.eyeL.cy} rx={cfg.eyeL.rx} ry={cfg.eyeL.ry} />
        </clipPath>
        <clipPath id={clipIdR}>
          <ellipse
            cx={cfg.eyeR.cx}
            cy={cfg.eyeR.cy}
            rx={cfg.eyeR.rx}
            ry={cfg.eyeR.ry}
            transform={cfg.eyeR.transform}
          />
        </clipPath>
        <rect
          ref={lidLRef}
          x={cfg.lidL.x}
          y={cfg.lidL.y}
          width={cfg.lidL.w}
          height={0}
          fill={cfg.bodyFill}
          clipPath={`url(#${clipIdL})`}
        />
        <rect
          ref={lidRRef}
          x={cfg.lidR.x}
          y={cfg.lidR.y}
          width={cfg.lidR.w}
          height={0}
          fill={cfg.bodyFill}
          clipPath={`url(#${clipIdR})`}
        />
      </svg>
    </button>
  );
});

const BLUE = {
  viewW: 137,
  viewH: 115,
  bodyFill: "#567CF8",
  body:
    "M60.5962 39.5038L78.1603 0L93.9679 39.5038L119.436 35.9924L111.532 57.0611L137 74.6183L103.628 83.3969L111.532 113.244L72.0128 96.5649L63.2308 115L45.6667 96.5649L16.6859 108.855L30.7372 80.7634L0 57.0611L33.3718 55.3053L30.7372 21.0687L60.5962 39.5038Z",
  smile:
    "M29.4484 51.6281C33.128 48.284 44.4827 41.4071 60.4649 40.6519C76.4471 39.8967 90.7304 45.5622 95.8743 48.4893",
  smileW: 5,
  eyeL: { cx: 50, cy: 67.4998, rx: 15, ry: 19.5 },
  eyeR: { cx: 76.6471, cy: 66.4999, rx: 15.1057, ry: 19.2597, transform: "rotate(-4.98711 76.6471 66.4999)" },
  pupilL: { cx: 54.5, cy: 73, rx: 7.5, ry: 10 },
  pupilR: { cx: 73.6385, cy: 72.2419, rx: 7.93048, ry: 10.1963, transform: "rotate(-7.4301 73.6385 72.2419)" },
  lidL: { x: 35, y: 48, w: 30 },
  lidR: { x: 61, y: 47, w: 32 },
};

const CORAL = {
  viewW: 120,
  viewH: 110,
  bodyFill: "#FF6B47",
  body:
    "M60 10 C78 8 98 18 104 36 C112 56 108 80 94 94 C80 108 56 112 36 102 C16 92 6 68 10 46 C14 24 30 12 60 10Z",
  smile: "M28 45C32 42 42 37 56 36C70 35 82 40 87 43",
  smileW: 4,
  eyeL: { cx: 46, cy: 62, rx: 13, ry: 16 },
  eyeR: { cx: 72, cy: 61, rx: 13, ry: 16, transform: "rotate(-3 72 61)" },
  pupilL: { cx: 50, cy: 66, rx: 6.5, ry: 8.5 },
  pupilR: { cx: 69, cy: 65, rx: 6.5, ry: 8.5, transform: "rotate(-5 69 65)" },
  lidL: { x: 31, y: 42, w: 26 },
  lidR: { x: 57, y: 41, w: 28 },
};
