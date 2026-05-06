# Wes ↔ Clerk integration

How the Wes macOS desktop app connects to the Clerk Lovable Cloud backend.

## Backend connection

- **Project URL:** `https://jnhziusozbixowfvhloy.supabase.co`
- **Anon publishable key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuaHppdXNvemJpeG93ZnZobG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODM2NjIsImV4cCI6MjA5MzA1OTY2Mn0.fuDMTuO_-4fzvLS806XDrKdeJ8yeMVXaEmd5hH3OkmE`

Both are safe to ship inside the Electron bundle. RLS enforces per-user isolation.

## Auth — Google sign-in via OAuth loopback

Wes uses the standard native-app loopback pattern. **No `wes://` custom scheme.**

### Required Cloud configuration (manual)

In Lovable → Cloud → Users → Auth settings → URL Configuration → **Redirect URLs**, add:

```
http://127.0.0.1/*
http://localhost/*
```

Wildcards are required because Electron picks a random free port per sign-in.

### Flow

1. Wes starts an HTTP server on `127.0.0.1:0` (random free port).
2. Wes opens the system browser to:
   `https://jnhziusozbixowfvhloy.supabase.co/auth/v1/authorize?provider=google&redirect_to=http://127.0.0.1:<port>/callback&state=<uuid>`
3. User signs in with Google. Supabase redirects back to `http://127.0.0.1:<port>/callback?code=...&state=...`.
4. Wes verifies `state`, then calls `supabase.auth.exchangeCodeForSession(code)`.
5. Wes renders a "Signed in — you can close this tab" page and shuts down the local server.
6. Refresh token is stored in macOS Keychain via `keytar` (`service: com.getclerks.wes`, `account: <user_id>`).
7. On launch, Wes restores the session from keychain — auto-refresh handles the rest.

### Client setup

```ts
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: true },
})
```

Wes manages persistence itself (keychain), so `persistSession: false`.

### Independent session

Sign out in Wes uses `supabase.auth.signOut({ scope: 'local' })` + `keytar.deletePassword(...)`. The web session on getclerks.com is unaffected, and vice versa.

## Database schema (read-only reference)

### `tasks` — active tasks
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | RLS scope |
| `title` | text | task name |
| `col` | enum | `today` \| `tomorrow` \| `upcoming` \| `someday` |
| `position` | int | sort order within `col` |
| `reason` | text | the "why" (Clerk's differentiator) |
| `note` | text | optional |
| `category` | text | optional |
| `cat_color` | smallint | 0..n |
| `due_date` | text | ISO date or null |
| `task_time` | text | optional |
| `location` | text | optional |
| `created_at` / `updated_at` | timestamptz | |

### `completed_tasks` — history
| Column | Type |
|---|---|
| `id` | uuid |
| `user_id` | uuid |
| `title` | text |
| `category` | text |
| `cat_color` | smallint |
| `completed_at` | timestamptz |

### `profiles`
Display name, character (`wes`/`rex`/`frank`), streak, tasks_completed, view_mode, onboarded.

## Recommended Wes queries

```ts
// Today's tasks, in order
supabase.from('tasks')
  .select('id,title,reason,note,category,cat_color,due_date,task_time,position')
  .eq('col', 'today')
  .order('position', { ascending: true })

// Mark complete (delete from tasks, insert into completed_tasks)
// Wrap in a single edge function if atomicity matters.
```

RLS does the user filtering automatically — never pass `user_id` in the client filter.

## What Wes should NOT do

- Don't call `sort-tasks` or `delete-account` edge functions without coordinating — those are user-facing flows owned by the web app.
- Don't write to `profiles.streak` or `tasks_completed` directly; those are derived from completion events on the web side.
- Don't register a `wes://` URL scheme for OAuth — loopback only.
