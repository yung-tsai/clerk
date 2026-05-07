# Wes ↔ Clerk integration

How the Wes macOS desktop app connects to the Clerk Lovable Cloud backend.

## Backend connection

- **Project URL:** `https://jnhziusozbixowfvhloy.supabase.co`
- **Anon publishable key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuaHppdXNvemJpeG93ZnZobG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODM2NjIsImV4cCI6MjA5MzA1OTY2Mn0.fuDMTuO_-4fzvLS806XDrKdeJ8yeMVXaEmd5hH3OkmE`

Both are safe to ship inside the Electron bundle. RLS enforces per-user isolation.

## Auth — Email/password (recommended for now)

Google OAuth on the web app uses Lovable's managed broker (`lovable.auth.signInWithOAuth`). Wes can't use that broker — it would need its own provider secret in Cloud Auth settings, which isn't configured yet. **Until that's sorted, ship email/password as the primary (or only) sign-in method in Wes.**

Use the Supabase JS SDK directly — no Lovable wrapper needed for password auth.

### Client setup (password flow)

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(URL, ANON_KEY, {
  auth: {
    persistSession: true,       // let supabase-js handle session restore
    autoRefreshToken: true,
    storage: electronSafeStorage, // see below
  },
})
```

### Sign in / sign up / reset

```ts
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// Sign up (matches web app — 8+ chars, HIBP check is on)
await supabase.auth.signUp({ email, password })
// If email confirmation is required, data.session will be null — show
// "check your email" UI, same as web Auth.tsx.

// Forgot password — send the user back to the web app to reset
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://getclerks.com/reset-password',
})
```

The web app already owns `/reset-password`. Don't try to handle recovery in Wes — opening the browser to getclerks.com is simpler and avoids another loopback flow.

### Persistence — use Electron `safeStorage` (or keytar)

`supabase-js` defaults to `localStorage`, which doesn't exist in the Electron main process and is plaintext in the renderer. Wrap Electron's `safeStorage` (Keychain-backed on macOS) as a `Storage`-shaped adapter:

```ts
import { safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

const file = (key: string) => join(app.getPath('userData'), `${key}.bin`)

export const electronSafeStorage = {
  getItem: (key: string) => {
    const p = file(key)
    if (!existsSync(p)) return null
    try { return safeStorage.decryptString(readFileSync(p)) } catch { return null }
  },
  setItem: (key: string, value: string) => {
    writeFileSync(file(key), safeStorage.encryptString(value))
  },
  removeItem: (key: string) => {
    const p = file(key); if (existsSync(p)) unlinkSync(p)
  },
}
```

`keytar` is also fine if you'd rather store in Keychain directly — same shape, different backend.

### Sign out

```ts
await supabase.auth.signOut({ scope: 'local' }) // don't kill web sessions
```

`scope: 'local'` keeps the user's getclerks.com session alive in their browser. Independent sessions per device.

### UI parity with web

Mirror `src/pages/Auth.tsx` in the web repo: email field, password field (8+ chars), sign-in / sign-up / forgot-password modes, "check your email" state after signup. Same copy is fine.

---

## Auth — Google sign-in via browser handoff (recommended)

The web app uses Lovable's **managed** Google OAuth broker. We're keeping it that way — no BYO Google credentials, no Google Cloud Console work, no provider-secret swap. Wes gets Google sign-in by punting to the browser, letting the user sign in to getclerks.com normally, and then handing the resulting session back to the desktop app over loopback.

This flow also works for email/password sign-in for free — same handoff page.

### Flow

```text
Wes (Electron)              Browser (getclerks.com)         Lovable Cloud
──────────────              ───────────────────────         ─────────────
1. Wes starts local server
   on 127.0.0.1:<port>
2. Wes opens browser ─────► /wes-auth?port=<port>&state=<uuid>
3. /wes-auth checks for a
   session. None? → /auth?next=/wes-auth?...
4. User signs in (Google or
   email) on the existing
   web auth page ───────────────────────────────────────────► session created
5. /wes-auth POSTs
   { state, access_token,
     refresh_token } to
   http://127.0.0.1:<port>/handoff
6. Wes verifies state,
   stores tokens via
   safeStorage, calls
   supabase.auth.setSession(...)
7. Page shows
   "Signed into Wes — close
   this tab"; local server
   shuts down
```

### What Wes needs to do

```ts
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { shell } from 'electron'

const state = randomUUID()

const server = createServer((req, res) => {
  // CORS preflight from getclerks.com
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': 'https://getclerks.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
    })
    return res.end()
  }

  if (req.method !== 'POST' || req.url !== '/handoff') {
    res.writeHead(404); return res.end()
  }

  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', async () => {
    try {
      const { state: s, access_token, refresh_token } = JSON.parse(body)
      if (s !== state) throw new Error('state mismatch')
      await supabase.auth.setSession({ access_token, refresh_token })
      res.writeHead(200, {
        'Access-Control-Allow-Origin': 'https://getclerks.com',
        'Content-Type': 'application/json',
      })
      res.end(JSON.stringify({ ok: true }))
      server.close()
    } catch (err) {
      res.writeHead(400, { 'Access-Control-Allow-Origin': 'https://getclerks.com' })
      res.end(String(err))
    }
  })
})

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address() as { port: number }
  shell.openExternal(`https://getclerks.com/wes-auth?port=${port}&state=${state}`)
})

// Timeout after 3 min
setTimeout(() => server.close(), 3 * 60 * 1000)
```

### Notes

- **State (CSRF):** Generate a UUID per attempt and reject any handoff whose `state` doesn't match.
- **Port range:** Wes should let the OS pick (`listen(0, ...)`); the web page validates `port` is 1024–65535.
- **CORS:** The browser fetches `http://127.0.0.1:<port>/handoff` from `https://getclerks.com`, so the local server must respond with `Access-Control-Allow-Origin: https://getclerks.com` on both the OPTIONS preflight and the POST.
- **Persistence:** Same `safeStorage`-backed adapter described in the email/password section above. Don't roll a separate store for Google sessions.
- **Independent session:** `signOut({ scope: 'local' })` only logs out Wes; the user stays signed in to getclerks.com.
- **Local dev:** During Wes development, point the URL at `http://localhost:5173/wes-auth?...` (your local web dev server) and update the CORS origin accordingly.

---

## Auth — Google sign-in via OAuth loopback (deferred)

> **Status:** Blocked on Google OAuth provider secret in Cloud → Users → Auth settings. Ship password auth first; come back to this once the secret is configured.

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
