## Goal

Get Google sign-in working in Wes **without** switching the web app off Lovable's managed Google OAuth. Web stays exactly as it is today; Wes gets Google via a browser handoff.

## Why not Claude Code's plan

Claude Code's three steps (create your own Google Cloud OAuth client → paste into Supabase → add `127.0.0.1` redirect) require switching this Supabase project's Google provider from **Lovable-managed** to **BYO credentials**. That's a one-way switch that affects the web app's consent screen and ownership model. You said keep web managed — so we route around it instead.

## The approach: browser-assisted sign-in for Wes

```text
Wes (Electron)              Browser (getclerks.com)         Lovable Cloud
──────────────              ───────────────────────         ─────────────
1. Wes starts local
   server on 127.0.0.1:<port>
2. Wes opens browser ─────► /wes-auth?port=<port>&state=<uuid>
3. User signs in (Google
   or email) — uses the
   web app's existing flow ────────────────────────────────► session created
4. /wes-auth page detects
   session, POSTs the
   refresh_token + state
   to http://127.0.0.1:<port>/handoff
5. Wes verifies state,
   stores refresh_token in
   Electron safeStorage,
   calls supabase.auth
   .setSession(...)
6. Browser shows "you can
   close this tab"; local
   server shuts down
```

Independent session per device: Wes holds its own refresh token in Keychain (via `safeStorage`); web session is untouched.

## What changes in this repo

### 1. New page: `src/pages/WesAuth.tsx` (route `/wes-auth`)

- Reads `port` and `state` from query string. Validates `port` is 1024–65535 and `state` is a UUID.
- If no session → renders the same `<Auth />` UI (or redirects to `/auth?next=/wes-auth?port=...&state=...`).
- If session present → POSTs `{ refresh_token, access_token, state }` to `http://127.0.0.1:<port>/handoff`, then shows "Signed into Wes — you can close this tab."
- Includes a "Cancel" link back to `/`.
- Handles failure (port closed, fetch error) with a clear message and a "Try again in Wes" instruction.

### 2. Tiny tweak to `src/pages/Auth.tsx`

- Honor a `?next=` query param: after successful sign-in (email or Google), redirect to `next` if it starts with `/wes-auth`. Today it hardcodes `/app` and `/onboarding`.

### 3. Update `WES_INTEGRATION.md`

- Add a third section: **"Google sign-in via browser handoff"** describing the `/wes-auth` flow, the JSON shape Wes must accept on `/handoff`, the state/CSRF check, and the timeout. Keep the deferred BYO loopback section as a "future option."

## What Wes (Electron) needs to do — for the Wes repo

- Start `http.createServer` on `127.0.0.1:0` listening for `POST /handoff`.
- Open `https://getclerks.com/wes-auth?port=<port>&state=<uuid>` via `shell.openExternal`.
- On `/handoff`: verify `state` matches, read `refresh_token` + `access_token`, respond 200, then `supabase.auth.setSession({ access_token, refresh_token })`. Store via `safeStorage` adapter (already documented).
- Timeout after ~3 min, allow user to retry.
- CORS: respond with `Access-Control-Allow-Origin: https://getclerks.com` on the OPTIONS preflight and the POST.

## Manual config (you do this in Lovable Cloud → Users → Auth settings → URL Configuration)

Add to **Redirect URLs** (still useful for future loopback option, harmless now):

```
http://127.0.0.1/*
http://localhost/*
```

That's it. No Google Cloud Console work, no provider secret swap, no change to the web Google button.

## Tradeoffs vs pure loopback

- **Pro:** Zero change to managed Google OAuth. Web app untouched. One sign-in flow to maintain (the web one).
- **Pro:** Works for both Google *and* email/password sign-in into Wes with no extra code.
- **Con:** Requires the user to be online and have a browser open. (True of OAuth loopback too.)
- **Con:** Slightly more moving parts than direct loopback — but the parts are small and live in code we control.

## Out of scope

- No Google Cloud Console work.
- No change to `lovable.auth.signInWithOAuth` on the web.
- No edge functions.
- Email/password fields in Wes are still recommended as a fallback (already in `WES_INTEGRATION.md`).

## Files touched

- New: `src/pages/WesAuth.tsx`
- Edited: `src/App.tsx` (add `/wes-auth` route)
- Edited: `src/pages/Auth.tsx` (honor `?next=` for `/wes-auth` only)
- Edited: `WES_INTEGRATION.md` (add browser-handoff section)
