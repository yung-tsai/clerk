# Fix greeting to use local timezone

## What's happening

`src/pages/AppHome.tsx` line 179 hardcodes `"Morning, ${name}."` — there's no time-of-day check at all right now, so it says "Morning" regardless of the actual hour. The user's bug report describes the symptom (says "Morning" at 9pm) but the root cause isn't a UTC vs. local mismatch — it's that the greeting is a literal string.

## Fix

Replace the hardcoded `"Morning"` with a time-of-day check that uses the user's local timezone via `Intl.DateTimeFormat`:

```ts
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const localHour = Number(
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: tz,
  }).format(new Date())
);
const timeOfDay =
  localHour < 12 ? "Morning" : localHour < 18 ? "Afternoon" : "Evening";
const greet = p.display_name
  ? `${timeOfDay}, ${p.display_name}.`
  : GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
showBubble(greet, 4500);
```

Buckets:
- 0:00–11:59 → Morning
- 12:00–17:59 → Afternoon
- 18:00–23:59 → Evening

## Note on the user's diagnosis

`new Date().getHours()` actually *does* return local time (it's `getUTCHours()` that returns UTC). But since the current code doesn't use `getHours()` at all, the distinction is moot here — the explicit `timeZone` option in `Intl.DateTimeFormat` is the most robust fix and matches the pattern already used elsewhere in the app (e.g. `sort-tasks` call sites).

## Files touched

- `src/pages/AppHome.tsx` — replace the hardcoded greeting at lines 178–181 with the timezone-aware version above.
