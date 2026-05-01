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

// Cache the last message briefly so messages fired during navigation
// (e.g. right before /app mounts) still get delivered to the corner Clerk.
let pending: { message: string; duration: number; firedAt: number } | null = null;
const PENDING_WINDOW_MS = 1500;

export function clerkSay(message: string, opts?: { duration?: number }) {
  const duration = opts?.duration ?? 3500;
  if (listeners.size === 0) {
    pending = { message, duration, firedAt: Date.now() };
  } else {
    listeners.forEach((l) => l(message, duration));
  }
}

export function subscribeClerk(listener: Listener) {
  listeners.add(listener);
  if (pending && Date.now() - pending.firedAt < PENDING_WINDOW_MS) {
    listener(pending.message, pending.duration);
  }
  pending = null;
  return () => {
    listeners.delete(listener);
  };
}
