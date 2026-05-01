import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasLovableCloudEnv } from "@/lib/lovable-cloud";
import clerkLogo from "@/assets/clerk-logo.svg";



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
  const primaryPath = hasLovableCloudEnv ? (user ? "/app" : "/onboarding") : "/auth";


  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1180px] flex-col px-6 pt-7 pb-20">
        {/* Header */}
        <header className="mb-10 sm:mb-12 flex w-full items-center justify-between">
          <img src={clerkLogo} alt="Clerk" className="h-[36px] w-auto select-none" draggable={false} />
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

        {/* ── HERO: 2-col on desktop, single-col on mobile ── */}
        <section className="w-full grid md:grid-cols-[1fr_minmax(0,440px)] gap-10 md:gap-14 items-center mb-16 sm:mb-[88px]">
          {/* LEFT: copy + CTA */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1
              className="font-plex font-light leading-[1.05] tracking-[-0.03em] text-foreground mb-7 animate-fade-up"
              style={{ fontSize: "clamp(30px, 5.6vw, 52px)" }}
            >
              <strong className="font-semibold font-mono text-5xl">The to-do app that prioritizes and explains why.</strong>
            </h1>

            {/* CTA */}
            <Link
              to={primaryPath}
              className="inline-flex items-center gap-2.5 rounded-full bg-foreground px-9 py-4 font-plex text-[15px] font-medium text-background tracking-[-0.01em] shadow-[0_4px_20px_rgba(0,0,0,0.14)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.18)] min-h-[48px] mb-3 animate-fade-up"
            >
              {user ? "Open Clerk" : "Get started free"}
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2.5 7.5h10M9 4l3.5 3.5L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            {/* Micro-promise (own line) */}
            <span className="font-mono-plex text-[11px] font-light tracking-[0.03em] text-faint mb-2.5 animate-fade-up">
              No account needed to try
            </span>

            {/* Audience positioning (own line, italic, more visible) */}
            <p className="font-plex text-[12.5px] italic font-light text-muted-foreground leading-[1.5] max-w-[340px] animate-fade-up">
              Made for ADHD, anxiety, and anyone who overthinks their list.
            </p>

          </div>

          {/* RIGHT: Hero video */}
          <div className="w-full max-w-[440px] mx-auto md:mx-0 animate-fade-up">
            <div className="rounded-[20px] overflow-hidden border border-black/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.9)_inset] bg-white transition-transform hover:-translate-y-1 duration-300">
              <video
                src="/landing-hero.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden="true"
                className="block w-full h-auto aspect-square object-cover"
              />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS (moved up — answers "how does this work?" right after hero) ── */}
        <section className="w-full max-w-[640px] mx-auto mb-16 sm:mb-[72px] animate-fade-up">
          <p className="font-mono-plex uppercase tracking-[0.1em] text-center mb-8 text-lg font-mono font-normal text-secondary-foreground">
            How it works
          </p>
          <div className="flex flex-col">
            {HOW_STEPS.map(([num, title, desc], i) => (
              <div key={num} className={`flex gap-5 items-start py-5 ${i < HOW_STEPS.length - 1 ? "border-b border-black/[0.08]" : ""}`}>
                <span className="font-mono-plex text-[11px] font-normal text-muted-foreground tracking-[0.05em] flex-shrink-0 mt-1 w-5">{num}</span>
                <div>
                  <div className="font-plex text-[15px] sm:text-[16px] font-medium text-foreground tracking-[-0.015em] mb-1.5">{title}</div>
                  <p className="font-plex text-[13.5px] font-normal text-foreground/75 leading-[1.55]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TENSION: Sound familiar? — now the closer before final CTA ── */}
        <section className="w-full max-w-[720px] mx-auto mb-12 sm:mb-16 animate-fade-up">
          <p className="font-mono-plex text-[10px] font-light uppercase tracking-[0.1em] text-faint text-center mb-6">
            Does this sound like you?
          </p>
          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
            {/* Without Clerk — visually heavier, mono font, red accent */}
            <div className="bg-white/55 backdrop-blur-md border border-black/[0.06] border-l-[3px] border-l-[#DC2626]/40 rounded-[20px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
              <div className="font-mono-plex text-[10px] font-normal uppercase tracking-[0.08em] mb-4 flex items-center gap-1.5 text-[#DC2626]">
                <span>✕</span> Without Clerk
              </div>
              {TENSION_BEFORE.map(([icon, text], i) => (
                <div key={i} className={`font-mono-plex text-[12.5px] font-normal text-foreground/85 leading-[1.5] py-2.5 flex items-start gap-2 ${i < TENSION_BEFORE.length - 1 ? "border-b border-black/5" : ""}`}>
                  <span className="text-[14px] flex-shrink-0 mt-px">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            {/* With Clerk — lighter, plex font, green accent */}
            <div className="bg-white/85 backdrop-blur-md border border-black/[0.06] border-l-[3px] border-l-[#059669]/45 rounded-[20px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
              <div className="font-mono-plex text-[10px] font-normal uppercase tracking-[0.08em] mb-4 flex items-center gap-1.5 text-[#059669]">
                <span>✓</span> With Clerk
              </div>
              {TENSION_AFTER.map(([icon, text], i) => (
                <div key={i} className={`font-plex text-[13.5px] font-normal text-foreground leading-[1.5] py-2.5 flex items-start gap-2 ${i < TENSION_AFTER.length - 1 ? "border-b border-black/5" : ""}`}>
                  <span className="text-[14px] flex-shrink-0 mt-px">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="w-full max-w-[540px] mx-auto text-center animate-fade-up">
          <h2
            className="font-plex font-light tracking-[-0.025em] leading-[1.15] text-foreground mb-7"
            style={{ fontSize: "clamp(26px, 5.5vw, 40px)" }}
          >
            Stop deciding.<br /><strong className="font-semibold">Start doing.</strong>
          </h2>
          <div className="flex flex-col items-center gap-2.5">
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
            <p className="font-plex text-[12.5px] italic font-light text-muted-foreground leading-[1.5] max-w-[340px] mt-1">
              Made for ADHD, anxiety, and anyone who overthinks their list.
            </p>
          </div>
        </section>

        <footer className="mt-16 sm:mt-[72px] text-center">
          <p className="font-mono-plex text-[11px] font-light text-faint tracking-[0.03em]">© 2026 Clerk</p>
        </footer>
      </div>
    </div>
  );
}

