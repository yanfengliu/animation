# Devlog Summary

- 2026-10-14: **A particle cloud that reads "hello world" only from one hidden viewpoint, by geometry alone.**
  - About 4,950 of 18,000 equally lit particles sit on 14°-slanted letter strokes as seen from the secret eye. They keep their distance from it, so the disguise holds everywhere else.
  - The owner rejected an angle-dependent glow as cheating. Without it, the stroke/gap ratio at the angle is 1.6 (2.4 with the glow).
  - Slanting the letters cut the el ±25 stem streaks from 2.26× to 1.72× the noise floor.
  - 36 headless gates, and a 74-mutant proof that killed all 74 after a green control run.
  - The gate that guards the owner's rule now ties the shipped render to its layers pixel for pixel, after review rounds 1–5 found 4 major gate defects.
  - Open:
    - nothing has run on a real GPU or with a screen reader;
    - nothing pins β below 1 (`docs/learning/lessons.md`);
    - the pixel identity assumes a renderer that does not dither.
  - Detail: [detailed/2026-10-10_2026-10-14.md](detailed/2026-10-10_2026-10-14.md).
