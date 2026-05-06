# Wes desktop — Google sign-in via loopback redirect

Goal: let the Wes Electron app sign a user in with Google against the Clerk Lovable Cloud backend, using the OAuth loopback pattern (no `wes://` custom scheme), with an independent per-device session.

This plan covers **only the Clerk side** (redirect allow-list + a small helper). The Electron implementation lives in the Wes repo — I'll give you a spec for it but won't build it here.

---

## How the flow works

```text
Wes (Electron)                Browser                  Lovable Cloud (Supabase)
──────────────                ───────                  ────────────────────────
1. start local HTTP
   server on 127.0.0.1:<port>
2. open system browser ─────► Google consent screen
                              user approves ────────► Supabase OAuth callback
                              Supabase redirects ◄───  with ?code=...
3. browser hits
   http://127.0.0.1:<port>/callback?code=...
4. Wes exchanges code
   for session ───────────────────────────────────►  supabase.auth
                                                      .exchangeCodeForSession
5. Wes stores refresh token
   in OS keychain (keytar)
6. local server shuts down,
   browser shows "you can close this tab"
```

Independent session = Wes holds its own refresh token in the macOS Keychain. Signing out of getclerks.com in the browser does not sign Wes out, and vice versa.

---

## What needs to change in Clerk (this project)

### 1. Redirect URL allow-list (manual — you do this)

I can't edit the allow-list from here. In Lovable:

- Desktop: Cloud icon → **Users** → **Auth settings** (gear) → **URL Configuration**
- Mobile: … → Cloud → Users → Auth settings → URL Configuration

Add these to **Redirect URLs**:

```text
http://127.0.0.1/*
http://localhost/*
```

Wildcards on the loopback host are the standard pattern — Electron picks a random free port each launch, so we can't pin one. Do **not** add `wes://...`.

Leave the existing web redirects (getclerks.com, lovable.app preview) alone.

### 2. No code changes required in the Clerk web app

The web app keeps using `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`. Nothing about its flow changes.

### 3. Optional: a `wes-handshake` edge function (recommended, small)

Purpose: give Wes a single endpoint that returns the Supabase auth URL it should open, so the URL construction lives server-side and can change without shipping a new Wes build.

- Path: `supabase/functions/wes-handshake/index.ts`
- `verify_jwt = false` (pre-auth)
- GET `?port=54321&state=<random>` → returns `{ authUrl, expiresAt }`
- Builds `https://<project>.supabase.co/auth/v1/authorize?provider=google&redirect_to=http://127.0.0.1:54321/callback&...`
- Validates `port` is in the loopback range and `state` is a UUID

If you'd rather keep it dead simple, skip this and have Wes construct the URL itself. Not strictly needed.

---

## Spec for the Wes (Electron) side — for the Wes repo, not this one

Hand this to whoever builds Wes:

- Use `@supabase/supabase-js` with the **same project URL + anon key** already shared, plus `auth: { persistSession: false }` (we manage tokens ourselves).
- On "Sign in with Google":
  1. Start an `http.createServer` on `127.0.0.1:0` (random free port).
  2. Open Google flow via `shell.openExternal(authUrl)` where `redirect_to` is `http://127.0.0.1:<port>/callback`.
  3. In the local server's `/callback` handler: read `code` from the query, call `supabase.auth.exchangeCodeForSession(code)`, render a tiny "Signed in — you can close this tab" HTML response, then `server.close()`.
  4. Take the resulting `session.refresh_token` and store it in **macOS Keychain via `keytar`** under service `com.getclerks.wes`, account = user id.
  5. On app launch, read refresh token from keychain → `supabase.auth.setSession({ refresh_token, access_token: '' })` → it auto-refreshes.
- Add a `state` param to the auth URL and verify it on callback (CSRF).
- Timeout the local server after ~2 min if no callback arrives.
- Sign out = `supabase.auth.signOut({ scope: 'local' })` + `keytar.deletePassword(...)`. `scope: 'local'` keeps the web session alive — that's what "independent session" means.

---

## What I'll do when you hit "Implement plan"

Honestly, very little — most of the work is in the Wes repo and in the Cloud UI:

1. (Optional) Scaffold the `wes-handshake` edge function if you want it.
2. Write a short `WES_INTEGRATION.md` in this repo documenting the redirect URLs, the anon key, the table shape (already shared earlier), and the loopback flow, so the Wes repo has a single source of truth to point at.

Tell me if you want the edge function included or skipped, and whether the markdown doc is useful or noise.