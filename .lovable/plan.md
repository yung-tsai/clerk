# Speech-bubble notifications + cleaner task cards

Two changes, shipped together.

## 1. Remove "Clerk's reasoning" line from task cards

The `reason` line on each `TaskCard` is `line-clamp-1` and usually truncated, so it's adding noise more than value. The reason already lives in a proper "Clerk's reasoning" block inside `TaskDetailModal`, which is the right home for it.

- In `src/components/TaskCard.tsx`, delete the `{task.reason && ( <p>... )}` block (lines ~110–114).
- Leave the `reason` field on `TaskCardData` and everywhere else (modal, DB, edge function) — it's still used, just not on the card.

## 2. Persistent corner Clerk that talks via speech bubbles

Clerk lives in the bottom-right of the authenticated app. When something happens that today fires a toast, Clerk pops a speech bubble instead. Plain `toast.error(...)` for errors stays as a normal toast (errors should look like errors, not like the mascot is happy about a 500).

### Behavior

- Persistent small Clerk (~56px) fixed in the bottom-right corner of `/app`. Not shown on Landing, Auth, Onboarding, or ResetPassword (those screens have their own Clerk moments).
- A speech bubble renders above-left of Clerk when there's a message to say.
- Bubble auto-dismisses after ~3.5s, or on click.
- Only one bubble at a time — a new message replaces the current one (no queue, no stack).
- Clicking corner Clerk does a small squish animation (already supported by `ClerkCharacter`) and dismisses any active bubble.
- Bubble has a little tail pointing down-right toward Clerk.
- Hidden on viewports below `sm` if it would overlap the FAB / input — we'll tuck it above the input bar with bottom offset.

### What becomes a bubble vs. a toast

Bubbles (replace `toast.success` / neutral `toast(...)` calls):
- `AppHome.tsx`: "All tasks cleared." after deleting all
- `CompletedModal.tsx`: "History cleared."
- `Auth.tsx`: "Account created. Welcome." / "Check your email for a reset link."
- `ResetPassword.tsx`: "Password updated. You're signed in."
- `SettingsModal.tsx`: "Coming soon — account sync is on the way."

Stay as regular sonner toasts (errors / system):
- All `toast.error(...)` calls (rate limits, AI credit exhaustion, validation errors, network errors).

### Implementation

**New file `src/components/ClerkBubble.tsx`** — a tiny zustand-free store + provider:

- A module-level event emitter exposing `clerkSay(message: string, opts?: { duration?: number })`.
- A `<ClerkCorner />` component that:
  - Subscribes to the emitter, holds `currentMessage` in state with an auto-dismiss timer.
  - Renders a `position: fixed` container in `bottom-4 right-4 z-50`.
  - Inside: the speech bubble (when message present) above the `ClerkCharacter`.
  - Bubble: rounded white card with border, drop shadow, max-width ~260px, `font-plex text-[14px]`, small triangular tail pointing down-right. Animates in with a subtle scale+fade (use existing `animate-card-in` or add a `bubble-in` keyframe in `index.css`).
  - Clicking Clerk or the bubble dismisses immediately.
- Mount `<ClerkCorner />` once inside `AppHome` (not globally in `App.tsx`, so it only appears in the authenticated app).

**Wiring helper `src/lib/clerk-say.ts`**: tiny re-export of `clerkSay` so imports read naturally:
```ts
import { clerkSay } from "@/lib/clerk-say";
clerkSay("All clear.");
```

**Migration of call sites**: at each bullet above, swap `toast.success(...)` → `clerkSay(...)`. Errors stay on sonner.

### Copy (placeholder, flag for Claude)

I'll wire the mechanism with **placeholder strings** matching today's copy and add a comment block at the top of `clerk-say.ts` listing every site + current string so Claude can do a voice pass:

```ts
// VOICE PASS NEEDED — Claude territory.
// Sites currently using clerkSay (replace strings, keep keys/locations):
//   AppHome — "All tasks cleared."
//   CompletedModal — "History cleared."
//   Auth — "Account created. Welcome." / "Check your email for a reset link."
//   ResetPassword — "Password updated. You're signed in."
//   SettingsModal — "Coming soon — account sync is on the way."
```

Per the Claude/Lovable handoff rule, I won't rewrite the strings myself — I'll flag them.

## Out of scope for this round

- Multi-message queue (one at a time is enough for MVP).
- Bubble for error states (errors stay as sonner toasts — visually distinct from Clerk being chipper).
- Sound / haptics.
- Clerk reacting differently per message type (idle/celebrate/think variants).

## Files touched

- `src/components/TaskCard.tsx` — remove reason paragraph
- `src/components/ClerkBubble.tsx` — new (corner Clerk + bubble + emitter)
- `src/lib/clerk-say.ts` — new (typed `clerkSay` helper + voice-pass TODO comment)
- `src/pages/AppHome.tsx` — mount `<ClerkCorner />`, swap success toast
- `src/components/CompletedModal.tsx` — swap success toast
- `src/pages/Auth.tsx` — swap success toasts
- `src/pages/ResetPassword.tsx` — swap success toast
- `src/components/SettingsModal.tsx` — swap neutral toast
- `src/index.css` — add `bubble-in` keyframe (small scale + fade)
