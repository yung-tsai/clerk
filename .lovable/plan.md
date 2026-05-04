## Update landing mascot to Wes

The "Here's what I'd do" card on `/` (step 02) still uses the old star-shaped blue mascot SVG inlined in `src/pages/Landing.tsx`. Replace it with the current Wes character used everywhere else in the app.

### Change
- `src/pages/Landing.tsx`
  - Add `import wesMascot from "@/assets/wes.svg";`
  - Replace the `MascotInline` component (the inlined `<svg>` with the star path + eyes) with a simple `<img src={wesMascot} />` at ~36×28 to match the current visual footprint next to the "Here's what I'd do." headline.

No other usages of the old mascot exist on the landing page. Expression stays neutral (static SVG, no eye-tracking needed in a marketing card).