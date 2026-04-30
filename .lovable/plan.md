## What we're shipping

A full landing copy rewrite anchored on **"The to-do app that explains what to do first"** (Option C from chat), plus the small backend/UI work to make that promise honest, plus saving the product vision to memory so it persists across sessions.

**No onboarding changes.** Energy/mood capture is premature for MVP — see "What we're NOT doing" below.

---

## 1. Save vision to memory (so I never forget)

Three new memory files + index:

- **`mem://index.md`** — Core rules applied every session (audience, voice, MVP scope, do-nots)
- **`mem://product/vision`** — Full vision: audience (ADHD/anxiety/overthinkers + open door), differentiator (explains the *why*), MVP scope, future direction (energy/mood/motivation), brand voice
- **`mem://design/landing-voice`** — Copy rules: plain H1s (Sunsama-style), "explains/why" through-line repeated 5+ times, no medicalizing, no jargon ("loud," "lie/truth," "fog" — all rejected), audience named under CTA not in H1

This means future sessions auto-load the vision. You won't have to re-explain.

## 2. Landing copy rewrite (`src/pages/Landing.tsx`)

| Section | New copy |
|---|---|
| **H1** | The to-do app that explains what to do first. |
| **Subhead** (new line under H1) | Clerk picks your next task and tells you why. |
| **Bubble rotation** (5 lines) | "Tell me what's on your mind. I'll tell you what to start with — and why." / "Twelve things on your plate? I'll pick one." / "I don't just sort. I explain." / "Stuck on what's first? That's my job." / "You decide enough. Let me decide this." |
| **Under-CTA microcopy** (replaces current "No account needed to try") | Made for ADHD, anxiety, and anyone who overthinks their list. · No account needed to try. |
| **"Sound familiar?" header** | Does this sound like you? |
| **Without Clerk** bullets | • You don't know where to start • Everything feels equally important • You second-guess every decision |
| **With Clerk** bullets | • One clear next task • You know *why* it's first • No more second-guessing |
| **How it works 01** | Type what's on your mind |
| **How it works 02** | Clerk picks what's first — and explains why |
| **How it works 03** | You stop deciding, start doing |
| **Final CTA H2** | Stop deciding. Start doing. |

The word **"explain" / "why"** appears in: subhead, bubble, "With Clerk" bullets, How it works 02, meta description (below). Five reinforcements of one promise.

## 3. SEO pass (`index.html`)

Replace the meta tags:
- `<title>` → `Clerk — The to-do app that explains what to do first`
- `<meta description>` → `Clerk prioritizes your tasks and tells you why each one matters. Made for ADHD, anxiety, and anyone who overthinks their list.`
- `og:title` and `og:description` → match above
- Add `og:url`, `og:site_name`, `twitter:title`, `twitter:description` for proper link previews

## 4. Make the "why" promise honest — surface `reason` in the app

The backend already generates a `reason` per task (good!) but the UI never shows it. If our H1 says Clerk *explains*, the app must visibly explain. Two changes:

### a. `src/components/TaskDetailModal.tsx`
Add a new field at the top of the left column (above the "Move to" buttons) labeled **"Clerk's reasoning"** showing `local.reason`. Italic, muted color, small icon. If `reason` is null, hide the field entirely (don't show empty state — looks broken).

### b. `src/components/TaskCard.tsx` (subtle)
Add a single-line, small, muted reason snippet below the title — only when `task.reason` exists, truncated to one line. Toggle-able later if it's too noisy, but worth shipping so the *promise is visible without clicking*.

Both changes are read-only (display existing data) — no schema changes, no migrations.

## 5. What we're NOT doing (and why)

- **No onboarding changes.** Adding energy/mood/overwhelm questions before those features exist = broken promise. When energy features ship, ask in-context then.
- **No new database fields.** `reason` already exists on tasks. No migration needed.
- **No "lie from the truth" or "loud list" copy.** Rejected — too clever, ambiguous, off-brand for an app helping anxious users feel calm.
- **No medicalizing language.** No "treat," "diagnose," "cure," "therapy." Stay in experience language.

---

## Technical notes

- **Files edited:** `src/pages/Landing.tsx`, `index.html`, `src/components/TaskDetailModal.tsx`, `src/components/TaskCard.tsx`
- **Files created:** `mem://index.md`, `mem://product/vision`, `mem://design/landing-voice`
- **No backend changes.** `sort-tasks` edge function already returns `reason`.
- **No schema changes.** `tasks.reason` column already exists and is populated.
- **Build/typecheck:** No new types, no new deps. Should pass cleanly.

---

## Open question before I build

The audience line under the CTA currently reads:
> *Made for ADHD, anxiety, and anyone who overthinks their list.*

Are you comfortable naming **ADHD** and **anxiety** explicitly on the landing? It's a strong positioning move (the right people feel seen) but it's also a commitment. Three options:

- **(a)** Ship as written — names them directly
- **(b)** Softer: *"Made for busy brains and overthinkers."* — same vibe, no clinical words
- **(c)** Even softer / SEO-only: keep the body copy generic, but include "ADHD" and "anxiety" only in the meta description (so Google indexes it but the page itself stays neutral)

Tell me **a, b, or c** and I'll build immediately. Default if you don't specify: **(a)**.