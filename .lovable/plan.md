## Landing page redesign — dark video hero (Claude v2)

Full rebuild of `src/pages/Landing.tsx` to match Claude's `clerk_landing_v2_1.html` exactly: dark cinematic hero with full-bleed background video, light "How it works" section with three mockups, dark final CTA, dark footer. Lean three-section page.

### Headline exception
Keep the approved H1: **"Your clerk for a calmer to-do list."** (overrides the headline in Claude's file). Render in three lines, IBM Plex Mono, white, with the third line at 75% opacity + lighter weight — same treatment Claude used for "Better focus."

### Sections (in order)

```text
┌─────────────────────────────────────────┐
│ HERO — full viewport, dark              │
│  • <video> background, autoplay loop    │
│  • dark gradient overlay (left-heavy)   │
│  • nav: logo + "Open →" pill (top)      │
│  • H1 + CTA + "No account needed" note  │
│  • scroll hint at bottom center         │
├─────────────────────────────────────────┤
│ HOW IT WORKS — light (#F5F5F3)          │
│  • centered "How it works." headline    │
│  • 3 steps, 2-col (text | mockup)       │
│    01 Dump everything → input mockup    │
│    02 Clerk sorts + explains → proposal │
│       modal mockup with 3 task cards    │
│    03 You stay in control → column      │
│       move mockup                        │
├─────────────────────────────────────────┤
│ FINAL CTA — dark (#1A1A1A)              │
│  • "Your tasks won't sort themselves.   │
│     But Clerk will."                    │
│  • white pill CTA + "No account..." note│
├─────────────────────────────────────────┤
│ FOOTER — dark, © 2026 Clerk · Early     │
│ Access                                  │
└─────────────────────────────────────────┘
```

### What's being cut
- Hero right-column video card (video moves to full-bleed background)
- "Does this sound like you?" tension section (Without/With Clerk grid)
- "Made for ADHD, anxiety…" audience line (both hero and final CTA)
- "Stop deciding. Start doing." (replaced by Claude's final headline)
- Existing `landing-bg` warm pastel background on this page

### Video file
Replace `public/landing-hero.mp4` with the uploaded `landing-video-2.mp4`. Keep the same filename so any other references (e.g., preloads) still work. Add `poster` attr pointing at a still frame — for now reuse a generated/placeholder; we can swap a real poster later.

### Mockup details (built as pure JSX/Tailwind, no new components)
- **Input mockup**: white card, "WHAT NEEDS DOING?" label, gray input box with example brain-dump text + blinking blue cursor.
- **Proposal mockup**: white card with mascot SVG inline (reuse the inline SVG from Claude's file — keeps it self-contained, no dep on `ClerkCharacter`), "Here's what I'd do." title, three task rows with colored column tags (Today/Tomorrow/Someday) using existing tag-* tokens, italic reason line, dark "Looks good" button.
- **Move mockup**: vertical stack of 4 column rows; first ("Today / Finish case study") highlighted with blue border + faint blue tint to show "you can move things."

### Styling approach
- Tailwind-first, but a few one-off effects (background video positioning, dark left-to-right gradient overlay, scroll-hint bounce, blinking cursor) need small additions to `src/index.css` under `@layer utilities` / keyframes:
  - `.hero-overlay-dark` — the two-layer gradient
  - `@keyframes scroll-bounce` + `.animate-scroll-bounce`
  - `@keyframes cursor-blink` + `.animate-cursor-blink` (or reuse Tailwind animate-pulse — close enough)
- Fonts already loaded (IBM Plex Mono + Sans). Use existing `font-mono-plex` + `font-sans-plex` utilities.
- Mobile (`<768px`): hide the background video (perf + autoplay quirks), show a poster image + heavier dark gradient. Stack `how-step` to single column with text first, mockup second.

### Routing / auth wiring
Preserve existing logic:
- `useAuth()` to get `user`
- `hasLovableCloudEnv` check to pick `primaryPath` (`/app` if signed in, else `/onboarding` or `/auth`)
- Both CTAs (hero + final) link to `primaryPath`; nav "Open →" links to `/app` if user, else `/auth`

### Files touched
1. **`public/landing-hero.mp4`** — replaced with uploaded video
2. **`src/pages/Landing.tsx`** — full rewrite
3. **`src/index.css`** — append a few keyframes/utilities for the hero overlay + scroll-bounce + cursor blink
4. **`mem://design/landing-voice`** — update to record:
   - Landing is now dark-hero / cinematic (no `landing-bg` warm gradient on `/`)
   - Tension section + ADHD audience line removed from landing (still valid voice elsewhere)
   - H1 stays "Your clerk for a calmer to-do list." rendered in 3 lines, mono
5. **`.lovable/plan.md`** — overwritten with this plan
6. **`mem://index.md`** — small Core update if landing aesthetic shift is worth a one-liner ("Landing = dark cinematic video hero; rest of app stays warm/light")

### Things explicitly NOT changing
- `src/pages/AppHome.tsx`, mascot, in-app surfaces — untouched
- `ClerkCharacter` component still used in-app; just inlined as raw SVG inside the proposal mockup so the landing page is self-contained
- Auth flow, routes, Supabase wiring — untouched

Ready to build on approval.