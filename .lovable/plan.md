## What we're shipping

Reorder the landing page for conversion + replace the "Focus view" preview with a static replica of the **Proposal Modal** (showing the magic moment: input → sorted tasks → reason next to each one). Ship items A, B, C, D, F from the critique, plus the proposal modal swap.

---

## 1. Hero becomes two-column on desktop, with the proposal modal as the visual

**Desktop (≥768px)**:
```text
┌────────────────────────────────────┬──────────────────────┐
│ H1: The to-do app that             │  ┌────────────────┐  │
│     explains what to do first.     │  │ ◆ Clerk        │  │
│ Subhead: Clerk picks your next     │  │ Here's where   │  │
│   task and tells you why.          │  │ I'd put these. │  │
│                                    │  │                │  │
│ [ Get started free → ]             │  │ • Finish case  │  │
│ No account needed to try           │  │   study  Today │  │
│ Made for ADHD, anxiety,…           │  │   "Due Friday."│  │
│                                    │  │ • Call dentist │  │
│ (mascot floats bottom-left,        │  │   Tomorrow     │  │
│  bubble small, low-key)            │  │   "Not urgent."│  │
│                                    │  │ • Learn Spanish│  │
│                                    │  │   Someday      │  │
│                                    │  │   "Where dreams│  │
│                                    │  │    live."      │  │
│                                    │  └────────────────┘  │
└────────────────────────────────────┴──────────────────────┘
```

**Mobile (<768px)**:
- H1 → Subhead → CTA → micro-lines → mascot+bubble → **proposal modal mockup directly below**
- All stays single column. The proposal modal moves up (was 3 sections deep, now right under the hero CTA — visible with one short scroll).

**Why**: Currently desktop has ~600px of mostly-empty hero. Showing the product immediately = "this is real" = conversion. Proposal modal beats Focus view because it shows *Clerk doing its job* (reason text visible per task) — the entire pitch in one image.

## 2. Build a static "ProposalPreview" component

New section in `Landing.tsx` (kept inline, no new file). Faithful static replica of `AppHome.tsx` lines 484-540 — same layout, same fonts, same colors. Key elements:
- Header row: Clerk character + "Here's where I'd put these." + "Tap a column to change it."
- 3 task rows, each with: title, italic reason text, column pill (Today/Tomorrow/Someday with their tag colors)
- "Looks good" button at bottom (purely visual, no click handler)

The 3 demo tasks (reusing the Onboarding demo for consistency):
1. **"Finish the case study"** → Today · *"Due Friday — that's close."*
2. **"Call dentist to book appointment"** → Tomorrow · *"Not urgent today."*
3. **"Learn Spanish someday"** → Someday · *"Where dreams live."*

Subtle hover/float animation on the modal (gentle `hover:-translate-y-1`) so it feels alive.

## 3. Separate the two micro-lines under the CTA (B)

Replace the single combined line with:
- **Line 1** (right under button, faint mono): `No account needed to try`
- **Line 2** (italic plex, slightly more visible, max-width 320px): `Made for ADHD, anxiety, and anyone who overthinks their list.`

Two distinct jobs: micro-promise (conversion) + positioning (audience). Apply to both hero CTA and final CTA.

## 4. Reposition the bubble + character (C)

**Desktop**: Move the mascot+bubble to **below the audience line in the left column** (or floating bottom-left of the hero) — out of the eye flow between subhead and CTA. Bubble becomes atmosphere, not a blocker.

**Mobile**: Keep current placement (works fine on small screens) but **slow rotation from 3.8s → 6s** so people can actually finish reading.

## 5. Make "Without Clerk" visually heavier than "With Clerk" (D)

- **Without Clerk card**: slightly darker bg (`bg-white/35` instead of `/45`), red-tinted left border (`border-l-2 border-l-[#DC2626]/30`), keep mono font for symptoms — feels heavy/clinical
- **With Clerk card**: lighter (`bg-white/65`), green-tinted left border, plex font for symptoms — feels clean/relief

The visual asymmetry creates the emotional tension that makes the section land.

## 6. Reorder sections below hero (F)

**Current order**:
Hero → Sound familiar? → Focus view → How it works → Final CTA

**New order**:
Hero (with Proposal preview built in) → How it works → Sound familiar? (now the closer) → Final CTA

**Why**: After seeing the product in the hero, the visitor's question is *"how does this work?"* — answer immediately with How it works. Then hit them with the emotional tension (Sound familiar?) right before the final CTA. Tension → CTA is the strongest conversion sequence.

The "Focus view" section is **deleted entirely** — its job is now done by the in-hero proposal modal.

---

## What we're NOT doing

- **No social proof slot** (E from critique) — you don't have testimonials yet, fake ones erode trust. Add when real ones exist.
- **No CTA button copy change** (H) — defer until you can A/B test.
- **No new images/assets** — proposal modal is built from existing components & demo data.
- **No memory updates** — vision unchanged, only layout/conversion changes.

---

## Files edited

- `src/pages/Landing.tsx` — full restructure (hero becomes 2-col on desktop, proposal preview added inline, sections reordered, focus view removed, microcopy split, tension cards reweighted, bubble repositioned, rotation slowed)

That's it. One file. Should be a clean ~30-line diff in spirit but more in practice because of the layout restructure.

---

Building this now unless you want to slice differently — e.g. *"do everything except keep the section order as-is"* or *"just the proposal modal swap, leave layout alone."*