## Goal
Optimize Landing and Onboarding for mobile (≤ 480 px) so layout, type sizes, spacing, and tap targets feel native — no horizontal scroll, no clipped bubbles, comfortable thumb zones.

## 1. Landing — `src/pages/Landing.tsx`

Apply mobile-first tweaks (using Tailwind defaults; `sm:` = ≥640 px overrides for tablet/desktop).

- **Outer wrapper**: change padding to `px-5 pt-6 pb-16 sm:px-6 sm:pt-7 sm:pb-20`. Keep `max-w-[540px]`.
- **Header**: `mb-10 sm:mb-16`. Logo height `h-[22px] sm:h-[24px]`.
- **Hero spacing**: `gap-y` reduced; hero block `mt-2 sm:mt-0`.
- **Headline**: already `clamp(34px,9vw,56px)` — adjust min to `clamp(30px, 8.5vw, 56px)` and `leading-[1.08]` so two lines don't crowd. Add `px-2 sm:px-0` so it never touches viewport edges on 360 px screens.
- **Char block** (character + bubble):
  - Wrap in `flex items-end gap-1` and `max-w-full`.
  - Bubble: `max-w-[min(268px,calc(100vw-120px))]` so it never overflows on narrow phones; `text-[14px] sm:text-[15px]`; `px-4 py-3 sm:px-5 sm:py-4`.
  - ClerkCharacter: `size={62}` mobile, `size={70}` ≥sm (use a `useIsMobile` hook OR just inline-style via a class — simpler: render two sizes via `sm:hidden` / `hidden sm:block`, or pass size based on `window.matchMedia` in a `useEffect`-driven state). Pick the matchMedia approach to avoid SSR flicker.
- **CTA pill**: `px-8 py-3.5 sm:px-9 sm:py-4`, `text-[14px] sm:text-[15px]`, full-tap target ≥ 44 px.
- **Tension grid**: already collapses to 1 column under 440 px in v27 reference. Convert to Tailwind: `grid-cols-1 min-[440px]:grid-cols-2 gap-3`. Tighten card padding `p-5 sm:p-6`.
- **Preview frame** (Focus view): `rounded-[20px] sm:rounded-[24px]`, `p-5 sm:p-8`. Date-main `text-[24px] sm:text-[28px]`. Cards: `p-3.5 sm:p-4`. Ensure `.pc-title` wraps (no `truncate`).
- **How it works**: step gap `py-4 sm:py-5`. Number column shrinks to `w-5`. Title `text-[15px] sm:text-[16px]`.
- **Final CTA headline**: `clamp(24px, 6.5vw, 38px)` so it scales down further on 320 px.
- **Footer**: unchanged.

## 2. Onboarding — `src/pages/Onboarding.tsx`

Currently uses `flex items-center justify-center px-6` with `max-w-[360–380px]` per step. Issues on mobile:
- `justify-center` vertically centers on small viewports → keyboard pushes content out of view.
- Bubble + character row can wrap awkwardly on 320 px.
- Character grid (`grid-cols-4`) makes each cell ~70 px on 320 px — too cramped with `🔒` placeholders.
- Skip-demo button at `bottom-8 right-6` collides with mobile thumb home-bar area.

Changes:

- **Container**: change to `flex flex-col items-center justify-start sm:justify-center pt-20 pb-10 sm:pt-0 sm:pb-0 px-5 sm:px-6`. Top padding clears the progress dots.
- **Progress dots**: keep position but `top-6 sm:top-8`.
- **All four step containers**: bump `max-w-[360px]` → `max-w-full sm:max-w-[380px]` so they fill the viewport on mobile (but still capped on desktop).
- **Speech-bubble + character rows** (NameStep / DemoStep / YourTurnStep / DemoStep callout):
  - Use `flex items-end gap-2 sm:gap-3 mb-8 sm:mb-10`.
  - Bubble: `max-w-[calc(100vw-120px)] sm:max-w-none`, `text-[13px] sm:text-[14px]`.
  - Character size: 52 mobile, 58 desktop (matchMedia hook or two renders).
- **NameStep input**: `text-[20px] sm:text-[22px]`, `py-3.5 sm:py-4`. Buttons full-width with `min-h-[52px]` touch target.
- **CharacterStep grid**: change to `grid-cols-3 min-[400px]:grid-cols-4 gap-2 sm:gap-3`. With 2 unlocked + 2 placeholders, 3-col on 320 px gives ~95 px tiles which read better; 4-col kicks in at 400 px+.
  - Tile padding `pt-3 pb-3`. Mascot size `40` mobile / `44` desktop.
- **DemoStep**:
  - Pill input: `text-[13px] sm:text-[14px]`, allow text wrap (`whitespace-normal break-words`) instead of `truncate` so the full demo text is readable on phones — OR keep truncate but expand pill to `max-w-full`. Pick truncate (matches the simulated feel).
  - Callout bubble: `max-w-[calc(100vw-48px)] sm:max-w-[300px]`, `text-[12px] sm:text-[13px]`.
  - Proposal card: `p-4 sm:p-5`, task row `text-[12px] sm:text-[13px]`, tag `text-[9.5px] sm:text-[10px]`. Allow task text to wrap to 2 lines instead of `truncate` (truncating loses meaning on small screens) — apply `line-clamp-2`.
  - Skip-demo: move from `fixed bottom-8 right-6` to `fixed bottom-5 right-5 sm:bottom-8 sm:right-6` and add `safe-area-inset-bottom` via `pb-[env(safe-area-inset-bottom)]` wrapper so it clears iOS home indicator.
- **YourTurnStep**:
  - Heading `text-[22px] sm:text-[26px]`.
  - Textarea `min-h-[110px] sm:min-h-[90px]` (more room to type on mobile), `text-[15px] sm:text-[16px]`.
  - Submit button `min-h-[52px]`.

## 3. Tail-direction fix (carry-over from prior plan)

Still applies and is part of this pass since we're touching Onboarding and Landing anyway:
- Render `<ClerkCharacter />` BEFORE the bubble in NameStep, DemoStep, YourTurnStep, and Landing hero.
- Bubble corner: `rounded-[4px_20px_20px_20px]` (sharp BOTTOM-LEFT pointing at the character on its left).

## 4. Shared mobile helper

Add `src/hooks/useIsMobile.ts` (if it doesn't already exist — check during build) that returns `window.matchMedia('(max-width: 640px)').matches` reactively. Used by Landing and Onboarding to switch ClerkCharacter `size` without SSR flicker.

## 5. CSS / global

- Add `html { overflow-x: hidden; }` scoped to landing/onboarding only via the existing `.landing-bg` wrapper to prevent the animated gradient from creating a horizontal scrollbar on iOS.
- Add `@supports (padding: max(0px))` safe-area padding utility on the bottom-fixed skip-demo button.

## 6. Files

- **edit** `src/pages/Landing.tsx` — mobile spacing, sizes, bubble cap, tension grid breakpoint, preview/how/final scaling.
- **edit** `src/pages/Onboarding.tsx` — container alignment, step max-widths, char/bubble row sizing, character grid breakpoints, demo proposal wrapping, skip-demo safe area.
- **new** `src/hooks/useIsMobile.ts` (only if missing).
- **edit** `src/index.css` — minor `.landing-bg { overflow-x: hidden }` rule.

## Out of scope
The full Landing v27 rebuild (rotating bubble, tension/preview/how-it-works sections, animated gradient, squish-on-tap) — covered by the previously proposed plan. This pass only optimizes the CURRENT Landing and Onboarding for mobile. If you want both landed together say so and I'll merge.

## Technical notes
- Mobile breakpoint = Tailwind default `sm: 640px`. Smallest target = 320 px (iPhone SE) — every fixed-width element verified against that.
- Bubble overflow guard formula: `min(268px, calc(100vw - 120px))` leaves 60 px for character + 60 px gutter.
- `line-clamp-2` requires `@tailwindcss/line-clamp` — already included in Tailwind 3.3+ core, no install needed.
- `useIsMobile` initializes from `matchMedia` synchronously (in `useState` initializer) so first paint is correct.