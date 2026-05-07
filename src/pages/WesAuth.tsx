import { useEffect, useState } from "react";
import { Navigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ClerkCharacter } from "@/components/ClerkCharacter";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Status = "idle" | "sending" | "done" | "error";

export default function WesAuth() {
  const [params] = useSearchParams();
  const { session, loading } = useAuth();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const port = Number(params.get("port"));
  const state = params.get("state") ?? "";

  const portValid = Number.isInteger(port) && port >= 1024 && port <= 65535;
  const stateValid = UUID_RE.test(state);
  const paramsValid = portValid && stateValid;

  useEffect(() => {
    if (loading || !session || !paramsValid || status !== "idle") return;
    const send = async () => {
      setStatus("sending");
      try {
        const res = await fetch(`http://127.0.0.1:${port}/handoff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        });
        if (!res.ok) throw new Error(`Wes responded ${res.status}`);
        setStatus("done");
      } catch (err: any) {
        setErrorMsg(err?.message || "Could not reach Wes on this device.");
        setStatus("error");
      }
    };
    send();
  }, [loading, session, paramsValid, port, state, status]);

  // Not signed in → bounce to /auth and come back here.
  if (!loading && !session && paramsValid) {
    const next = `/wes-auth?port=${port}&state=${encodeURIComponent(state)}`;
    return <Navigate to={`/auth?next=${encodeURIComponent(next)}`} replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-[380px] flex flex-col items-center text-center">
        <ClerkCharacter size={64} />

        {!paramsValid ? (
          <>
            <h1 className="font-plex text-[28px] font-light tracking-[-0.02em] mt-6 mb-2">
              Invalid sign-in link
            </h1>
            <p className="font-mono-plex text-[12px] text-muted-foreground leading-[1.6] mb-8">
              This page expects a <code>port</code> and <code>state</code> from the Wes
              desktop app. Open Wes and click "Sign in with Google" to start.
            </p>
            <Link
              to="/"
              className="font-mono-plex text-[11px] text-muted-foreground hover:text-foreground"
            >
              ← Back to Clerk
            </Link>
          </>
        ) : status === "done" ? (
          <>
            <h1 className="font-plex text-[28px] font-light tracking-[-0.02em] mt-6 mb-2">
              Signed into Wes
            </h1>
            <p className="font-mono-plex text-[12px] text-muted-foreground leading-[1.6] mb-8">
              You can close this tab and head back to the desktop app.
            </p>
          </>
        ) : status === "error" ? (
          <>
            <h1 className="font-plex text-[28px] font-light tracking-[-0.02em] mt-6 mb-2">
              Couldn't reach Wes
            </h1>
            <p className="font-mono-plex text-[12px] text-muted-foreground leading-[1.6] mb-2">
              {errorMsg}
            </p>
            <p className="font-mono-plex text-[12px] text-muted-foreground leading-[1.6] mb-8">
              Open Wes again and retry sign-in. Make sure it's still running on this device.
            </p>
            <Link
              to="/"
              className="font-mono-plex text-[11px] text-muted-foreground hover:text-foreground"
            >
              ← Back to Clerk
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-plex text-[28px] font-light tracking-[-0.02em] mt-6 mb-2">
              Signing into Wes…
            </h1>
            <p className="font-mono-plex text-[12px] text-muted-foreground leading-[1.6] mb-8">
              Handing your session to the desktop app.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
