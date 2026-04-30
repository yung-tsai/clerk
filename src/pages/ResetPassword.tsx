import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import { toast } from "sonner";
import { getLovableCloudClient } from "@/lib/lovable-cloud";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Supabase exchanges the recovery token in the URL hash automatically
  // on load. We just wait for the session (or PASSWORD_RECOVERY event).
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const supabase = await getLovableCloudClient();

      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (!active) return;
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          setReady(true);
        }
      });
      unsubscribe = () => sub.subscription.unsubscribe();

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) setReady(true);
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const supabase = await getLovableCloudClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message || "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen landing-bg flex items-center justify-center px-6">
      <div className="relative z-10 w-full max-w-[380px] flex flex-col items-center">
        <ClerkCharacter size={64} />
        <h1 className="font-plex text-[28px] font-light tracking-[-0.02em] mb-1 mt-6">
          Set a new password
        </h1>
        <p className="font-mono-plex text-[12px] text-muted-foreground mb-8 text-center">
          {ready
            ? "Pick something you'll remember this time."
            : "Verifying your reset link..."}
        </p>

        <form onSubmit={submit} className="w-full space-y-3">
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!ready}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[14px] outline-none focus:border-foreground/40 disabled:opacity-50"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={!ready}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[14px] outline-none focus:border-foreground/40 disabled:opacity-50"
          />
          <button
            disabled={loading || !ready}
            className="w-full rounded-full bg-foreground py-3 font-plex text-[14px] font-medium text-background disabled:opacity-50"
          >
            {loading ? "..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
