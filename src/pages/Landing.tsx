import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import { useAuth } from "@/contexts/AuthContext";
import { hasLovableCloudEnv } from "@/lib/lovable-cloud";
import { useIsMobile } from "@/hooks/use-mobile";
import clerkLogo from "@/assets/clerk-logo.png";

const BUBBLE_LINES = [
  "Tell me what's on your mind. I'll tell you what to start with — and why.",
  "Twelve things on your plate? I'll pick one.",
  "I don't just sort. I explain.",
  "Stuck on what's first? That's my job.",
  "You decide enough. Let me decide this.",
];

const PREVIEW_CARDS = [
  { time: "9:00 AM | FRI", tag: "Work", tagClass: "bg-[hsl(var(--tag-blue))]", title: "Call dentist to confirm appointment", loc: "@Downtown", delay: 0 },
  { time: "Add time", tag: "Family", tagClass: "bg-[hsl(var(--tag-yellow))]", title: "Pick up kids from school", loc: "@Lincoln Elementary", delay: 160 },
  { time: "6:30 PM", tag: "Health", tagClass: "bg-[hsl(var(--tag-green))]", title: "Evening run — 30 mins", loc: "Add location", delay: 320 },
];

const TENSION_BEFORE = [
  ["🌀", "You don't know where to start"],
  ["😤", "Everything feels equally important"],
  ["😶", "You second-guess every decision"],
];
const TENSION_AFTER = [
  ["🎯", "One clear next task"],
  ["💡", "You know why it's first"],
  ["😌", "No more second-guessing"],
];

const HOW_STEPS = [
  ["01", "Type what's on your mind", "No forms. No categories. Just dump everything — work, home, errands. Clerk reads it all."],
  ["02", "Clerk picks what's first — and explains why", "Not just where it goes. Why it goes there. \"Due Friday — that's close.\" \"Tomorrow's problem.\" You see the reasoning."],
  ["03", "You stop deciding, start doing", "Disagree with a pick? Move it. But mostly, you'll just trust it and start."],
];

export default function Landing() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const primaryPath = hasLovableCloudEnv ? (user ? "/app" : "/onboarding") : "/auth";

  // Rotating bubble
  const [lineIdx, setLineIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const rotate = () => {
    setFading(true);
    setTimeout(() => {
      setLineIdx((i) => (i + 1) % BUBBLE_LINES.length);
      setFading(false);
    }, 300);
  };
  useEffect(() => {
    const id = setInterval(rotate, 3800);
    return () => clearInterval(id);
  }, []);

  // Preview card reveal on scroll
  const previewRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const charSize = isMobile ? 60 : 70;

  return (
    <div className="min-h-screen landing-bg overflow-x-hidden">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[540px] flex-col items-center px-6 pt-7 pb-20">
        {/* Header */}
        <header className="mb-12 sm:mb-16 flex w-full items-center justify-between">
          <img src={clerkLogo} alt="Clerk" className="h-[22px] sm:h-[24px] w-auto select-none" draggable={false} />
          <nav className="flex items-center gap-6">
            {user ? (
              <Link to="/app" className="font-mono-plex text-[11px] font-light uppercase tracking-[0.05em] text-muted-foreground hover:text-foreground transition-colors">
                Open
              </Link>
            ) : (
              <Link to="/auth" className="font-mono-plex text-[11px] font-light uppercase tracking-[0.05em] text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </Link>
            )}
          </nav>
        </header>

        {/* Hero */}
        <section className="flex w-full flex-col items-center text-center">
          <h1
            className="font-plex font-light leading-[1.07] tracking-[-0.03em] text-foreground mb-4 px-2 sm:px-0 animate-fade-up"
            style={{ fontSize: "clamp(28px, 7.5vw, 50px)" }}
          >
            The to-do app that <strong className="font-semibold">explains what to do first.</strong>
          </h1>
          <p className="font-plex text-[16px] sm:text-[18px] font-light text-muted-foreground leading-[1.45] mb-5 max-w-[440px] mx-auto animate-fade-up">
            Clerk picks your next task and tells you why.
          </p>

          {/* Bubble (left) + Character (right) — matches v27 */}
          <div className="flex items-end justify-center gap-0 mb-10 sm:mb-11 max-w-full animate-fade-up">
            <div className="relative mb-2">
              <div
                className="bg-white border border-black/[0.08] rounded-[20px_20px_20px_4px] px-4 py-3 sm:px-5 sm:py-4 text-[14px] sm:text-[15px] font-normal text-foreground leading-[1.55] shadow-[0_4px_24px_rgba(0,0,0,0.08)] text-left flex items-center min-h-[58px]"
                style={{ maxWidth: "min(268px, calc(100vw - 130px))" }}
              >
                <span className={`bubble-text ${fading ? "fade-out" : ""}`}>
                  {BUBBLE_LINES[lineIdx]}
                </span>
              </div>
            </div>
            <div className="-ml-1 mb-1 flex-shrink-0">
              <ClerkCharacter size={charSize} onClick={rotate} />
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-3 mb-16 sm:mb-20 animate-fade-up">
            <Link
              to={primaryPath}
              className="inline-flex items-center gap-2.5 rounded-full bg-foreground px-9 py-4 font-plex text-[15px] font-medium text-background tracking-[-0.01em] shadow-[0_4px_20px_rgba(0,0,0,0.14)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.18)] min-h-[48px]"
            >
              {user ? "Open Clerk" : "Get started free"}
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2.5 7.5h10M9 4l3.5 3.5L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <span className="font-mono-plex text-[11px] font-light tracking-[0.03em] text-faint text-center max-w-[320px] leading-[1.5]">
              Made for ADHD, anxiety, and anyone who overthinks their list. · No account needed to try.
            </span>
          </div>
        </section>

        {/* Tension: Sound familiar? */}
        <section className="w-full mb-16 sm:mb-[72px] animate-fade-up">
          <p className="font-mono-plex text-[10px] font-light uppercase tracking-[0.1em] text-faint text-center mb-6">
            Does this sound like you?
          </p>
          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
            <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-[20px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
              <div className="font-mono-plex text-[10px] font-normal uppercase tracking-[0.08em] mb-4 flex items-center gap-1.5 text-[#DC2626]">
                <span>✕</span> Without Clerk
              </div>
              {TENSION_BEFORE.map(([icon, text], i) => (
                <div key={i} className={`text-[13px] font-normal text-foreground leading-[1.5] py-2 flex items-start gap-2 ${i < TENSION_BEFORE.length - 1 ? "border-b border-black/5" : ""}`}>
                  <span className="text-[14px] flex-shrink-0 mt-px">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-[20px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
              <div className="font-mono-plex text-[10px] font-normal uppercase tracking-[0.08em] mb-4 flex items-center gap-1.5 text-[#059669]">
                <span>✓</span> With Clerk
              </div>
              {TENSION_AFTER.map(([icon, text], i) => (
                <div key={i} className={`text-[13px] font-normal text-foreground leading-[1.5] py-2 flex items-start gap-2 ${i < TENSION_AFTER.length - 1 ? "border-b border-black/5" : ""}`}>
                  <span className="text-[14px] flex-shrink-0 mt-px">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* App preview */}
        <section className="w-full mb-16 sm:mb-[72px] animate-fade-up">
          <p className="font-mono-plex text-[10px] font-light uppercase tracking-[0.1em] text-faint text-center mb-5">
            Focus view
          </p>
          <div className="bg-white/55 backdrop-blur-xl border border-white/85 rounded-[20px] sm:rounded-[24px] p-5 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.09),0_1px_0_rgba(255,255,255,0.9)_inset]">
            <div className="text-center mb-6">
              <span className="block text-[24px] sm:text-[28px] font-semibold tracking-[-0.025em] text-foreground">Mon Apr 28</span>
              <span className="font-mono-plex text-[12px] font-light text-muted-foreground">10:24 AM</span>
            </div>
            <div ref={previewRef} className="flex flex-col gap-2.5">
              {PREVIEW_CARDS.map((c, i) => (
                <div
                  key={i}
                  className={`preview-card-reveal bg-white/50 border border-border rounded-[12px] p-3.5 sm:p-4 ${revealed ? "visible" : ""}`}
                  style={{ transitionDelay: revealed ? `${c.delay}ms` : "0ms" }}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-mono-plex text-[11px] font-normal text-[#2A2A2A]">{c.time}</span>
                    <span className={`font-mono-plex text-[11px] font-normal text-[#2A2A2A] px-2 py-0.5 rounded-md ${c.tagClass}`}>{c.tag}</span>
                  </div>
                  <div className="font-plex text-[15px] sm:text-[16px] font-medium text-[#2A2A2A] mb-2 leading-[1.3]">{c.title}</div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono-plex text-[11px] text-muted-foreground">{c.loc}</span>
                    <div className="w-5 h-5 rounded-full border border-[#939393] bg-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="w-full mb-16 sm:mb-[72px] animate-fade-up">
          <p className="font-mono-plex text-[10px] font-light uppercase tracking-[0.1em] text-faint text-center mb-8">
            How it works
          </p>
          <div className="flex flex-col">
            {HOW_STEPS.map(([num, title, desc], i) => (
              <div key={num} className={`flex gap-5 items-start py-5 ${i < HOW_STEPS.length - 1 ? "border-b border-black/[0.06]" : ""}`}>
                <span className="font-mono-plex text-[11px] font-light text-faint tracking-[0.05em] flex-shrink-0 mt-1 w-5">{num}</span>
                <div>
                  <div className="font-plex text-[15px] sm:text-[16px] font-medium text-foreground tracking-[-0.015em] mb-1">{title}</div>
                  <p className="font-mono-plex text-[12px] font-light text-muted-foreground leading-[1.6]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full text-center animate-fade-up">
          <h2
            className="font-plex font-light tracking-[-0.025em] leading-[1.15] text-foreground mb-7"
            style={{ fontSize: "clamp(24px, 6.5vw, 38px)" }}
          >
            Your tasks won't sort themselves.<br /><strong className="font-semibold">But Clerk will.</strong>
          </h2>
          <div className="flex flex-col items-center gap-3">
            <Link
              to={primaryPath}
              className="inline-flex items-center gap-2.5 rounded-full bg-foreground px-9 py-4 font-plex text-[15px] font-medium text-background tracking-[-0.01em] shadow-[0_4px_20px_rgba(0,0,0,0.14)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.18)] min-h-[48px]"
            >
              {user ? "Open Clerk" : "Get started free"}
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2.5 7.5h10M9 4l3.5 3.5L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <span className="font-mono-plex text-[11px] font-light tracking-[0.03em] text-faint">
              No account needed to try
            </span>
          </div>
        </section>

        <footer className="mt-16 sm:mt-[72px] text-center">
          <p className="font-mono-plex text-[11px] font-light text-faint tracking-[0.03em]">© 2026 Clerk</p>
        </footer>
      </div>
    </div>
  );
}
