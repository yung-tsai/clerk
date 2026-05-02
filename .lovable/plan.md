## Add audience tagline under hero CTA

Add **"Built for ADHD, anxiety, and anyone who overthinks their list."** stacked above the existing "Free to start. No credit card." line in the hero section.

### Change

**File:** `src/pages/Landing.tsx` (hero CTA block, around line 82)

Currently:
```
[CTA button]
Free to start. No credit card.
```

After:
```
[CTA button]
Built for ADHD, anxiety, and anyone who overthinks their list.
Free to start. No credit card.
```

### Styling

- Tagline: same `font-sans-plex` family as the existing subline, but slightly more prominent — `text-[14px]`, `font-medium`, `text-white/90` (it's the positioning line, deserves the eye).
- Existing "Free to start" line: drop to `text-white/55` so it reads as secondary fine print.
- Stack tightly (`gap-1.5`) so they read as one block under the button.
- Mobile: line wraps naturally; no special handling needed.

### What's NOT changing

- Hero H1, video, button, layout — all untouched.
- Final CTA section subline ("Free to start. No credit card.") stays as-is. Tagline only appears once, in the hero, where it does the most work.
- No memory updates needed — this aligns with existing audience memory.