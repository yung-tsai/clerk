import { Link } from "react-router-dom";
import clerkLogo from "@/assets/clerk-logo.svg";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="px-6 sm:px-12 py-7 border-b border-divider">
        <Link to="/" className="inline-block">
          <img src={clerkLogo} alt="Clerk" className="h-[28px] w-auto" />
        </Link>
      </nav>
      <main className="max-w-[680px] mx-auto px-6 sm:px-12 py-12 sm:py-20">
        <h1 className="font-plex text-[32px] sm:text-[40px] font-semibold tracking-[-0.025em] mb-2">
          Terms
        </h1>
        <p className="font-mono-plex text-[12px] text-muted-foreground mb-10">
          Last updated: May 2, 2026
        </p>

        <div className="space-y-8 text-[15px] leading-[1.7] text-foreground/85">
          <section>
            <h2 className="font-plex text-[18px] font-semibold mb-3 text-foreground">Early access</h2>
            <p>
              Clerk is in early access. The service is provided as-is, may
              change without notice, and may have downtime or bugs. Don't rely
              on it as the only place where critical information lives.
            </p>
          </section>

          <section>
            <h2 className="font-plex text-[18px] font-semibold mb-3 text-foreground">Your account</h2>
            <p>
              You're responsible for keeping your login credentials safe and
              for what happens under your account. Don't use Clerk to do
              anything illegal or to harm other people.
            </p>
          </section>

          <section>
            <h2 className="font-plex text-[18px] font-semibold mb-3 text-foreground">Your content</h2>
            <p>
              The tasks you write belong to you. We only use them to sort and
              show them back to you, and to send them to our AI provider for
              prioritization. You can delete them at any time.
            </p>
          </section>

          <section>
            <h2 className="font-plex text-[18px] font-semibold mb-3 text-foreground">AI output</h2>
            <p>
              Clerk uses AI to suggest priorities and explain reasoning. AI can
              be wrong, biased, or weird. Treat its suggestions as a starting
              point, not a directive. You always make the final call on what
              to do.
            </p>
          </section>

          <section>
            <h2 className="font-plex text-[18px] font-semibold mb-3 text-foreground">Liability</h2>
            <p>
              To the extent allowed by law, Clerk is not liable for any
              indirect, incidental, or consequential damages arising from your
              use of the service.
            </p>
          </section>

          <section>
            <h2 className="font-plex text-[18px] font-semibold mb-3 text-foreground">Changes</h2>
            <p>
              We may update these terms. Material changes will be announced in
              the app or by email. Continued use after changes means you accept
              the new terms.
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
