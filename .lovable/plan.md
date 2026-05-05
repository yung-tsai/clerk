Use the uploaded image as the video poster frame on the landing hero.

## Changes

1. Save the upload to `public/landing-hero-poster.png` (already copied).
2. In `src/pages/Landing.tsx`, add `poster="/landing-hero-poster.png"` to the existing `<video>` element on the hero (line 29-38).

That's it. The poster shows instantly while the MP4 buffers, then the video takes over on autoplay. Same image used as the OG/social preview if you want — let me know.

## Note

The image is the blue + orange characters at a desk. It's a totally different vibe from the cinematic dark video. On mobile it'll flash this bright illustration for a split second before the dark video kicks in, which may feel jarring. If you'd rather, I can extract a frame from the actual `landing-hero.mp4` and use that instead — visually seamless. Want me to do both options or just go with the upload?
