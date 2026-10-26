#!/usr/bin/env bash
# Full mutation proof (node tests/mutate.mjs, 132 mutants, about 9-10 hours) in resumable batches (work unit 1).
# Start or resume it from anywhere in the repo: bash docs/work/1_sentence-sequence/proof-batches.sh
# It runs from its own copy, tmp/proof-final/run-batches.sh, since bash reads a script as it runs it.
# The first run splits the mutant names into batch-NN.txt lists of 11 and records the inputs and the commit.
# During a proof only Markdown files may change. Every other file git lists, tracked or untracked, is an input,
# and so are Node and Playwright. They are checked at start, after each batch and before all.done.
# A batch's .done holds the digests of its list, the inputs and its log, and counts only while all three match.
# Rerun it after a proof to recheck it: it exits 0 only while the proof is clean and the inputs are unchanged.
# Exit codes: 0 complete and clean; 1 complete, not clean (all.done says why); 2 mutate.mjs exited 2 (a red
# control or bad usage); 3 the inputs changed (see ABORTED); 4 the lists, the catalog or the folder are unusable;
# 5 another runner holds the lock; 6 a batch crashed or its log lacks a verdict; 143 a signal stopped it.
# After 2, 6 or 143 that batch stays undone with its log kept, and the next run runs it again.
# PROOF_DIR (default tmp/proof-final), NODE (default node) and BATCH_SIZE (default 11) can be set.
set -u
shopt -s nullglob
self=$(cd "$(dirname "$0")" && pwd)/${0##*/}
ROOT=${PROOF_ROOT:-$(git -C "${self%/*}" rev-parse --show-toplevel)} || exit 4   # the copy gets it from the first run
DIR=${PROOF_DIR:-$ROOT/tmp/proof-final}
mkdir -p "$DIR" && DIR=$(cd "$DIR" && pwd) && cd "$ROOT" || exit 4
export PROOF_ROOT="$ROOT" PROOF_DIR="$DIR"
NODE=${NODE:-node}
log() { echo "$(date -Iseconds) $*" | tee -a "$DIR/runner.log"; }
refuse() { log "refused: $*" >&2; exit 4; }
sum() { sha256sum | cut -c1-64; }

# Before writing anything, refuse a folder this runner did not set up (an older runner's proof takes no lock
# and may be running from its run-batches.sh) or whose setup broke off (files but no names.txt).
if [ -f "$DIR/names.txt" ]; then grep -qs '^HEAD ' "$DIR/revision.txt"; else ! ls -A "$DIR" | grep -qvxE 'run-batches\.sh|runner\.(pid|log)'; fi \
  || { echo "refused: $DIR was not set up by this runner, or its setup broke off; move it aside for a fresh proof" >&2; exit 4; }
# One runner at a time. The lock comes before the copy, so a refused runner never rewrites a running one.
pid=$(cat "$DIR/runner.pid" 2>/dev/null | tr -dc 0-9)
if [ -n "$pid" ] && [ "$pid" != $$ ] && kill -0 "$pid" 2>/dev/null; then
  log "refused: runner $pid holds $DIR/runner.pid (delete it if no runner is running)" >&2; exit 5
fi
echo $$ > "$DIR/runner.pid" || exit 4
if ! [ "$self" -ef "$DIR/run-batches.sh" ]; then cp "$self" "$DIR/run-batches.sh" && exec bash "$DIR/run-batches.sh"; exit 4; fi
trap 'rm -f "$DIR/runner.pid"' EXIT

# The inputs: every file git lists, tracked or untracked but not ignored, hashed as on disk, then Node and
# Playwright. Markdown is left out because no gate reads it, so notes may change during a proof.
fingerprint() {
  git ls-files -z --cached --others --exclude-standard | grep -zv '\.md$' | LC_ALL=C sort -zu | xargs -0r sha256sum 2>/dev/null
  "$NODE" -e 'console.log("node", process.version); for (const p of ["playwright", "playwright-core"]) { let v = "missing"; try { v = require(`./node_modules/${p}/package.json`).version } catch {} console.log(p, v) }'
}
check() {  # stops the proof with exit 3 when the inputs no longer match hashes-before.txt; $1 says when
  fingerprint > "$DIR/hashes-now.txt"
  cmp -s "$DIR/hashes-before.txt" "$DIR/hashes-now.txt" && return
  { echo "ABORT $(date -Iseconds): the inputs changed $1. These differ from hashes-before.txt:"
    diff "$DIR/hashes-before.txt" "$DIR/hashes-now.txt" | sed -nE 's/^[<>] ([0-9a-f]{64} [ *])?/  /p' | LC_ALL=C sort -u
    echo "The batch markers no longer prove the current inputs unless the change is reverted byte for byte."
    echo "For a fresh proof, move $DIR aside and run this again."; } > "$DIR/ABORTED"
  cat "$DIR/ABORTED" >&2
  log "ABORT: inputs changed $1:$(sed -n 's/^  / /p' "$DIR/ABORTED" | tr -d '\n')" > /dev/null
  exit 3
}
catalog() {  # the mutant names, from the usage error mutate.mjs gives for an unknown name before it runs anything
  local out; out=$("$NODE" tests/mutate.mjs '@catalog' 2>&1); [ $? -eq 2 ] || return 1
  sed -n 's/^mutate\.mjs: unknown mutant "@catalog"; known: //p' <<< "$out" | tr -d '\r' | sed 's/, /\n/g'
}
cover() {  # what keeps the lines of file $2 from being the names in file $1, each once
  awk 'function add(s) { r = r (r == "" ? "" : "; ") s } FILENAME == ARGV[1] { want[$0]; next }
    !($0 in want) { add("extra " $0); next } seen[$0]++ { add("twice " $0) }
    END { for (w in want) if (!(w in seen)) add("missing " w); if (r != "") print r }' "$1" "$2"
}
verdicts() { sed -nE 's/^## ([^ ]+): (KILLED|ERRORED|SURVIVED) .*/\1/p' "$@" 2>/dev/null; }

if [ ! -f "$DIR/names.txt" ]; then   # setup; names.txt comes last, so a setup that broke off is refused above
  size=${BATCH_SIZE:-11}
  [[ $size =~ ^[1-9][0-9]*$ ]] || refuse "BATCH_SIZE must be a whole number above 0, not \"$size\""
  known=$(catalog)
  if [ -z "$known" ] || grep -qvxE '[^[:space:]]+' <<< "$known" || [ -n "$(LC_ALL=C sort <<< "$known" | uniq -d)" ]; then
    refuse "node tests/mutate.mjs @catalog gave no list of unique mutant names"
  fi
  awk -v n="$size" -v d="$DIR" '{ print > sprintf("%s/batch-%02d.txt", d, int((NR - 1) / n) + 1) }' <<< "$known"
  fingerprint > "$DIR/hashes-before.txt"
  st=$(git --no-optional-locks status --porcelain)
  { echo "HEAD $(git rev-parse HEAD)"; [ -z "$st" ] && echo "tree clean" || printf 'tree dirty:\n%s\n' "$st"; } > "$DIR/revision.txt"
  echo "$known" > "$DIR/names.txt"
  lists=("$DIR"/batch-*.txt); log "setup: $(wc -l < "$DIR/names.txt") mutants in ${#lists[@]} batches"
fi
[ -s "$DIR/hashes-before.txt" ] || refuse "$DIR has names.txt but no hashes-before.txt; move it aside for a fresh proof"
check "before this run (found by the check at its start, before any batch ran)"
if [ -f "$DIR/ABORTED" ]; then rm -f "$DIR/ABORTED"; log "the inputs match hashes-before.txt again, so ABORTED is removed"; fi

lists=("$DIR"/batch-*.txt)
known=$(catalog) && [ -n "$known" ] || refuse "node tests/mutate.mjs @catalog gave no mutant names"
bad=$(cover <(echo "$known") "$DIR/names.txt")
[ -z "$bad" ] || refuse "names.txt does not hold the names mutate.mjs knows, each once: $bad"
for list in "${lists[@]}"; do
  grep -q '[^[:space:]]' "$list" && ! grep -q '^[[:space:]]*$' "$list" || refuse "${list##*/} is empty or has a blank line"
done
bad=$(cover "$DIR/names.txt" <(awk 1 /dev/null "${lists[@]}"))
[ -z "$bad" ] || refuse "the batch lists do not hold the names in names.txt, each once: $bad"

fsum=$(sum < "$DIR/hashes-before.txt")
for list in "${lists[@]}"; do
  b=${list%.txt}; n=${b##*/}
  mapfile -t want < "$list"
  lsum=$(printf '%s\n' "${want[@]}" | sum)
  if [ -f "$b.done" ] && [ -f "$b.log" ] && grep -qx "list $lsum" "$b.done" && grep -qx "inputs $fsum" "$b.done" \
    && grep -qx "log $(sum < "$b.log")" "$b.done"; then continue; fi
  [ -f "$b.done" ] && log "$n: its marker does not match its list, the inputs or its log, so it runs again"
  rm -f "$b.done" "$DIR/all.done"
  printf '%s\n' "${want[@]}" | grep -q '^[[:space:]]*$' && refuse "$n is empty or has a blank line"   # no names would run all
  log "$n start: ${#want[@]} mutants"
  "$NODE" tests/mutate.mjs "${want[@]}" > "$b.log" 2>&1 &   # in the background, so a signal to the runner stops it too
  child=$!; trap 'kill "$child" 2>/dev/null; log "$n stopped by a signal" > /dev/null; exit 143' INT TERM HUP
  wait "$child"; code=$?; trap - INT TERM HUP
  check "during $n (found by the check after it ran)"
  summary=$(grep -E '^control green \(' "$b.log" | tail -n 1)
  bad=$(cover <(printf '%s\n' "${want[@]}") <(verdicts "$b.log"))
  log "$n exit $code | ${summary:-no control green summary line}${bad:+ | not one verdict per name: $bad}"
  # Done only after a green control with one verdict per name. A red control (2) or a crash stays undone.
  if [ "$code" -gt 1 ] || [ -z "$summary" ] || [ -n "$bad" ]; then
    log "$n left undone; its log is $b.log"; [ "$code" -eq 2 ] && exit 2; exit 6
  fi
  printf 'list %s\ninputs %s\nlog %s\nexit %s\n%s\n' "$lsum" "$fsum" "$(sum < "$b.log")" "$code" "$summary" > "$b.done.tmp" \
    && mv -f "$b.done.tmp" "$b.done"
done

check "after the last batch (found by the check before all.done)"
logs=("${lists[@]/%.txt/.log}")
bad=$(cover "$DIR/names.txt" <(verdicts "${logs[@]}"))
[ -z "$bad" ] || { log "not done: the batch logs do not give one verdict per name in names.txt: $bad" >&2; exit 6; }
read -r k s e f < <(awk '/^## [^ ]+: (KILLED|ERRORED|SURVIVED) / { v[$3]++; if (/FLAG: 0 green/) f++ }
  END { print v["KILLED"] + 0, v["SURVIVED"] + 0, v["ERRORED"] + 0, f + 0 }' "${logs[@]}")
unclean=$(for list in "${lists[@]}"; do b=${list%.txt}; grep -qx 'exit 0' "$b.done" || echo "  ${b##*/} ($(sed -n 4p "$b.done")):$(awk '
  /^## [^ ]+: (ERRORED|SURVIVED) |^## [^ ]+: KILLED .*FLAG: 0 green/ { sub(/:$/, "", $2); printf " %s %s%s;", tolower($3), $2, /FLAG: 0 green/ ? " (flagged)" : "" }' "$b.log")"; done)
[ -z "$unclean" ] && [ $((s + e + f)) -eq 0 ] && verdict=CLEAN || verdict="NOT CLEAN"
{ echo "$verdict"
  echo "$(date -Iseconds): $(wc -l < "$DIR/names.txt") mutants in ${#lists[@]} batches: $k killed, $s survived, $e errored, $f flagged"
  echo "inputs: hashes-before.txt (sha256 $fsum); $(head -n 2 "$DIR/revision.txt" | paste -sd' ')"
  if [ "$verdict" != CLEAN ]; then
    echo "Batches with survivors, errored or flagged mutants:"; echo "$unclean"
    echo "An errored or flagged mutant often means a broken environment, such as a browser that crashed after the control:"
    echo "delete that batch's .done and run this again to rerun it. A survivor means a gate gap."
  fi; } > "$DIR/all.done.tmp" && mv -f "$DIR/all.done.tmp" "$DIR/all.done"
log "all done: $verdict; $k killed, $s survived, $e errored, $f flagged" > /dev/null
cat "$DIR/all.done"
[ "$verdict" = CLEAN ] || exit 1
