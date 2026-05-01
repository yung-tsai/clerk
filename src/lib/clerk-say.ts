// Transport for Clerk's bubble messages.
// All quip *strings* live in `src/lib/clerk-quips.ts` (the tone bank) —
// don't add literal copy here. clerkSay() just delivers a string to whichever
// component is currently rendering the bubble (today: AppBar via AppHome).
//
// A few legacy literals still call clerkSay() directly with their own copy
// (Auth, ResetPassword, SettingsModal, CompletedModal, settings clear-all).
// Those are intentionally outside the tone bank for now — see plan.

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
