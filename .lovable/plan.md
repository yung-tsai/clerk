# Plan: wire new AI sort fields into tasks

The `sort-tasks` edge function now returns `dueDate`, `taskTime`, `location`, and `category` per task — but these are dropped on the client. Currently only `title`, `col`, and `reason` make it into the proposal modal and the DB insert. The DB columns already exist (`due_date`, `task_time`, `location`, `category`, `cat_color`), so this is purely a client-side mapping fix.

## Changes

### 1. `src/pages/AppHome.tsx`

**Extend the `Proposal` type** (line 44) to carry the new fields:
```ts
type Proposal = {
  title: string; col: ClerkCol; reason: string;
  dueDate?: string; taskTime?: string;
  location?: string; category?: string;
};
```

**Update `acceptProposals` (lines 259–281)** so the insert rows include the new fields. Empty strings from the AI become `null` so the DB stores nothing rather than `""`. Category gets a stable color via a small hash:

```ts
const norm = (s?: string) => (s && s.trim() ? s.trim() : null);
const colorFor = (cat: string | null) => {
  if (!cat) return 0;
  let h = 0;
  for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) | 0;
  return Math.abs(h) % 4;
};

const rows = proposals.map((p, i) => {
  const category = norm(p.category);
  return {
    user_id: user.id,
    title: p.title,
    col: p.col,
    reason: p.reason,
    position: baseSec + i,
    due_date: norm(p.dueDate),
    task_time: norm(p.taskTime),
    location: norm(p.location),
    category,
    cat_color: colorFor(category),
  };
});
```

**Local-fallback path in `processInput` (lines 249–252)**: keep as-is — `classify` only knows column + reason, so the new fields stay undefined and fall through cleanly.

**Proposal modal (lines 635–662)**: optional small enhancement — show extracted time / location / category as faint metadata under the title so the user sees what Clerk extracted before accepting. Suggested compact line under the reason:
```
{p.taskTime || p.dueDate || p.location || p.category ? (
  <div className="font-plex-mono text-[11px] text-muted-foreground mt-1">
    {[p.taskTime, p.dueDate, p.location && `@${p.location}`, p.category]
      .filter(Boolean).join(" · ")}
  </div>
) : null}
```

### 2. `src/pages/Onboarding.tsx`

**Update the local `Proposal` type (line 75)** to match — same extra optional fields. The `pendingProposals` payload handed to `/app` then carries the AI-extracted fields through to `acceptProposals`, where the mapping above persists them.

## Out of scope

- No DB migration needed — columns already exist.
- No edge-function changes — it already returns the fields.
- `TaskCard` and `TaskDetailModal` already render `task_time`, `due_date`, `location`, and `category` + `cat_color`, so once persisted the data shows up automatically.
