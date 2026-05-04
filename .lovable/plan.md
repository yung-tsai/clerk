## Two small updates

### 1. Replace logo
Overwrite `src/assets/clerk-logo.svg` with the uploaded `Clerks.svg`. All four usages (`Landing`, `AppHome`, `Privacy`, `Terms`) import by path so no code changes needed.

- `code--copy user-uploads://Clerks.svg src/assets/clerk-logo.svg` (overwrite)

### 2. Smaller mascot float (from previous turn, was interrupted)
The bottom-bar mascot bobs too high (~9px) and pokes above the input pill.

- `src/index.css`, `@keyframes char-float`:
  - translateY: `-9px` → `-3px`
  - rotate: `±0.6deg` → `±0.4deg`