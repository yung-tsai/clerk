## What I found

`TaskCard.tsx` is correct — it already reads `task_time`, `due_date`, `location`, `category`, and `cat_color`, and renders them in exactly the slots you described. The "Add time" / "Add location" / "Add tag" placeholders only appear when those fields are `null`.

The data isn't reaching the card because it's `null` in the database. Confirmed via a direct DB query — every task created today has:

```
task_time: null, due_date: null, location: null, category: null, cat_color: 0
```

…even for unambiguous inputs like `"meeting at 3"` (should give `3:00 PM` + `Work`) and `"pick up kids at Lincoln Elementary Friday"` (should give `Friday` + `Lincoln Elementary` + `Family`).

The mapping in `acceptProposals` (AppHome.tsx lines 267–304) is correct — it forwards `dueDate`, `taskTime`, `location`, `category` from the proposal into the insert. So the fields are being dropped earlier, in the edge function response itself.

### Root cause

`supabase/functions/sort-tasks/index.ts` line 155 uses:

```ts
model: "google/gemini-2.5-flash-preview"
```

That model id isn't on Lovable AI's supported list. The supported Gemini Flash models are `google/gemini-2.5-flash`, `google/gemini-2.5-flash-lite`, and `google/gemini-3-flash-preview`. The gateway is likely returning a tool call where `dueDate`/`taskTime`/`location`/`category` come back as empty strings (which then get normalized to `null` on insert). No 4xx is logged, which fits a "model rerouted / returns minimal output" failure mode rather than a hard error.

## Changes

### 1. `supabase/functions/sort-tasks/index.ts`

- Change `model` from `"google/gemini-2.5-flash-preview"` to `"google/gemini-2.5-flash"` (the supported, current Flash model — best fit for structured tool calling at low latency).
- Add a one-line `console.log` of the parsed tool-call output (titles + the four extracted fields only, not the full payload) so future regressions show up in edge function logs immediately.

### 2. `src/pages/AppHome.tsx` — temporary diagnostic log

In `processInput` right after `if (data?.tasks?.length) sorted = data.tasks;`, add:

```ts
console.log("[sort-tasks] proposals from AI:", sorted);
```

This is what you asked for — lets you see in the browser console exactly what the AI returned per task (title + col + reason + the four new fields). Keep it for now; we can remove it once we confirm fields are flowing.

### 3. No changes to `TaskCard.tsx`

It already renders all four fields correctly. Once the edge function returns populated fields, cards will display them automatically.

## How to verify after the fix

1. Sort a task like `"call dentist tomorrow at 9 at the office"`.
2. Browser console should log a proposal with `taskTime: "9:00 AM"`, `dueDate: "Friday"` (or whatever tomorrow is), `location: "Office"`, `category: "Health"`.
3. After accepting, the card should show `9:00 AM | Friday` top-left, `@Office` bottom-left, and a colored `HEALTH` tag top-right.
4. Old tasks (the ones already in the DB with null fields) will still show placeholders — that's expected; the fix is forward-only unless we backfill, which I'd skip for now.

## Out of scope

- No DB backfill for existing tasks.
- No changes to the prompt itself — it's already specific and well-formed; the issue is purely the model id.
- No fallback model logic. If the supported model fails, the existing local-classify fallback in `processInput` already handles it (just without the four extracted fields, which is acceptable degradation).
