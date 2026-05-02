# Pre-MVP Launch Audit — Clerk

Scope: I read the landing page, auth flow, onboarding, AppHome (focus + planner + DnD), settings, the `sort-tasks` edge function, RLS policies, and the index/manifest. DB linter is clean and no security findings — good baseline. Below is what's missing or weak before you ship to real users.

---

## P0 — Must fix before public launch

**1. "No account needed to try" is a lie**
Both CTAs on the landing page say *"No account needed to try"*, but `primaryPath` always routes to `/onboarding` (which requires auth) or `/auth`. Either:
- Build a true no-auth try mode (localStorage-backed sandbox), or
- Change the copy to *"Free to start"* / *"Free, no credit card"*.
Recommend: change the copy for MVP. Lowest risk.

**2. Email confirmation flow is broken**
`Auth.tsx` calls `navigate("/onboarding")` immediately after `signUp`, but Supabase signups require email confirmation (you haven't enabled auto-confirm). The user lands on `/onboarding`, the `useEffect` sees no session, and bounces them back to `/auth`. Confusing.
Fix: after signup, show a "Check your email" state instead of navigating. Or enable auto-confirm if you want frictionless try.

**3. "Back up your tasks" button is fake**
In `SettingsModal`, the Manage/Back up button just says *"Coming soon — account sync is on the way."* Every signed-in user already has cloud sync — the copy is wrong and the button does nothing. For signed-out users (which shouldn't exist in this app currently), the offer is empty. Either remove the section or make it show actual account info (email + sign out).

**4. Forgot-password flow is incomplete in UI**
`ResetPassword.tsx` exists (route is wired) but I didn't see it in this audit pass — verify it: handles the recovery token from the email link, shows a new-password form, and signs the user in. If it's a stub, this breaks every locked-out user.

**5. Landing page SEO/social card has no image**
`og:image` and `twitter:image` are missing. Any link share (X, iMessage, Slack, LinkedIn) renders blank. Add a 1200×630 PNG to `/public/og-image.png` and reference it.

---

## P1 — Strongly recommended before launch

**6. No legal pages**
No Privacy Policy, no Terms. Required for Google OAuth verification (you'll get rejected eventually) and for App Store / PWA distribution. Add `/privacy` and `/terms` routes with minimal honest copy. Link from landing footer.

**7. Landing footer is too thin**
Just `© 2026 Clerk · Early Access`. No links to privacy, terms, contact, or "Made by". Users (and OAuth reviewers) will look for these.

**8. No error boundary**
A single render error in AppHome (1193-line file with lots of state) crashes the whole app to a blank screen. Wrap routes in a React error boundary that shows a friendly *"Something broke. Reload."* fallback.

**9. Mobile video weight**
`landing-hero.mp4` autoplays on every device now. Check the file size — if >3 MB it's a real cost on mobile data. Either compress to ~1–2 MB H.264 720p, ship a `<source>` poster image as fallback, or keep the static-gradient fallback for `prefers-reduced-data` / small viewports.

**10. No analytics**
You have zero visibility into: signup conversion, drop-off in onboarding, demo completion rate, AI sort failure rate. Add a lightweight analytics pixel (Plausible, Umami, or PostHog) before launch — otherwise you'll be flying blind on what to fix next.

**11. AI cost / abuse exposure**
`sort-tasks` edge function has `verify_jwt = false` and no per-user rate limit. Anyone can hit the public URL and burn your `LOVABLE_API_KEY` credits. Two options:
- Flip `verify_jwt = true` and require auth on every sort (matches reality — only logged-in users sort tasks).
- Or add per-IP rate limiting in the function.
Recommend: flip to `verify_jwt = true`.

**12. No retry / clear loading state on AI failure**
`processInput` shows a quip and falls back to local classify, but the user has no idea the AI failed. They might think Clerk is just dumb. Surface a small "AI offline — used local sort" hint next to affected proposals.

---

## P2 — Polish / nice-to-have

**13. Onboarding still uses old `landing-bg`**
`Onboarding.tsx` uses `className="landing-bg"`. The landing page is now dark cinematic; onboarding still uses the old warm gradient. Intentional? If yes, fine — your memory says "rest of app stays warm/light." Just confirm that's the brand decision.

**14. No empty-state for fresh accounts**
After onboarding, if a user enters zero seed tasks, AppHome opens to an empty Today column with no guidance. Add an empty-state illustration or a Clerk speech bubble like *"Type something below to get started."*

**15. Completed view, but no undo on accidental complete**
TaskCard complete is one-tap. No undo toast. Easy regret moment. Add a Sonner toast with an Undo action that re-inserts the task (5s window).

**16. Streak edge cases**
Streak only ticks when you complete a task. A user who plans every day but completes nothing breaks streak — which might be the intent, but worth deciding explicitly. Also: timezone changes (traveling) can double-count or skip a day because you're using ISO date strings without timezone normalization.

**17. AppHome.tsx is 1193 lines**
Not a launch blocker, but it's going to bite the next time you debug. Extract `FocusView`, `PlannerMobile`, `PlannerDesktop`, `DroppableColumn`, and the proposal modal into their own files post-launch.

**18. No test coverage on the critical paths**
`vitest` is set up with one example test. The carry-over logic, classify fallback, and proposal accept flow are all untested. At minimum, snapshot-test `planCarryOver` and `classify` since those are pure functions.

**19. Accessibility gaps**
- Several interactive `<div>`s in the proposal modal and planner have no `role="button"` / keyboard handlers.
- Drag-and-drop has no keyboard alternative (dnd-kit supports it, you just haven't enabled `KeyboardSensor`).
- The video has no `aria-hidden` issue (good) but `prefers-reduced-motion` is ignored — the video, the cursor blink, the scroll bounce, and the fade-up animations all run regardless.

**20. PWA install prompt is documented but not triggered**
You list install instructions in Settings but don't fire `beforeinstallprompt` to actually offer install. Cheap win.

---

## Backend / data

- **RLS:** Clean. Owner-scoped on all three tables. ✓
- **No foreign keys** between `tasks.user_id` / `completed_tasks.user_id` and `auth.users`. That's intentional per Lovable conventions, but consider an `ON DELETE CASCADE` cleanup function so deleted accounts don't leak rows.
- **`tasks.position` is `integer`** with a "halve the gap" reorder strategy. You'll hit collisions after enough reorders. Switch to a fractional/string ranking (lexorank) post-launch if reordering becomes heavy.
- **No edge function for account deletion.** GDPR-adjacent: users have no way to delete their account. Add a "Delete account" button in Danger Zone that wipes `tasks`, `completed_tasks`, `profiles`, and calls `auth.admin.deleteUser` via a service-role edge function.

---

## Suggested launch checklist (in order)

```text
1. Fix the "No account needed" copy OR build sandbox mode      [P0]
2. Fix signup → email-confirm flow                              [P0]
3. Verify ResetPassword works end-to-end                        [P0]
4. Add og:image                                                 [P0]
5. Lock down sort-tasks (verify_jwt = true)                     [P0/P1]
6. Add /privacy and /terms                                      [P1]
7. Add error boundary + analytics                               [P1]
8. Compress hero video, add reduced-motion guard                [P1]
9. Account-delete flow                                          [P1]
10. Empty state + undo-complete toast                           [P2]
```

If you approve, I'll switch to build mode and tackle P0 items first — recommend starting with #1, #2, #4, and #5 in a single pass since they're tightly scoped. Let me know which P0/P1 items to do now vs. later.
