#!/usr/bin/env bash
# Full mutation proof (node tests/mutate.mjs, 132 mutants, about 9-10 hours) in resumable batches (work unit 1).
# Start or resume it from the repo root with: bash docs/work/1_sentence-sequence/proof-batches.sh
# (from anywhere else, give this file's path). It runs from its own copy, tmp/proof-final/run-batches.sh.
# It proves a frozen snapshot. Setup refuses a checkout with changes other than Markdown, then extracts HEAD as
# committed into tmp/proof-final/tree with a copy of node_modules/playwright and playwright-core, and every
# mutate.mjs call runs there, so the checkout may change freely during a proof.
# The snapshot (all but its run output: tmp/, test-results/, playwright-report/) and the Node version are hashed
# at start, after each batch and before all.done. Not seen: a change made and reverted within one batch, and the
# Chromium build in Playwright's cache, whose version follows playwright-core.
# One proof runs at a time per repo: tmp/mutation.lock holds the runner's pids and the running batch's.
# A batch's .done holds the digests of its list, the inputs and its log, and counts only while all three match.
# Rerun it after a proof to recheck it: it exits 0 only while the proof is clean and the snapshot unchanged.
# Exit codes: 0 complete and clean; 1 complete, not clean (all.done says why); 2 mutate.mjs exited 2 (a red
# control or bad usage); 3 the snapshot or Node changed, or could not be hashed (see ABORTED); 4 the checkout,
# the lists, the catalog or the folder are unusable; 5 the lock is held; 6 a batch crashed or the logs lack a
# verdict; 143 a signal stopped it. After 2, 6 or 143 that batch stays undone with its log kept.
# PROOF_DIR (default tmp/proof-final), NODE (default node) and BATCH_SIZE (default 11) can be set.
set -u
shopt -s nullglob
self=$(cd "$(dirname "$0")" && pwd)/${0##*/}
ROOT=${PROOF_ROOT:-$(git -C "${self%/*}" rev-parse --show-toplevel)} || exit 4   # the copy gets it from the first run
DIR=${PROOF_DIR:-$ROOT/tmp/proof-final}; case $DIR in /* | [A-Za-z]:*) ;; *) DIR=$PWD/$DIR ;; esac
cd "$ROOT" || exit 4
export PROOF_ROOT="$ROOT" PROOF_DIR="$DIR"
NODE=${NODE:-node} LOCK=$ROOT/tmp/mutation.lock
log() { echo "$(date -Iseconds) $*" | tee -a "$DIR/runner.log"; }
refuse() { log "refused: $*" >&2; exit 4; }
sum() { sha256sum | cut -c1-64; }

# The lock comes before any folder check or write. Its owner file holds a token, the runner's pid and Windows pid,
# and the running batch's Windows pid. It is stale only when all of them have ended, so PID reuse fails safe.
command -v tasklist > /dev/null && command -v taskkill > /dev/null || { echo "refused: this runner needs Windows (tasklist, taskkill)" >&2; exit 4; }
alive() { [ "${1:--}" != - ] && tasklist //FI "PID eq $1" //NH | grep -qw -- "$1"; }
own() { printf '%s %s %s %s\n' "$TOKEN" $$ "$(cat /proc/$$/winpid)" "${1:--}" > "$LOCK/owner.new" && mv -f "$LOCK/owner.new" "$LOCK/owner"; }
mine() { local t; read -r t _ < "$LOCK/owner" && [ "$t" = "$TOKEN" ]; } 2> /dev/null
held() { echo "refused: the proof lock $LOCK is held ($*). Check a Windows pid with: tasklist //FI \"PID eq <pid>\". If none is a proof, move $LOCK aside." >&2; exit 5; }
if [ -n "${PROOF_LOCK_TOKEN:-}" ]; then TOKEN=$PROOF_LOCK_TOKEN; mine || held "not by the runner that started this copy"
else
  TOKEN=$$.$(date +%s%N).$RANDOM; mkdir -p "$ROOT/tmp" || exit 4
  if ! mkdir "$LOCK" 2> /dev/null; then
    read -r t p w c 2> /dev/null < "$LOCK/owner" && [ -n "${c:-}" ] || held "it has no owner line yet, or a broken one"
    kill -0 "$p" 2> /dev/null || alive "$w" || alive "$c" && held "runner pid $p, Windows pid $w; batch Windows pid $c"
    # Take the stale lock over by renaming it, so of two runners only one can; a lock renamed by mistake goes back.
    mv -T "$LOCK" "$LOCK.stale.$TOKEN" 2> /dev/null || held "another runner is taking it over"
    read -r t2 _ 2> /dev/null < "$LOCK.stale.$TOKEN/owner"
    if [ "${t2:-}" != "$t" ]; then mv -T "$LOCK.stale.$TOKEN" "$LOCK" 2> /dev/null; held "another runner took it over"; fi
    rm -f "$LOCK.stale.$TOKEN/owner"; rmdir "$LOCK.stale.$TOKEN"
    mkdir "$LOCK" 2> /dev/null || held "another runner took it over"
  fi
fi
own && export PROOF_LOCK_TOKEN=$TOKEN || exit 4
trap 'mine && rm -f "$LOCK/owner" && rmdir "$LOCK"' EXIT

# Refuse, before writing to it, a folder this runner did not set up (an older runner's proof may be running from
# its run-batches.sh) or whose setup broke off (files but no names.txt).
if [ -f "$DIR/names.txt" ]; then grep -qs '^HEAD ' "$DIR/revision.txt" && [ -d "$DIR/tree" ]
else ! ls -A "$DIR" 2> /dev/null | grep -qvxE 'run-batches\.sh|runner\.log'; fi \
  || { echo "refused: $DIR was not set up by this runner, or its setup broke off; move it aside for a fresh proof" >&2; exit 4; }
mkdir -p "$DIR" || exit 4
if ! [ "$self" -ef "$DIR/run-batches.sh" ]; then cp "$self" "$DIR/run-batches.sh" && exec bash "$DIR/run-batches.sh"; exit 4; fi

# The inputs: every file of the snapshot but its run output, hashed, then the Node version. It fails loudly on any
# error, and unless every file found got exactly one hash line.
fingerprint() (
  set -o pipefail; cd "$DIR/tree" || exit 1
  find . \( -path ./tmp -o -path ./test-results -o -path ./playwright-report \) -prune -o -type f -print0 | LC_ALL=C sort -z > "$DIR/files.list" || exit 1
  n=$(tr -dc '\000' < "$DIR/files.list" | wc -c) && [ "$n" -gt 0 ] || { echo "fingerprint: no files under $DIR/tree" >&2; exit 1; }
  xargs -0 sha256sum -- < "$DIR/files.list" > "$DIR/files.sums" || exit 1
  [ "$(wc -l < "$DIR/files.sums")" -eq "$n" ] || { echo "fingerprint: $n files but $(wc -l < "$DIR/files.sums") hash lines" >&2; exit 1; }
  v=$("$NODE" --version) && cat "$DIR/files.sums" && echo "node $v"
)
check() {  # stops the proof with exit 3 unless the snapshot and Node hash as in hashes-before.txt; $1 says when
  if fingerprint > "$DIR/hashes-now.txt" 2> "$DIR/hashes-now.err"; then cmp -s "$DIR/hashes-before.txt" "$DIR/hashes-now.txt" && return
    what="changed $1. These differ from hashes-before.txt:"$'\n'$(diff "$DIR/hashes-before.txt" "$DIR/hashes-now.txt" | sed -nE 's/^[<>] ([0-9a-f]{64} [ *])?/  /p' | LC_ALL=C sort -u)
  else what="could not be hashed $1:"$'\n'$(sed 's/^/  /' "$DIR/hashes-now.err"); fi
  { echo "ABORT $(date -Iseconds): the snapshot or Node $what"
    echo "The batch markers no longer prove the inputs unless they are restored byte for byte. If only the snapshot's"
    echo "node_modules changed, restore it: npm ci in the checkout, then copy node_modules/playwright and playwright-core"
    echo "into $DIR/tree/node_modules again. Otherwise move $DIR aside for a fresh proof."; } > "$DIR/ABORTED"
  cat "$DIR/ABORTED" >&2
  log "ABORT: the snapshot or Node $(tr '\n' ' ' <<< "$what")" > /dev/null
  exit 3
}
catalog() {  # the snapshot's mutant names, from the usage error mutate.mjs gives for an unknown name before it runs anything
  local out; out=$("$NODE" tests/mutate.mjs '@catalog' 2>&1); [ $? -eq 2 ] || return 1
  sed -n 's/^mutate\.mjs: unknown mutant "@catalog"; known: //p' <<< "$out" | tr -d '\r' | sed 's/, /\n/g'
}
cover() {  # what keeps the lines of file $2 from being the names in file $1, each once
  awk 'function add(s) { r = r (r == "" ? "" : "; ") s } FILENAME == ARGV[1] { want[$0]; next }
    !($0 in want) { add("extra " $0); next } seen[$0]++ { add("twice " $0) }
    END { for (w in want) if (!(w in seen)) add("missing " w); if (r != "") print r }' "$1" "$2"
}
verdicts() { sed -nE 's/^## ([^ ]+): (KILLED|ERRORED|SURVIVED) .*/\1/p' "$@" 2> /dev/null; }

if [ ! -f "$DIR/names.txt" ]; then   # setup; names.txt comes last, so a setup that broke off is refused above
  size=${BATCH_SIZE:-11}
  [[ $size =~ ^[1-9][0-9]*$ ]] || refuse "BATCH_SIZE must be a whole number above 0, not \"$size\""
  commit=$(git rev-parse --verify HEAD) || refuse "the checkout has no commit to prove"
  dirty=$( (set -o pipefail; { git -c core.safecrlf=false diff --no-renames --name-only -z HEAD -- && git ls-files -z --others --exclude-standard; } | tr '\0' '\n') ) \
    || refuse "git could not list the checkout's changes"
  dirty=$(grep -v '\.md$' <<< "$dirty")
  [ -z "$dirty" ] || refuse "the checkout has changes other than Markdown; commit them first: $(paste -sd' ' <<< "$dirty")"
  mkdir "$DIR/tree" && (set -o pipefail; git -c core.autocrlf=false archive --format=tar "$commit" | tar -x -C "$DIR/tree") \
    && mkdir "$DIR/tree/node_modules" && cp -R node_modules/playwright node_modules/playwright-core "$DIR/tree/node_modules/" \
    || refuse "could not extract $commit with node_modules/playwright and playwright-core into $DIR/tree"
  cd "$DIR/tree" || exit 4
  known=$(catalog)
  if [ -z "$known" ] || grep -qvxE '[^[:space:]]+' <<< "$known" || [ -n "$(LC_ALL=C sort <<< "$known" | uniq -d)" ]; then
    refuse "node tests/mutate.mjs @catalog gave no list of unique mutant names"
  fi
  awk -v n="$size" -v d="$DIR" '{ print > sprintf("%s/batch-%02d.txt", d, int((NR - 1) / n) + 1) }' <<< "$known"
  fingerprint > "$DIR/hashes-before.txt" 2> "$DIR/hashes-now.err" || refuse "could not hash the snapshot: $(paste -sd' ' "$DIR/hashes-now.err")"
  echo "HEAD $commit" > "$DIR/revision.txt"
  echo "$known" > "$DIR/names.txt"
  lists=("$DIR"/batch-*.txt); log "setup: $(wc -l < "$DIR/names.txt") mutants in ${#lists[@]} batches, a snapshot of $commit"
fi
cd "$DIR/tree" || refuse "$DIR/tree is missing; move $DIR aside for a fresh proof"
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
  # In the background, with its Windows pid in the lock: a signal ends its whole process tree, and a runner that
  # dies without its trap leaves a lock that stays held while the batch lives on.
  "$NODE" tests/mutate.mjs "${want[@]}" > "$b.log" 2>&1 &
  child=$! cw=-; read -r cw 2> /dev/null < "/proc/$child/winpid"; own "$cw"
  trap '{ [ "$cw" != - ] && taskkill //T //F //PID "$cw" || kill "$child"; } > /dev/null 2>&1; wait "$child"; log "$n stopped by a signal" > /dev/null; exit 143' INT TERM HUP
  wait "$child"; code=$?; trap - INT TERM HUP; own -
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

# Before all.done: the inputs again, then the verdicts against the snapshot's catalog and names.txt, and the lists.
check "after the last batch (found by the check before all.done)"
logs=("${lists[@]/%.txt/.log}"); v=$(verdicts "${logs[@]}")
known=$(catalog) && [ -n "$known" ] || refuse "node tests/mutate.mjs @catalog gave no mutant names"
bad=$({ c=$(cover <(echo "$known") <(echo "$v")); [ -z "$c" ] || echo "verdicts against mutate.mjs: $c"
  c=$(cover "$DIR/names.txt" <(echo "$v")); [ -z "$c" ] || echo "verdicts against names.txt: $c"
  c=$(cover "$DIR/names.txt" <(awk 1 /dev/null "${lists[@]}")); [ -z "$c" ] || echo "lists against names.txt: $c"; } | paste -sd'|')
[ -z "$bad" ] || { log "not done: the batches do not cover every mutant once: $bad" >&2; exit 6; }
read -r k s e f < <(awk '/^## [^ ]+: (KILLED|ERRORED|SURVIVED) / { v[$3]++; if (/FLAG: 0 green/) f++ }
  END { print v["KILLED"] + 0, v["SURVIVED"] + 0, v["ERRORED"] + 0, f + 0 }' "${logs[@]}")
unclean=$(for list in "${lists[@]}"; do b=${list%.txt}; grep -qx 'exit 0' "$b.done" || echo "  ${b##*/} ($(sed -n 4p "$b.done")):$(awk '
  /^## [^ ]+: (ERRORED|SURVIVED) |^## [^ ]+: KILLED .*FLAG: 0 green/ { sub(/:$/, "", $2); printf " %s %s%s;", tolower($3), $2, /FLAG: 0 green/ ? " (flagged)" : "" }' "$b.log")"; done)
[ -z "$unclean" ] && [ $((s + e + f)) -eq 0 ] && verdict=CLEAN || verdict="NOT CLEAN"
{ echo "$verdict"
  echo "$(date -Iseconds): $(wc -l < "$DIR/names.txt") mutants in ${#lists[@]} batches: $k killed, $s survived, $e errored, $f flagged"
  echo "inputs: the snapshot of $(cat "$DIR/revision.txt") in $DIR/tree, hashes-before.txt (sha256 $fsum)"
  if [ "$verdict" = CLEAN ]; then
    echo "Kills printed at the timing lines that docs/gates.md lists may be timing misses: audit them (F98-F100)."
  else
    echo "Batches with survivors, errored or flagged mutants:"; echo "$unclean"
    echo "An errored or flagged mutant often means a broken environment, such as a browser that crashed after the control:"
    echo "delete that batch's .done and run this again to rerun it. A survivor means a gate gap."
  fi; } > "$DIR/all.done.tmp" && mv -f "$DIR/all.done.tmp" "$DIR/all.done"
log "all done: $verdict; $k killed, $s survived, $e errored, $f flagged" > /dev/null
cat "$DIR/all.done"
[ "$verdict" = CLEAN ] || exit 1
