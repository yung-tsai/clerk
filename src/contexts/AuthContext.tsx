import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getLovableCloudClient, hasLovableCloudEnv } from "@/lib/lovable-cloud";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasLovableCloudEnv) {
      setLoading(false);
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | undefined;

    getLovableCloudClient()
      .then((supabase) => {
        if (!active) return;
        const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
          if (!active) return;
          setSession(s);
          setLoading(false);
        });
        unsubscribe = () => sub.subscription.unsubscribe();
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!active) return;
          setSession(session);
          setLoading(false);
        });
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut: async () => {
          if (!hasLovableCloudEnv) return;
          const supabase = await getLovableCloudClient();
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
