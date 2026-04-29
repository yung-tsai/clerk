import { Link } from "react-router-dom";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import { useAuth } from "@/contexts/AuthContext";
import { hasLovableCloudEnv } from "@/lib/lovable-cloud";

export default function Landing() {
  const { user } = useAuth();
  const primaryPath = hasLovableCloudEnv ? (user ? "/app" : "/onboarding") : "/auth";

  return (
    <div className="min-h-screen landing-bg">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[540px] flex-col items-center px-6 pt-7 pb-20">
        <header className="mb-16 flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <ClerkCharacter size={28} />
            <span className="font-mono-plex text-[11px] font-semibold uppercase tracking-[0.1em]">
              Clerk
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <a
              href="#how"
              className="font-mono-plex text-[11px] font-light uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works
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
          <ClerkCharacter size={120} className="mb-8" />
          <h1 className="animate-fade-up font-plex text-[clamp(34px,9vw,56px)] font-light leading-[1.07] tracking-[-0.03em] text-foreground">
            Your tasks,<br />sorted.
          </h1>
          <p className="mt-5 max-w-[420px] animate-fade-up text-[15px] font-light leading-[1.55] text-muted-foreground">
            Type what's on your mind. Clerk decides what to do today,
            tomorrow, this week — or never. Dry, confident, occasionally wry.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              to={primaryPath}
              className="rounded-full bg-foreground px-7 py-3 font-plex text-[14px] font-medium text-background transition-transform hover:scale-[1.02]"
            >
              {user ? "Open Clerk" : "Get started"}
            </Link>
            <span className="font-mono-plex text-[11px] font-light text-faint">
              Free. No credit card.
            </span>
          </div>
        </section>

        <section id="how" className="mt-32 grid w-full gap-8">
          {[
            ["01", "Brain dump", "Throw in everything. Comma-separated, all at once."],
            ["02", "Clerk sorts", "Today, tomorrow, this week, or someday — with reasoning."],
            ["03", "You execute", "Drag, edit, or argue back. It learns."],
          ].map(([n, t, d]) => (
            <div key={n} className="clerk-card p-5">
              <div className="font-mono-plex text-[10px] font-light uppercase tracking-[0.12em] text-faint">
                {n}
              </div>
              <h3 className="mt-2 font-plex text-[18px] font-medium">{t}</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">{d}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
