import { Link } from "react-router-dom";
import clerkLogo from "@/assets/clerk-logo.svg";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="px-6 sm:px-12 py-7 border-b border-divider">
        <Link to="/" className="inline-block">
          <img src={clerkLogo} alt="Clerk" className="h-[28px] w-auto" />
        </Link>
      </nav>
      <main className="max-w-[680px] mx-auto px-6 sm:px-12 py-12 sm:py-20">
        <h1 className="font-plex text-[32px] sm:text-[40px] font-semibold tracking-[-0.025em] mb-2">
          Privacy
        </h1>
        <p className="font-mono-plex text-[12px] text-muted-foreground mb-10">
          Last updated: May 2, 2026
        </p>

        <div className="space-y-8 text-[15px] leading-[1.7] text-foreground/85">
          <section>
            <h2 className="font-plex text-[18px] font-semibold mb-3 text-foreground">What we collect</h2>
            <p>
              When you create an account we store your email address, an
              optional display name, and the tasks you write. That's it. We do
              not collect analytics about how you use the app yet, and we do
              not sell or share your data.
            </p>
          </section>

          <section>
            <h2 className="font-plex text-[18px] font-semibold mb-3 text-foreground">How your tasks are processed</h2>
            <p>
              When you submit tasks, we send the text you wrote to a third-party
              AI model (via Lovable AI Gateway, which currently uses Google
              Gemini) so it can sort and explain them. We do not include your
              email or name in that request — only the task text and your
              timezone. The AI provider does not retain or train on your data.
            </p>
          </section>

          <section>
            <h2 className="font-plex text-[18px] font-semibold mb-3 text-foreground">Where it lives</h2>
            <p>
              Your account and tasks are stored on Supabase infrastructure
              hosted in the EU. Only you can read your tasks — enforced at the
              database level.
            </p>
          </section>

          <section>
            <h2 className="font-plex text-[18px] font-semibold mb-3 text-foreground">Your rights</h2>
            <p>
              You can clear all your tasks any time from Settings → Danger
              zone, and you can permanently delete your account from the same
              screen. Account deletion removes all your tasks, completed
              history, and profile.
            </p>
          </section>

          <section>
            <h2 className="font-plex text-[18px] font-semibold mb-3 text-foreground">Cookies</h2>
            <p>
              We use only the cookies and local storage necessary to keep you
              signed in. No tracking cookies, no third-party advertising
              cookies.
            </p>
          </section>

          <section>
            <h2 className="font-plex text-[18px] font-semibold mb-3 text-foreground">Contact</h2>
            <p>
              Questions, complaints, or data requests: reply to any email we
              send you, or reach out via the link on our landing page.
            </p>
          </section>
        </div>
      </main>
      <footer className="border-t border-divider px-6 sm:px-12 py-6 text-center">
        <p className="font-mono-plex text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">← Back to Clerk</Link>
        </p>
      </footer>
    </div>
  );
}
