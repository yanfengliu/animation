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
  # Only a batch whose control ran green and that judged every mutant counts as done; a broken
  # environment (control red, exit 2, or every test failing at once) is left for a rerun.
  if [ "$code" -eq 0 ] || { [ "$code" -eq 1 ] && grep -q "^control green" "$b.log"; }; then
    echo "exit $code | $summary" > "$b.done"
  else
    echo "$(basename "$b") left undone (exit $code)" >> "$DIR/runner.log"
    exit "$code"
  fi
done
echo "all done $(date -Iseconds)" | tee -a "$DIR/runner.log" > "$DIR/all.done"
