import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasLovableCloudEnv } from "@/lib/lovable-cloud";
import clerkLogo from "@/assets/clerk-logo.svg";

const ArrowIcon = ({ stroke = "currentColor" }: { stroke?: string }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <path d="M3 7.5h9M9 4l3.5 3.5L9 11" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MascotInline = () => (
  <svg width="32" height="27" viewBox="0 0 137 115" fill="none" style={{ overflow: "visible" }} aria-hidden="true">
    <path d="M60.5962 39.5038L78.1603 0L93.9679 39.5038L119.436 35.9924L111.532 57.0611L137 74.6183L103.628 83.3969L111.532 113.244L72.0128 96.5649L63.2308 115L45.6667 96.5649L16.6859 108.855L30.7372 80.7634L0 57.0611L33.3718 55.3053L30.7372 21.0687L60.5962 39.5038Z" fill="#567CF8" />
    <ellipse cx="50" cy="67" rx="12" ry="15" fill="white" />
    <ellipse cx="54" cy="71" rx="6" ry="8" fill="#1A1A1A" />
    <ellipse cx="75" cy="66" rx="12" ry="15" transform="rotate(-5 75 66)" fill="white" />
    <ellipse cx="72" cy="70" rx="6" ry="8" transform="rotate(-7 72 70)" fill="#1A1A1A" />
  </svg>
);

export default function Landing() {
  const { user } = useAuth();
  const primaryPath = hasLovableCloudEnv ? (user ? "/app" : "/onboarding") : "/auth";
  const navOpenPath = user ? "/app" : "/auth";
  const ctaLabel = user ? "Open Clerk" : "Get started free";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      {/* ══ HERO ══ */}
      <section className="relative w-full h-screen min-h-[600px] flex flex-col overflow-hidden">
        {/* Background video */}
        <video
          className="absolute inset-0 w-full h-full object-cover object-center z-0 hidden md:block"
          src="/landing-hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        {/* Mobile poster fallback (uses first frame of video as static via video element with no autoplay would fail; use a colored block) */}
        <div className="absolute inset-0 z-0 md:hidden bg-gradient-to-br from-[#1a1a2e] via-[#0a0a0a] to-[#0a0a0a]" />

        {/* Dark overlay */}
        <div className="absolute inset-0 z-[1] hero-overlay-dark" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-7">
          <img src={clerkLogo} alt="Clerk" className="h-[28px] w-auto select-none brightness-0 invert" draggable={false} />
          <Link
            to={navOpenPath}
            className="font-mono-plex text-[12px] font-light text-white/70 bg-white/10 border border-white/20 rounded-full px-5 py-2 backdrop-blur-md tracking-[0.05em] hover:bg-white/20 hover:text-white transition-colors"
          >
            {user ? "Open →" : "Sign in →"}
          </Link>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-12 pb-20 max-w-[680px]">
          <h1
            className="font-mono-plex font-medium leading-[1.05] tracking-[-0.03em] text-white mb-7 animate-fade-up"
            style={{ fontSize: "clamp(38px, 6vw, 72px)" }}
          >
            Your clerk<br />
            for a calmer<br />
            <span className="text-white/75 font-light">to-do list.</span>
          </h1>
          <div className="flex flex-col items-start gap-3.5 animate-fade-up">
            <Link
              to={primaryPath}
              className="inline-flex items-center gap-2.5 bg-white text-[#1A1A1A] font-sans-plex text-[15px] font-semibold px-9 py-4 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.3)] tracking-[-0.01em] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
              {ctaLabel}
              <ArrowIcon stroke="#1A1A1A" />
            </Link>
            <span className="font-sans-plex text-[13px] font-medium text-white/75">
              No account needed to try
            </span>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 opacity-40 animate-scroll-bounce">
          <span className="font-mono-plex text-[9px] font-light text-white tracking-[0.12em] uppercase">
            How it works
          </span>
          <div className="w-px h-6 bg-white" />
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="bg-[#F5F5F3] text-[#1A1A1A] px-6 sm:px-12 py-16 sm:py-24">
        <h2 className="font-serif font-bold tracking-[-0.03em] text-[#1A1A1A] leading-[1.08] text-center mb-16 sm:mb-20 max-w-[600px] mx-auto" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(36px, 5vw, 56px)" }}>
          How it works.
        </h2>

        <div className="max-w-[900px] mx-auto flex flex-col gap-16 sm:gap-20">
          {/* Step 01 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <div className="font-mono-plex text-[11px] font-light text-[#9CA3AF] tracking-[0.08em] mb-3.5">01</div>
              <h3 className="font-sans-plex font-semibold tracking-[-0.025em] text-[#1A1A1A] mb-3 leading-[1.15]" style={{ fontSize: "clamp(22px, 3vw, 30px)" }}>
                Dump everything<br />on your mind.
              </h3>
              <p className="font-mono-plex text-[13px] font-light text-[#6A7282] leading-[1.7]">
                No forms. No categories. Type it all at once — work, home, errands, whatever. Clerk reads it all.
              </p>
            </div>
            <div className="bg-white rounded-[20px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <div className="font-mono-plex text-[10px] font-normal text-[#9CA3AF] tracking-[0.1em] uppercase mb-3">
                What needs doing?
              </div>
              <div className="font-sans-plex text-[16px] text-[#1A1A1A] leading-[1.6] p-4 bg-[#F9FAFB] rounded-xl border-[1.5px] border-[#E5E7EB]">
                Finish case study due Friday, call dentist tomorrow at 9, pick up kids at Lincoln Elementary, go for a run in the morning, learn Spanish someday
                <span className="inline-block w-0.5 h-[18px] bg-[#567CF8] ml-0.5 align-middle animate-cursor-blink" />
              </div>
            </div>
          </div>

          {/* Step 02 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <div className="font-mono-plex text-[11px] font-light text-[#9CA3AF] tracking-[0.08em] mb-3.5">02</div>
              <h3 className="font-sans-plex font-semibold tracking-[-0.025em] text-[#1A1A1A] mb-3 leading-[1.15]" style={{ fontSize: "clamp(22px, 3vw, 30px)" }}>
                Clerk sorts and<br />explains why.
              </h3>
              <p className="font-mono-plex text-[13px] font-light text-[#6A7282] leading-[1.7]">
                Clerk reads the urgency, the deadlines, the emotional weight — and tells you exactly why each task landed where it did.
              </p>
            </div>
            <div className="bg-white rounded-[20px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-2.5 mb-1.5">
                <MascotInline />
                <div className="text-[16px] font-semibold text-[#1A1A1A] tracking-[-0.01em]">Here's what I'd do.</div>
              </div>
              <div className="font-mono-plex text-[11px] font-light text-[#9CA3AF] mb-5 pl-[42px]">
                Tap a column to move anything.
              </div>
              <div className="flex flex-col gap-2.5 mb-5">
                {[
                  { title: "Finish case study", col: "Today", colCls: "bg-[#CEDAFF]", reason: "Due Friday — that's close. Do it first." },
                  { title: "Call dentist", col: "Tomorrow", colCls: "bg-[#FFF7CE]", reason: "You said tomorrow at 9. Tomorrow it is." },
                  { title: "Learn Spanish", col: "Someday", colCls: "bg-[#FFCEFB]", reason: "No deadline. Someday where dreams live." },
                ].map((t) => (
                  <div key={t.title} className="bg-[#F9FAFB] rounded-xl px-3.5 py-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[14px] font-medium text-[#1A1A1A] tracking-[-0.005em]">{t.title}</span>
                      <span className={`font-mono-plex text-[10px] font-normal px-2.5 py-[3px] rounded-full text-[#1A1A1A] flex-shrink-0 ${t.colCls}`}>{t.col}</span>
                    </div>
                    <div className="font-mono-plex text-[11px] font-light text-[#9CA3AF] leading-[1.5] italic">
                      {t.reason}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full bg-[#1A1A1A] text-white font-sans-plex text-[14px] font-medium py-3.5 rounded-xl tracking-[-0.01em]">
                Looks good
              </button>
            </div>
          </div>

          {/* Step 03 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <div className="font-mono-plex text-[11px] font-light text-[#9CA3AF] tracking-[0.08em] mb-3.5">03</div>
              <h3 className="font-sans-plex font-semibold tracking-[-0.025em] text-[#1A1A1A] mb-3 leading-[1.15]" style={{ fontSize: "clamp(22px, 3vw, 30px)" }}>
                You stay<br />in control.
              </h3>
              <p className="font-mono-plex text-[13px] font-light text-[#6A7282] leading-[1.7]">
                Disagree with where something landed? Move it. Clerk never locks you in. You always have the final say.
              </p>
            </div>
            <div className="bg-white rounded-[20px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] flex flex-col gap-2.5">
              <div className="rounded-xl px-4 py-3.5 border-[1.5px] border-[#567CF8] bg-[rgba(86,124,248,0.06)]">
                <div className="font-mono-plex text-[10px] font-normal text-[#9CA3AF] tracking-[0.08em] uppercase mb-1.5">Today</div>
                <div className="text-[14px] font-medium text-[#1A1A1A]">Finish case study</div>
              </div>
              {[
                { label: "Tomorrow", task: "Call dentist · 9:00 AM" },
                { label: "Upcoming", task: "Pick up kids · Lincoln Elementary" },
                { label: "Someday", task: "Learn Spanish" },
              ].map((c) => (
                <div key={c.label} className="rounded-xl px-4 py-3.5 border-[1.5px] border-transparent bg-[#F9FAFB]">
                  <div className="font-mono-plex text-[10px] font-normal text-[#9CA3AF] tracking-[0.08em] uppercase mb-1.5">{c.label}</div>
                  <div className="text-[14px] font-medium text-[#1A1A1A]">{c.task}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="bg-[#1A1A1A] px-6 sm:px-12 py-16 sm:py-24 text-center flex flex-col items-center">
        <h2 className="font-mono-plex font-medium tracking-[-0.03em] text-white leading-[1.1] mb-3.5" style={{ fontSize: "clamp(28px, 5vw, 52px)" }}>
          Your tasks won't<br />sort themselves.<br />But Clerk will.
        </h2>
        <p className="font-mono-plex text-[13px] font-light text-white/40 mb-10 tracking-[0.02em]">
          No account needed to try.
        </p>
        <Link
          to={primaryPath}
          className="inline-flex items-center gap-2.5 bg-white text-[#1A1A1A] font-sans-plex text-[15px] font-semibold px-10 py-4 rounded-full shadow-[0_4px_24px_rgba(255,255,255,0.15)] tracking-[-0.01em] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)] mb-4"
        >
          {ctaLabel}
          <ArrowIcon stroke="#1A1A1A" />
        </Link>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-[#1A1A1A] border-t border-white/[0.06] px-6 sm:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
        <p className="font-mono-plex text-[11px] font-light text-white/20 tracking-[0.04em]">© 2026 Clerk</p>
        <p className="font-mono-plex text-[11px] font-light text-white/20 tracking-[0.04em]">Early Access</p>
      </footer>
    </div>
  );
}
