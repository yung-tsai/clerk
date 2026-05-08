## Why your PostHog data looks polluted

Bots (and link scanners) crawl random URLs like `/cifinancial`, `/wp-admin`, `/.env`, etc. Because Clerk is a SPA:

1. The server returns `index.html` with a **200** for any path.
2. React Router renders `NotFound`, but PostHog's `capture_pageview: true` already fired a `$pageview` for that URL.
3. Result: PostHog shows tons of "pages" that don't exist, inflating sessions, unique visitors, and bounce rate.

`analytics.ts` currently has:
```ts
posthog.init(KEY, {
  capture_pageview: true,
  capture_pageleave: true,
  ...
});
```
No bot filter, no route allow-list, no 404 suppression.

## Plan

Three small, layered fixes — defense in depth.

### 1. Tell PostHog to drop bot traffic

In `src/lib/analytics.ts`, pass:
```ts
opt_out_useragent_filter: false, // (default) keep PostHog's built-in bot UA list
before_send: (event) => {
  // Drop events from headless / known crawlers PostHog might miss
  const ua = navigator.userAgent || "";
  if (/bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|axios|python-requests|curl|wget/i.test(ua)) {
    return null;
  }
  return event;
},
```
PostHog already filters common bots, but this catches the noisy ones (especially `HeadlessChrome` and scripted scrapers) that slip through.

### 2. Stop auto-capturing pageviews; capture them manually only for real routes

Change to `capture_pageview: false` and add a tiny `RouteTracker` component inside `<BrowserRouter>` (in `src/App.tsx`) that calls `posthog.capture('$pageview')` **only when the matched route is one of our known routes** (`/`, `/auth`, `/wes-auth`, `/reset-password`, `/onboarding`, `/app`, `/privacy`, `/terms`).

When the user lands on `*` (NotFound), we fire `pageview_404` with the path as a property instead — useful for debugging without polluting the main funnel.

### 3. Tighten `public/robots.txt`

Today it explicitly `Allow: /` for everyone, which encourages aggressive crawling of garbage paths. Switch to:
```
User-agent: *
Allow: /
Disallow: /app
Disallow: /onboarding
Disallow: /auth
Disallow: /reset-password
Disallow: /wes-auth
```
Keeps the marketing landing crawlable, blocks the app surface from being indexed, and signals well-behaved bots to stop probing app routes.

### What this fixes vs. doesn't

- ✅ PostHog dashboards (sessions, pageviews, unique visitors, bounce rate) will reflect real users.
- ✅ Random `/cifinancial`-style hits won't show up as "pages."
- ⚠️ Won't stop bots from *requesting* the URL — only your own analytics. CDN/WAF rules would be needed to block at the edge, but that's overkill for what you're describing.

## Files touched

- `src/lib/analytics.ts` — add `before_send`, set `capture_pageview: false`, expose a `capturePageview()` helper.
- `src/App.tsx` — add `<RouteTracker />` inside `<BrowserRouter>`.
- `public/robots.txt` — disallow app routes.

No backend or schema changes.