Three small mobile UX fixes:

## 1. iOS zoom on auth inputs

`src/pages/Auth.tsx` and `src/pages/ResetPassword.tsx` use raw `<input>` tags with `text-[14px]`. iOS Safari zooms any input under 16px. We already fixed this everywhere else; these two pages were missed.

**Fix:** change input classes from `text-[14px]` → `text-[16px] md:text-[14px]` on:
- email + password inputs in `Auth.tsx` (3 inputs)
- new password + confirm inputs in `ResetPassword.tsx` (2 inputs)

This is the same pattern we used for the AppBar/TaskDetailModal fix — full size on mobile so iOS doesn't zoom, smaller on desktop where zoom isn't a concern.

## 2. Password requirements not visible

Right now the only feedback is "Password is known to be weak" *after* submit, with no upfront guidance. Supabase's password policy (Cloud default) requires 8+ characters and rejects breached passwords (HaveIBeenPwned check).

**Fix:** add a small helper line under the password field on signup and the new-password fields on reset:

> `8+ characters. Avoid common passwords (we check against known breaches).`

Styled as `font-mono-plex text-[11px] text-muted-foreground` to match existing microcopy. Only shown on signup and reset-password screens, not signin.

## 3. Onboarding "skip demo" button stuck at bottom

On step 2 (the demo), `skip demo` is `fixed bottom-5 right-5`. On mobile the demo content is short and the button floats way below it in dead space. With Safari's chrome bar it's even further out of reach.

**Fix:** move it to `fixed top-5 right-5` (same side as the progress dots area, but in the corner so it doesn't collide). Keep it small + faint so it stays a quiet escape hatch, not a primary action. Remove the safe-area-bottom padding since it's no longer at the bottom.

## Files

- `src/pages/Auth.tsx` — bump input font-size on mobile, add password helper text under signup password field
- `src/pages/ResetPassword.tsx` — bump input font-size on mobile, add password helper text
- `src/pages/Onboarding.tsx` — move skip button from bottom-right to top-right
