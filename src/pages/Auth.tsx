import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/onboarding" },
        });
        if (error) throw error;
        toast.success("Account created. Welcome.");
        navigate("/onboarding");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/app");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen landing-bg flex items-center justify-center px-6">
      <div className="relative z-10 w-full max-w-[380px] flex flex-col items-center">
        <Link to="/" className="mb-6">
          <ClerkCharacter size={64} />
        </Link>
        <h1 className="font-plex text-[28px] font-light tracking-[-0.02em] mb-1">
          {mode === "signup" ? "Get started" : "Welcome back"}
        </h1>
        <p className="font-mono-plex text-[12px] text-muted-foreground mb-8">
          {mode === "signup" ? "Create your Clerk account" : "Sign in to continue"}
        </p>

        <form onSubmit={submit} className="w-full space-y-3">
          <input
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[14px] outline-none focus:border-foreground/40"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[14px] outline-none focus:border-foreground/40"
          />
          <button
            disabled={loading}
            className="w-full rounded-full bg-foreground py-3 font-plex text-[14px] font-medium text-background disabled:opacity-50"
          >
            {loading ? "..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-6 font-mono-plex text-[11px] text-muted-foreground hover:text-foreground"
        >
          {mode === "signup" ? "Have an account? Sign in" : "New here? Sign up"}
        </button>
      </div>
    </div>
  );
}
