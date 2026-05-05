import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { type CharacterVariant, parseVariant } from "@/lib/characters";

export type Expression = "neutral" | "determined";

interface ClerkCharacterProps {
  size?: number;
  thinking?: boolean;
  onClick?: () => void;
  className?: string;
  /** Serialized character + variant, e.g. `"wes:v1"`. */
  variant?: CharacterVariant;
  /** Override expression. If omitted, `thinking` implies "determined". */
  expression?: Expression;
  /** Use the float/blink animation (default true). Disable for static contexts. */
  animated?: boolean;
}

/**
 * Clerk's mascots — Wes, Rex, Frank — each with two body variants.
 * Pupils follow the cursor; eyelids blink every few seconds.
 */
export const ClerkCharacter = forwardRef<HTMLButtonElement, ClerkCharacterProps>(function ClerkCharacter(
  { size = 60, thinking = false, onClick, className, variant = "wes:v1", expression, animated = true },
  forwardedRef
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pupilLRef = useRef<SVGEllipseElement>(null);
  const pupilRRef = useRef<SVGEllipseElement>(null);
  const lidLRef = useRef<SVGRectElement>(null);
  const lidRRef = useRef<SVGRectElement>(null);
  const [squish, setSquish] = useState(false);
  const uid = useId().replace(/:/g, "");

  const cfg = VARIANT_CONFIGS[variant] ?? VARIANT_CONFIGS["wes:v1"];
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
      const kR = expr === "determined" ? k * 0.4 : k;
      const baseR = expr === "determined" ? cfg.determinedPupilR : cfg.pupilR;
      pupilRRef.current?.setAttribute("cx", (baseR.cx + Math.cos(angle) * kR).toString());
      pupilRRef.current?.setAttribute("cy", (baseR.cy + Math.sin(angle) * kR).toString());
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

  const scale = cfg.renderScale ?? 1;
  const w = size * scale;
  const h = (size / cfg.viewW) * cfg.viewH * scale;
  const clipIdL = `clerk-clip-l-${uid}`;
  const clipIdR = `clerk-clip-r-${uid}`;
  const gradId = `clerk-grad-${uid}`;

  const bodyFill = cfg.gradient ? `url(#${gradId})` : cfg.bodyFill;

  return (
    <button
      ref={forwardedRef}
      type="button"
      onClick={handleClick}
      aria-label={`Clerk — ${parseVariant(variant).character}`}
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
        <path d={cfg.body} fill={bodyFill} stroke={cfg.bodyStroke} strokeWidth={cfg.bodyStroke ? 1 : undefined} />
        {!cfg.smileOnTop && (
          <path d={cfg.smile} stroke="#000" strokeWidth={cfg.smileW} strokeLinecap="round" />
        )}
        <ellipse cx={cfg.eyeL.cx} cy={cfg.eyeL.cy} rx={cfg.eyeL.rx} ry={cfg.eyeL.ry} fill="white" />
        <ellipse
          ref={pupilLRef}
          cx={cfg.pupilL.cx}
          cy={cfg.pupilL.cy}
          rx={cfg.pupilL.rx}
          ry={cfg.pupilL.ry}
          fill="#000"
        />
        <ellipse cx={cfg.eyeR.cx} cy={cfg.eyeR.cy} rx={cfg.eyeR.rx} ry={cfg.eyeR.ry} fill="white" />
        <ellipse
          ref={pupilRRef}
          cx={(expr === "determined" ? cfg.determinedPupilR : cfg.pupilR).cx}
          cy={(expr === "determined" ? cfg.determinedPupilR : cfg.pupilR).cy}
          rx={(expr === "determined" ? cfg.determinedPupilR : cfg.pupilR).rx}
          ry={(expr === "determined" ? cfg.determinedPupilR : cfg.pupilR).ry}
          fill="#000"
        />
        <clipPath id={clipIdL}>
          <ellipse cx={cfg.eyeL.cx} cy={cfg.eyeL.cy} rx={cfg.eyeL.rx} ry={cfg.eyeL.ry} />
        </clipPath>
        <clipPath id={clipIdR}>
          <ellipse cx={cfg.eyeR.cx} cy={cfg.eyeR.cy} rx={cfg.eyeR.rx} ry={cfg.eyeR.ry} />
        </clipPath>
        <rect
          ref={lidLRef}
          x={cfg.eyeL.cx - cfg.eyeL.rx * 1.2}
          y={cfg.eyeL.cy - cfg.eyeL.ry}
          width={cfg.eyeL.rx * 2.4}
          height={0}
          fill={cfg.lidColor ?? cfg.bodyFill}
          clipPath={`url(#${clipIdL})`}
        />
        <rect
          ref={lidRRef}
          x={cfg.eyeR.cx - cfg.eyeR.rx * 1.2}
          y={cfg.eyeR.cy - cfg.eyeR.ry}
          width={cfg.eyeR.rx * 2.4}
          height={0}
          fill={cfg.lidColor ?? cfg.bodyFill}
          clipPath={`url(#${clipIdR})`}
        />
        {cfg.smileOnTop && (
          <path d={cfg.smile} stroke="#000" strokeWidth={cfg.smileW} strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
});

/* ─────────── Variant configs ─────────── */
type Ellipse = { cx: number; cy: number; rx: number; ry: number };
type VariantCfg = {
  viewW: number;
  viewH: number;
  bodyFill: string;
  bodyStroke?: string;
  gradient?: { from: string; to: string; x1: number; y1: number; x2: number; y2: number; stop?: number };
  body: string;
  smile: string;
  smileW: number;
  eyeL: Ellipse;
  eyeR: Ellipse;
  pupilL: Ellipse;
  pupilR: Ellipse;
  determinedPupilR: Ellipse;
  lidColor?: string;
  /** Visual scale multiplier vs. requested `size`. Lets us nudge characters that read smaller. */
  renderScale?: number;
};

// Wes v1 — peaked blob with three humps on top
const WES_V1: VariantCfg = {
  viewW: 148,
  viewH: 113,
  bodyFill: "#567CF8",
  gradient: { from: "#567CF8", to: "#4167E2", x1: 142.5, y1: 10, x2: 13.5, y2: 77 },
  body:
    "M69.5647 14C67.398 10.1667 62.0647 2 54.0647 2C42.0647 2 28.2181 9.52034 13.2631 44C-4.73688 85.5 3.56466 109 18.0647 109C29.6647 109 38.2314 99.3333 41.5647 95C42.5647 99.3333 47.7647 109 56.5647 109C65.3647 109 76.2313 100.333 80.5647 96C81.5647 100.333 85.9647 109 95.5647 109C107.565 109 123.763 103 138.065 63.5C149.331 32.3823 146.065 2 131.065 2C119.065 2 110.065 9.66667 107.065 13.5C106.398 9.66667 102.565 2 92.5647 2C82.5647 2 73.2313 10.1667 69.5647 14Z",
  smile:
    "M42.7007 36.6717C52.6002 33.0993 64.9631 29.5599 82.2067 29.7722C101.914 30.0148 114.185 33.8657 120.297 37.6374",
  smileW: 5,
  eyeR: { cx: 79.6126 + 20.7236, cy: 38.6416 + 22.6998, rx: 20.7236, ry: 22.6998 },
  eyeL: { cx: 41.1385 + 20.7236, cy: 37.6555 + 22.6998, rx: 20.7236, ry: 22.6998 },
  pupilL: { cx: 55.5933 + 10.3621, cy: 47 + 12.6805, rx: 10.3621, ry: 12.6805 },
  pupilR: { cx: 93.5933 + 10.3621, cy: 48 + 12.6805, rx: 10.3621, ry: 12.6805 },
  determinedPupilR: { cx: 66.2, cy: 60.6, rx: 10.36, ry: 12.7 },
};

// Wes v2 — fresh upload (wes-v2-2.svg, 143x120)
const WES_V2: VariantCfg = {
  viewW: 143,
  viewH: 120,
  bodyFill: "#567CF8",
  gradient: { from: "#567CF8", to: "#4167E2", x1: 139, y1: 53, x2: 3, y2: 53, stop: 0.569 },
  body:
    "M41 16C38.3333 12.3333 35 2 25 2C14 2 3 30 3 63.5C3 97 18 116 28 116C36 116 41 109 42.5 105.5C44.3333 109 49.7 116 56.5 116C63.3 116 68 109 69.5 105.5C71.8333 109 78.4 116 86 116C93.6 116 99.1667 109 101 105.5C103.5 109 109.9 116 115.5 116C122.5 116 136.009 105.387 139 66C142 26.5 123 2 113 2C105 2 100.333 10.3333 99 14.5C97.8333 10.3333 93.6 2 86 2C78.4 2 71.5 12.5 70 16C68.6667 12.3333 63.7 2 56.5 2C49.3 2 43.1667 12.3333 41 16Z",
  smile:
    "M37.3653 33.6642C48.4129 29.5522 62.2197 25.4495 81.5351 25.4941C103.61 25.545 117.397 29.7204 124.285 33.8763",
  smileW: 5,
  eyeR: { cx: 80.0549 + 23.5702, cy: 33.6145 + 25.8178, rx: 23.5702, ry: 25.8178 },
  eyeL: { cx: 36.296 + 23.5702, cy: 34.4919 + 25.8178, rx: 23.5702, ry: 25.8178 },
  pupilL: { cx: 49.5068 + 11.7855, cy: 44.9285 + 14.4223, rx: 11.7855, ry: 14.4223 },
  pupilR: { cx: 91.4354 + 11.7855, cy: 44.4631 + 14.4223, rx: 11.7855, ry: 14.4223 },
  determinedPupilR: { cx: 91.4354 + 11.7855, cy: 44.4631 + 14.4223, rx: 11.78, ry: 14.42 },
};

// Rex v1 — spiky burst (orange)
const REX_V1: VariantCfg = {
  viewW: 160,
  viewH: 148,
  bodyFill: "#FF8A28",
  gradient: { from: "#FF8A28", to: "#EF7108", x1: 128.93, y1: 8.872, x2: 21.59, y2: 99.64 },
  bodyStroke: "#F77A13",
  body:
    "M96.6262 42.6728C94.8389 42.4175 75.1855 15.3055 73.0174 15.7271C69.0124 15.7176 64.9933 47.4177 61.887 49.2431C58.7807 51.0685 31.6638 42.7687 29.7378 45.4003C27.8119 48.0319 39.4512 70.3796 38.1818 72.6361C36.9123 74.8927 15.0153 82.3975 14.2915 86.5886C13.5677 90.7797 40.3593 98.6017 41.986 100.991C43.6127 103.38 35.154 130.826 37.8181 132.163C40.4822 133.5 64.9197 115.407 67.9209 114.56C70.9221 113.714 87.3675 131.478 91.2018 130.207C95.0361 128.936 95.0032 107.871 97.7564 106.145C100.51 104.42 135.178 113.817 139.526 110.312C143.874 106.808 125.135 83.6147 125.07 81.3549C125.004 79.0952 146.588 68.4513 146.881 64.7613C147.174 61.0713 122.18 56.9192 120.151 54.4539C118.122 51.9886 120.416 34.4445 118.38 33.3098C116.345 32.1751 98.4135 42.9282 96.6262 42.6728Z",
  smile:
    "M51.8156 59.8144C60.7241 56.1526 71.8862 52.4226 87.6607 51.9278C105.689 51.3623 117.062 54.3929 122.801 57.5972",
  smileW: 5,
  eyeR: { cx: 85.6432 + 18.9659, cy: 60.1406 + 20.7744, rx: 18.9659, ry: 20.7744 },
  eyeL: { cx: 50.4266 + 18.9659, cy: 60.7764 + 20.7744, rx: 18.9659, ry: 20.7744 },
  pupilL: { cx: 64.0161 + 9.48324, cy: 68.7424 + 11.6049, rx: 9.48324, ry: 11.6049 },
  pupilR: { cx: 98.7998 + 9.48324, cy: 68.1387 + 11.6049, rx: 9.48324, ry: 11.6049 },
  determinedPupilR: { cx: 98.7998 + 9.48324, cy: 68.1387 + 11.6049, rx: 9.48, ry: 11.6 },
  renderScale: 1.15,
};

// Rex v2 — squarer burst (orange)
const REX_V2: VariantCfg = {
  viewW: 146,
  viewH: 127,
  bodyFill: "#FF8A28",
  gradient: { from: "#FF8A28", to: "#EF7108", x1: 140.257, y1: 11.472, x2: 7.121, y2: 71.916 },
  bodyStroke: "#F77A13",
  body:
    "M77.703 20.6154C70.0388 13.6333 53.0383 0.297525 46.3496 2.81108C40.497 5.32476 37.6404 24.8046 36.9436 34.2304C33.1115 34.9286 25.0293 37.3723 23.3571 41.5616C21.685 45.7508 24.0539 52.3838 25.4474 55.1766C18.1316 59.715 3.5 70.4674 3.5 77.1702C3.5 83.8731 18.1316 92.5309 25.4474 96.0219C27.5376 104.051 33.8083 120.529 42.1692 122.205C50.5301 123.88 59.5877 118.015 63.0714 114.874C65.8584 116.619 73.1045 120.11 79.7932 120.11C86.482 120.11 90.9411 115.223 92.3346 112.779C96.1667 114.524 105.294 117.806 111.147 116.968C116.999 116.13 121.946 99.1638 123.688 90.7853C129.959 86.9452 142.5 77.1702 142.5 68.7917C142.5 60.4132 128.565 53.4311 121.598 50.9874C122.991 47.4963 125.36 39.6764 123.688 36.325C122.016 32.9736 116.721 34.9286 114.282 36.325C114.63 28.9938 114.073 13.703 109.056 11.1894C104.04 8.67588 86.0639 16.4261 77.703 20.6154Z",
  smile:
    "M42.1619 45.4001C51.7072 41.4766 63.6672 37.4799 80.5693 36.9497C99.886 36.3438 112.072 39.5911 118.222 43.0244",
  smileW: 5,
  eyeR: { cx: 78.4076 + 20.3216, cy: 45.7498 + 22.2594, rx: 20.3216, ry: 22.2594 },
  eyeL: { cx: 40.6737 + 20.3216, cy: 46.4309 + 22.2594, rx: 20.3216, ry: 22.2594 },
  pupilL: { cx: 55.2345 + 10.1611, cy: 54.9663 + 12.4345, rx: 10.1611, ry: 12.4345 },
  pupilR: { cx: 92.5046 + 10.1611, cy: 54.3196 + 12.4345, rx: 10.1611, ry: 12.4345 },
  determinedPupilR: { cx: 92.5046 + 10.1611, cy: 54.3196 + 12.4345, rx: 10.16, ry: 12.43 },
  renderScale: 1.15,
};

// Frank v1 — folder/tag shape (purple)
const FRANK_V1: VariantCfg = {
  viewW: 122,
  viewH: 113,
  bodyFill: "#886AC3",
  gradient: { from: "#886AC3", to: "#634798", x1: 117.277, y1: 9.165, x2: 7.795, y2: 60.983 },
  bodyStroke: "#795EB0",
  body:
    "M3.50627 99.848L7.00902 10.1881C7.18469 5.69164 11.033 2.22461 15.5234 2.51737L104.237 8.30124C108.169 8.55759 111.329 11.6389 111.684 15.5632L118.431 90.1078C118.828 94.4964 115.602 98.3799 111.215 98.7936L12.2512 108.125C7.43259 108.579 3.31733 104.684 3.50627 99.848Z",
  smile:
    "M27.2164 32.4052C39.0272 32.4052 49.7478 32.1831 67.772 32.405C88.3712 32.6586 94.9489 32.405 108.325 32.405",
  smileW: 5,
  eyeR: { cx: 68.6222 + 21.6617, cy: 30.2153 + 23.7273, rx: 21.6617, ry: 23.7273 },
  eyeL: { cx: 28.4065 + 21.6617, cy: 29.3293 + 23.7273, rx: 21.6617, ry: 23.7273 },
  // Left pupil in source is a path approximating a tilted ellipse — center ≈ (54.6, 53.3)
  pupilL: { cx: 54.6, cy: 53.3, rx: 10.83, ry: 13.27 },
  pupilR: { cx: 79.0815 + 10.8312, cy: 40.1848 + 13.2545, rx: 10.8312, ry: 13.2545 },
  determinedPupilR: { cx: 79.0815 + 10.8312, cy: 40.1848 + 13.2545, rx: 10.83, ry: 13.25 },
};

// Frank v2 — taller folder shape (purple)
const FRANK_V2: VariantCfg = {
  viewW: 129,
  viewH: 108,
  bodyFill: "#886AC3",
  gradient: { from: "#886AC3", to: "#634798", x1: 123.176, y1: 9.28, x2: 12.903, y2: 67.431 },
  bodyStroke: "#795EB0",
  body:
    "M3.50775 95.1521L7.20769 10.1521C7.39394 5.87318 10.9171 2.5 15.2001 2.5H111.055C115.271 2.5 118.763 5.77179 119.038 9.97876L124.588 94.9788C124.889 99.5923 121.228 103.5 116.605 103.5H11.5002C6.94538 103.5 3.30967 99.7026 3.50775 95.1521Z",
  smile:
    "M26.2358 29.9477C38.322 29.9477 49.2924 29.7204 67.7369 29.9475C88.8163 30.207 95.5474 29.9475 109.236 29.9475",
  smileW: 5,
  eyeR: { cx: 68.6069 + 22.1667, cy: 27.7068 + 24.2805, rx: 22.1667, ry: 24.2805 },
  eyeL: { cx: 27.4537 + 22.1667, cy: 26.7998 + 24.2805, rx: 22.1667, ry: 24.2805 },
  pupilL: { cx: 54.3, cy: 51.3, rx: 11.08, ry: 13.56 },
  pupilR: { cx: 79.3101 + 11.0837, cy: 37.9087 + 13.5635, rx: 11.0837, ry: 13.5635 },
  determinedPupilR: { cx: 79.3101 + 11.0837, cy: 37.9087 + 13.5635, rx: 11.08, ry: 13.56 },
};

const VARIANT_CONFIGS: Record<CharacterVariant, VariantCfg> = {
  "wes:v1": WES_V1,
  "wes:v2": WES_V2,
  "rex:v1": REX_V1,
  "rex:v2": REX_V2,
  "frank:v1": FRANK_V1,
  "frank:v2": FRANK_V2,
};
