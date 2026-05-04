import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CharacterVariant } from "@/lib/characters";

export type Expression = "neutral" | "determined";

interface ClerkCharacterProps {
  size?: number;
  thinking?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: CharacterVariant;
  /** Override expression. If omitted, `thinking` implies "determined". */
  expression?: Expression;
  /** Use the float/blink animation (default true). Disable for static contexts. */
  animated?: boolean;
}

/**
 * Wes — Clerk's mascot. Three body variants (wes, wes-v2, wes-v3) and two
 * expressions (neutral, determined). Pupils follow cursor; eyelids blink
 * every few seconds.
 */
export const ClerkCharacter = forwardRef<HTMLButtonElement, ClerkCharacterProps>(function ClerkCharacter(
  { size = 60, thinking = false, onClick, className, variant = "wes", expression, animated = true },
  forwardedRef
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pupilLRef = useRef<SVGEllipseElement>(null);
  const pupilRRef = useRef<SVGEllipseElement>(null);
  const lidLRef = useRef<SVGRectElement>(null);
  const lidRRef = useRef<SVGRectElement>(null);
  const [squish, setSquish] = useState(false);
  const uid = useId().replace(/:/g, "");

  const cfg = WES_VARIANTS[variant] ?? WES_VARIANTS.wes;
  const expr: Expression = expression ?? (thinking ? "determined" : "neutral");

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
      // Determined right pupil is huge; clamp tracking so it doesn't escape the eye.
      const kR = expr === "determined" ? k * 0.4 : k;
      pupilRRef.current?.setAttribute(
        "cx",
        ((expr === "determined" ? cfg.determinedPupilR.cx : cfg.pupilR.cx) + Math.cos(angle) * kR).toString()
      );
      pupilRRef.current?.setAttribute(
        "cy",
        ((expr === "determined" ? cfg.determinedPupilR.cy : cfg.pupilR.cy) + Math.sin(angle) * kR).toString()
      );
    };
    window.addEventListener("pointermove", handle);
    return () => window.removeEventListener("pointermove", handle);
  }, [cfg, expr]);

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
  const clipIdL = `clerk-clip-l-${uid}`;
  const clipIdR = `clerk-clip-r-${uid}`;
  const gradId = `clerk-grad-${uid}`;

  const bodyFill = cfg.gradient ? `url(#${gradId})` : cfg.bodyFill;

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
        {cfg.gradient && (
          <defs>
            <linearGradient
              id={gradId}
              x1={cfg.gradient.x1}
              y1={cfg.gradient.y1}
              x2={cfg.gradient.x2}
              y2={cfg.gradient.y2}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset={cfg.gradient.stop ?? 0.648} stopColor={cfg.gradient.from} />
              <stop offset="1" stopColor={cfg.gradient.to} />
            </linearGradient>
          </defs>
        )}
        {/* Body */}
        <path d={cfg.body} fill={bodyFill} />
        {/* Smile */}
        <path d={cfg.smile} stroke="#000" strokeWidth={cfg.smileW} strokeLinecap="round" />
        {/* Left eye white */}
        <ellipse
          cx={cfg.eyeL.cx}
          cy={cfg.eyeL.cy}
          rx={cfg.eyeL.rx}
          ry={cfg.eyeL.ry}
          transform={cfg.eyeL.transform}
          fill="white"
        />
        <ellipse
          ref={pupilLRef}
          cx={cfg.pupilL.cx}
          cy={cfg.pupilL.cy}
          rx={cfg.pupilL.rx}
          ry={cfg.pupilL.ry}
          transform={cfg.pupilL.transform}
          fill="#000"
        />
        {/* Right eye white */}
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
          cx={(expr === "determined" ? cfg.determinedPupilR : cfg.pupilR).cx}
          cy={(expr === "determined" ? cfg.determinedPupilR : cfg.pupilR).cy}
          rx={(expr === "determined" ? cfg.determinedPupilR : cfg.pupilR).rx}
          ry={(expr === "determined" ? cfg.determinedPupilR : cfg.pupilR).ry}
          transform={(expr === "determined" ? cfg.determinedPupilR : cfg.pupilR).transform}
          fill="#000"
        />
        {/* Lids — body-colored caps that drop down to fake a blink */}
        <clipPath id={clipIdL}>
          <ellipse
            cx={cfg.eyeL.cx}
            cy={cfg.eyeL.cy}
            rx={cfg.eyeL.rx}
            ry={cfg.eyeL.ry}
            transform={cfg.eyeL.transform}
          />
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
          fill={cfg.lidColor ?? cfg.bodyFill}
          clipPath={`url(#${clipIdL})`}
        />
        <rect
          ref={lidRRef}
          x={cfg.lidR.x}
          y={cfg.lidR.y}
          width={cfg.lidR.w}
          height={0}
          fill={cfg.lidColor ?? cfg.bodyFill}
          clipPath={`url(#${clipIdR})`}
        />
      </svg>
    </button>
  );
});

/* ─────────── Variant configs ─────────── */
// Eye/pupil/lid coords are pulled from the matrix transforms in the source SVGs.
// Translations + rx/ry give us absolute centers since the rotation component is ~negligible.

type Ellipse = { cx: number; cy: number; rx: number; ry: number; transform?: string };
type VariantCfg = {
  viewW: number;
  viewH: number;
  bodyFill: string;
  gradient?: { from: string; to: string; x1: number; y1: number; x2: number; y2: number; stop?: number };
  body: string;
  smile: string;
  smileW: number;
  eyeL: Ellipse;
  eyeR: Ellipse;
  pupilL: Ellipse;
  pupilR: Ellipse;
  determinedPupilR: Ellipse; // big closed-eye determined look
  lidL: { x: number; y: number; w: number };
  lidR: { x: number; y: number; w: number };
  lidColor?: string;
};

// Wes — peaked blob with three humps on top
const WES: VariantCfg = {
  viewW: 148,
  viewH: 113,
  bodyFill: "#567CF8",
  gradient: { from: "#567CF8", to: "#4167E2", x1: 142.5, y1: 10, x2: 13.5, y2: 77 },
  body:
    "M69.5647 14C67.398 10.1667 62.0647 2 54.0647 2C42.0647 2 28.2181 9.52034 13.2631 44C-4.73688 85.5 3.56466 109 18.0647 109C29.6647 109 38.2314 99.3333 41.5647 95C42.5647 99.3333 47.7647 109 56.5647 109C65.3647 109 76.2313 100.333 80.5647 96C81.5647 100.333 85.9647 109 95.5647 109C107.565 109 123.763 103 138.065 63.5C149.331 32.3823 146.065 2 131.065 2C119.065 2 110.065 9.66667 107.065 13.5C106.398 9.66667 102.565 2 92.5647 2C82.5647 2 73.2313 10.1667 69.5647 14Z",
  smile:
    "M42.7007 36.6717C52.6002 33.0993 64.9631 29.5599 82.2067 29.7722C101.914 30.0148 114.185 33.8657 120.297 37.6374",
  smileW: 5,
  // Right eye white: translate (79.6126, 38.6416) + rx 20.7236 ry 22.6998
  eyeR: { cx: 79.6126 + 20.7236, cy: 38.6416 + 22.6998, rx: 20.7236, ry: 22.6998 },
  eyeL: { cx: 41.1385 + 20.7236, cy: 37.6555 + 22.6998, rx: 20.7236, ry: 22.6998 },
  // Pupils: translate + rx/ry
  pupilL: { cx: 55.5933 + 10.3621, cy: 47 + 12.6805, rx: 10.3621, ry: 12.6805 },
  pupilR: { cx: 93.5933 + 10.3621, cy: 48 + 12.6805, rx: 10.3621, ry: 12.6805 },
  // From wes-determined.svg right pupil — big oval taking up most of the eye
  determinedPupilR: { cx: 66.2, cy: 60.6, rx: 10.36, ry: 12.7 },
  lidL: { x: 35, y: 38, w: 50 },
  lidR: { x: 73, y: 38, w: 55 },
};

// Wes v2 — rounded soft blob
const WES_V2: VariantCfg = {
  viewW: 125,
  viewH: 114,
  bodyFill: "#567CF8",
  gradient: { from: "#567CF8", to: "#4167E2", x1: 118.194, y1: 11.0842, x2: 4.00615, y2: 60.0229 },
  body:
    "M94.2467 11.4826C86.0517 4.81716 41.9299 -2.56188 31.5 5.5842C21.0701 15.2127 15.3314 26.9947 10.5825 39.5843C1.64276 63.2838 1.12262 88.5046 6.33758 98.8731C10.5825 107.313 34.6474 109.982 59.2322 109.982C83.817 109.982 107.825 110.378 119 94.0842C130.175 77.7908 102.442 18.1481 94.2467 11.4826Z",
  smile:
    "M27.0825 36.7499C36.5949 33.3172 48.4744 29.9162 65.0437 30.1202C83.9802 30.3533 95.7712 34.0536 101.645 37.6778",
  smileW: 5,
  eyeR: { cx: 62.6952 + 20.7236, cy: 39.0703 + 22.6998, rx: 20.7236, ry: 22.6998 },
  eyeL: { cx: 24.2211 + 20.7236, cy: 38.0845 + 22.6998, rx: 20.7236, ry: 22.6998 },
  pupilL: { cx: 38.6759 + 10.3621, cy: 47.4287 + 12.6805, rx: 10.3621, ry: 12.6805 },
  pupilR: { cx: 76.6759 + 10.3621, cy: 48.4287 + 12.6805, rx: 10.3621, ry: 12.6805 },
  determinedPupilR: { cx: 76.6759 + 10.3621, cy: 48.4287 + 12.6805, rx: 10.36, ry: 12.7 },
  lidL: { x: 18, y: 38, w: 50 },
  lidR: { x: 56, y: 38, w: 55 },
};

// Wes v3 — squiggly blob
const WES_V3: VariantCfg = {
  viewW: 105,
  viewH: 103,
  bodyFill: "#567CF8",
  body:
    "M17.22 103C28.1047 103 34.6053 93.8912 36.4951 89.3367C38.0068 93.8912 39.8965 103 50.101 103C60.3054 103 64.5985 94.8571 68 87.5C71.0235 92.7551 76 100.5 88 100.5C98.8555 100.5 107.908 84.473 103 56.5C98 28 78 0 50.101 0C28.5583 0 9.28321 29.4286 2.48025 53.602C-4.32271 77.7755 3.61407 103 17.22 103Z",
  smile:
    "M23 31.737C32.5124 28.3043 44.3918 24.9033 60.9612 25.1072C79.8976 25.3404 91.6886 29.0406 97.5621 32.6649",
  smileW: 5,
  eyeR: { cx: 58.6126 + 20.7236, cy: 34.0574 + 22.6998, rx: 20.7236, ry: 22.6998 },
  eyeL: { cx: 20.1386 + 20.7236, cy: 33.0715 + 22.6998, rx: 20.7236, ry: 22.6998 },
  pupilL: { cx: 34.5934 + 10.3621, cy: 42.4158 + 12.6805, rx: 10.3621, ry: 12.6805 },
  pupilR: { cx: 72.5934 + 10.3621, cy: 43.4158 + 12.6805, rx: 10.3621, ry: 12.6805 },
  determinedPupilR: { cx: 72.5934 + 10.3621, cy: 43.4158 + 12.6805, rx: 10.36, ry: 12.7 },
  lidL: { x: 14, y: 33, w: 50 },
  lidR: { x: 52, y: 33, w: 55 },
};

const WES_VARIANTS: Record<CharacterVariant, VariantCfg> = {
  wes: WES,
  "wes-v2": WES_V2,
  "wes-v3": WES_V3,
};
