import { Link } from "react-router-dom";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import { useAuth } from "@/contexts/AuthContext";
import { hasLovableCloudEnv } from "@/lib/lovable-cloud";
import { useIsMobile } from "@/hooks/use-mobile";
import clerkLogo from "@/assets/clerk-logo.png";

export default function Landing() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const primaryPath = hasLovableCloudEnv ? (user ? "/app" : "/onboarding") : "/auth";

  return (
    <div className="min-h-screen landing-bg overflow-x-hidden">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[540px] flex-col items-center px-5 pt-6 pb-16 sm:px-6 sm:pt-7 sm:pb-20">
        <header className="mb-10 sm:mb-16 flex w-full items-center justify-between">
          <img src={clerkLogo} alt="Clerk" className="h-[22px] sm:h-[24px] w-auto select-none" draggable={false} />
          <nav className="flex items-center gap-5 sm:gap-6">
            <a
              href="#how"
              className="font-mono-plex text-[11px] font-light uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:text-foreground"
            >
              How
            </a>
            {user ? (
              <Link
                to="/app"
                className="font-mono-plex text-[11px] font-light uppercase tracking-[0.05em] text-muted-foreground hover:text-foreground"
              >
                Open
              </Link>
            ) : (
              <Link
                to="/auth"
                className="font-mono-plex text-[11px] font-light uppercase tracking-[0.05em] text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
            )}
          </nav>
        </header>

        <section className="flex w-full flex-col items-center text-center">
          <ClerkCharacter size={isMobile ? 96 : 120} className="mb-6 sm:mb-8" />
          <h1 className="animate-fade-up font-plex font-light leading-[1.08] tracking-[-0.03em] text-foreground px-2 sm:px-0" style={{ fontSize: "clamp(30px, 8.5vw, 56px)" }}>
            Your tasks,<br />sorted.
          </h1>
          <p className="mt-4 sm:mt-5 max-w-[420px] animate-fade-up text-[14px] sm:text-[15px] font-light leading-[1.55] text-muted-foreground">
            Type what's on your mind. Clerk decides what to do today,
            tomorrow, this week — or never. Dry, confident, occasionally wry.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col items-center gap-4">
            <Link
              to={primaryPath}
              className="rounded-full bg-foreground px-8 py-3.5 sm:px-9 sm:py-4 font-plex text-[14px] sm:text-[15px] font-medium text-background transition-transform hover:scale-[1.02] min-h-[48px] inline-flex items-center"
            >
              {user ? "Open Clerk" : "Get started"}
            </Link>
            <span className="font-mono-plex text-[11px] font-light text-faint">
              Free. No credit card.
            </span>
          </div>
        </section>

        <section id="how" className="mt-20 sm:mt-32 grid w-full gap-5 sm:gap-8">
          {[
            ["01", "Brain dump", "Throw in everything. Comma-separated, all at once."],
            ["02", "Clerk sorts", "Today, tomorrow, this week, or someday — with reasoning."],
            ["03", "You execute", "Drag, edit, or argue back. It learns."],
          ].map(([n, t, d]) => (
            <div key={n} className="clerk-card p-4 sm:p-5">
              <div className="font-mono-plex text-[10px] font-light uppercase tracking-[0.12em] text-faint">
                {n}
              </div>
              <h3 className="mt-2 font-plex text-[16px] sm:text-[18px] font-medium">{t}</h3>
              <p className="mt-1 text-[13px] text-muted-foreground leading-[1.5]">{d}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
