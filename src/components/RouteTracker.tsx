import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { capturePageview, track } from "@/lib/analytics";

const KNOWN_ROUTES = new Set([
  "/",
  "/auth",
  "/wes-auth",
  "/reset-password",
  "/onboarding",
  "/app",
  "/privacy",
  "/terms",
]);

export function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (KNOWN_ROUTES.has(location.pathname)) {
      capturePageview({ path: location.pathname });
    } else {
      track("pageview_404", { path: location.pathname });
    }
  }, [location.pathname]);

  return null;
}
