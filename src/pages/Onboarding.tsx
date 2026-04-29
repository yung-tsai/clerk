import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClerkCharacter } from "@/components/ClerkCharacter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getLovableCloudClient } from "@/lib/lovable-cloud";

const SCREENS = 3;

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const next = () => setStep((s) => Math.min(s + 1, SCREENS - 1));

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = await getLovableCloudClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name || null, onboarded: true })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate("/app");
  };

  return (
    <div className="min-h-screen landing-bg overflow-hidden relative">
      {/* progress dots */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {Array.from({ length: SCREENS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? "w-[18px] bg-foreground" : "w-1.5 bg-foreground/15"
            }`}
          />
        ))}
      </div>

      <button
        onClick={finish}
        className="fixed bottom-8 right-6 font-mono-plex text-[11px] font-light tracking-[0.04em] text-faint hover:text-muted-foreground z-10"
      >
        SKIP
      </button>

      <div className="relative z-[1] min-h-screen flex flex-col items-center justify-center px-6 text-center">
        {step === 0 && (
          <div className="animate-fade-up">
            <ClerkCharacter size={120} className="mb-8" />
            <h1 className="font-plex text-[34px] font-light tracking-[-0.02em] mb-3">
              Hi. I'm Clerk.
            </h1>
            <p className="text-[15px] text-muted-foreground max-w-[340px] mx-auto">
              I sort your tasks. Today, tomorrow, this week, or someday.
              <br />I have opinions.
            </p>
            <button
              onClick={next}
              className="mt-10 rounded-full bg-foreground px-7 py-3 font-plex text-[14px] font-medium text-background"
            >
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up w-full max-w-[340px]">
            <ClerkCharacter size={80} className="mb-6" />
            <h1 className="font-plex text-[28px] font-light tracking-[-0.02em] mb-2">
              What should I call you?
            </h1>
            <p className="text-[13px] text-muted-foreground mb-8">
              I'll greet you each morning.
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[15px] text-center outline-none focus:border-foreground/40"
            />
            <button
              onClick={next}
              className="mt-8 rounded-full bg-foreground px-7 py-3 font-plex text-[14px] font-medium text-background"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up max-w-[380px]">
            <ClerkCharacter size={100} className="mb-6" />
            <h1 className="font-plex text-[28px] font-light tracking-[-0.02em] mb-3">
              {name ? `Ready, ${name}?` : "Ready?"}
            </h1>
            <p className="text-[14px] text-muted-foreground leading-relaxed mb-2">
              Type tasks the way you'd say them. Comma-separate to dump several.
            </p>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              I'll sort. You execute.
            </p>
            <button
              onClick={finish}
              disabled={saving}
              className="mt-10 rounded-full bg-foreground px-8 py-3 font-plex text-[14px] font-medium text-background disabled:opacity-50"
            >
              {saving ? "..." : "Let's go"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
