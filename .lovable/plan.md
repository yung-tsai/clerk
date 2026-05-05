## What I found

The current code already includes the drag-handle modal changes, and the live published bundle at `getclerks.com` contains those updated modal styles. So if your phone still shows the old full-page-looking task/settings/completed screens after 12 hours and cache clearing, the likely cause is not the JS bundle itself — it is the app running in an installed/mobile web-app mode or browser session that is preserving viewport/app-shell behavior.

I also found that Clerk is configured as installable:
- `manifest.json` has `display: "standalone"`
- `index.html` includes Apple mobile web app meta tags
- there is no service worker, so this is not a classic PWA cache issue, but iOS can still pin install-related behavior and old app sessions more aggressively than normal tabs.

## Plan

### 1. Add a visible build/version footer in Settings
Add the build timestamp/hash we discussed earlier, but make it practical for debugging:
- Show a small version row at the bottom of Settings.
- Include a short build hash and build time.
- Make it easy to compare Preview vs published vs mobile.

This gives us a reliable way to answer: “Is this phone actually running the newest build?”

### 2. Add a lightweight stale-build detector
Add a small client-side check that compares the currently loaded build hash to a tiny generated version file.

Behavior:
- On app load and when the tab becomes visible, check if a newer build exists.
- If yes, show a soft in-app banner/toast: “New Clerk update available” with a “Refresh” action.
- The refresh action reloads the page.

Important: this will not add a service worker or full PWA caching. It is just a small published-version check.

### 3. Update the Proposal modal for modal consistency
The proposal modal currently still uses the older centered modal pattern and visible desktop close button behavior. I’ll update it to match the new mobile sheet language:
- Add the mobile drag handle at the top.
- Hide the default X on mobile.
- Keep tap-outside behavior, but preserve the existing behavior where dismissing accepts proposals.
- Make the header read more like the landing example: “Here’s what I’d do.” / “Tap a column to move anything.”
- Keep desktop layout clean and unchanged where possible.

### 4. Improve the mobile task-detail/new-task modal layout
Your screenshots show the modal is technically updated in code, but on actual mobile it still feels like a full-page editor with no obvious boundary, especially when Safari browser chrome is visible.

I’ll tighten this up by making mobile dialogs more obviously “sheets”:
- Ensure the modal surface has a visible rounded top, subtle border, and background separation from the page.
- Keep the drag handle visible at the very top.
- Add safer bottom padding so the Delete button/input fields don’t get trapped behind Safari’s bottom toolbar.
- Keep desktop behavior unchanged.

### 5. Improve the last screenshot: inline input + keyboard state
The last screenshot shows the bottom app bar/input fighting the iOS keyboard:
- The input pill floats above the keyboard, but the separate action toolbar underneath it creates a lot of vertical clutter.
- The dashed add-card stays visible high on the screen, which makes the focused input state feel visually disconnected.
- The keyboard state should feel more like “I’m adding a task now,” not like the normal nav bar plus extra controls.

I’ll improve this by adjusting the focused mobile input state:
- When the input is focused on mobile, simplify the bottom bar so it becomes a compact compose state.
- Keep the text field prominent.
- Avoid showing extra navigation/menu affordances that compete with the keyboard.
- Keep the normal AppBar/menu behavior when the keyboard is not open.

### 6. Verify the actual published behavior path
After implementation, I’ll check the code paths that determine modal visibility and app-shell behavior:
- confirm no service worker exists/registers
- confirm version footer renders in Settings
- confirm proposal modal uses the same mobile sheet treatment
- confirm the input focused state is cleaner on mobile widths

## Files I expect to touch

- `vite.config.ts`
- `src/vite-env.d.ts`
- `src/App.tsx` or a small new update-check component
- `src/pages/AppHome.tsx`
- `src/components/SettingsModal.tsx`
- `src/components/TaskDetailModal.tsx`
- `src/components/AppBar.tsx`
- possibly `src/components/ui/dialog.tsx`
- possibly a generated/public version file pattern

## One note about mobile installs

Because the app is installable on iOS, if you are launching Clerk from a home-screen icon, iOS may keep older install metadata/session behavior even without a service worker. The version footer will tell us immediately whether that’s happening. If the footer shows the new version but the UI still looks old, then we’ll know it’s a responsive/layout issue rather than deployment/caching.