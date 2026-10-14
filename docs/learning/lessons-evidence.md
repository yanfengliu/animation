# Lessons evidence

## Nothing in the gates holds the relocation rate at 0.85

**Anchor:** 2026-10-12. Retired mutant `full-relocation` (β 1.0) in `9c0425f`; W11's search for a replacement in `cea1d4e`; numbers in the `tests/illusion.test.mjs` header and in `docs/work/0_hello-world-cloud/reviews/3_integration.md` (F25).

**Gate:** not landed. It needs a mean over about 12 seeds, which costs about four times the current illusion file. That requires a faster render path, or a separate slow-gate command kept out of `npm test`.

With upright letters, the β 1.0 mutant was killed by the relocation-residual gate. After the 14° slant it survived: its worst gated residual over the cloud's own floor was 1.281, against 1.285 for β 0.85 (seed 1). The floor rises with β, so the ratio cannot see relocation rising evenly across all views. Round 3 (R3-3) showed the old kill on the upright page was luck of seed 1; seeds 2 and 3 did not separate either.

W11 then looked for an absolute bound: the az±25 row residual over the cloud's noise, as a mean over seeds 1–3.
- The real page (β 0.85) measured 1.416 for seeds 1–3, 1.693 for 4–6, 1.556 for 7–9 and 1.524 for 10–12.
- β 1.0 measured 1.637 for seeds 1–3 and 1.897 for 4–6.
- Per seed (1–6), β 0.85 to 1.0 changed it by −0.3% to +36.6%, +14.4% on average.

So the real page's own redraws overlap β 1.0. The hidden excess, the residual over the floor and the el±25 column all overlap too: the last has a margin of only 0.05.

The cost of β 1.0 is real even if small: W8's upright table shows az+25 rows going from 1.25 to 1.69, and el±25 columns from 1.74/2.20 to 2.10/2.57. β stays at 0.85 because the words already read at a glance there.
