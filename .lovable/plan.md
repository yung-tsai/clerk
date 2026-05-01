# Remove mascot + bubble from hero (and decide on H1)

## H1 recommendation

Current: *"The to-do app that prioritizes and explains what to do first."*

It's clear but not converting — it describes the app, not the user's outcome. My pick:

**A. "Finally know what to do first."** — outcome-led, six words, pairs perfectly with the video (red dumps mess → blue sorts → "ohhh, finally"). Strongest stopping power.

**B. "The to-do app that decides what's first — so you don't have to."** — keeps your structure, adds the relief, names the real pain (deciding).

**C.** Keep the current H1.

I'll proceed with **the user's choice** — please pick A, B, or C in your reply. Default if you don't specify: **A**.

## Hero cleanup (always doing this)

Remove the Clerk mascot + speech bubble from the hero left column. The video on the right now carries all the character/personality — having a second mascot duplicates the job and crowds the layout.

### What gets removed in `src/pages/Landing.tsx`

- The entire mascot-and-bubble JSX block (lines ~87–102): the `ClerkCharacter` + the rotating speech bubble.
- The `BUBBLE_LINES` constant (lines 9–15).
- Bubble rotation state and effects: `lineIdx`, `fading`, `rotate()`, the `useInterval` setup (lines ~41–54).
- `charSize` constant + `useIsMobile` import if no longer used elsewhere on the page.
- `ClerkCharacter` import if no longer referenced.
- Unused `useEffect`/`useState` imports if nothing else needs them.

### Hero layout after removal

```text
LEFT COLUMN                          RIGHT COLUMN
┌──────────────────────┐             ┌─────────────┐
│ H1                   │             │             │
│                      │             │   VIDEO     │
│ [ Get started → ]    │             │             │
│ no account needed    │             │             │
│ Made for ADHD…       │             └─────────────┘
└──────────────────────┘
```

Spacing tightens slightly: replace the mascot block with a small spacer (`mb-7` worth of room) so the H1 → CTA gap stays balanced.

## Other character/bubble usage

Mascot stays everywhere else — the in-app `AppHome`, the Proposal Modal, etc. This change is **landing-hero only**.

## Memory update

Update `mem://design/landing-voice` to reflect:
- New H1 (whichever you pick).
- "Hero left column has no mascot; video carries personality."
- Remove the BUBBLE_LINES rules section (no longer applicable to landing).

Mascot/bubble copy guidance still applies to in-app surfaces.
