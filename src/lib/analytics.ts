import posthog from "posthog-js";

// Public PostHog project key (phc_...). Safe to ship in the client bundle.
// Set via VITE_POSTHOG_KEY in your .env file. Leave empty to disable analytics
// in local/dev environments.
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ||
  "https://eu.i.posthog.com";

let initialized = false;

export function initAnalytics() {
  if (initialized || !POSTHOG_KEY || typeof window === "undefined") return;
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false,
      persistence: "localStorage+cookie",
      person_profiles: "identified_only",
    });
    initialized = true;
  } catch (err) {
    // Never break the app if analytics fails.
    console.warn("[analytics] init failed", err);
  }
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  try {
    posthog.capture(event, properties);
  } catch {
    /* swallow */
  }
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  try {
    posthog.identify(userId, properties);
  } catch {
    /* swallow */
  }
}

export function resetAnalytics() {
  if (!initialized) return;
  try {
    posthog.reset();
  } catch {
    /* swallow */
  }
}
