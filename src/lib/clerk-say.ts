// VOICE PASS NEEDED — Claude territory.
// These strings are placeholders matching the previous toast copy.
// Claude should rewrite them in Clerk's voice (warm, sassy, calm).
// Sites currently using clerkSay (replace strings, keep keys/locations):
//   AppHome — "All tasks cleared."
//   CompletedModal — "History cleared."
//   Auth — "Account created. Welcome." / "Check your email for a reset link."
//   ResetPassword — "Password updated. You're signed in."
//   SettingsModal — "Coming soon — account sync is on the way."

type Listener = (message: string, duration: number) => void;

const listeners = new Set<Listener>();

export function clerkSay(message: string, opts?: { duration?: number }) {
  const duration = opts?.duration ?? 3500;
  listeners.forEach((l) => l(message, duration));
}

export function subscribeClerk(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
