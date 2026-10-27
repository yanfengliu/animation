#!/usr/bin/env bash
# Full mutation proof (node tests/mutate.mjs, 132 mutants, about 9-10 hours) in resumable batches (work unit 1).
# Start or resume it from the repo root with: bash docs/work/1_sentence-sequence/proof-batches.sh
# (from anywhere else, give this file's path). It runs from its copy, tmp/proof-final/run-batches.sh. Once a proof is
# set up, that copy judges it even if this file changes; PROOF_RUNNER=new runs this file instead, which then aborts
# on the fingerprint, so it means a fresh proof.
# It proves a frozen snapshot. Setup refuses a checkout with changes other than Markdown, extracts HEAD as committed
# into tmp/proof-final/tree with a copy of node_modules (refused unless its Playwright versions are package-lock.json's),
# and writes revision.txt: the commit, this runner's sha256, Node's path and version, the Playwright versions. Every
# mutate.mjs call runs in the snapshot, so the checkout may change freely during a proof.
# The snapshot (but its tmp/, test-results/ and playwright-report/), revision.txt, the running runner and the Node
# version are hashed at start, after each batch and before all.done.
# One proof at a time: tmp/mutation.lock holds the runner's Windows pid and its batch's, and before taking the lock
# and before each batch it refuses while another bash runs a proof runner or another node runs tests/mutate.mjs.
# Not seen: npm test and other projects' browser work; a snapshot edit made and reverted within one batch; the
# Chromium build in Playwright's cache (not hashed: a Playwright upgrade plus npx playwright install in the checkout
# can remove it mid-proof, which fails safe); git attributes other than autocrlf (none apply today). PID reuse fails
# safe. A runner killed on this machine can report exit 0 to its caller, so read all.done: only a finished run leaves
# one (each run first moves an earlier one to all.done.prev).
# A batch's .done holds the digests of its list, the inputs and its log, and counts only while all three match.
# Exit codes: 0 complete and clean; 1 complete, not clean (all.done says why); 2 mutate.mjs exited 2 (a red control
# or bad usage); 3 the inputs changed or could not be hashed (see ABORTED); 4 the checkout, the lists, the catalog or
# the folder are unusable, or a result could not be written; 5 another mutation run, a held lock or a lost lock;
# 6 a batch crashed or the logs lack a verdict; 143 a signal stopped it. After 2, 6 or 143 that batch stays undone.
# PROOF_DIR (default tmp/proof-final), NODE (default: the recorded one, else node) and BATCH_SIZE (default 11).
set -u
shopt -s nullglob
self=$(cd "$(dirname "$0")" && pwd)/${0##*/}
ROOT=${PROOF_ROOT:-$(git -C "${self%/*}" rev-parse --show-toplevel)} || exit 4   # the copy gets it from the first run
DIR=${PROOF_DIR:-$ROOT/tmp/proof-final}; case $DIR in /* | [A-Za-z]:*) ;; *) DIR=$PWD/$DIR ;; esac
cd "$ROOT" || exit 4
export PROOF_ROOT="$ROOT" PROOF_DIR="$DIR"
LOCK=$ROOT/tmp/mutation.lock
log() { echo "$(date -Iseconds) $*" | tee -a "$DIR/runner.log"; }
refuse() { log "refused: $*" >&2; exit 4; }
sum() { sha256sum | cut -c1-64; }
command -v tasklist > /dev/null && command -v taskkill > /dev/null && command -v powershell.exe > /dev/null \
  || { echo "refused: this runner needs Windows (tasklist, taskkill, powershell.exe)" >&2; exit 4; }

# Other mutation runs: a bash whose first argument is a proof runner, or a node whose first argument is
# tests/mutate.mjs. Launchers such as bash -c "..." only name the script; the process that runs it is seen. This
# runner, its ancestors (handed on across exec in PROOF_KIN) and its descendants are left out.
read -r -d '' PS << 'EOF'
$me = [int]$env:PROOF_ME; $all = @{}; Get-CimInstance Win32_Process | ForEach-Object { $all[[int]$_.ProcessId] = $_ }
$ours = @{}; foreach ($k in $env:PROOF_KINLIST -split ',') { $x = [int]$k; while ($x -and $all.ContainsKey($x) -and -not $ours[$x]) { $ours[$x] = 1; "K $x"; $x = [int]$all[$x].ParentProcessId } }
$rx = '^\s*"?([^"]*?[\\/])?((bash|sh)(\.exe)?"?\s+"?[^"\s]*(run|proof)-batches\.sh|node(\.exe)?"?\s+(-\S+\s+)*"?[^"\s]*tests[\\/]mutate\.mjs)"?(\s|$)'
foreach ($p in $all.Values) { if ($ours[[int]$p.ProcessId] -or $p.CommandLine -notmatch $rx) { continue }
  $x = [int]$p.ParentProcessId; for ($n = 0; $x -and $x -ne $me -and $all.ContainsKey($x) -and $n -lt 64; $n++) { $x = [int]$all[$x].ParentProcessId }
  if ($x -ne $me) { 'M ' + $p.ProcessId + ' ' + $p.Name + ': ' + $p.CommandLine } }
EOF
runs() {  # exits 5 while another mutation run lives; $1 says when, and $2=log also logs it
  local kin p=$PPID out; kin=$(cat /proc/$$/winpid)
  while [ "$p" -gt 1 ] 2> /dev/null && [ -r "/proc/$p/winpid" ]; do kin=$kin,$(cat "/proc/$p/winpid"); p=$(cat "/proc/$p/ppid"); done
  out=$(set -o pipefail; PROOF_ME=$(cat /proc/$$/winpid) PROOF_KINLIST=$kin${PROOF_KIN:+,$PROOF_KIN} MSYS_NO_PATHCONV=1 \
    MSYS2_ARG_CONV_EXCL='*' powershell.exe -NoProfile -Command "$PS" | tr -d '\r') && grep -q '^K ' <<< "$out" \
    || { echo "refused $1: could not list the processes, so another mutation run cannot be ruled out" >&2; exit 5; }
  export PROOF_KIN; PROOF_KIN=$(sed -n 's/^K //p' <<< "$out" | paste -sd,)
  out=$(sed -n 's/^M /  /p' <<< "$out"); [ -z "$out" ] && return
  echo "refused $1: another mutation run is alive (Windows pid, program: command line):"$'\n'"$out"$'\n'"Wait until it ends; an older runner's proof may also need to resume, as its plan says." >&2
  [ "${2:-}" != log ] || log "refused $1: another mutation run is alive: $(tr '\n' ' ' <<< "$out")" > /dev/null; exit 5
}

# The lock, before any folder check or write: tmp/mutation.lock/owner holds a token, the runner's Windows pid and
# the Windows pid of the batch it runs (node's, or that of the Git Bash stub above it, which lives as long as node).
# A lock held by another is never taken over: it is reported with what to do.
pname() { local n; n=$(tasklist //FI "PID eq $1" //NH //FO CSV 2> /dev/null | sed -n "s/^\"\([^\"]*\)\",\"$1\".*/\1/p"); echo "${n:-ended}"; }
own() { printf '%s %s %s\n' "$TOKEN" "$(cat /proc/$$/winpid)" "${1:--}" > "$LOCK/owner.new" && mv -fT "$LOCK/owner.new" "$LOCK/owner"; }
mine() { local t; read -r t _ < "$LOCK/owner" && [ "$t" = "$TOKEN" ]; } 2> /dev/null
held() {
  local t w c nw nc=none
  if ! read -r t w c 2> /dev/null < "$LOCK/owner" || [ -z "${c:-}" ]; then
    echo "refused: the proof lock $LOCK has no owner line yet. Retry after a few seconds; if it stays so, move it aside by hand." >&2; exit 5
  fi
  nw=$(pname "$w"); [ "$c" = - ] || nc=$(pname "$c")
  echo "refused: the proof lock $LOCK is held: runner Windows pid $w ($nw), batch Windows pid $c ($nc)." >&2
  if [ "$nw" = ended ] && { [ "$nc" = none ] || [ "$nc" = ended ]; }; then echo "Both have ended and no mutation run is alive: move $LOCK aside by hand and run this again." >&2
  else echo "Check them with: tasklist //FI \"PID eq <pid>\"." >&2; fi; exit 5
}
if [ -n "${PROOF_LOCK_TOKEN:-}" ]; then TOKEN=$PROOF_LOCK_TOKEN   # the copy, started by a first run that took the lock
  mine && own || { echo "refused: the proof lock $LOCK is no longer the one this copy was started with" >&2; exit 5; }
else
  runs "before taking the lock"
  TOKEN=$$.$(date +%s%N).$RANDOM; mkdir -p "$ROOT/tmp" || exit 4; mkdir "$LOCK" 2> /dev/null || held
  own || { rm -f "$LOCK/owner.new"; rmdir "$LOCK"; echo "refused: could not write $LOCK/owner" >&2; exit 5; }
  export PROOF_LOCK_TOKEN=$TOKEN
fi
trap 'mine && rm -f "$LOCK/owner" "$LOCK/owner.new" && rmdir "$LOCK"' EXIT

# Refuse, before writing to it, a folder this runner did not set up or whose setup broke off (files but no names.txt).
if [ -f "$DIR/names.txt" ]; then grep -qs '^commit ' "$DIR/revision.txt" && [ -d "$DIR/tree" ]
else ! ls -A "$DIR" 2> /dev/null | grep -qvxE 'run-batches\.sh|runner\.log'; fi || { cat >&2 << EOF
refused: $DIR was not set up by this runner, or its setup broke off. It may be an older runner's proof that is still
running or should resume, as that proof's plan says. Move it aside only once no runner and no tests/mutate.mjs runs
and that proof is not to resume.
EOF
exit 4; }
mkdir -p "$DIR" || exit 4
if ! [ "$self" -ef "$DIR/run-batches.sh" ]; then   # once a proof is set up, the copy that set it up judges it
  if [ -f "$DIR/names.txt" ] && [ -f "$DIR/run-batches.sh" ] && ! cmp -s "$self" "$DIR/run-batches.sh" && [ "${PROOF_RUNNER:-}" != new ]; then
    log "running run-batches.sh, the copy that set up this proof, not the changed $self (PROOF_RUNNER=new runs that)" > /dev/null
  else cp "$self" "$DIR/run-batches.sh" || exit 4; fi
  exec bash "$DIR/run-batches.sh"
fi
[ ! -e "$DIR/all.done" ] || { mv -fT "$DIR/all.done" "$DIR/all.done.prev" && log "moved the earlier all.done to all.done.prev" > /dev/null; } \
  || refuse "could not move all.done to all.done.prev"
NODE=${NODE:-$(sed -n 's/^node \(.*\) v[0-9][^ ]*$/\1/p' "$DIR/revision.txt" 2> /dev/null)}; NODE=${NODE:-node}

# The inputs: every snapshot file but its run output, revision.txt, the running runner and the Node version. It fails
# loudly on any error, and unless every file found got exactly one hash line.
fingerprint() (
  set -o pipefail; cd "$DIR/tree" || exit 1
  find . \( -path ./tmp -o -path ./test-results -o -path ./playwright-report \) -prune -o -type f -print0 | LC_ALL=C sort -z > "$DIR/files.list" || exit 1
  n=$(tr -dc '\000' < "$DIR/files.list" | wc -c) && [ "$n" -gt 0 ] || { echo "fingerprint: no files under $DIR/tree" >&2; exit 1; }
  xargs -0 sha256sum -- < "$DIR/files.list" > "$DIR/files.sums" || exit 1
  [ "$(wc -l < "$DIR/files.sums")" -eq "$n" ] || { echo "fingerprint: $n files but $(wc -l < "$DIR/files.sums") hash lines" >&2; exit 1; }
  r=$(cd "$DIR" && sha256sum -- revision.txt) && v=$("$NODE" --version) && cat "$DIR/files.sums" && echo "$r" && echo "runner $(sum < "$self")" && echo "node $v"
)
check() {  # stops the proof with exit 3 unless the inputs hash as in hashes-before.txt; $1 says when
  local what; if fingerprint > "$DIR/hashes-now.txt" 2> "$DIR/hashes-now.err"; then cmp -s "$DIR/hashes-before.txt" "$DIR/hashes-now.txt" && return
    what="changed $1. These differ from hashes-before.txt:"$'\n'$(diff "$DIR/hashes-before.txt" "$DIR/hashes-now.txt" | sed -nE 's/^[<>] ([0-9a-f]{64} [ *])?/  /p' | LC_ALL=C sort -u)
  else what="could not be hashed $1:"$'\n'$(sed 's/^/  /' "$DIR/hashes-now.err"); fi
  { echo "ABORT $(date -Iseconds): the inputs $what"
    echo "The batch markers no longer prove the inputs unless they are restored byte for byte. If only the Node version changed,"
    echo "run this again with NODE=$(sed -n 's/^node \(.*\) v[0-9][^ ]*$/\1/p' "$DIR/revision.txt"); otherwise move $DIR aside for a fresh proof."; } > "$DIR/ABORTED"
  cat "$DIR/ABORTED" >&2
  log "ABORT: the inputs $(tr '\n' ' ' <<< "$what")" > /dev/null
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
stop() {  # ends the batch's process tree if it was launched (the trap may come before $child is set), logs $2, exits $1
  local c=$child; if [ -z "$c" ]; then set +u; c=$!; set -u; [ "$c" = "$prev" ] && c=; fi
  if [ -n "$c" ]; then [ "$cw" != - ] || read -r cw 2> /dev/null < "/proc/$c/winpid"
    { [ "$cw" != - ] && taskkill //T //F //PID "$cw" || kill "$c"; } > /dev/null 2>&1; wait "$c"; fi
  log "$2" > /dev/null; exit "$1"
}

if [ ! -f "$DIR/names.txt" ]; then   # setup; names.txt comes last, so a setup that broke off is refused above
  size=${BATCH_SIZE:-11}
  [[ $size =~ ^[1-9][0-9]*$ ]] || refuse "BATCH_SIZE must be a whole number above 0, not \"$size\""
  commit=$(git rev-parse --verify HEAD) || refuse "the checkout has no commit to prove"
  dirty=$( (set -o pipefail; { git -c core.safecrlf=false diff --no-renames --name-only -z HEAD -- && git ls-files -z --others --exclude-standard; } | tr '\0' '\n') ) \
    || refuse "git could not list the checkout's changes"
  dirty=$(grep -v '\.md$' <<< "$dirty")
  [ -z "$dirty" ] || refuse "the checkout has changes other than Markdown; commit them first: $(paste -sd' ' <<< "$dirty")"
  mkdir "$DIR/tree" && (set -o pipefail; git -c core.autocrlf=false archive --format=tar "$commit" | tar -x -C "$DIR/tree") \
    && cp -R node_modules "$DIR/tree/node_modules" || refuse "could not extract $commit and node_modules into $DIR/tree"
  cd "$DIR/tree" || exit 4
  nodepath=$(command -v "$NODE") && nodev=$("$NODE" --version) || refuse "NODE ($NODE) does not run"
  pw=$("$NODE" -e 'const l = require("./package-lock.json"); for (const n of ["playwright", "playwright-core"]) {
    const want = (l.packages?.["node_modules/" + n] ?? l.dependencies?.[n])?.version, got = require("./node_modules/" + n + "/package.json").version;
    console.log(n, got, want === got ? "ok" : "differs from the " + want + " that package-lock.json names") }') || refuse "could not read the copied Playwright versions"
  ! grep -q differs <<< "$pw" || refuse "the copied Playwright differs from package-lock.json: $(paste -sd';' <<< "$pw")"
  known=$(catalog)
  if [ -z "$known" ] || grep -qvxE '[^[:space:]]+' <<< "$known" || [ -n "$(LC_ALL=C sort <<< "$known" | uniq -d)" ]; then
    refuse "node tests/mutate.mjs @catalog gave no list of unique mutant names"
  fi
  awk -v n="$size" -v d="$DIR" '{ print > sprintf("%s/batch-%02d.txt", d, int((NR - 1) / n) + 1) }' <<< "$known"
  printf 'commit %s\nrunner %s\nnode %s %s\n%s\n' "$commit" "$(sum < "$self")" "$nodepath" "$nodev" "$(sed 's/ ok$//' <<< "$pw")" > "$DIR/revision.txt" \
    || refuse "could not write revision.txt"
  fingerprint > "$DIR/hashes-before.txt" 2> "$DIR/hashes-now.err" || refuse "could not hash the snapshot: $(paste -sd' ' "$DIR/hashes-now.err")"
  echo "$known" > "$DIR/names.txt" || refuse "could not write names.txt"
  lists=("$DIR"/batch-*.txt); log "setup: $(wc -l < "$DIR/names.txt") mutants in ${#lists[@]} batches, a snapshot of $commit"
fi
cd "$DIR/tree" || refuse "$DIR/tree is missing; move $DIR aside for a fresh proof"
[ -s "$DIR/hashes-before.txt" ] || refuse "$DIR has names.txt but no hashes-before.txt; move it aside for a fresh proof"
check "before this run (found by the check at its start, before any batch ran)"
if [ -f "$DIR/ABORTED" ]; then rm -f "$DIR/ABORTED"; log "the inputs match hashes-before.txt again, so ABORTED is removed"; fi
commit=$(sed -n 's/^commit //p' "$DIR/revision.txt")

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
  rm -f "$b.done"
  printf '%s\n' "${want[@]}" | grep -q '^[[:space:]]*$' && refuse "$n is empty or has a blank line"   # no names would run all
  mine || { log "stopped before $n: the proof lock $LOCK is no longer this runner's" >&2; exit 5; }
  runs "before $n" log
  log "$n start: ${#want[@]} mutants"
  # The trap comes first, and the batch's Windows pid goes into the lock: a signal ends its whole process tree, and a
  # runner that dies without its trap leaves a lock that names the batch while it lives on.
  set +u; prev=$!; set -u; child= cw=-
  trap 'stop 143 "$n stopped by a signal"' INT TERM HUP
  "$NODE" tests/mutate.mjs "${want[@]}" > "$b.log" 2>&1 & child=$!
  read -r cw 2> /dev/null < "/proc/$child/winpid"; own "$cw" || stop 5 "$n stopped: could not record its pid in $LOCK"
  wait "$child"; code=$?; trap - INT TERM HUP
  own - || { log "stopped after $n: could not update $LOCK" >&2; exit 5; }
  check "during $n (found by the check after it ran)"
  summary=$(grep -E '^control green \(' "$b.log" | tail -n 1)
  bad=$(cover <(printf '%s\n' "${want[@]}") <(verdicts "$b.log"))
  log "$n exit $code | ${summary:-no control green summary line}${bad:+ | not one verdict per name: $bad}"
  # Done only after a green control with one verdict per name. A red control (2) or a crash stays undone.
  if [ "$code" -gt 1 ] || [ -z "$summary" ] || [ -n "$bad" ]; then
    log "$n left undone; its log is $b.log"; [ "$code" -eq 2 ] && exit 2; exit 6
  fi
  printf 'list %s\ninputs %s\nlog %s\nexit %s\n%s\n' "$lsum" "$fsum" "$(sum < "$b.log")" "$code" "$summary" > "$b.done.tmp" \
    && mv -fT "$b.done.tmp" "$b.done" || refuse "could not write $b.done"
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
if since=$(git -C "$ROOT" -c core.safecrlf=false diff --name-only "$commit" HEAD -- 2> /dev/null); then since=$(grep -v '\.md$' <<< "$since" | paste -sd' ')
  since=${since:+"Note: the checkout's HEAD has changes other than Markdown since $commit: $since"}
else since="Note: git could not compare the checkout's HEAD with $commit."; fi
{ echo "$verdict"
  echo "$(date -Iseconds): $(wc -l < "$DIR/names.txt") mutants in ${#lists[@]} batches: $k killed, $s survived, $e errored, $f flagged"
  echo "inputs: the snapshot of commit $commit in $DIR/tree, hashes-before.txt (sha256 $fsum)"
  [ -z "$since" ] || echo "$since"
  if [ "$verdict" = CLEAN ]; then
    echo "Kills printed at the timing lines that docs/gates.md lists may be timing misses: audit them (F98-F100)."
  else
    echo "Batches with survivors, errored or flagged mutants:"; echo "$unclean"
    echo "An errored or flagged mutant often means a broken environment, such as a browser that crashed after the control:"
    echo "delete that batch's .done and run this again to rerun it. A survivor means a gate gap."
  fi; } > "$DIR/all.done.tmp" && mv -fT "$DIR/all.done.tmp" "$DIR/all.done" || refuse "could not write all.done"
log "all done: $verdict; $k killed, $s survived, $e errored, $f flagged" > /dev/null
cat "$DIR/all.done"
[ "$verdict" = CLEAN ] || exit 1
