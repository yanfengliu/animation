# Lessons

This file holds, one line each, every lesson this repo has paid for and has not yet gated. Read it at session start. It stays short because each entry leaves as soon as its gate lands.

Each rule links into [lessons-evidence.md](lessons-evidence.md), which holds the story and the anchor. Open that only when a rule is in doubt or the work is in that area.

To add a lesson, write an entry there and one line here, and name the gate it is waiting for. When the gate lands, prove it red by reintroducing the defect, record that in `gate-proofs.md`, and delete both halves in the same commit.

## Rules

- Nothing in the gates holds the relocation rate β at 0.85. Raising it to 1.0 makes the words a little crisper (E ratio 1.61 to 1.76) but lumpier off-angle, by about 14% on average at az+25, and that rise is smaller than the spread between random clouds. So keep β at 0.85 by decision and do not raise it to sharpen the words. — **gate:** a mean az±25 row-residual bound over enough seeds (about 12) to separate β 0.85 from 1.0, killed by a β 1.0 `full-relocation` mutant. It needs a faster render path or a separate slow-gate command to be affordable ([evidence](lessons-evidence.md#nothing-in-the-gates-holds-the-relocation-rate-at-085))
