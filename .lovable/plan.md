# Onboarding (4 screens) + Focus/Planner views matched to the reference HTML

Goal: pixel-match `clerk_v27.html` for Focus, Planner, cards, and the bottom bar; add the missing onboarding steps; keep all backend wiring (Lovable Cloud + sort-tasks) intact.

---

## 1. Design tokens (apply globally first)

Add to `src/index.css` + `tailwind.config.ts` so every surface uses identical values:

**CSS vars / colors**
- `--bg #F5F5F3`, `--card-bg #FFFFFF`, `--card-border #EBEBEB`, `--card-border-strong #D7D7D7`
- `--ink #11181C`, `--muted #6B7280`, `--faint #9CA3AF`, `--divider #F0F0EF`
- `--max-w 1280px`, `--pad-x 40px`, `--bar-h 120px`, `--header-h 64px`, `--col-w 460px`
- Title color `#2A2A2A`, checkbox border `#939393`, accent `#567CF8`
- Category swatches `cat-0..3`: `#CEDAFF / #FFF7CE / #CEFFE7 / #FFCEFB`

**Fonts** (load in `index.html`)
- IBM Plex Sans 400/500/600, IBM Plex Mono 400/500, JetBrains Mono 400/500, Inter 300/400/500/600
- Tailwind: `font-plex`, `font-mono-plex`, `font-jb-mono`, `font-inter`
- Body default: Inter, color `--ink`, antialiased

## 2. Database

Migration adds to `profiles`:
- `character text default 'blue'`
- `view_mode text default 'focus'`

## 3. Character system

- `src/lib/characters.ts` — registry for `'blue' | 'coral'` returning the exact SVG markup from the HTML (Blue star + Coral blob).
- `ClerkCharacter.tsx` — accept `variant` prop, default `'blue'`. Keep float (`char-float`, 3.2s) + thinking pulse (`char-think`, 0.8s) + blink animations.

## 4. Onboarding rewrite — 4 screens (`src/pages/Onboarding.tsx`)

Top progress dots, "skip demo" bottom-right only on screen 3.

1. **Name** — mascot + speech "Hi. I'm Clerk. What should I call you?", IBM Plex Sans h1 (28px/600/-0.025em), IBM Plex Mono 12px subcopy, name input (rounded-14, focus ring `#567CF8`/12% blue), Continue (disabled until non-empty).
2. **Pick your Clerk** — h2 "Pick your Clerk, {name}." + "Two are ready. More are on the way." 4-tile grid: Blue (selected, ring `--ink`), Coral, two locked tiles `🔒 Soon` (opacity 0.5). Labels: IBM Plex Mono 10px.
3. **Animated demo**:
   - Mascot says "Watch me work." → black callout "Type your tasks — all at once, however they come to mind."
   - Auto-types `finish the case study, it's due Friday, pick up groceries, call dentist to book appointment, learn Spanish someday` into a fake pill input at 28ms/char
   - Mascot switches to thinking pulse, says "Give me a moment..."
   - White proposal card slides up: title "Sorted. Here's my reasoning." + 4 rows with colored col-pills (Today `#CEDAFF`, Today, Tomorrow `#FFF7CE`, Someday `#FFCEFB`) and IBM Plex Mono reasoning lines
   - Second callout "I explain every decision. You can always move a task if you disagree."
   - "Looks good →" advances. State machine: React state + `setTimeout` chain, refs to clear on unmount/skip.
4. **Your turn** — h2 "What's on your mind?", textarea (16px Plex Sans, rounded-14, ≥90px tall), IBM Plex Mono hint, "Let's go →". On submit:
   - Update profile: `display_name`, `character`, `onboarded=true`, `view_mode='focus'`
   - If textarea has content, call `sort-tasks` edge function and insert returned tasks
   - Navigate to `/app`

## 5. Layout shell + view toggle (`src/pages/AppHome.tsx`)

- `view: 'focus' | 'planner'` from profile, persisted on toggle.
- Fixed header (h `--header-h`, border-bottom `--divider`, bg `--bg`):
  - Left: Clerk logo group (mascot 26 + IBM Plex Mono "Clerk" 11px uppercase)
  - Center: `Focus | Planner` toggle — Inter 12px/500, active `--ink`, inactive `--faint`, `|` separator faint
  - Right: settings icon
- View container: `position:fixed; inset:0; padding-top:--header-h; padding-bottom:--bar-h; overflow-y:auto`. Inner: `max-w 1280px`, padding `28px 40px 40px`.

## 6. Focus view

- `today-col`: max-width `420px`, centered.
- Today date header: weekday 28px/700/-0.02em `--ink`; sub 13px/400 `--muted` (6px gap).
- `card-list`: vertical stack of TaskCard (today only).
- Empty: 12px `#D1D5DB` "Nothing yet. Add tasks below."

## 7. Planner view

- Horizontal scroll wrapper (`planner-scroll`, no scrollbar).
- `planner-grid`: `grid-template-columns: repeat(4, 280px)`, dividers between via `border-right: 1px --divider` on each col except last (`padding-right:28px`, `padding-left:28px` on subsequent cols).
- `col-header`: title IBM Plex Sans 20px/400/-0.02em `#3F3F3F`; count IBM Plex Mono 16px/300 `--ink`. Bottom padding 12px, margin-bottom 12px.
- Empty per col: same faint placeholder.
- Optional: prev/next nav buttons (32px circle, `--ink`, fixed, bottom `calc(--bar-h + 16px)`) and column dots indicator (5px, active scale 1.3 `--ink`) — mirror the reference.

## 8. Shared TaskCard (`src/components/TaskCard.tsx`)

Exact spec — used in Focus, Planner, and proposal preview:
- `bg-white/50`, border `1px #D7D7D7`, radius 12, padding 16, max-w 380, fade-in 0.25s
- Hover shadow `0 2px 12px rgba(0,0,0,0.07)`; expanded `0 4px 16px rgba(0,0,0,0.08)`
- Title: IBM Plex Sans 18px/500/1.28, `#2A2A2A`, 2-line clamp collapsed, full when expanded
- Checkbox: 22×22 circle, border `1px #939393`, hover border `#567CF8`, bottom-right
- Meta tags: JetBrains Mono 9px uppercase, letter-spacing 0.06em, color `--muted`, border `--card-border`
- Date tag: bg `#F9FAFB`, color `#2A2A2A`
- Category tag (cat-0..3): IBM Plex Mono 12px, padded pill
- Location/time: IBM Plex Mono 12px `#2A2A2A`; empty placeholder `#C4C8CC`
- Expanded actions: Inter 11px/500 faint until hover; delete hover red `#DC2626 / #FCA5A5 / #FEF2F2`
- Move-to buttons: same act-btn style, prefixed `→ tomorrow` etc.

## 9. Bottom bar (`src/components/AppBar.tsx`) — exact match

`app-bar`: `position:fixed; bottom:28px; left:50%; translateX(-50%); z-index:200`.

`pill-container`: column, gap 10, items centered, position relative.

**Speech bubble** (above pill, right-anchored):
- Absolute `bottom: calc(100% + 8px); right: 0;`
- Bg `#1A1A1A`, color white, Inter 12px/400/1.4, padding `8px 12px`, radius 10
- max-w 280, text-center, `pointer-events:none`
- Hidden by default (`opacity:0; translateY(6px)`), `.show` → opacity 1 / translateY 0, transition 0.2s

**Glass pill**:
- Bg white, border `1px rgba(0,0,0,0.08)`, radius 28 (→ 20 when menu open), shadow `0 4px 24px rgba(0,0,0,0.08)`, overflow hidden
- min-w 280, max-w 500, width `calc(100vw - 48px)`
- Row (`6px 12px` padding, items center):
  - **Hamburger** left: button with three 18×2 lines `#444`, gap 4, opacity hover 0.6
  - **Input** middle: Inter 14px `#2A2A2A`, transparent, placeholder `#B0B0B0`, flex:1, padding `4px 8px`
  - **Character** right: 50×42, animated float, swaps to `thinking` pulse during AI call, click focuses input
- **Upward menu panel** (when hamburger toggled): `max-height` 0 → 240, opacity 0 → 1, transition 0.35s. Items: Focus, Planner, Completed, Settings, Sign out — Inter 13px/500, padding `11px 16px`, divider rows, icons 15px opacity 0.45, active item color `#567CF8`, danger `#DC2626`.

Functionality: typing + Enter → call `sort-tasks` → show proposal modal (existing) → insert tasks → reset input. Toast errors. Speech bubble shows transient mascot lines ("Thinking...", "Sorted.", greetings, etc.).

## 10. Settings sheet

Add Character row: Blue/Coral mini picker → updates profile + live re-renders mascot everywhere.

## 11. Routing / flow

`/auth → /onboarding (if !onboarded) → /app`. `/app` opens whichever view `view_mode` says (default Focus).

---

## Files

- migration: add `character`, `view_mode` to `profiles`
- edit: `index.html` (font links), `src/index.css`, `tailwind.config.ts`
- new: `src/lib/characters.ts`, `src/components/TaskCard.tsx`, `src/components/AppBar.tsx`
- edit: `src/components/ClerkCharacter.tsx` (variant prop)
- rewrite: `src/pages/Onboarding.tsx` (4 screens + scripted demo)
- rewrite: `src/pages/AppHome.tsx` (header + Focus/Planner views, uses AppBar + TaskCard, settings character picker)
