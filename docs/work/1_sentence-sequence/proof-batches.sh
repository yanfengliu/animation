#!/usr/bin/env bash
# Full mutation proof in resumable batches (work unit 1, 2026-10-25). Copy to tmp/proof-final/ with
# batch-NN.txt name lists (split -l 11 of the mutant names) and hashes-before.txt, then run it.
# Runs each tmp/proof-final/batch-NN.txt through tests/mutate.mjs by name, unless batch-NN.done exists.
# Before each batch it checks that the code and tests still hash as at the start, and stops if not.
# Rerun it to resume: finished batches are skipped. It writes all.done when every batch has a .done.
set -u
cd "$(dirname "$0")/../.." || exit 1
DIR=tmp/proof-final
NODE="${NODE:-node}"
echo "runner start $(date -Iseconds) pid $$ node $NODE" >> "$DIR/runner.log"
for list in "$DIR"/batch-??.txt; do
  b="${list%.txt}"
  [ -f "$b.done" ] && continue
  if ! git ls-files -z -- index.html scripts tests package.json package-lock.json | xargs -0 sha256sum | diff -q - "$DIR/hashes-before.txt" > /dev/null; then
    echo "ABORT $(date -Iseconds): code or tests changed before $(basename "$b")" | tee -a "$DIR/runner.log" > "$DIR/ABORTED"
    exit 3
  fi
  echo "$(basename "$b") start $(date -Iseconds)" >> "$DIR/runner.log"
  # shellcheck disable=SC2046
  "$NODE" tests/mutate.mjs $(cat "$list") > "$b.log" 2>&1
  code=$?
  summary=$(grep -E "^control |mutant\(s\):" "$b.log" | tail -n 1)
  echo "$(basename "$b") exit $code $(date -Iseconds) | $summary" >> "$DIR/runner.log"
  # A batch counts as done once its control ran green and every mutant got a verdict (exit 0, or exit 1
  # for a survivor, an errored or a flagged mutant); a red control (exit 2) or a crash is left for a
  # rerun. An environment that breaks after the control shows as errored or flagged mutants in a done
  # batch, so read every batch's summary after the proof, and delete that batch's .done to rerun it.
  if [ "$code" -eq 0 ] || { [ "$code" -eq 1 ] && grep -q "^control green" "$b.log"; }; then
    echo "exit $code | $summary" > "$b.done"
  else
    echo "$(basename "$b") left undone (exit $code)" >> "$DIR/runner.log"
    exit "$code"
  fi
done
echo "all done $(date -Iseconds)" | tee -a "$DIR/runner.log" > "$DIR/all.done"
