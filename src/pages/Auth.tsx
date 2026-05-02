import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import { toast } from "sonner";
import { clerkSay } from "@/lib/clerk-say";
import { getLovableCloudClient } from "@/lib/lovable-cloud";
import { lovable } from "@/integrations/lovable";
import { track, identify } from "@/lib/analytics";

type Mode = "signin" | "signup" | "forgot";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = await getLovableCloudClient();

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        clerkSay("Check your email for a reset link.");
        setMode("signin");
        return;
      }

      if (mode === "signup") {
        track("signup_started", { method: "email" });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/onboarding" },
        });
        if (error) throw error;
        // If email confirmation is required, there's no session yet.
        if (!data.session) {
          setConfirmSent(true);
          track("signup_email_sent", { method: "email" });
          return;
        }
        if (data.user) identify(data.user.id, { email: data.user.email ?? undefined });
        track("signup_completed", { method: "email" });
        clerkSay("Account created. Welcome.");
        navigate("/onboarding");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) identify(data.user.id, { email: data.user.email ?? undefined });
        track("signin_completed", { method: "email" });
        navigate("/app");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    track("signup_started", { method: "google" });
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/app`,
      });
      if (result.error) {
        toast.error(result.error.message || "Could not sign in with Google");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) {
        // Browser is navigating to Google — nothing more to do.
        return;
      }
      // Tokens received and session set — let AppHome decide where to go.
      navigate("/app");
    } catch (err: any) {
      toast.error(err?.message || "Could not start Google sign-in");
      setGoogleLoading(false);
    }
  };

  const titles: Record<Mode, { h1: string; sub: string; cta: string }> = {
    signup: { h1: "Get started", sub: "Create your Clerk account", cta: "Create account" },
    signin: { h1: "Welcome back", sub: "Sign in to continue", cta: "Sign in" },
    forgot: { h1: "Reset password", sub: "We'll email you a reset link", cta: "Send reset link" },
  };
  const t = titles[mode];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="relative z-10 w-full max-w-[380px] flex flex-col items-center">
        <Link to="/" className="mb-6">
          <ClerkCharacter size={64} />
        </Link>
        {confirmSent ? (
          <>
            <h1 className="font-plex text-[28px] font-light tracking-[-0.02em] mb-2 text-center">
              Check your email
            </h1>
            <p className="font-mono-plex text-[12px] text-muted-foreground mb-8 text-center leading-[1.6]">
              I sent a confirmation link to <span className="text-foreground">{email}</span>.
              <br />
              Click it to finish creating your account.
            </p>
            <button
              onClick={() => {
                setConfirmSent(false);
                setMode("signin");
              }}
              className="font-mono-plex text-[11px] text-muted-foreground hover:text-foreground"
            >
              ← Back to sign in
            </button>
          </>
        ) : (
        <>
        <h1 className="font-plex text-[28px] font-light tracking-[-0.02em] mb-1">{t.h1}</h1>
        <p className="font-mono-plex text-[12px] text-muted-foreground mb-8">{t.sub}</p>

        {mode !== "forgot" && (
          <>
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={googleLoading || loading}
              className="w-full rounded-full bg-white border border-border py-3 font-plex text-[14px] font-medium text-foreground hover:bg-foreground/[0.03] transition-colors disabled:opacity-50 flex items-center justify-center gap-2.5 mb-4"
            >
              <GoogleIcon />
              {googleLoading ? "..." : "Continue with Google"}
            </button>

            <div className="w-full flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="font-mono-plex text-[10px] text-muted-foreground tracking-wider uppercase">
                or
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="w-full space-y-3">
          <input
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[14px] outline-none focus:border-foreground/40"
          />
          {mode !== "forgot" && (
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[14px] outline-none focus:border-foreground/40"
            />
          )}
          <button
            disabled={loading || googleLoading}
            className="w-full rounded-full bg-foreground py-3 font-plex text-[14px] font-medium text-background disabled:opacity-50"
          >
            {loading ? "..." : t.cta}
          </button>
        </form>

        {mode === "signin" && (
          <button
            onClick={() => setMode("forgot")}
            className="mt-4 font-mono-plex text-[11px] text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </button>
        )}

        <button
          onClick={() => {
            if (mode === "forgot") setMode("signin");
            else setMode(mode === "signup" ? "signin" : "signup");
          }}
          className="mt-6 font-mono-plex text-[11px] text-muted-foreground hover:text-foreground"
        >
          {mode === "forgot"
            ? "← Back to sign in"
            : mode === "signup"
            ? "Have an account? Sign in"
            : "New here? Sign up"}
        </button>
        </>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
