# Review 4: integration (docs, comments and the proof runner)

## Target

Repository `animation`. The target is every change since review round 3's target, as integrated on `main`: `git diff df0dac7 5225ddb`, without round 3's own record (`docs/work/1_sentence-sequence/reviews/3_integration.md`), which the reviewers read as a reference.
- No executable code changed in this range. `index.html` and `scripts/` are unchanged. The `tests/` changes (`560ac55`) are comments plus the defect text of `hold-names-next-early`, which the mutation log only prints.
- The range holds round 3's docs pass (`daaffcc`, W26), the test-file comment fixes (`560ac55`), the AGENTS.md restructure (`f857227`, W27, and `b7d3130`, which moved the gates' proofs and bounds to the new `docs/gates.md`), the local rule and runner for the batched proof (`7616e58`, `5225ddb`), and plan and record updates (`c4b27cb`, `3efc2f6`, `6695ac6`, `1c06af4`, `5fe4386`, the owner's answers to F72 and F73 among them).
- The fleet canon block (`AGENTS.md:28–84`) is byte-identical at `df0dac7` and `5225ddb` (sha256 `d38205df`).
- The reviewed diff is `tmp/review-runs/wu1-round4/target.diff` (ignored; 11 files, 702 lines, sha256 `62bf852f`). It is `git diff df0dac7 5225ddb` without round 3's record, so the target is recoverable from those commits.
- Both reviewers read `5225ddb` in a clone at `tmp/review-runs/wu1-round4/tree-5225ddb/` (ignored), detached at `5225ddb` with no remote.
  - Its 45 tracked files hold the `5225ddb` blobs, but the working files have CRLF line endings, from the global `core.autocrlf=true`, where the primary checkout and round 3's clone have LF. The prompt's "byte for byte" holds for the text and its lines, not for those line endings; `git show` gave the reviewers the blobs' own bytes.
  - Its ignored `tmp/` held a copy of the diff and 83 copies of evidence: W25's status note and the 47 text files of `tmp/w25/`; the `npm test` log of `560ac55`'s code (`tmp/final/npmtest-1.log`); the broken and interrupted full proofs of `df0dac7` (`tmp/proof-wu1-r3/`); the running proof's runner, name lists, hashes, runner log and batch 0's log and done marker (`tmp/proof-final/`, copied at batch 1 of 12); W27's evidence (`tmp/w27/`); and the coordinator's comment-fix list, its two edit scripts and the gates move's block and diff (`tmp/coordinator/`).
- The full mutation proof of `560ac55`'s code was running in the primary checkout throughout both runs. Neither reviewer ran a test, a browser or a probe.

## Reviewers and coverage

Codex ran, and its report passed the runbook's checks.
- codex-cli 0.163.0, as in rounds 1–3, smoke-tested again first: from the clone, with the pinned model and effort, it returned `START` and the third message with the right lines (`tests/lib/messages.mjs:15` and `:9`), with no DLL markers.
- The runbook's diff form: `codex exec --model gpt-6-astra -c model_reasoning_effort=xhigh -c approval_policy=never --sandbox read-only --ephemeral -o …`, with the prompt as the argument and the diff on stdin. It ran from the clone, with the user config loaded (no `--ignore-user-config`), and no other `codex exec` was running.
- Model: the run header names `gpt-6-astra`, reasoning effort xhigh, approval never and sandbox read-only.
- DLL markers: the run produced neither `STATUS_DLL_INIT_FAILED` nor `-1073741502`. The stdout holds the pair once, inside a line of round 3's record that Codex printed while reading it.
- Run: 23 min 46 s (14:35 to 14:59), 259,194 tokens and 43 read-only commands.
  - All 43 were screened after the run: Windows PowerShell `Get-Content`, `Select-Object`, `ForEach-Object` and one SHA-256 computation over the clone's files that `hashes-before.txt` lists; `rg`; and git (`status`, `rev-parse`, `log`, `diff` and `show`) with `-c safe.directory=<clone>`, some with `GIT_CONFIG_NOSYSTEM` and `GIT_CONFIG_GLOBAL=NUL` in their own process.
  - Each ran in the clone with repo-relative paths. None ran npm, npx, Node, a test or a browser, and there were no MCP tool calls.
- One subagent spawn failed ("collab spawn failed", as in rounds 0–3), so no subagent contributed, as the report says.
- Citations: every finding cites a file and line. These citations outside the diff's hunks were checked against the clone, and all hold: `tests/hygiene.test.mjs:192` (settings files that `.gitignore` names are skipped), `tests/mutate.mjs:421–422` (the settings-hook mutants write `.claude/settings.json`), `:495` (mutants are picked by membership), `:538` (the summary line), `tmp/proof-final/batch-10.txt:9–11` (the settings-hook mutants), `tmp/w25/mutate-r3-window.log:13` (the 1-mutant rerun), `tmp/proof-wu1-r3/mutate-full.log:2075` (26 killed, 106 errored, 105 flagged) and `tmp/w25/identity-counts.txt:206` (31 values off by more than 1 level).

Claude ran, and its report passed the runbook's checks.
- Claude Code 2.1.308. The login check ran from a new empty folder outside every repo, with every tool off (`--tools=""`) and no MCP servers (`--strict-mcp-config`), and passed on the first attempt: `system/init` named the pin with empty `tools` and `mcp_servers`, stderr was empty, and `modelUsage` held only `claude-opus-5-5[1m]`.
- A permission smoke test (low effort, 14 fixed steps) ran first: reads inside the clone and `git log` and `git show` were allowed; every path of the primary checkout in every form (absolute, `..`, `git -C`, Glob and Grep), `~/.claude/settings.json` and `cat` were denied; a `general-purpose` subagent answered.
- The review: the runbook's diff form, with the prompt appended to the system prompt and the diff on stdin, from the clone. Tools Read, Glob, Grep, Task and Bash, with `git diff`, `git log` and `git show` allowed, `dontAsk`, a deny list for every other path of the primary checkout and for other folders, and no MCP servers.
- `modelUsage` held exactly `claude-opus-5-5[1m]`. 100 turns, $11.32, 32 min 53 s (14:35 to 15:08); stderr empty.
- 99 tool calls: 56 reads of 46 files, 29 greps, 3 globs and 11 git commands, every one inside the clone. Two were denied, as its report says: `git diff --no-index` and a `| head` pipe. It used no subagents.
- Citations outside the diff's hunks, checked against the clone, all hold: `tests/mutate.mjs:465` (each mutant's gate run loads the test files again), `tests/sequence.test.mjs:316–320` (a missed capture hold is retried with `LOOP_WAIT_MS`, 60 s), `tmp/proof-wu1-r3/mutate-full.log:2075`, `reviews/0_implementation.md:338` (F72's fix was to define "seamless" with the owner) and `reviews/3_integration.md:536` ("four of the fleet's five").

Both reviewers read only the clone. Its 129 files, the evidence included, had the same sha256 before and after both runs, and `git status` there was clean.

## Reports

### Codex (`gpt-6-astra`, effort xhigh), 2026-10-26

Redacted: nothing. The report is Codex's `-o` output, which held no credentials, session details, echoed prompt or transport chatter. Its headings are moved down two levels to fit this record; the text is unchanged.

#### Summary

**7 findings: 3 major, 4 minor.**

The R3 bounds mostly match the code, and the test changes do not alter execution. The batch runner has three gaps that can leave an incomplete or mixed-revision proof looking complete. The supplied batch lists themselves contain all 132 mutants exactly once; I found no evidence that this copied run has skipped one.

#### How I checked

I compared the committed diff, the earlier `AGENTS.md`, the move scripts and evidence, the plan and review records, and the relevant page, gate and mutation-runner code. I checked the copied logs against numerical claims and timing anchors.

I ran only read-only commands inside this clone. No tests, browsers or repository scripts ran, and no files changed. No subagent contributed; one dispatch failed before starting.

The working files have some CRLF differences; their normalized contents match the committed files. I used committed Git contents for change comparisons. I could not independently verify absent screenshots/render caches, the published artifact, the original owner messages, or proof progress beyond the copied snapshot.

All references below are at `5225ddb` unless qualified.

#### Findings

##### X1 — The fingerprint omits inputs that change the hygiene proof

**Major — new runner, `7616e58`.**  
Location: `docs/work/1_sentence-sequence/proof-batches.sh:15`.

The hash check excludes `.gitignore`, root tooling files, `.claude/settings*.json`, scripts reached through commands, and untracked files. The hygiene gate reads those inputs: `tests/hygiene.test.mjs:175–205` and `:213–235`.

A concrete failure:

- Batch 10 finishes, including its three settings-hook mutants (`tmp/proof-final/batch-10.txt:9–11`).
- `.claude/settings.json` is then added to `.gitignore`.
- Batch 11 passes the unchanged fingerprint and finishes.

The final tree now skips that settings file at `tests/hygiene.test.mjs:192`. The earlier settings-hook kills no longer prove the final tree: those mutants inject precisely that file (`tests/mutate.mjs:421–422`). Nevertheless, every recorded batch can look clean.

**Suggested fix:** fingerprint all actual proof inputs and their membership, including ignored/untracked inputs the gates read, or run against an immutable complete input snapshot.

##### X2 — Resume does not establish complete, unique mutant coverage

**Major — new runner, `7616e58`.**  
Location: `docs/work/1_sentence-sequence/proof-batches.sh:12–14`, `:29–36`.

The runner trusts whichever batch files exist and skips any file whose corresponding `.done` exists. Markers contain neither the batch-list digest nor the mutant identities. There is no final comparison with the full catalog.

For example, losing `batch-11.txt` before a resume makes the runner finish after the remaining lists, omitting 11 mutants. Replacing a completed list while retaining its marker silently skips its new names. Duplicate valid names also hide omissions because `tests/mutate.mjs:495` selects mutants by membership rather than checking uniqueness.

The supplied lists are correct; this is a defect in preserving that correctness during resume.

**Suggested fix:** freeze and validate a manifest containing every catalog name exactly once. Bind each marker to its list and input digests, and verify all expected verdicts before writing `all.done`.

##### X3 — Completed batches bypass input checks, and completion has no final check

**Major — new runner, `7616e58`.**  
Location: `docs/work/1_sentence-sequence/proof-batches.sh:14–15`, `:21–36`.

The `.done` shortcut precedes the fingerprint check. There is also no check after a batch or before final completion.

Once all markers exist, changing `index.html` and rerunning the script performs **no fingerprint check** and writes a fresh `all.done`. A change during the final batch likewise receives no later check. Changes to gate files during a batch can affect later child-process runs (`tests/mutate.mjs:457–479`).

**Suggested fix:** validate the baseline before accepting existing markers, after each batch, and before completion. An immutable snapshot would also prevent temporary changes between checks.

##### X4 — A historical log anchor was incorrectly advanced

**Minor — `b7d3130`, F100/F103.**  
Location: `docs/gates.md:158`.

The text says the R3 timeout was “printed as `:602`”. The actual copied log prints **`tests/sequence.test.mjs:597`** (`tmp/w25/mutate-r3.log:83`).

The move script advanced this historical number along with current code references (`tmp/coordinator/move-gates.mjs:20`). Current line 609 correctly identifies the wait; current line 602 is its enclosing call site. Neither changes what the old log printed.

A later timing-kill audit could search for or attribute the wrong recorded line.

**Suggested fix:** retain “printed as `:597` in the R3 log”, while keeping current references 609 and 624.

##### X5 — “Last” run claims and the current timing summary are stale

**Minor — `f857227`.**  
Location: `AGENTS.md:88`, `:92`, `:107`.

`AGENTS.md:88` says `npm test` last ran on October 22. The plan records the October 25 run on `560ac55`, and its log reports **48/48 in 266.0 s** (`docs/work/1_sentence-sequence/plan.md:217`; `tmp/final/npmtest-1.log:215`).

The claim that the illusion file takes **101.6–105.5 s “of each run”** also does not describe the supplied R3 runs: their phase durations are **100.9–103.6 s**; the later run took **128.9 s** (`tmp/w25/npmtest-1.log:96`, `npmtest-2.log:96`, `npmtest-3.log:96`; `tmp/final/npmtest-1.log:96`).

The “latest targeted run” of 34 mutants also omits the subsequent one-mutant rerun (`tmp/w25/mutate-r3-window.log:13`).

**Suggested fix:** date historical measurements explicitly, update the latest verification date, and call the 34-mutant run the main R3 targeted run rather than the latest one.

##### X6 — Short summaries retain claims the detailed bounds now qualify

**Minor — new plan notes and `b7d3130`; F98–F103.**  
Locations: `docs/work/1_sentence-sequence/plan.md:208–209`; `AGENTS.md:112`.

Three summaries overstate their evidence:

- “Timing misses take the error path” omits the CHECK paths explicitly retained in `docs/gates.md:151–159`.
- The identity summary says differences are one level, but **31 of 44,879 differing values exceed one level** (`tmp/w25/identity-counts.txt:206–207`). The corrected gate document preserves that exception at `docs/gates.md:37`.
- The new index says every particle renders alike “at every angle” and that the shipped render “equals” its layers. The gate samples listed views and allows a residual; it does not prove either literal universal claim (`docs/gates.md:29`, `:37`, `:124`, `:132`).

These summaries can give a reader a stronger acceptance claim than the detailed record supports.

**Suggested fix:** qualify the summaries with the sampled views, residual tolerance, timing exceptions and 31 larger differences.

##### X7 — Moving the gate block broke its lesson link

**Minor — `b7d3130`.**  
Location: `docs/gates.md:139`.

The relative target `docs/learning/lessons.md` now resolves from `docs/gates.md` to nonexistent `docs/docs/learning/lessons.md`. A reader following the unresolved β-bound decision gets a broken link.

**Suggested fix:** change the target to `learning/lessons.md`.

#### Answers

1. **R3 bounds and corrections:** Substantively carried out, with X4 and X6 exceptions. F96/F101 accurately describe the sampling window and its remaining gap (`docs/gates.md:160`; `tests/sequence.test.mjs:586–627`). F97 matches Play occurring after six Find landings (`docs/gates.md:134`; `tests/sequence.test.mjs:341–351`). F98–F100 accurately preserve timing CHECK paths, apart from the historical anchor. F102 correctly identifies unmutated duration bounds (`docs/gates.md:161`; `tests/mutate.mjs:291–292`). F103’s detailed identity counts, four comparisons of three shots, hold-start timing and post-tour reveal claims match the inspected code/logs. I found no other wrong anchor in the moved timing section.

2. **Test comments:** Yes: after removing comments, the changed test files retain the same code sequence, except the printed `hold-names-next-early` defect string at `tests/mutate.mjs:294`. Moving `logLength` across a comment does not change execution. I found no new incorrect test comment. In particular, the 31 identity exceptions and the cut-window limitation are now stated correctly (`tests/illusion.test.mjs:522–526`; `tests/sequence.test.mjs:581–594`).

3. **AGENTS restructure:** The committed fleet canon is byte-identical (`AGENTS.md:28–84`). The invariants, query contract and conventions remain unchanged at `AGENTS.md:119–136`; operating commands remain in its Gates section. The gate block moved verbatim from `f857227` except for 13 anchor substitutions, one of which caused X4. I found no lost current operating rule or contract. The mandatory pointer at `AGENTS.md:110` covers the relocated detail. The index overstatement, stale run claims and broken link are X5–X7.

4. **Plan and records:** The owner answers agree: F72 skipped, F73 kept, dated October 26 (`plan.md:173–176`; `reviews/0_implementation.md:452–453`). `README.md:19` explicitly describes the recorded-video seam, so it does not contradict those answers. The final proof and timing-kill audit correctly remain pending (`plan.md:213`). One historical description needs care: the old full-proof log did not simply end after 26 mutants—it recorded **26 killed, 106 errored and 105 flagged** after the environment failed (`tmp/proof-wu1-r3/mutate-full.log:2075`). It provides no clean full proof. Artifact publication remains unverified from the supplied materials.

5. **Runner and rule:** The supplied manifests cover **132 unique names**, and copied batch 0 reports **11 killed, zero survived/errored/flagged** (`tmp/proof-final/runner.log:6`). An ordinary mid-run exit-1 crash does not satisfy the completion condition: `control green` is printed only in the final mutation summary (`tests/mutate.mjs:538`). However, X1–X3 prevent reliable full-proof completion across changes or damaged resume state. The running copy’s comment at `tmp/proof-final/run-batches.sh:24–25` is stale: post-control environment failures can produce a done batch; the tracked correction at `proof-batches.sh:25–28` accurately says so. `all.done` means completion, not a clean verdict. **About nine hours is consistent with the copied timings**, but “at most about 50 minutes” is not an upper bound: batch 0 already took **3,288 s, or 54.8 minutes**.

#### Read outside the diff

Relevant unchanged ranges inspected include:

- `index.html:118–145`, `:780–879`, `:1040–1098`.
- `tests/mutate.mjs:425–539`.
- `tests/hygiene.test.mjs:175–235`.
- `tests/sequence.test.mjs:254–355`, `:558–649`, `:737–758`.
- `tests/illusion.test.mjs:633–725`.
- `tests/page.test.mjs:170–252`.
- `README.md:1–25`.
- `docs/work/1_sentence-sequence/reviews/3_integration.md:530–547`.

### Claude (`claude-opus-5-5[1m]`, effort max), 2026-10-26

Redacted: nothing. The report is the `result` field of the run's final event, unchanged.

**Summary**

- I found 10 problems: 1 major (C1) and 9 minor (C2–C10).
- Round 3's bounds and corrections (F96–F103) are carried out, and they match the code at `5225ddb`. Of the 15 file:line anchors in `docs/gates.md`, 14 are right; one historical "printed as" line number is wrong (C2).
- `560ac55` changes only comments, plus the defect text of `hold-names-next-early` and one code line that moved without changing.
- The move from AGENTS.md to `docs/gates.md` is word for word, except the header and the anchor lines. The fleet canon block is byte-identical to `df0dac7`'s.
- The weak spots:
  - the proof runner can write "all done" for a proof that did not run on the bytes it hashed;
  - AGENTS.md states stale run dates and timings, and its new one-line summaries say more than `docs/gates.md` supports;
  - a few statements in the local rule and the plan disagree with the logs.

**How I checked**

- **Read:**
  - the full target diff and round 3's record;
  - the plan, `docs/gates.md`, AGENTS.md outside the canon block, README.md, the lessons file, the defect register and the local rules;
  - the code each anchor names, in `tests/sequence.test.mjs`, `tests/illusion.test.mjs`, `tests/motion.test.mjs`, `tests/mutate.mjs`, `tests/hygiene.test.mjs` and `index.html`;
  - the evidence: `tmp/proof-final/` (every file), `tmp/proof-wu1-r3/`, R3's mutation and `npm test` logs, `extract.log`, `identity-counts.txt`, `tmp/final/npmtest-1.log`, `tmp/coordinator/` and W27's token check (`tmp/w27/tokens.txt`).
- **Git:**
  - I read each commit's diff separately: W26's (`daaffcc`) and W27's (`f857227`) changes to AGENTS.md, and `5225ddb`.
  - I compared the file before the move with the file after it: `git diff --numstat f857227:AGENTS.md b7d3130:docs/gates.md` shows 10 lines of `docs/gates.md` differ.
  - Two commands were denied: `git diff --no-index` and a `| head` pipe.
- No subagents. I ran no tests, no `node` and no browser.
- **Could not check:**
  - That `hashes-before.txt` matches `560ac55`'s bytes, because I can't hash files. I only confirmed it equals `df0dac7`'s list except in the 4 files `560ac55` changed.
  - Untracked files in the main checkout.
  - The earlier workers' logs (R1a–R2b) behind the figures W27 moved. I spot-checked 7 of its citations to the review records, and all held.
  - The first runner's batch log from 2026-10-25, which was overwritten.
  - What caused the browser crash on 2026-10-22.

**Findings**

**C1 — major — the proof runner can mark a proof done that did not run on the hashed bytes** (new, `7616e58` and `5225ddb`)
- **Where:** `docs/work/1_sentence-sequence/proof-batches.sh:14–18`, `:21`, `:29–30`, `:36`. The copy that runs has the same code at `tmp/proof-final/run-batches.sh:13–17`, `:26–27`, `:33`. The rule is `docs/policies/local-rules.md:6`.
- **The gap:**
  - The hash check runs only before a batch starts. Nothing checks again after a batch, before it writes the `.done` marker, or before it writes `all.done`.
  - A `.done` marker holds only "exit N | summary". It records neither the hashes nor the batch's list of mutants.
  - Each mutant's gate run re-reads the test files (`tests/mutate.mjs:465`). So an edit made during a batch reaches the rest of that batch's mutants.
- **Scenarios:**
  1. Someone commits a change to `tests/` while batch k runs.
     - Commits do land during the proof here: `b7d3130` (12:48) and `7616e58` (12:50) during batch 0, which ran 12:46–13:40; `5fe4386` and `5225ddb` during batch 1. `560ac55` landed 77 s before the first runner started (`runner.log:1`).
     - Batch k still gets its `.done`. Batch k+1 then aborts with "code or tests changed before batch-(k+1)", which points at the wrong batch.
     - The session reverts the change, or regenerates `hashes-before.txt`, and reruns. Batch k is then skipped for good, and `all.done` is written.
  2. A change made during the last batch is never detected.
  3. Once every batch is done, a rerun skips every check (line 14 comes before line 15) and writes a fresh `all.done`, whatever has changed since.
  4. If the name lists are split again, as on 2026-10-26 (`runner.log:3`), any `.done` file left from the old split skips different mutants.
- **Fix:**
  - Hash again after each batch, and write `.done` only if nothing changed.
  - Store the hash list's sha256 and the batch's list in each `.done`, and skip a batch only when both match.
  - Check once more before writing `all.done`.
  - Make the ABORT message say the change happened during or before the previous batch, and that every `.done` must be deleted unless the change is reverted byte for byte.

**C2 — minor — `docs/gates.md:158` misstates what R3's log printed** (`b7d3130`, F100)
- **What's wrong:** It says R3's `reduced-switch-glides-on` kill was "printed as `:602`". R3's run printed `tests/sequence.test.mjs:597` (`tmp/w25/mutate-r3.log:83`), as W26's text said. `tmp/coordinator/move-gates.mjs:20` shifted 597 to 602 as if it were a code anchor. `:602` is what a run on `560ac55`'s code prints, not what R3's run printed.
- **Scenario:** a session checks the bound against R3's evidence, finds no `:602` in the log, and concludes the bound or the log is wrong.
- **Fix:** write "printed as `:597` in R3's run (`:602` at `560ac55`'s line numbers)".

**C3 — minor — AGENTS.md's run dates and timings are stale** (`f857227`, kept by `b7d3130`)
- **The date:** `AGENTS.md:88` says `npm test` last ran on 2026-10-22.
  - It ran on 2026-10-25 on `560ac55`'s code: 48 passed in 266.0 s (`tmp/final/npmtest-1.log:215`; `plan.md:217`). That was before W27's commit at 21:26.
  - Batch 0 of the final proof re-ran mutants R3 touched, such as `reveal-extra-text-pass`, on 2026-10-26 (`batch-00.log:19`).
- **The illusion time:** `:92` "The illusion file takes 101.6–105.5 s of each run" now reads as R3's figure.
  - At `df0dac7` it was part of the sentence about R1b, and no copied log holds that range.
  - R3's three runs took 100.9–103.6 s (`tmp/w25/extract.log:2`). The 2026-10-25 run took 128.9 s (`npmtest-1.log:96`).
- **The last phase:** it is given only "after R2a" (41.8–42.1 s). R3's runs took 43.8–44.0 s, and the 2026-10-25 run 47.2 s (`:213`).
- **Scenario:** a session compares a 266 s run with "about 3.9 minutes" and chases a regression that is only machine load. Or it believes `npm test` never ran on the comment-fixed code.
- **Fix:** state the 2026-10-25 run and its phase times (128.9, 89.9 and 47.2 s), and R3's phase ranges from `extract.log:2`.

**C4 — minor — rules for judging a proof, or for changing the page's behaviour, now sit only in `docs/gates.md`** (`b7d3130`; F98–F100, F102)
- **The caveat that moved out:**
  - `AGENTS.md:104` says "A mutant counts as killed only by a CHECK."
  - After W26's pass (`daaffcc`), AGENTS.md also warned that a CHECK at one of the timing lines may be a timing miss. Only `docs/gates.md:159` says that now.
- **The pointer misses these cases:** `AGENTS.md:110` sends a session to `docs/gates.md` "before changing a test, a threshold, a mutant or how the page draws". That does not cover:
  - running or auditing a proof, which is exactly the plan's next step (`plan.md:213`);
  - changing the sequence, input or capture code.
- **Rules a session needs for those changes:**
  - `gates.md:161`: no mutant shortens a hold, and the 2.5 s bound passes a 2.6 s hold.
  - `gates.md:56`: a change that redraws the cloud moves every seed-mean threshold; re-measure, never retune.
- **Scenarios:**
  - The session doing the plan's audit reads only AGENTS.md and the local rule. It counts every CHECK as a kill, and reports the proof clean although a kill printed at `:283` or `:754` was a timing miss.
  - A session sets `HOLD_MS` to 2600, sees `npm test` green, and thinks the hold length was checked.
- **Fix:**
  - Add one line to `AGENTS.md:104`: a CHECK at a timing line listed in `docs/gates.md` may be a timing miss, so read its message.
  - Widen `:110` to "before changing the page or a gate, and before judging a mutation run".

**C5 — minor — AGENTS.md's one-line summaries claim more than `docs/gates.md` supports** (new, `b7d3130`)
- **Where:** `AGENTS.md:112` and `:116`. Each item below gives the summary's claim, then what `docs/gates.md` supports:
  - "each message is legible": `gates.md:124` says the image gates "measure light, colour and shape, not whether a person can read the text".
  - "every particle renders alike at every angle": `gates.md:29` measures 12 views, and `:132` says a reveal between them passes.
  - "the shipped render equals its test-only layers": `gates.md:37` says it matches within 0.1%, with 7–623 channel values a frame differing.
  - "with pictures at their holds": `gates.md:92` and `:134` say only capture's first pass and the face's hold in the tour and in Play are pictured.
- **Scenario:** AGENTS.md loads into every session and `docs/gates.md` does not. A session trusts a green `npm test` for a change whose effect shows only 5–10° from an eye.
- **Fix:** write "alike at the 12 views measured", "within 0.1%", and "at the holds listed in `docs/gates.md`".

**C6 — minor — broken link at `docs/gates.md:139`** (`b7d3130`)
- **What's wrong:** `[docs/learning/lessons.md](docs/learning/lessons.md)` was moved word for word from the repo root. From `docs/` it points at `docs/docs/learning/lessons.md`, which does not exist. Line 3's `../AGENTS.md` shows the move did account for the new folder elsewhere.
- **Scenario:** a reader following the β lesson gets a dead link and may think the lesson was removed.
- **Fix:** link to `learning/lessons.md`.

**C7 — minor — the local rule and the plan misdescribe the past failures, and omit the check the runner asks for** (`7616e58`, `5fe4386`, `5225ddb`)
- **The time lost:** `local-rules.md:6` says "a batch loses at most about 50 minutes". Batch 0 took 3,288 s, 54.8 min (`runner.log:5–6`).
- **The 2026-10-22 run:**
  - The rule says session ends "killed three full proofs". The plan says of the 2026-10-22 run that a session end "stopped it … after 26" (`plan.md:214`).
  - The log shows something else. A browser crashed ("Target crashed") at the 27th mutant (`mutate-full.log:302–311`). The next 105 mutants errored in 0 s each (from `:326`). The proof process itself ran on to its summary: 26 killed, 106 errored, 105 flagged, 7,205 s (`:2075`).
- **Why it matters:** in exactly that failure mode, the runner marks the batch done (`proof-batches.sh:25–30`).
  - Only the runner's comment says to read every batch's summary and delete such a `.done`.
  - The rule doesn't, and the plan's audit step (`plan.md:213`) covers only kills at timing lines.
- **The running copy:** `tmp/proof-final/run-batches.sh:24–25` still says a batch where every test fails at once is left for a rerun. Its code does not do that; `5225ddb` fixed only the committed copy.
- **Scenario:**
  1. A session end breaks the browsers mid-batch, and that batch is marked done with mutants that no gate judged.
  2. The next batch's control fails, and the runner stops.
  3. The next session reruns: the broken batch is skipped, `all.done` appears, and an audit of timing-line kills finds nothing wrong.
- **Fix:**
  - In the rule and at `plan.md:213`, say the proof is clean only if every `.done` says exit 0, and that any batch showing errored or flagged mutants must be rerun.
  - Change "about 50 minutes" to "about 55".
  - Describe the 2026-10-22 run as a browser crash after 26 mutants.

**C8 — minor — the hash list and the runner's guards miss inputs and cases** (new, `7616e58`)
- **Inputs the hash list misses:**
  - The hygiene check reads the disk, not git (`tests/hygiene.test.mjs:176–192`), and tree mutants copy the working tree (`tests/mutate.mjs:444–455`). So both see untracked files under `scripts/` and `tests/`, code files at the root, `.gitignore` and `.claude/settings*.json`.
  - The hash list (`git ls-files` of `index.html`, `scripts`, `tests`, `package.json` and `package-lock.json`, `proof-batches.sh:15`) covers none of those, nor `node_modules`.
- **Cases the runner doesn't guard:**
  - An empty or blank batch list makes `mutate.mjs` run all 132 mutants inside that batch (`mutate.mjs:492–495`), which is then marked done.
  - There is no lock against a second runner. The 2026-10-25 run was a hidden process (`runner.log:3`). A second runner would double the load that the timing bounds are sensitive to, and both would write the same log.
  - The committed copy can't run where it sits: line 8's `../..` lands in `docs/`. Its header gives no commands for building the name lists or `hashes-before.txt`, whose format must match line 15 exactly.
- **Scenario:** a session adds an untracked helper under `scripts/`, or edits `.gitignore`, during a tree batch; the tree mutants then scan files the hash list never covered.
- **Fix:**
  - Hash the output of `git ls-files --cached --others --exclude-standard` over those paths, plus `.gitignore` and `.claude/`.
  - Refuse an empty list.
  - Add a pid lock.
  - `cd` to the git root.
  - Put the set-up commands in the header.

**C9 — minor — `plan.md:209` repeats the identity over-claim that F103 corrected** (`c4b27cb`, F103)
- **What's wrong:** it says the shipped render "differs by one level in 7–623 values a frame". R3's own count has 31 of the 44,879 differing values off by more than one level, in rows 756–769 (`tmp/w25/identity-counts.txt:206–207`). `tests/illusion.test.mjs:522–524` and `gates.md:37` now say so.
- **Scenario:** the Outcome copies the plan's line.
- **Fix:** add "but for 31 values off by more, under the hint".

**C10 — minor — acceptance criterion 5 is left at odds with the owner's answer to F72** (`5fe4386`, F72)
- **What's wrong:**
  - `plan.md:73` still requires that capture mode "loops the sequence seamlessly".
  - F72 found "seamless" undefined; its fix was to define it with the owner (`reviews/0_implementation.md:338`).
  - The owner skipped F72 on 2026-10-26 (`plan.md:175`; `reviews/0_implementation.md:452`). `README.md:19` says one recorded pass jumps when played as a loop.
  - `plan.md:219` will check every acceptance criterion.
- **Scenario:** the coordinator either ticks criterion 5 for the camera's loop, or leaves it unmet because a recording jumps. Either way the owner's reading is not written down.
- **Fix:** reword it to "loops the camera path without a break (one recorded pass jumps where it repeats; F72, skipped by the owner on 2026-10-26)".

**Answers**

1. **Round 3's bounds and corrections (F96–F103).**
   - **Anchors:** the bounds at `gates.md:150–161` match the code. All 15 anchors point at the lines they describe, except C2's historical "printed as". I checked them against:
     - `tests/sequence.test.mjs`: `:283`, `:465`, `:576`, `:609`, `:624`, `:627`, `:641`/`:649` and `:749`/`:754`;
     - `tests/illusion.test.mjs:672` and `:721`;
     - `tests/motion.test.mjs:98–99`;
     - `index.html:118`, `:824–876` and `:1060–1077`.
   - **Figures:** they match the logs.
     - The fewest frames in the window: 12, at capture mode's switch in the third run, against 29–60 in the other cases (`npmtest-1..3.log:117–120`).
     - The start-view hold took 1.49, 1.49 and 1.50 s.
     - `hold-names-next-early`'s frames came up to 248–266 ms after the first one that named the next message (`mutate-r3.log:197–199`).
   - **Small overreach:** F98's "a capture hold that no poll sees" holds for the first five holds only. A missed hold at "world" goes to the retry, which waits 60 s (`sequence.test.mjs:316–320`).
   - **F97:** stated at `gates.md:134` and `defect-register.md:96` and `:123`.
   - **F103:** all eight items are done.
   - **One deviation from round 3's record:** it said test comments change only after the full proof. `560ac55` changed them before the final proof, which now runs on that code. `plan.md:217` records this but gives no reason. The kill audits F98–F100 call for are still pending (`plan.md:213`).
2. **The test-file comments (`560ac55`).**
   - **What changed:** comments only, plus the defect text at `tests/mutate.mjs:294` and the `logLength` line moving above its neighbour's comment (`sequence.test.mjs:235`). The defect text is only printed (`mutate.mjs:503`).
   - **The fix list:** every item in `tmp/coordinator/wu1-final-comment-fixes.md` was applied.
   - **Correctness:** I found no new or changed comment that is wrong or at odds with `docs/gates.md`.
3. **The AGENTS.md restructure (`f857227`, `b7d3130`).**
   - **The move:** word for word, except 10 lines: the 3 header lines and the 7 lines whose 13 anchors changed. 12 of those 13 shifts are right; the 13th is C2.
   - **W27's cuts:** the dropped facts trace to the plan or the review records (spot-checked: `reviews/2_integration.md:396`, `:474`, `:476`, `:477`, `:484`; `reviews/1_integration.md:186`, `:207`). The exception is the illusion time's provenance (C3).
   - **Facts stated two ways:** no outright contradictions. The plan's R2a note says "26 named mutants, 12 of them new" (`plan.md:184`), and W27's moved note says "the 11 new mutants and the 13" (`:190`). They agree only if the 26 counts runs (24 mutants plus 2 reruns).
   - **Summaries and rules:** the one-line summaries overclaim (C5), and some rules now live only in `docs/gates.md` (C4). The hygiene check's rules also moved there, but that gate enforces them itself.
   - **Canon block:** byte-identical. The diff starts at `AGENTS.md:88`, and the markers are at `:28` and `:84`.
   - **Dates, counts and timings:** the counts hold (132 = 109 + 23); the "last ran" date and the phase times are stale (C3).
4. **The plan and the records.**
   - **The plan's notes:** they match the commits and the logs: `daaffcc` on 2026-10-22, `560ac55` on 2026-10-25, R3's 8,149 s with 34 killed, the 266.0 s `npm test`, and the runner since 12:46:08. The exceptions are C9 and `plan.md:214` (C7).
   - **F72 and F73:** recorded the same way at `plan.md:173–176` and `reviews/0_implementation.md:452–453`: F72 skipped, F73 kept, 2026-10-26. `README.md:19` agrees; criterion 5 does not (C10).
   - **Gaps:** the plan has no step for the condensing or for the move to `docs/gates.md`, and `:216` still places the F96–F103 docs "in AGENTS.md".
   - **Outside the target:** round 3's record says "four of the fleet's five are left unused" (`3_integration.md:536`) but "Repair rounds used: 3 of 5" (`:570`).
5. **The proof runner and its rule.**
   - **What works:** a batch counts as done only once `mutate.mjs` has printed its final summary (the only "control green" line, `mutate.mjs:538`) and exited 0 or 1. A crash, a killed process or an unknown name (`:494`) leaves the batch undone.
   - **The lists:** the 12 lists cover all 132 names exactly once, in order, with no carriage returns.
   - **The hash list:** it equals `df0dac7`'s except for the 4 files `560ac55` changed.
   - **Defects:** C1, C7 and C8.
   - **Timing:** "about 9 hours" is consistent with the logs: batch 0 took 3,288 s for 11 page mutants, which projects to about 9.1 h for all 12 batches. "At most about 50 minutes" per batch is low: batch 0 took 54.8 min.

**Read outside the diff**

- **Tests:**
  - `tests/sequence.test.mjs:117–240`, `:245–423`, `:425–576`, `:586–759`
  - `tests/illusion.test.mjs:630–725`
  - `tests/motion.test.mjs:13–170`
  - `tests/mutate.mjs:1–70`, `:420–539`
  - `tests/lib/phases.mjs:1–19`
  - `tests/hygiene.test.mjs:4–192` (search hits)
- **Page:** `index.html:112–123`, `:820–929`, `:1040–1100`
- **Docs:**
  - `README.md:1–25`
  - `AGENTS.md:84–119`
  - `docs/learning/defect-register.md:84–131`
  - `docs/learning/lessons.md:1–11`
  - `docs/work/1_sentence-sequence/plan.md:1–309`
  - `reviews/3_integration.md:1–570`
- **Evidence:**
  - all of `tmp/proof-final/`
  - `tmp/proof-wu1-r3/mutate-full.log:134–343`, `:2060–2075`
  - `tmp/w25/mutate-r3.log:25–231`
  - `tmp/w25/npmtest-1..3.log:96–122`, `:162–215`
  - `tmp/final/npmtest-1.log:85–219`
  - `tmp/w25/identity-counts.txt:200–208`
  - `tmp/coordinator/move-gates.mjs:1–65`
  - `tmp/w27/tokens.txt:1–491`

## Findings and disposition

The two lanes agree on most items. They differ on one severity: Codex rates the missing gate inputs in the runner's hash list major (X1), Claude minor (C8). The table keeps both.

None of the findings is against the owner's rule, and none is in `index.html`, `scripts/` or the test code: every one is in the docs, the test comments' records or the proof runner.

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F104 | Codex X2, X3 (major) and Claude C1 (major): the proof runner can report a proof done that did not run every mutant once on the hashed inputs. It checks the hashes only before a batch, and only for batches not yet done; a done marker records neither its list nor the hashes; nothing checks after a batch or before `all.done`, nor that the lists cover the catalog exactly once. | Accepted. The proof now running uses the runner as of `7616e58` (`tmp/proof-final/run-batches.sh`), which must not change while it runs, so the coordinator checks that run by hand: its 12 lists hold the 132 names of the catalog once each (checked at batch 3), and after its last batch the inputs are hashed again and every name must have exactly one verdict. | Runner repair (W28): the inputs are checked at start, after each batch and before `all.done`; each marker holds its list's and the inputs' digests; the lists must cover the catalog once; every name needs exactly one verdict. |
| F105 | Codex X1 (major) and Claude C8 (minor): the runner's hash list misses gate inputs: untracked files under `scripts/` and `tests/`, root code files, `.gitignore`, `.claude/settings*.json` and the toolchain. | Accepted. For the running proof none of those inputs exists or changed: there are no root code files and no `.claude/settings*.json`, `.gitignore` last changed on 2026-10-10, and the only untracked file is the devlog draft, which is Markdown. The final check repeats this. | Runner repair (W28): hash every file git lists as tracked, or as untracked and not ignored, except Markdown, which no gate reads, plus Node's and Playwright's versions. |
| F106 | Claude C8 (minor): an empty list runs all 132 mutants in one batch; no lock stops a second runner; the committed copy cannot run where it sits, and its setup was by hand. | Accepted. | Runner repair (W28): empty lists are refused, a pid lock, and one command that copies the runner into `tmp/proof-final/`, runs that copy and sets up the lists and hashes. |
| F107 | Codex X4 and Claude C2 (minor): `docs/gates.md:158` says R3's log printed `:602`, but it printed `:597`. The move's script shifted a number from a log as if it were a code anchor. | Accepted. | Corrected: R3's log printed `:597`, the call that encloses the wait, which is `:602` at today's lines. |
| F108 | Codex X5 and Claude C3 (minor): AGENTS.md's "last ran" date and phase times are stale. Its 101.6–105.5 s for the illusion file predates R3, whose runs took 100.9–103.6 s, and the run on `560ac55`'s code took 266.0 s. It also calls R3's 34-mutant run the latest, though a 1-mutant run followed. | Accepted. | Corrected in AGENTS.md's Gates section, whose run dates change again once the proof ends. |
| F109 | Codex X6 and Claude C5, C9 (minor): one-line summaries claim more than the detail. AGENTS.md's index says each message is "legible", every particle renders alike "at every angle", the shipped render "equals" its layers, and the holds are pictured; the plan's R3 notes say timing misses take the error path and the identity differs by one level. | Accepted. | Corrected: contrast at each eye, alike at each view measured, a match within a 0.1% residual, the misses that still end in a check, and the 31 values off by more than one level. |
| F110 | Codex X7 and Claude C6 (minor): the link at `docs/gates.md:139` still pointed from the repo root. | Accepted. | Corrected to `learning/lessons.md`. |
| F111 | Claude C4 (minor): AGENTS.md no longer says that a CHECK at a timing line may be a timing miss, and its pointer to `docs/gates.md` covers neither judging a proof nor changing the sequence code. | Accepted. | Corrected: a line in the mutation-proof bullet, and the pointer now says to read `docs/gates.md` before changing the page or a gate and before judging a mutation run. |
| F112 | Claude C7 (minor), with Codex's answers 4 and 5: the local rule and the plan misdescribe the proofs that failed. On 2026-10-22 the browsers crashed at the 27th mutant and the process ran on to its summary: 26 killed, 106 errored, 105 flagged. A batch takes about 55 minutes, not 50. Neither says a proof is clean only when every batch exited 0. The running copy's comment is the old one. | Accepted. The running copy stays as it is until the proof ends. | Corrected in the plan; the local rule is rewritten with the repaired runner. |
| F113 | Claude C10 (minor): acceptance criterion 5 still says capture mode "loops the sequence seamlessly", though the owner skipped F72, which found "seamless" undefined. | Accepted. | The criterion now says what it means after F72: the camera's path repeats without a break, and one recorded pass, played as a video loop, still jumps where it starts again. |
| F114 | Claude's answers (minor): F98's bound holds for capture's first five holds only, since a missed hold at "world" goes to the 60 s retry; the plan's R2a note counts 12 new mutants, where 11 were new (24 mutants, 2 of them run again); the plan had no steps for the AGENTS.md restructure and still placed the F96–F103 docs in AGENTS.md; round 3's record says four of the five repair rounds are left, where two are; and the plan gave no reason why the comment fixes came before the proof. | Accepted. | Corrected in `docs/gates.md`, the plan and round 3's record. |

## Verification

- The review driver checked provenance and isolation, as above: Codex 0.163.0 on the pin at xhigh, read-only, with no DLL failure; Claude 2.1.308 with `modelUsage` exactly the pin; both inside a clone detached at `5225ddb`, unchanged after both runs.
- The coordinator checked each finding against the files before accepting it, among them the R3 log line (`:597`), the phase times in R3's three logs and the 2026-10-25 log, the catalog against the 12 batch lists (132 names, each once), the old full proof's summary (26 killed, 106 errored, 105 flagged; 105 with 0 green tests) and R2a's mutant counts (116 mutants before R2a and 127 after).
- Not checked: the published artifact and the owner's own words, which neither reviewer could read.

## Round outcome

Changes requested: four in the proof runner (F104–F106 and its part of F112) and the rest in the docs. None is against the owner's rule, and the page and the gates' code are unchanged. Repair round 4 makes them: the docs by the coordinator, the runner by W28. Its runner change gets a focused re-review. Repair rounds used: 4 of 5.

## Focused re-review of the repairs

### Target

Round 4's repairs as integrated on `main`: `git diff 5225ddb 70f4ebb`, without this record. That is `a6efa30`, the coordinator's docs fixes for F107–F114, and `70f4ebb`, W28's rewrite of the proof runner for F104–F106 with the local rule (F112). `index.html`, `scripts/` and `tests/` are unchanged in this range.
- The reviewed diff is `tmp/review-runs/wu1-round4b/target.diff` (ignored; 6 files, 320 lines, sha256 `9c3125bc`), recoverable from those commits.
- Both reviewers read a clone at `tmp/review-runs/wu1-round4b/tree-70f4ebb/` (ignored), detached at `70f4ebb` with no remote and, this time, LF working files as committed (`core.autocrlf=false`). Its 65 files, 19 copies of evidence among them, had the same sha256 before and after both runs, and `git status` there was clean.
- The evidence: W28's test script, its log (76 cases against the runner's exact bytes, sha256 `df44c275`), its stub of `tests/mutate.mjs` and its signal probe; and the running proof's runner copy, name lists, hashes, revision, runner log and batches 0–3's logs and markers.

### Reviewers and coverage

- Codex 0.163.0, the same command form, model header and smoke test as above. 12 min 50 s (16:37 to 16:50), 169,053 tokens and 23 read-only commands: PowerShell `Get-Content` and `ForEach-Object`, `rg`, and git with `-c safe.directory=<clone>`, all in the clone. The scanner's one alert was a false match, an `rg` pattern naming `launch(` and `PLAYWRIGHT`. No DLL markers but the one inside a quoted line of this record. One subagent spawn failed, so none contributed.
- Claude 2.1.308, the same flags, with a fresh login check and permission smoke test, both passed. `modelUsage` held exactly `claude-opus-5-5[1m]`; 46 turns, $5.54, 23 min 24 s (16:37 to 17:01); 45 tool calls, all in the clone. A `| head` pipe was denied. Read-only git commands outside the allow list ran there (`git ls-files`, `git grep`, `git cat-file`), which Claude Code treats as read-only; each read only the clone's own history. No subagents.
- Citations outside the diff's hunks, checked against the clone, hold: `tests/mutate.mjs:34` (mutants go to `tmp/mutants`) and `:444` (`TREE_SKIP` names only root-level folders), `tests/hygiene.test.mjs:175–183` (the walk skips only `node_modules`), `tests/sequence.test.mjs:135` (`LOOP_WAIT_MS`), `docs/work/.gitattributes:1` (`* -text`), `tmp/proof-final/revision.txt:1` (a bare hash, so the new runner refuses the folder), `tmp/w28/test.sh:176` and `tmp/w28/probe-kill.log:4` (the old design's child lived on after a kill).

### Reports

#### Codex (`gpt-6-astra`, effort xhigh), 2026-10-26

Redacted: nothing. The report is Codex's `-o` output, unchanged.

**Summary**

**8 findings: 6 major, 2 minor. Changes requested.**

The runner repairs several ordinary resume failures, but can still report CLEAN with incomplete coverage or unrecorded inputs. Its locking and interruption handling can also admit overlapping proofs. Most documentation repairs are correct; F108’s stale date remains.

The supplied old proof folder is correctly refused before its files are rewritten.

**How I checked**

I read the diff, both round 4 reports and dispositions, the runner, W28’s tests and stub, the copied proof evidence, and the relevant gate code and documentation. I traced failure scenarios without executing them.

The runner’s SHA-256 matches W28’s recorded value: `df44c2752709fa8986a4d826e0cd7f43d2f43174a39cb1419b73d5b6595adc11`. Git confirms `index.html`, `scripts/` and `tests/` are unchanged across the target range. The checkout remained clean.

No tests, repository scripts or browsers ran. No files changed. One subagent dispatch failed before starting; no subagent contributed. The original R3 logs and W28’s `fixture/names.txt` are absent from this clone, so I could not independently check their historical measurements or fixture contents.

Below, `runner` means `docs/work/1_sentence-sequence/proof-batches.sh`. All line references are at `70f4ebb`.

**Findings**

**X1 — The catalog can shrink during a run and still finish CLEAN**

- **Location:** `runner:87–94`, `runner:99`, `runner:124–132`.
- **Severity:** major.
- **Concerns:** F104.

While batch 01 runs, remove `powershell-quoted-switch-opener` from both `names.txt` and the future `batch-12.txt`. These ignored files are outside the fingerprint.

The initial catalog comparison has already passed. Batch 12 subsequently reads its shortened list and runs ten mutants. Completion compares the logs against the shortened `names.txt`, so it can write **CLEAN, 131 mutants** and exit 0. The actual catalog still contains 132.

W28’s mid-run list tests cover an emptied list and a moved name, but not coordinated removal from the manifest and a future list (`tmp/w28/test.sh:248–256`).

**Suggested fix:** retain the validated catalog independently of mutable proof files, compare final coverage against it, and revalidate lists and marker bindings before publishing completion.

**X2 — The PID file is not an exclusive lock**

- **Location:** `runner:32–38`.
- **Severity:** major.
- **Concerns:** F106.

Two starters can both read an absent PID file. Let A write its PID, copy and re-execute the runner, pass its second lock check, and begin work while B is delayed after its initial read. B then writes its PID, overwrites A’s running script copy and starts another proof.

Both can write the same logs and mutant files. Either runner’s EXIT trap also removes the other’s PID file.

Separate `PROOF_DIR` values avoid even this race: each gets its own lock, although both processes use the same `tmp/mutants` paths (`tests/mutate.mjs:34`, `:435–454`).

The test starts the second runner only after the first batch has begun, so it misses acquisition races (`tmp/w28/test.sh:175–186`).

**Suggested fix:** use an atomic, repository-wide lock covering the shared mutant workspace. Release it only when its ownership token still matches.

**X3 — A hashing failure can silently remove all file protection**

- **Location:** `runner:15`, `runner:42–48`, `runner:76`.
- **Severity:** major.
- **Concerns:** F105; new failure in the expanded fingerprint.

Put a harmless root code file named `--broken.mjs` in the tree before starting. Git lists that name without a `./` prefix. `xargs` passes it to `sha256sum` without `--`, so it is interpreted as an unknown option.

The error is suppressed, the pipeline’s failure is ignored, and the following Node command succeeds. For this small repository, the fingerprint can therefore contain only the three version lines.

After a completed proof, changing `index.html` and resuming can then retain the same fingerprint, skip every batch, and report CLEAN. Git enumeration failures and fingerprint-output failures are likewise not explicitly rejected.

**Suggested fix:** pass `--` to `sha256sum`; explicitly reject failures in enumeration, hashing, version collection and output writing. Never accept a partial fingerprint.

**X4 — Git-ignored files can still be hygiene inputs**

- **Location:** `runner:43`; `tests/hygiene.test.mjs:175–192`, `:213–239`; `docs/policies/local-rules.md:8`.
- **Severity:** major.
- **Concerns:** F105 and F112.

Suppose `.git/info/exclude` excludes `scripts/local-helper.mjs`. The runner never hashes that untracked file, but the hygiene gate scans it regardless of Git’s ignore rules. Tree mutants copy it too (`tests/mutate.mjs:444–453`).

Change the helper after the hygiene batches finish, then resume. The fingerprint still matches, completed batches are accepted, and CLEAN can describe a tree whose current hygiene inputs were never judged.

Settings have another mismatch: the gate skips only exact paths written in the root `.gitignore`; Git also applies wildcard, nested, local and global exclusions.

The repair implements the disposition’s requested Git command, but that command does not cover every actual input as the local rule claims.

**Suggested fix:** fingerprint the files the gates actually read, including relevant ignored files, or run from a complete frozen snapshot.

**X5 — An edit reverted within a batch escapes every check**

- **Location:** `runner:83`, `runner:107–110`, `runner:122`; `tests/mutate.mjs:465`, `:523`.
- **Severity:** major.
- **Concerns:** F104.

After a batch’s control passes, temporarily change a gate while subsequent mutants run, then restore its original bytes before the batch ends. Each mutant reloads the gate files, but the runner observes only the matching before/after fingerprints.

For example, a temporary failing assertion can supply a CHECK while other tests remain green. The batch can exit 0 and receive a marker tied to the original fingerprint, although some judgments used different tests.

The local prohibition on code changes reduces this risk operationally; the runner does not detect this sequence. W28 tests persistent mid-batch changes, not changes restored before the next check (`tmp/w28/test.sh:97–110`).

**Suggested fix:** execute against frozen inputs. If retaining endpoint checks, state their limitation explicitly instead of treating them as proof that inputs stayed unchanged throughout execution.

**X6 — Resume can overlap a surviving child after interruption**

- **Location:** `runner:32–38`, `runner:107–109`.
- **Severity:** major.
- **Concerns:** F106 and F112; new signal handling.

If only the Bash runner is forcibly terminated, such as with SIGKILL, its trap cannot run. The mutation process can remain active. A new invocation sees a dead runner PID and immediately starts another batch, using the same mutant files and log path.

For handled signals, the trap sends a signal only to `$child`, does not wait for its termination, and then releases the lock. It does not establish cleanup of the test subprocesses and browsers beneath it. A supported `NODE` wrapper that launches Node without `exec` adds another descendant the trap does not target.

W28’s signal test uses a single-process stub and checks that its log stops growing for four seconds; it does not test descendant cleanup or forced termination (`tmp/w28/test.sh:289–298`). The earlier probe records a surviving child, but is not a reproduction against the final runner (`tmp/w28/probe-kill.log:1–8`).

**Suggested fix:** track the owned process tree, stop and await it before releasing the lock, and refuse recovery while recorded children remain alive. On Windows, an owned Job Object is one possible mechanism.

**X7 — F108’s “last ran” date remains stale**

- **Location:** `AGENTS.md:88`, `AGENTS.md:92`.
- **Severity:** minor.
- **Concerns:** F108.

Line 88 still says `npm test` last ran on **2026-10-22**. Line 92 now records its **2026-10-25**, **266.0 s** run. A reader checking whether the final code was tested receives contradictory answers.

**Suggested fix:** give `npm test` its October 25 date separately from the October 22 mutant and screenshot runs.

**X8 — The advertised command does not work “from anywhere in the repo”**

- **Location:** `runner:3`; `tmp/w28/test.sh:240–246`.
- **Severity:** minor.
- **Concerns:** F106.

From `tests/`, the literal advertised command tries to open `tests/docs/work/1_sentence-sequence/proof-batches.sh` and fails before root discovery runs.

W28’s subdirectory test correctly uses `../$RUNNER`; it does not exercise the command printed in the header.

**Suggested fix:** say the printed command runs from the repository root, while an appropriate relative or absolute script path works elsewhere.

**Answers**

**1. Does the runner resolve F104–F106?**

Partly.

The ordinary protections are substantially improved:

- Catalog discovery reaches the usage error before mutation files or gates run (`tests/mutate.mjs:485–498`).
- Startup rejects missing, duplicate, extra and blank list entries (`runner:87–94`).
- Resume binds markers to list, input and log digests (`runner:99–102`).
- A real red control exits 2 and stays undone; incomplete verdict output also stays undone (`runner:111–119`; `tests/mutate.mjs:515–518`).
- Final accounting rejects survivors, errors, flags and nonzero batch statuses (`runner:124–141`). I found no ordinary parsing error in those verdict and flag formats.

However, X1–X6 defeat the broader completeness, input-integrity and exclusive-execution guarantees.

The supplied old folder is safely rejected: `tmp/proof-final/revision.txt:1` contains a bare hash, so `runner:29–30` exits before the PID write or self-copy. Its copied batches 00–03 each show 11 killed mutants, green controls and no flags; this establishes only the copied snapshot.

For Windows handling, ordinary filenames containing spaces are preserved by the NUL-delimited hashing pipeline. A previously hashed file’s deletion changes the fingerprint, although hashing errors themselves are mishandled. Raw LF/CRLF changes also change fingerprints. **The runner has a relevant protection against checkout conversion:** `docs/work/.gitattributes:1` contains `* -text`, and the reviewed runner has LF bytes. I found no CRLF launch defect in these bytes.

**2. Do W28’s 76 cases test their claims?**

They are **76 assertions**, and the copied log reports all passed (`tmp/w28/test.log:357`). The recorded runner digest matches the reviewed file.

The stub faithfully reproduces the formats and exit codes important to normal runner parsing: unknown-name usage, red control, verdict headings, final summary and unclean exit 1 (`tmp/w28/fixture/mutate.stub.mjs:14–56`; `tests/mutate.mjs:485–539`).

Its limits matter:

- It always models 48 tests; actual page-only controls have 44, and tree-only controls use the hygiene gates.
- Flags are generated only as ERRORED, leaving KILLED-with-zero-green untested.
- It accepts `--write-only` without implementing its real early exit, although this runner does not use that option.
- It neither creates real mutants nor launches test subprocesses.
- The lock test waits until acquisition is finished.
- The “copy was not rewritten” assertion compares contents, which cannot detect rewriting identical bytes (`tmp/w28/test.sh:178–181`).
- The signal test observes log growth, not process-tree termination.
- Tests omit X1, X3–X5, simultaneous acquisition, separate proof directories, PID reuse, filesystem failures, and interrupted setup/publication.

The tests provide useful evidence for the paths they cover, not for the omitted guarantees.

**3. Do the local rule and documentation repairs hold?**

The local rule accurately describes default batching, the exit-0-plus-CLEAN requirement and rerunning unclean batches (`docs/policies/local-rules.md:6–11`). Its “every input” claim and safe-resume implication exceed the implementation, as X4 and X6 explain.

I found no further problem in these requested corrections:

- **F107:** historical `:597` is distinguished from current `:602` and `:609` (`docs/gates.md:158`; `tests/sequence.test.mjs:602–609`).
- **F109:** sampled views, residual tolerance and identity exceptions are stated in the repaired summaries (`AGENTS.md:113–117`; `plan.md:208–209`).
- **F110–F111:** the lesson link and proof-audit warning are repaired (`docs/gates.md:139`; `AGENTS.md:105`, `:111`).
- **F112:** the plan distinguishes the browser crash from session termination and requires clean batches (`plan.md:213–215`).
- **F113:** “seamless” now distinguishes the camera path from a recorded video loop (`plan.md:73`; `README.md:19`).
- **F114:** the last-hold retry matches the code; the count, history and repair-round corrections match the review record (`docs/gates.md:151`; `tests/sequence.test.mjs:306–320`; `plan.md:184`, `:216–220`; `reviews/3_integration.md:536`, `:570`).

F108 remains incomplete as X7 describes. Historical numerical claims were checked against the supplied records; the original measurement logs were unavailable.

**Read outside the diff**

- `tests/mutate.mjs:1–85`, catalog declarations through `:420`, and `:421–539`.
- `tests/hygiene.test.mjs:1–50`, `:160–242`.
- `tests/lib/harness.mjs:1–160`.
- `tests/sequence.test.mjs:275–322`, `:598–627`.
- `docs/work/.gitattributes:1`; `README.md:1–25`; `AGENTS.md:88`.
- `tmp/w28/test.sh:1–302`, `fixture/mutate.stub.mjs:1–56`, `test.log:1–357`, and both probe files.
- The supplied old runner, manifest, fingerprint, revision, runner log, and batches 00–03’s verdicts, summaries and markers.

#### Claude (`claude-opus-5-5[1m]`, effort max), 2026-10-26

Redacted: nothing. The report is the `result` field of the run's final event, unchanged.

**Summary**

- 6 findings: 1 major (C1) and 5 minor (C2–C6).
- **The runner (`70f4ebb`) does what the repair column says for F104, F105 and F106.** I found no sequence of runs, session ends, signals, file or folder changes that makes it write CLEAN or exit 0 in any of these cases:
  - a mutant was skipped or judged twice;
  - a batch's control was red;
  - an input it hashes changed and was still changed at the next check.
- It refuses the running proof's folder before it writes anything.
- **The main gap is in the docs about the proof that is running now.** The plan says it runs with `proof-batches.sh`, and the new rule's command is how to resume it. But that proof is 7616e58's runner, which has none of the new checks, and the new command refuses its folder.
- The other gaps are smaller:
  - the lock covers one folder only;
  - a few claims say more than the code does;
  - one F108 date is still stale;
  - on this machine, `git restore` does not give back the exact bytes the runner hashed.
- The docs fixes for F107, F109–F111, F113 and F114 hold. F108 is only partly fixed.

**How I checked**

- **Read in full or in the relevant ranges:**
  - the round 4 record;
  - the runner at `70f4ebb`, and at `7616e58` via `git show`;
  - `tests/mutate.mjs`, `tests/hygiene.test.mjs` and `tests/sequence.test.mjs`;
  - `.gitignore`, `package.json`, `docs/work/.gitattributes` and `docs/work/registry.json`;
  - the local rules, `AGENTS.md`, `docs/gates.md` and the plan;
  - every file in `tmp/w28/` and `tmp/proof-final/`.
- **Git checks:**
  - `git grep` at `df0dac7` and `560ac55` for F107's line numbers;
  - `git cat-file -s` for the plan's KB figures;
  - commit times with `git log`.
- No subagents. I ran no tests, no node and no browser.
- **Could not check:**
  - The sha256 `df44c275…` of the tested bytes, since I have no hashing tool. `test.log:1` names a 141-line file, `70f4ebb`'s file has 141 lines, and the test ended at 16:26:39, three minutes before the commit at 16:29:51.
  - How a session end kills processes here, that is, whether node outlives bash.
  - R3's log, since `tmp/w25` is not in this clone.
  - `tmp/w28/fixture/names.txt`, which `test.sh` reads but which is not in the evidence copy.

**Findings**

**C1 — major — the tracked docs misdescribe the running proof, and the rule's command cannot resume it** (new; concerns F104 and F112)
- **Where:** `docs/work/1_sentence-sequence/plan.md:213–215`, `docs/policies/local-rules.md:7`, `:9` and `:10`, and `proof-batches.sh:29–30`.
- **The running proof** is 7616e58's code, in `tmp/proof-final/run-batches.sh:6–33`, now at batch-04 of 00–11 (`runner.log:13`). Its checks are much weaker than the new runner's:
  - it hashes tracked files under 5 paths, and only before each batch (`run-batches.sh:13–17`);
  - it marks exit-1 batches done (`:26–27`);
  - it has no check after the last batch and no lock;
  - it writes `all.done` as "all done <date>", with no CLEAN, and exits 0 even with errored batches (`:33`).
- **Where the docs go wrong:**
  - `plan.md:215` says it runs with `proof-batches.sh`, which now names the repaired runner.
  - `local-rules.md:7` says "the same command resumes it", but that command refuses this folder: `revision.txt:1` is a bare SHA. The refusal says "move it aside for a fresh proof", and `local-rules.md:10` agrees.
  - The working resume, `bash tmp/proof-final/run-batches.sh`, is written nowhere in the tracked docs.
  - F104's hand checks are only in the record (`4_integration.md:403`), not in the plan's todo.
  - `local-rules.md:9` ("all.done says CLEAN") can never hold for this proof.
- **Scenario:** a session end during batch 5–11, as happened three times (`plan.md:214`). The next session follows the rule, gets exit 4 and moves the folder aside, throwing away 5–11 finished batches of 51–55 minutes each (`runner.log:6–12`). If instead it runs the old copy while the old runner still lives (the 2026-10-25 run was a hidden process), there is no lock, so batch-04 runs twice. At the end, a reader of `plan.md:215` assumes the new runner's final rehash and checks also covered this proof.
- **Fix:**
  - At `plan.md:213–215`, name 7616e58's copy and its resume command, with "only after checking that no runner or `tests/mutate.mjs` is still running".
  - Add F104's hand checks to the plan's todo.
  - In the rule, say that its command and its CLEAN test apply to proofs started by `70f4ebb`'s runner, and that an old folder is moved aside only once its runner has stopped.

**C2 — minor — the lock covers one folder and the runner's bash process only** (F106)
- **Where:** `proof-batches.sh:29–38`, `:107` and `:14`.
- **(a) Other folders are not covered.** A proof in another `PROOF_DIR` (`:14` says it can be set), or beside the old-runner proof, is not refused. Both proofs share `tmp/mutants/` (`mutate.mjs:34`) and the CPU, and load turns the timing lines in `gates.md:150–159` into CHECKs that count as kills.
  - Scenario: refused by `tmp/proof-final`, a session runs `PROOF_DIR=tmp/proof-new bash …proof-batches.sh` during the old proof's batch 5, and two mutation runs go at once.
- **(b) A surviving `mutate.mjs` is not covered.** If bash ends without its trap (taskkill or TerminateProcess on bash.exe, or `kill -9`), node can outlive it. Windows does not end children with their parent, and W28's probe showed this here with the older design (`probe-kill.log:4`). The next run sees a dead PID, reruns that batch and truncates its log (`:107`) while the orphan still writes to it and drives its browsers. Usually this ends in exit 6 (a verdict twice or missing). But the doubled load can also produce timing kills that pass every check.
- **(c) The folder check (`:29`) comes before the lock (`:32`).** A runner started during another runner's setup gets exit 4 and "its setup broke off; move it aside". Following that advice would break the setup in progress.
- **Fix:** one lock for the whole repo (for example `$ROOT/tmp/mutation.lock`) holding both the runner's PID and the child's Windows PID (`/proc/$child/winpid`), refused while either is alive, and checked before the folder.

**C3 — minor — "every input but Markdown" says more than the fingerprint** (F105)
- **Where:** `local-rules.md:8`, and `proof-batches.sh:6–7` and `:40–44`.
- **What the fingerprint leaves out:**
  - Ignored code files that the hygiene gate still scans. The `.gitignore` patterns `tmp/`, `test-results/` and `playwright-report/` have no leading slash, so they match at any depth. Hygiene walks all of `scripts/` and `tests/`, skipping only `node_modules` (`hygiene.test.mjs:175–183`). `TREE_SKIP` drops only root-level names (`mutate.mjs:444–448`). So a file like `tests/tmp/x.mjs` is scanned but never hashed.
  - Files under ignored paths that a command names (`hygiene.test.mjs:213–226`).
  - `node_modules` beyond the two version strings, and the Chromium build.
- **Effect:** I found no way for these to change a verdict. A violating file turns a tree batch's control red (exit 2), so this fails safe.
- **Fix:** reword the claim to what the code hashes, or also hash `git ls-files -oi --exclude-standard -- scripts tests`.

**C4 — minor — `AGENTS.md:88` still says `npm test` last ran on 2026-10-22** (F108, partly unresolved)
- `:92` (from `a6efa30`) now cites "the run of 2026-10-25, on the final code, 266.0 s", so the section contradicts itself. The R3-touched mutants also ran again on 2026-10-26 (`batch-00.log:19`).
- **Fix:** update the date at `:88`.

**C5 — minor — CLEAN leaves out the timing-line audit** (new; F98–F100 and F111)
- **Where:** `proof-batches.sh:130–137` and `local-rules.md:9`, against `plan.md:213` and `AGENTS.md:105`.
- **Scenario:** a mutant killed only at `tests/sequence.test.mjs:283` on a loaded machine still counts. A session reads "CLEAN" and the rule, and reports the proof clean without the plan's audit.
- **Fix:** add one line to `all.done` and the rule: "then audit kills printed only at the timing lines in `docs/gates.md`".

**C6 — minor — "reverted byte for byte" is not what `git restore` gives on this machine** (new)
- **Where:** `proof-batches.sh:51` and `local-rules.md:8`.
- The primary checkout has LF working files under a global `core.autocrlf=true` (`4_integration.md:11`). There is no root `.gitattributes`; only `docs/work/` has `* -text`, which keeps the runner itself LF.
- **Scenario:** a session edits `tests/x.mjs` by mistake and runs `git restore` on it. Git writes CRLF, the check still reports the file, and the session moves the proof aside, losing every finished batch.
- **Fix:** name a byte-exact restore in the ABORTED text, for example `git -c core.autocrlf=false checkout -- <file>`.

**Answers**

1. **The runner resolves F104–F106 as the record says.**
   - **F104:**
     - checks at start (`:83`), after each batch (`:110`) and before `all.done` (`:122`);
     - markers hold the digests of the list, the inputs and the log (`:101–102`, `:118`);
     - the catalog must match `names.txt` and the lists, each name once (`:87–94`);
     - one verdict per name, per batch and across all logs (`:112`, `:124`).
   - **F105:** the fingerprint is at `:43–44`.
   - **F106:** empty lists are refused (`:90–92`, `:105`); the lock is at `:32–36`; the self-copy and `exec` at `:37`; setup at `:68–81`.
   - **The header's claims hold**, with the limits in C2 and C3.
   - **A red control cannot pass.** It means exit 2 and no `control green (` line (`mutate.mjs:515–518`, `:538`).
   - **The final tally parses the real output.** The verdict-line format matches the real log (`batch-00.log:15–65`), and FLAG is on the same line (`mutate.mjs:527–528`).
   - **The catalog read has no side effects.** `mutate.mjs` checks the names (`:494`) before `mkdirSync` (`:498`).
   - **The fingerprint handles the awkward cases:**
     - a deleted tracked file stays listed by `--cached` and drops its hash line, so the check sees it;
     - spaces in file names are handled by `-z` and `-0`;
     - a CRLF rewrite counts as a change, which fails safe (but see C6);
     - Markdown is outside the file types the gates read (`hygiene.test.mjs:6–8`).
   - **Not seen by design:** a change made and reverted within one batch. The docs name the check points correctly.
   - **Disturbance:** it refuses foreign folders before writing (`test.sh:230–238`) and never rewrites a running copy (test 11). The exceptions are C1 and C2.
2. **W28's tests: the 76 cases test what their names say.**
   - The stub's usage text, control line, verdict lines, summary and exit codes match `mutate.mjs:485–539` (stub lines 14–56). One small mismatch: case 3's "between batches" is really between runs.
   - **Untested paths:**
     - a mutant both killed and flagged: the stub flags only errored ones, so the second branch of `:128–129` never ran;
     - a signal with real gate children and browsers: case 23's stub starts none;
     - bash ending without its trap while node lives on;
     - two proof folders at once, or a second runner during setup;
     - PID reuse;
     - deleted tracked files, names with spaces, CRLF rewrites and ignored inputs;
     - a change of Node version;
     - `cp` or `mv` failures;
     - the real live folder (case 16b is a mock).
3. **The local rule and the docs.**
   - **The local rule matches the runner** except for C1, C3 and C5.
   - **F107 holds.** `df0dac7:tests/sequence.test.mjs:597` is the `Promise.all` that encloses the wait at `:604`; at `70f4ebb` they are at `:602` and `:609`.
   - **F109 holds.** `AGENTS.md:113` and `:117` agree with `gates.md:12`, `:29`, `:37` and `:93`.
   - **F110 holds.** The link at `gates.md:139` resolves.
   - **F111 holds** (`AGENTS.md:105` and `:111`). A nit: `gates.md:5` keeps the old, narrower "read this before…" list.
   - **F113 holds** (`plan.md:73`, consistent with `:175`).
   - **F114 holds:**
     - `gates.md:151` agrees with `sequence.test.mjs:135–136`, `:306–323` and `:409`;
     - `plan.md:184` and `:216–218` are right, including 84,460 and 29,450 bytes;
     - `3_integration.md:536` is right.
   - **F108 is only partly fixed** (C4).
   - **F112's plan text is right** (`plan.md:214`), but see C1.

**Read outside the diff**

- `tests/mutate.mjs:1–40`, `:334–345`, `:400–540`
- `tests/hygiene.test.mjs:1–60`, `:150–250`
- `tests/sequence.test.mjs:135–136`, `:250–330`, `:409`, `:594–629`
- `docs/gates.md:1–60`, `:84–163`
- `AGENTS.md:84–119`
- `plan.md:160–234`
- `reviews/4_integration.md` (all of it)
- `.gitignore`, `package.json`, `docs/work/.gitattributes`, `docs/work/registry.json`
- `7616e58:docs/work/1_sentence-sequence/proof-batches.sh`
- `df0dac7` and `560ac55:tests/sequence.test.mjs` (by `git grep`)
- every file in `tmp/proof-final/` and `tmp/w28/`

### Findings and disposition

Both lanes agree that the docs fixes for F107 and F109–F114 hold and that F108's date was still stale. They differ on the runner: Claude found that it does what F104–F106's repair column says, within limits it rates minor; Codex rates the same limits major, since each lets the runner report CLEAN, or run beside another proof, in a case its header says it rules out. The table keeps both.

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F115 | Codex X1 (major): a coordinated edit of `names.txt` and a later list, both ignored files, shrinks the proof to 131 mutants and still ends CLEAN, since the final check compares the verdicts with `names.txt`, not the catalog. | Accepted. | Second runner repair (W28): the final check also compares the verdicts with the catalog. |
| F116 | Codex X2, X6 (major) and Claude C2 (minor): the pid-file lock is not atomic and covers one folder; a runner that dies without its trap leaves `mutate.mjs` and its browsers running beside a resume; the trap stops only the child, without waiting; and the folder check comes before the lock, so a runner started during another's setup is told to move it aside. | Accepted. | W28: one atomic lock for the repo, taken first, holding the runner's and the child's Windows pids and refused while either lives; on a signal the child's process tree is ended and awaited. |
| F117 | Codex X3, X4, X5 (major) and Claude C3 (minor): the fingerprint can fail silently (a file named `--x.mjs`, no `--`, errors suppressed, no pipefail), misses ignored files that the hygiene gate still scans, and cannot see an edit made and reverted within a batch. | Accepted. This is the second review to find the runner short of frozen inputs, for one reason: it checks a live tree that may change. So, by R11's reassessment, the runner no longer checks the checkout: it proves a frozen snapshot of the commit. | W28: the proof runs on `git archive HEAD`, extracted under the proof folder with its own copy of Playwright; the fingerprint is that snapshot's files, hashed with `--` under pipefail and failing loudly; an edit reverted within a batch is then unseen only in the snapshot. |
| F118 | Claude C1 (major): the docs named the new runner for the proof that is running, though it runs `7616e58`'s copy, which the new runner refuses. Nothing tracked said how to resume it, and the rule's advice could lead a session to move its folder aside and lose its finished batches. | Accepted. | Fixed in `50f0fea`: the plan gives the resume command and the hand checks that the old runner needs after its last batch, and the rule says never to move aside a folder whose proof should resume. |
| F119 | Codex X7 and Claude C4 (minor): AGENTS.md's last-ran date for `npm test` was still 2026-10-22 (F108). | Accepted. | Fixed in `50f0fea`. |
| F120 | Codex X8 (minor): the header's command fails from a subdirectory. | Accepted. | W28: the header gives the command for the repo root, or the script's path from anywhere. |
| F121 | Claude C5 (minor): CLEAN does not say that kills printed at the timing lines still need their audit (F98–F100). | Accepted. | W28: a line in `all.done`; the rule says so too. |
| F122 | Claude C6 (minor): with `core.autocrlf=true`, `git restore` writes CRLF, so "reverted byte for byte" cannot be done on this machine. | Accepted. With the snapshot the checkout is no longer an input, so nothing there needs reverting. | W28: the abort message says what to do when the snapshot or the toolchain changed. |
| — | Claude (nit): `docs/gates.md:5` kept the older "read this before" list. | Accepted. | Fixed: it now matches AGENTS.md's pointer. |

### Outcome

Changes requested, in the runner only; the docs fixes hold, and F119 was fixed in `50f0fea`. The runner's second repair is `4f80295`, reviewed below.

## Second focused re-review: the snapshot runner

### Target

The second runner repair (W28): `git diff cd476eb 4f80295`, which changes only `docs/work/1_sentence-sequence/proof-batches.sh` (now 187 lines, sha256 `7a6aeb13`) and the local rule. The reviewed diff is `tmp/review-runs/wu1-round4c/target.diff` (ignored; 2 files, 228 lines, sha256 `006cf3bd`).
- Both reviewers read a clone at `tmp/review-runs/wu1-round4c/tree-4f80295/` (ignored), detached at `4f80295` with no remote and LF working files. Its 54 files, 8 copies of evidence among them, had the same sha256 before and after both runs, and `git status` there was clean.
- The evidence: W28's test script for this design, its three logs (35 cases, 88 checks, against the runner's exact bytes) and its stub; and the running proof's runner log and revision.

### Reviewers and coverage

- Codex 0.163.0, the same command form, model header and smoke test as above. 14 min 1 s (18:05 to 18:19), 131,072 tokens and 16 read-only commands, all in the clone, with no scanner alert and no DLL marker but one inside a quoted line of this record. One subagent spawn failed, so none contributed.
- Claude 2.1.308, after a fresh login check and permission smoke test, both passed. `modelUsage` held exactly `claude-opus-5-5[1m]`; 33 turns, $5.27, 24 min 49 s (18:05 to 18:30); 32 tool calls, all in the clone. One `| head` pipe was denied, and it ran the command again without it. No subagents.
- Citations outside the diff's hunks, checked against the clone, hold: `tests/mutate.mjs:33`, `tests/lib/harness.mjs:16` and `tests/hygiene.test.mjs:77` (each gate finds its root from its own file), `package.json:16` (Playwright 1.63.0) and `tmp/w28/test2-final-3.log:104` (a runner killed with `taskkill //F` reported exit 0 to its caller).

### Reports

#### Codex (`gpt-6-astra`, effort xhigh), 2026-10-26

Redacted: nothing. The report is Codex's `-o` output, unchanged.

**Summary**

**6 findings: 4 major, 2 minor. Changes requested.**

The snapshot fixes the ordinary live-checkout problem, and the final catalog comparison closes F115’s missing-mutant case. However, lock recovery can admit overlapping proofs, abnormal termination can leave descendants unprotected, and the reported commit is not bound to the proof.

**How I checked**

I read the supplied diff, both previous re-review reports and F115–F122 dispositions, the runner, relevant gate code, local rules, plan, W28’s test script/stub/three logs, and copied legacy-proof evidence. I traced execution without running it.

The runner’s SHA-256 matches the logs: `7a6aeb13f63a68cb1f5521b0052b02d734099a231ce6c034a63a0c6cd2a7255b`. Git confirms the page, gates, scripts and package files are unchanged across the target range.

No files changed; no tests, scripts or browsers ran. One subagent dispatch failed before starting; none contributed. `tmp/w28/fixture/names.txt` is absent, so I could not check its catalog. Windows process behavior was assessed from code and supplied evidence, not reproduced.

Below, **runner** means `docs/work/1_sentence-sequence/proof-batches.sh`. References are at `4f80295` unless another commit is specified.

**Findings**

**X1 — Stale-lock takeover can temporarily remove a live owner’s lock**

- **Location:** `runner:42–49`, `:35`, `:53`.
- **Severity:** major.
- **Concerns:** F116.

Concrete sequence:

1. A and B both read the same stale owner.
2. A completes takeover, publishes its new owner and starts a batch.
3. B resumes at line 45 and renames **A’s live lock**, using its earlier stale-owner decision.
4. Before B restores it, C creates the now-absent lock and starts another proof.
5. B detects the different token, but restoring over C’s nonempty lock fails. That failure is ignored.

A and C can now run together. A’s subsequent `own` calls also overwrite the current owner without checking its token. B can leave a stale directory behind.

The token comparison happens after the live lock has already disappeared. W28 tests simultaneous fresh acquisition and single-runner stale takeover separately (`tmp/w28/test2.sh:353–377`).

**Suggested fix:** use a locking mechanism whose ownership cannot disappear during recovery. Alternatively, refuse automatic stale takeover until a recovery protocol serializes all acquirers. Check ownership before every update and handle restoration failures explicitly.

**X2 — Batch startup and abnormal exits leave gaps in process ownership**

- **Location:** `runner:146–149`, `:155–156`, `:43`, `:53`.
- **Severity:** major.
- **Concerns:** F116.

The batch starts at line 146. Its PID is published afterward, and the signal trap is installed afterward again.

If the session forcibly terminates Bash between launch and publication, the owner still records `-` for the batch. A resume sees dead runner PIDs, takes over and launches another batch while the first Node process remains alive.

There is another gap after startup: `wait` returning immediately clears the recorded batch PID, even on a crash. For example, a supported `NODE` shell wrapper can launch Node without `exec`; if that wrapper is forcibly terminated, Node can survive. The runner clears the PID, exits through the crash path and releases its lock without cleaning that descendant.

The signal fallback also kills only `$child` when `taskkill /T` fails. Waiting for that child does not establish that every descendant ended.

**Suggested fix:** establish ownership before the batch can execute, check PID-publication failures, and retain ownership until all descendants have ended. A Windows Job Object or equivalent supervisor can cover both startup and parent-death cases. Do not clear the batch record merely because its immediate parent exited.

**X3 — Another proof directory bypasses protection against the running legacy proof**

- **Location:** `runner:23–26`, `:40–59`; `7616e58:docs/work/1_sentence-sequence/proof-batches.sh:7–21`.
- **Severity:** major.
- **Concerns:** F116, specifically the earlier Claude C2(a) scenario.

While the legacy proof runs in `tmp/proof-final`, start the new runner with `PROOF_DIR=tmp/proof-new`.

The legacy runner never takes `tmp/mutation.lock`. The new runner acquires it successfully and checks only the selected new directory. It therefore starts beside the legacy browser workload.

The default invocation correctly refuses the supplied legacy folder. That protects its files, but does not provide the claimed repository-wide exclusion. Case 23 tests refusal of the old folder; case 30 tests two cooperating new runners. Neither combines an active legacy runner with another directory (`tmp/w28/test2.sh:302–317`, `:359–362`).

**Suggested fix:** conservatively block new proofs while the known legacy proof remains unresolved, independently of `PROOF_DIR`. Retire that compatibility guard only after the legacy workload is confirmed stopped. Do not modify its running copy.

**X4 — Changing `revision.txt` relabels a completed proof without invalidating it**

- **Location:** `runner:57`, `:65–71`, `:113–115`, `:133–139`, `:177`.
- **Severity:** major.
- **Concerns:** F117; new snapshot-provenance defect.

After a completed proof, replace `revision.txt` with `HEAD <another valid commit>` and rerun.

The folder check requires only a line beginning `HEAD `. The fingerprint covers `tree/` and the Node version, not `revision.txt`. Every batch marker still matches, so every batch is skipped. Completion then copies the changed label into a new **CLEAN** report and exits 0.

The snapshot can therefore be correct and unchanged while the runner claims it proves a different commit.

**Suggested fix:** bind the original commit identifier into the recorded input digest and batch markers, validate its format, and reject later changes. Establish that binding during snapshot creation.

**X5 — Failure to publish completion can still return 0**

- **Location:** `runner:184–187`.
- **Severity:** minor.
- **Concerns:** new; the header’s exit-status claim.

If writing `all.done.tmp` or renaming it fails—for example, because of a Windows file lock or permission error—the runner continues. It logs “all done,” attempts to print `all.done`, and returns success whenever its in-memory verdict is CLEAN.

Thus exit 0 does not guarantee that the completion artifact was successfully published. The local rule’s additional requirement to inspect `all.done` limits the consequence.

**Suggested fix:** make publication and readback failures return a nonzero status. Publish the success log only after the completion artifact has been verified.

**X6 — The dependency-restoration advice does not restore added files**

- **Location:** `runner:78–80`.
- **Severity:** minor.
- **Concerns:** F122.

Suppose an extra file is added under the snapshot’s `node_modules/playwright`. The fingerprint correctly aborts.

Following the advice to run `npm ci` in the checkout and copy the two package directories back normally merges directory contents. It does not remove that extra snapshot file, so the next run still aborts. Moreover, the checkout may now contain a different lockfile, which the new design explicitly permits.

**Suggested fix:** describe replacing the snapshot’s package directories completely, using dependencies matching the proof’s original lockfile and recorded fingerprint. Distinguish replacement from copying over existing directories.

**Answers**

**1. The snapshot**

For the ordinary path, **yes: the gates and page resolve inside the snapshot**:

- `mutate.mjs` derives its root from its own module location and starts gate files with that root as `cwd` (`tests/mutate.mjs:33–36`, `:460–465`).
- The harness derives its root from its own module location and resolves `PAGE` there (`tests/lib/harness.mjs:9–21`).
- Hygiene derives its repository root the same way and resolves `SCAN_ROOT` beneath it (`tests/hygiene.test.mjs:77–80`).
- `tests/run.mjs` also uses its module location (`:13–19`), although the proof invokes `mutate.mjs` directly.
- Mutation runs clear inherited `PAGE` and `SCAN_ROOT` before assigning their own values (`tests/mutate.mjs:496`, `:500–512`).

The current mutation code writes generated pages and trees under `tmp/mutants`; tree copies are deleted after scanning (`tests/mutate.mjs:435–454`, `:498–524`). Screenshots are returned as buffers. The fingerprint excludes these outputs; it also excludes `test-results/` and `playwright-report/`, which these gate paths do not currently write. I found no current committed source input hidden by those exclusions.

The dirty check catches net tracked changes against HEAD, nonignored untracked files, deletions and code-to-Markdown renames because rename detection is disabled. Lowercase `.md` paths are exempt. It is not a separate check of index contents or ignored files (`runner:99–103`).

LF extraction is appropriate here: `git archive` reads the named commit, and the command explicitly disables `core.autocrlf`. W28’s CRLF case checks that behavior for `index.html` (`runner:104`; `tmp/w28/test2.sh:133–138`). The committed tree has no symlinks.

The snapshot remains writable. Endpoint hashing cannot detect changes restored between checks, as the header now acknowledges. Commit-label integrity remains defective under X4.

**2. The lock and signals**

Fresh acquisition uses atomic `mkdir`; the lock precedes folder checks and self-copy, persists across `exec`, and remains held between batches (`runner:38–61`, `:134–160`). The ordinary EXIT path checks its token before removal.

Those improvements hold, but takeover and abnormal process lifetimes remain unsafe under X1–X3.

If Bash dies after successfully recording a still-live batch PID, resume correctly refuses. W28’s case 34 supports that narrow case. Its cleanup then explicitly kills the batch tree; it does not test recovery when the batch parent dies while descendants remain (`tmp/w28/test2.sh:391–402`).

An ownerless lock fails closed and requires manual recovery (`runner:42`; `tmp/w28/test2.sh:415–418`). A crash between directory creation and owner publication can leave that state.

**3. Coverage, verdict and F115–F122**

- **F115:** repaired. Final verdicts are compared with the snapshot catalog, closing coordinated removal from `names.txt` and a future list (`runner:164–169`).
- **F116:** incomplete; X1–X3.
- **F117:** ordinary snapshot isolation and hashing failures are repaired. Provenance needs X4; transient snapshot edits remain an explicit bound.
- **F118:** the plan now names the legacy runner, resume command and required hand checks (`plan.md:213–217`). Default-folder refusal is correct.
- **F119:** corrected at `AGENTS.md:88`.
- **F120:** corrected at `runner:3–4`.
- **F121:** corrected at `runner:179` and `docs/policies/local-rules.md:9`.
- **F122:** checkout restoration is no longer necessary, but dependency recovery advice has X6.

I found no ordinary parsing error for red controls, survivors, errors or zero-green flags (`runner:151–174`; `tests/mutate.mjs:513–539`).

A previous CLEAN file deliberately remains after a startup abort; case 16 asserts this. It must not be treated as a fresh successful recheck. Also, the copied forced-termination experiment reports runner exit **0** despite stopping during batch 01 (`tmp/w28/test2-final-3.log:103–107`). Exit status alone is therefore insufficient, even apart from X5.

**4. W28’s tests**

The three logs report **35 cases and 88 passing assertions**: 31, 30 and 27 respectively. Case numbering skips 25. Their recorded runner digest matches the reviewed bytes.

The stub faithfully models the runner-relevant usage error, verdict headings, flags, summary and normal exit codes. It now includes KILLED-with-zero-green (`tmp/w28/fixture/mutate.stub.mjs:17–25`, `:36–68`).

Their limits are material:

- The stub runs no gates, creates no real mutants and imports no Playwright package. Snapshot-location assertions cover the stub’s location and `cwd`, not actual gate/import behavior.
- It always reports 48 control tests; actual controls depend on the selected mutants.
- It accepts `--write-only` without implementing the real early exit; the runner does not use that option.
- Race cases lack a scheduling barrier and do not exercise competing stale takeovers.
- Process tests omit startup publication, batch-parent death with surviving descendants, and `taskkill` failure.
- Descendant cleanup is inferred from stopped heartbeat growth, not a direct descendant-PID check.
- Case 28’s digest comparison proves unchanged bytes, not that identical bytes were never rewritten (`tmp/w28/test2.sh:345–348`).
- Revision-label changes, completion-publication failures and dependency restoration after an added file are untested.

**Read outside the diff**

Relevant ranges read outside the changed hunks include:

- `tests/mutate.mjs:1–85`, `:413–539`.
- `tests/hygiene.test.mjs:1–100`, `:158–242`.
- `tests/run.mjs:1–28`; `tests/lib/harness.mjs:1–160`; `tests/lib/phases.mjs:1–19`.
- `package.json:1–18`; `package-lock.json:1–48`; `.gitignore:1–7`; `docs/work/.gitattributes:1`.
- `docs/work/1_sentence-sequence/reviews/4_integration.md:425–808`.
- `docs/work/1_sentence-sequence/plan.md:202–224`; `AGENTS.md:88–96`; `docs/gates.md:150–161`.
- `tmp/w28/test2.sh:1–423`, its stub and three supplied logs.
- `tmp/proof-final/runner.log:1–20`; `tmp/proof-final/revision.txt:1`.
- `7616e58:docs/work/1_sentence-sequence/proof-batches.sh:1–34`.

#### Claude (`claude-opus-5-5[1m]`, effort max), 2026-10-26

Redacted: nothing. The report is the `result` field of the run's final event; its headings are moved down three levels to fit this record.

##### Summary

- **7 findings: 1 major (C1), 6 minor (C2–C7).**
- **Verdict: changes requested.**
  - For this commit, the snapshot design holds. I found no way for a newly written CLEAN to cover a mutant twice, miss one, or prove bytes other than the commit's (within the stated bounds).
  - **The main gap:** the new lock cannot see the 7616e58 proof that is running now. With `PROOF_DIR` set, a second proof starts beside it.
  - **Smaller gaps:**
    - the folder refusal still says "move it aside", for the very folder that must not be moved;
    - an old CLEAN `all.done` can outlast a run that did not finish;
    - the lock has narrow windows that release it, or leave it with no owner;
    - a resume runs the checkout's current runner, not the one that set the proof up;
    - the snapshot is not fully sealed or checked;
    - the abort advice for a changed Node costs every finished batch.

##### How I checked

- **Read:**
  - the runner at `4f80295` in full, and the diff;
  - the round 4 record's re-review section (`reviews/4_integration.md:425–809`);
  - `local-rules.md`, and `plan.md:205–224`;
  - `tests/mutate.mjs:1–80` and `:400–540`, `tests/hygiene.test.mjs` in full, `tests/lib/harness.mjs:1–80`, `tests/run.mjs`, `package.json` and `.gitignore`;
  - `7616e58`'s runner (`git show`);
  - W28's `test2.sh`, its stub and its three logs;
  - `tmp/proof-final/runner.log` and `revision.txt`.
- **Also:**
  - I searched `tests/` for file writes, imports and child processes.
  - `git show 4f80295:` shows that the commit tracks no `tmp/` or `test-results/`.
  - One `git show … | head` call was denied, so I reran it without the pipe.
- **Not done:** no subagents; no tests, scripts, node or browser; no file changed.
- **Could not check:**
  - the runner's sha256: I had no hashing tool. It has 187 lines, as W28's logs say. The tests ended at 17:53, five minutes before the commit at 17:58:50.
  - which process `/proc/$child/winpid` names at `:147`;
  - how a session end here kills processes;
  - a real gate run from a snapshot;
  - Playwright's browser-cache cleanup (from its documentation, not read here);
  - whether Windows lets a folder be moved while a running process has files in it open;
  - why case 34's killed runner reported exit 0.

##### Findings

**C1: major. The lock cannot see the proof that is running now, or any `tests/mutate.mjs` started outside the runner (F116, the old-runner case in Claude C2(a))**
- **Where:** `proof-batches.sh:11`, `:18`, `:31–53`; `local-rules.md:8`; `7616e58:docs/work/1_sentence-sequence/proof-batches.sh:7–34` (takes no lock); `tmp/proof-final/runner.log:13–20`.
- **Scenario:**
  - Batches 05–11 of the 7616e58 proof remain (batch-05 restarted at 17:16).
  - A session wants a proof of `4f80295`, finds `tmp/proof-final` taken, and runs `PROOF_DIR=tmp/proof-new bash docs/work/1_sentence-sequence/proof-batches.sh`.
  - `mkdir tmp/mutation.lock` succeeds, because the old runner never makes it. The folder is fresh, so setup runs, and batch-01's control opens browsers beside batch-05.
  - The same holds for a targeted `node tests/mutate.mjs <names>` (which AGENTS.md recommends) or `npm test` beside a new-runner proof: nothing reads the lock.
- **Effect:** `runner.log:18` shows what load does here: batch-05's control went red while another project's Playwright tests ran. Red controls fail safe. But checks that fail at the timing lines still count as kills, so CLEAN then rests only on the audit.
- **Fix:**
  - Before taking the lock and before each batch, refuse while any `node.exe` other than the runner's own batch has `tests/mutate.mjs` in its command line (for example with PowerShell `Get-CimInstance Win32_Process`).
  - Have `tests/mutate.mjs` refuse while `tmp/mutation.lock` holds a token other than `PROOF_LOCK_TOKEN`. This reads only files, so the hygiene gate stays green.
  - Narrow `:11` and the rule to what the code enforces. Until the old proof ends, the rule should say to start no proof under any `PROOF_DIR`.

**C2: minor. The folder refusal still says to move aside the folder that must not move (F118)**
- **Where:** `proof-batches.sh:59`, against `local-rules.md:10` and `plan.md:216` ("Never move its folder aside").
- **Scenario:**
  - Today the rule's own command prints: "…/tmp/proof-final was not set up by this runner, or its setup broke off; move it aside for a fresh proof".
  - Suppose a session follows it while the old runner runs, and Windows allows the move.
  - The old runner's current batch writes on through its open files. But its `.done` write then fails, its hash check at `7616e58:…:15–17` finds no `hashes-before.txt`, and it exits 3.
  - That batch is lost, and the plan's resume command (`bash tmp/proof-final/run-batches.sh`) fails until the folder is moved back.
  - Running the new runner again then starts a fresh proof beside the old batch (C1).
- **Fix:** make `:59` say that the folder may be an older runner's proof that is still running or should resume. Tell the user to move it aside only once no runner or `tests/mutate.mjs` runs and the proof is not to resume.

**C3: minor. A CLEAN `all.done` can outlast the run that wrote it (new; concerns `local-rules.md:9` and header `:13`)**
- **Where:** `proof-batches.sh:120`, `:141`, `:184`; `test2.sh:247–252` (case 16 checks that `all.done` is left as it was after an abort); `test2-final-3.log:104` (a runner killed with `taskkill //F` reported exit 0 to its caller).
- **Scenarios:**
  - **(a) Abort.** A recheck finds the snapshot changed and exits 3, but `all.done` still says CLEAN next to `ABORTED`.
  - **(b) Killed recheck.** A recheck run has no batch to run, so `:141` never removes `all.done`. If a session end kills it before `:184`, its caller can see exit 0 here, and `all.done` says CLEAN. Both halves of the rule's test pass for a recheck that never finished.
  - **(c) Older commit.** After later code commits, the same command rechecks the older snapshot and exits 0 with CLEAN. Nothing says the checkout has moved on.
- **Fix:**
  - At the start of every run, after the lock, move `all.done` to `all.done.prev`.
  - In `all.done`, add the checkout's HEAD when `git diff --name-only <commit> HEAD` shows non-Markdown changes.
  - In the rule: check that `all.done` names the commit you mean to prove, and know that a killed runner can report exit 0 on this machine.

**C4: minor. Edge cases in the lock's life (F116)**
- **Where:** `proof-batches.sh:35`, `:37`, `:42`, `:45–49`, `:53`, `:146–149`.
- **(a) The batch starts unprotected.**
  - The batch starts at `:146`. Its pid reaches the lock, and its trap is set, only at `:147–148`. `own` there starts `cat` and `mv`, which take tens of milliseconds or more under MSYS.
  - A TERM or HUP in that window runs the EXIT trap (`:53`). It removes the lock while the batch runs on.
  - The next runner can then run the same batch beside it, both writing `$b.log` and `tmp/mutants/`.
- **(b) The runner never checks again that it holds the lock.**
  - The status of `own` at `:147` and `:149` is ignored.
  - So a lock moved aside, as `:37` invites ("If none is a proof, move $LOCK aside", even when `:42` names no pid), leaves the proof running with no lock.
- **(c) Locks with no owner.** These leave a lock with no owner line, and every later run exits 5 until someone moves it:
  - a kill between `:41` and `:52`;
  - a signal during `own`: `owner.new` stays behind, so the trap's `rmdir` fails;
  - two runners taking over one stale lock: B renames A's new lock before A writes its owner, finds no token, and moves it back at `:47`, while A's `own` fails and A exits 4 with no trap.
  - With three takers at once, two can end up running.
- **(d) The recorded pid may be bash.exe.** `cw` is read right after the fork. It may name the forked bash.exe that waits for node.exe; I could not check. The tree kill works either way (case 35), but the `tasklist` check that `:37` suggests would then show bash.exe.
- **Fix:**
  - Set the INT/TERM/HUP trap before `:146`, using `$!`.
  - Check `mine` before each batch, and stop if the lock is lost.
  - Remove `owner.new` in the trap.
  - Run takeovers one at a time behind a second mkdir lock, instead of renaming the lock and moving it back.
  - In `:37`, print each pid's program name and command line, and say to retry after a few seconds when there is no owner line yet.

**C5: minor. A resume runs the checkout's current runner, not the one that set the proof up (new; header `:4–7`, `local-rules.md:7–8`)**
- **Where:** `proof-batches.sh:61`; `test2.sh:141–146` (case 5).
- **Scenario:**
  - A proof starts with runner R1, and the checkout then gets R2. Today `70f4ebb` and `4f80295` landed 90 minutes apart, while a proof ran.
  - After a session end, the rule's command copies R2 over `run-batches.sh`, and R2 judges R1's folder. It may refuse the folder and say "move it aside", as `70f4ebb` does with 7616e58's proof, or accept it with other checks.
  - `all.done` never names its runner. Case 5's "an edit to the committed runner never runs" holds only within one run.
- **Fix:** record the runner's sha256 at setup and print it in `all.done`. When the starting script differs from the copy, resume with the copy, or with the snapshot's own frozen and hashed `proof-batches.sh`, unless the user asks for the new one.

**C6: minor. The snapshot is not fully sealed from the checkout, or checked against the commit (F117; header `:5–7`)**
- **Where:** `proof-batches.sh:104–106`, `:177`; `harness.mjs:9`; `package.json:15–17`.
- **(a) Imports can reach the live checkout.** Node's search for a bare import climbs from `tmp/proof-final/tree/` up to the checkout's own `node_modules`. Today only `playwright` is imported, and both its packages are copied. A later dev dependency would come silently from the live, unhashed checkout.
- **(b) Playwright's version is not checked.** Nothing compares the copied versions with `package-lock.json`, and `all.done` names no Playwright version.
- **(c) Extracted files are not compared with the commit.** An `export-ignore`, `export-subst`, or a global or `info/attributes` text rule would change them silently. None applies today, and case 4 shows LF output on this machine.
- **(d) The cache keeps Chromium only for the checkout.** Playwright keeps a cached browser only while some installation that ran its install step still needs it, and the snapshot's copy never ran it. So upgrading Playwright in the checkout and then running `npx playwright install` would delete the build mid-proof. That fails safe.
- **Fix:**
  - Copy every package in `package-lock.json`, or refuse other dependencies.
  - Check the copied versions against the lock file and print them in `all.done`.
  - Compare `git ls-tree -r <commit>` blob ids with `git hash-object --no-filters` of the extracted files.
  - Run the snapshot's own `playwright install chromium` at setup. It reuses the cached build and registers the snapshot.

**C7: minor. The abort advice for a toolchain change is costly or unreliable (F122)**
- **Where:** `proof-batches.sh:26`, `:77–80`; `local-rules.md:6`; `plan.md:216` (the old resume command pins `NODE`).
- **Scenario:**
  - W28's PATH holds two Node installs: nvm's `v24.18.1` and `/c/Program Files/nodejs` (`test2-final-2.log:9`). The rule's command does not pin `NODE`.
  - A resume under the other `node` exits 3, and is told: "Otherwise move $DIR aside for a fresh proof". That throws away every finished batch, though running again with the first Node would pass.
  - The node_modules advice ("npm ci in the checkout, then copy") restores the bytes only if the checkout's lock file still pins the snapshot's version. Also, `cp -R` into the existing folders merges files rather than replacing them.
- **Fix:** record `command -v "$NODE"` at setup, and for a Node-only difference say "run again with NODE=<path>". For node_modules, say to delete the two folders first and copy the version that the snapshot's lock file names.

##### Answers

**1. The snapshot: yes, for this commit.**
- **Roots:** each gate finds its root from its own file (`mutate.mjs:33`, `hygiene.test.mjs:77–78`, `harness.mjs:16–17`, `run.mjs:13`). So it uses the snapshot, its `index.html` and its `tests/lib`. `playwright` resolves to the copied packages.
- **Writes during a run:** only `mutate.mjs`'s `tmp/mutants` (`:34`, `:437`, `:446–451`, `:498`, `:524`). Screenshots stay in memory (`harness.mjs:110`, `illusion.test.mjs:645`, `page.test.mjs:259`, `sequence.test.mjs:292`, `:453`). So the prune at `:67` covers exactly what is written, and the commit tracks none of the three pruned folders.
- **Dirty check (`:100–103`):**
  - It catches modified, staged, deleted, renamed (both names) and untracked files.
  - Markdown is left out.
  - A difference in line endings alone is not reported, which is right, since the snapshot comes from the commit.
- **`git archive`:** with `core.autocrlf=false` it gives the committed bytes here (case 4, and only `docs/work/.gitattributes` `* -text`).
- **Taken from outside the commit:**
  - the two Playwright packages;
  - Node (by version);
  - Chromium (not hashed, as the header says);
  - the runner itself (C5);
  - in future, any package not copied (C6).
- A refused run touches only `tmp/mutation.lock`, which the old runner and its gates never read.

**2. The lock and signals.**
- **What holds:**
  - `mkdir` is atomic, and the token stops another runner from releasing the lock.
  - The lock comes before the folder check.
  - It holds through the copy and `exec`: the MSYS pid survives `exec`, and the copy checks the token at `:38` and records its new pid at `:52`.
  - It holds between batches, with the batch field set to `-`.
- **Takeover:** safe for one taker; races between takers break it (C4c).
- **Left held:** while an orphaned batch lives, by design (case 34), and with no owner in C4's windows.
- **Signal trap:** `taskkill //T //F` ends the tree (case 35, one grandchild). It waits only for the direct child. With no Windows pid it falls back to `kill`, which an earlier W28 probe showed leaves node running (`reviews/4_integration.md:438`). The batch runs unprotected at `:146–148` (C4a).
- **Kill without the trap:**
  - the batch runs to its end, and new runs exit 5 meanwhile;
  - the stale lock is then taken over, and the batch reruns;
  - the caller may see exit 0, and `all.done` is gone (`:141`).

**3. Coverage and the verdict.**
- **F115–F122:**

  | Finding | Holds? | Evidence or gap |
  |---|---|---|
  | F115 | Yes | `:164–169`; case 13 |
  | F116 | Partly | C1, C4 |
  | F117 | Yes | `:65–72`, `:104–106`; limits in C6 |
  | F118 | Yes in the docs | but `:59` (C2) |
  | F119 | Yes | AGENTS.md now says `npm test` last ran on 2026-10-25 |
  | F120 | Yes | `:3–4` |
  | F121 | Yes | `:179`; `local-rules.md:9` |
  | F122 | Partly | C7 |

- **A new CLEAN** requires (`:163–174`):
  - the final check;
  - the catalog, `names.txt`, the lists and the verdicts to match, each name once;
  - every marker to be bound and to say exit 0;
  - no survivor, errored or flagged mutant.

  I found no way around this within the stated bounds:
  - a change reverted within one batch;
  - the Chromium cache;
  - kills at the timing lines.
- **An old CLEAN,** or exit 0 from a killed runner, can still mislead (C3).
- **Claims beyond the code:** `:11` and `local-rules.md:8` (C1); "may change freely" (C5, C6); `:59` (C2); `:77–80` (C7).

**4. W28's tests.**
- **Faithfulness:** the 35 cases test what their names say. The stub's command line, usage error, control line, verdict, flag and summary lines, and exit codes match `mutate.mjs:485–539`.
- **Untested:**
  - the rule's own command: every case sets `PROOF_DIR` (in `/c/…` form) and `NODE` (`test2.sh:8`, `:37`, `:43`);
  - a real snapshot of this repo: the fixture's `node_modules` are dummy files, and the stub imports nothing;
  - a real process tree;
  - the `:146–148` window, a signal during `own`, a lock moved aside mid-run, and racing takeovers;
  - a failing `tasklist`, and the `kill` fallback;
  - case 34's exit 0 (printed, not checked);
  - a stale `all.done`;
  - git attributes other than `autocrlf`;
  - a resume after the runner changed;
  - a run beside a lockless runner.

##### Read outside the diff

- `proof-batches.sh:89–90`, `:122–140`, `:153–158`, `:173`, `:184–187` (whole file read)
- `tests/mutate.mjs:1–80`, `:400–540`; `tests/hygiene.test.mjs:1–465`; `tests/lib/harness.mjs:1–80`; `tests/run.mjs:1–29`
- `package.json:1–18`; `.gitignore:1–7`; `docs/policies/local-rules.md:1–7`, `:10–11`
- `docs/work/1_sentence-sequence/plan.md:205–224`; `reviews/4_integration.md:425–809`
- `7616e58:docs/work/1_sentence-sequence/proof-batches.sh:1–34`
- `tmp/w28/test2.sh:1–424`, `fixture/mutate.stub.mjs:1–69`, `test2-final-1.log`, `-2.log`, `-3.log`
- `tmp/proof-final/runner.log:1–20`, `revision.txt:1`
- the AGENTS.md Gates section (from the session context)

### Findings and disposition

Both lanes agree that the snapshot core holds: for this commit, neither found a way for a newly written CLEAN to cover a mutant twice, miss one, or prove bytes other than the commit's, within the stated bounds. They agree that F115 and F118–F121 are repaired, that the lock cannot see the proof now running on the old runner, and that its takeover can race. Codex rates the lock's and the label's gaps major; Claude rates all but the first minor. The table keeps both.

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F123 | Codex X3 (major) and Claude C1 (major): the lock cannot see the proof now running on `7616e58`'s runner, which takes no lock, nor a `tests/mutate.mjs` run started outside the runner; with `PROOF_DIR` set, a second proof starts beside the running one. | Accepted. | Third runner repair (W28): before the lock and before each batch, the runner refuses while any other process runs `tests/mutate.mjs` or a proof runner. |
| F124 | Codex X1 (major) and Claude C4c (minor): the stale-lock takeover renames and restores the lock, so three runners can end up with two running, and two takers can leave a lock with no owner. | Accepted. | W28: no automatic takeover. A stale lock is reported with its pids and their state, and moved aside by hand. |
| F125 | Codex X2 (major) and Claude C4a, C4b, C4d (minor): the batch starts before its pid is in the lock and before its trap is set; the status of `own` is not checked; the runner never checks again that it holds the lock; a batch whose parent dies can live on with its pid cleared; the fallback `kill` leaves descendants. | Accepted. | W28: the trap is set before the batch starts, every `own` is checked, the lock is checked before each batch, and orphaned batches are seen by F123's process check. |
| F126 | Codex X4 (major): `revision.txt` can be relabelled to another commit, and a rerun then writes CLEAN for it, since the fingerprint does not cover it. | Accepted. | W28: `revision.txt`, with the commit, the runner's sha256, Node's path and version and the Playwright versions, is written before hashing and is part of the fingerprint. |
| F127 | Claude C2 (minor): the folder refusal tells a session to move aside the folder of the proof now running, which must not move. | Accepted. | W28: the refusal says the folder may be an older proof that is running or should resume, and when it may be moved. |
| F128 | Claude C3 (minor) and Codex X5 (minor): a CLEAN `all.done` can outlast a run that did not finish, a runner killed here can report exit 0 to its caller, and a failed write of `all.done` can still exit 0. | Accepted. | W28: each run first moves `all.done` to `all.done.prev`; writes of `all.done` are checked; `all.done` notes non-Markdown changes in the checkout since the snapshot's commit. The exit 0 of a killed runner is stated as a bound: read `all.done`. |
| F129 | Claude C5 (minor): a resume runs the checkout's current runner, not the one that set the proof up. | Accepted. | W28: a resume runs the proof folder's own copy unless `PROOF_RUNNER=new` is set, and the runner's sha256 is part of the inputs. |
| F130 | Claude C6 (minor): the snapshot is not sealed: a future import could resolve from the checkout's `node_modules`, the copied Playwright versions are not checked against `package-lock.json`, the extracted files are not compared with the commit, and a Playwright upgrade in the checkout can remove the cached Chromium mid-proof. | Accepted in part. | W28: all of `node_modules` is copied and the Playwright versions are checked against the lock file. Git attributes other than `autocrlf` (none apply today) and the Chromium cache, which fails safe, are stated as bounds. |
| F131 | Codex X6 and Claude C7 (minor): the abort advice for a toolchain change is costly or wrong: `npm ci` and a copy merge rather than restore, and a resume under another `node` on the PATH is told to start afresh. | Accepted. | W28: a resume defaults to the recorded Node; the abort says to run again with it when only Node changed, and otherwise to start a fresh proof. |

### Outcome

Changes requested, all in the runner, which is not part of the page or the gates. This is the third review of the runner and its sixth repair overall, past the canon's cap of five, which the owner's "Carry on until it's all done" (2026-10-26) covers. It is the last: a verification review of the third repair checks only its changes. Anything else it finds becomes a stated bound in the runner's header, unless it shows a CLEAN that is false for the snapshot's commit.

## Verification review of the third runner repair

### Target

The third runner repair (W28): `git diff d69e6cd b62b7db`, which changes only `docs/work/1_sentence-sequence/proof-batches.sh` (now 251 lines, sha256 `dd6f0cc4`) and the local rule. The runner at `d69e6cd` is the one at `4f80295`. The reviewed diff is `tmp/review-runs/wu1-round4d/target.diff` (ignored; 2 files, 308 lines, sha256 `d287e8fb`).
- The review was scoped, as the second re-review's outcome says: whether each of the nine changes F123–F131 asked for is made and made correctly, and whether any of them adds a defect. Other limits it found go to the runner's header as bounds.
- Both reviewers read a clone at `tmp/review-runs/wu1-round4d/tree-b62b7db/` (ignored), detached at `b62b7db` with no remote and LF working files. Its 54 files, 8 copies of evidence among them, had the same sha256 before and after both runs, and `git status` there was clean.
- The evidence: W28's test script for this repair, its three logs (26 cases, 93 checks, against the runner's exact bytes) and its stub; and the running proof's runner log and revision. W28 could not run the runner's process query on this machine's processes, because the permission classifier refused it twice; its tests run that query on a made-up process table.

### Reviewers and coverage

- Codex 0.163.0, the same command form and model header as above, after a fresh read smoke test, which passed. 13 min 53 s (20:00 to 20:13), 122,092 tokens and 16 read-only commands, all in the clone, with no scanner alert and no DLL marker. One subagent spawn failed, so none contributed.
- Claude 2.1.308, after a fresh login check and permission smoke test, both passed: the smoke test's 5 reads and commands inside the clone ran, and its 9 outside it were denied. `modelUsage` held exactly `claude-opus-5-5[1m]`; 25 turns, $4.92, 23 min 20 s (20:00 to 20:23); 24 tool calls, all in the clone. Two were compound git commands that only read (`git ls-files -s` with `git show`, and two `git diff --stat`), which its settings let through. No subagents.
- Citations outside the diff's hunks, checked against the clone, hold: `tests/hygiene.test.mjs:178` and `:221` (`node_modules` is skipped, so copying all of it does not change the hygiene gate), and `tmp/w28/test3.sh:336` (a batch that a new run overlapped is still marked done), `:350–355` (the race cases use a stand-in query), `:370–375` (the PID-reuse case reuses a lock owner's pid, not an ancestor's) and `:431–432` (`PROOF_RUNNER=new` replaces the copy, then aborts).

### Reports

#### Codex (`gpt-6-astra`, effort xhigh), 2026-10-26

Redacted: nothing. The report is Codex's `-o` output, unchanged.

**Summary**

**3 findings: 2 major, 1 minor.** Six changes are made; changes **1, 5 and 9 are partly made**. The main remaining risk is missed mutation processes. The snapshot provenance and ordinary resume paths look correct within the stated bounds.

Below, `runner` means `docs/work/1_sentence-sequence/proof-batches.sh`. All current line references are at `b62b7db`.

**How I checked**

I read the full current runner, its `4f80295` predecessor, the supplied diff, F123–F131 and their underlying reports, the mutation CLI/output, both package files, local rules, W28’s script/stub/three logs, and the copied legacy-proof evidence.

The runner’s SHA-256 matches the evidence: `dd6f0cc48485d16ce5f1bf978aeca7c2203490f01bcbed70435e9672b283f767`. The logs report **26 cases and 93 passing checks**. Their process-query coverage uses a fabricated process table, not this machine’s live processes.

No files were changed; no tests, scripts or browsers ran. One subagent dispatch failed before starting; none contributed. `tmp/w28/fixture/names.txt`, referenced by the fixture, is absent, so I could not independently check that catalog.

**Findings**

**X1 — The process filter misses valid mutation command lines**

- **Location:** `runner:46–49`, called at `:82` and `:200`.
- **Severity:** major.
- **Change:** 1.

The regex requires the script path to contain no whitespace and permits preceding Node options only when they have no separate value.

For example, an unrelated process running `node.exe --require node:fs tests/mutate.mjs` is missed: `--require` matches the option group, but its argument `node:fs` prevents the script match. A quoted absolute mutation-script path containing a space is also missed.

A directly launched mutation run takes no runner lock. Consequently, both scans can succeed and the new runner can start browsers beside that visible mutation process.

**Suggested fix:** recognize the requested script markers throughout non-owned command lines, handling quoted paths and options with separate values. Add those shapes to the fabricated process-table cases.

**X2 — Reused ancestor PIDs can hide another mutation run**

- **Location:** `runner:45–49`, `:57`; contrary header claim at `:17–18`.
- **Severity:** major.
- **Changes:** 1 and 9.

`PROOF_KIN` preserves numeric ancestor PIDs between scans. Each subsequent scan treats any process currently occupying those PIDs as owned, without checking its identity or creation time.

Concrete sequence:

1. A launching ancestor is recorded in `PROOF_KIN`.
2. That ancestor exits during a batch.
3. Before the next scan, Windows reuses its PID for an unrelated `node tests/mutate.mjs` process.
4. Line 45 marks that new process as owned; line 47 excludes it.

The runner can then start another batch beside it. Thus PID reuse can defeat exclusion; it does not always “fail safe.” W28’s reuse case checks a reused **lock-owner** PID, not a reused cached ancestor (`tmp/w28/test3.sh:370–375`).

**Suggested fix:** preserve and compare process creation times alongside cached PIDs. If this remains an accepted bound, the header must explicitly describe the possible missed process.

**X3 — A code-to-Markdown rename can suppress the checkout-change note**

- **Location:** `runner:235–237`.
- **Severity:** minor.
- **Change:** 5.

Suppose a later commit renames `scripts/shoot.mjs` to `scripts/shoot.md` without changing its contents. With rename detection enabled, `git diff --name-only <snapshot> HEAD` reports the new Markdown path. The following filter removes it, so `all.done` gives no note despite removal of a non-Markdown source file.

The snapshot proof remains valid, but the requested checkout-change notice is incomplete.

**Suggested fix:** add `--no-renames`, as the setup dirty check already does at `runner:150`, and cover this rename case.

**The nine changes**

1. **Partly made:** both process scans and exit 5 exist, but recognition and cached ownership have X1–X2 — `runner:43–60,82,199–200`.
2. **Made:** automatic takeover is removed; held-lock diagnostics and ownerless retry advice exist — `runner:66–85`.
3. **Made:** the signal trap precedes launch, every `own` status is checked, ownership is checked before batches, and EXIT removes `owner.new` — `runner:79–87,139–143,199–209`.
4. **Made:** provenance is written before hashing and fingerprinted; resume selects the recorded Node and existing runner copy — `runner:98–116,157–169`.
5. **Partly made:** completion rotation and checked publication exist; the checkout note has X3 — `runner:104–105,235–249`.
6. **Made:** folder refusal explains running/resumable older proofs and when moving is appropriate — `runner:89–96`.
7. **Made:** all `node_modules` is copied and both Playwright versions are checked against the snapshot lockfile — `runner:154–161`.
8. **Made:** abort advice removes `npm ci` and distinguishes Node-only recovery — `runner:122–124`.
9. **Partly made:** all requested bounds are named, but the PID-reuse safety claim is incorrect — `runner:15–19`, X2.

**Other limits**

- An independent mutation run can start immediately after a process scan; the scans do not provide atomic exclusion against noncooperating launches (`runner:200–206`).
- The inherited fallback after failed tree termination kills only the immediate child, so descendant cleanup is not assured (`runner:141–142`).
- The inherited lock rewrite still occurs before EXIT cleanup is installed; failure there can leave a lock requiring manual recovery (`runner:79–87`).

**Read outside the diff**

- `tests/mutate.mjs:450–539`.
- `package.json:1–18`; `package-lock.json:1–48`.
- `docs/work/1_sentence-sequence/reviews/4_integration.md:814–1245`.
- `tmp/w28/test3.sh:1–452`; `fixture/mutate.stub.mjs:1–70`; all three supplied logs.
- `tmp/proof-final/revision.txt:1`; `runner.log:1–24`.

#### Claude (`claude-opus-5-5[1m]`, effort max), 2026-10-26

Redacted: nothing. The report is the `result` field of the run's final event; its headings are moved down three levels to fit this record.

**Verification review of W28's third runner repair (`git diff d69e6cd b62b7db`)**

##### Summary

- **3 findings, all minor (C1–C3). No major ones.**
- **All nine changes are made.** One claim in change 9's header is wrong: "PID reuse fails safe" holds for the lock, but not for the new process check (C1).
- Through these changes, I found no way for the runner to write a CLEAN that is false for the snapshot's commit, or to exit 0 for a proof that is not clean.
- The new runner refuses the running 7616e58 proof twice over:
  - its process check sees that proof's runner and node (`proof-batches.sh:82`, exit 5);
  - its folder check rejects `tmp/proof-final`, whose `revision.txt` has no `commit ` line (`:90`, exit 4).

##### How I checked

- **Read:**
  - the runner at `b62b7db` in full (251 lines) and the target diff;
  - the `4f80295` runner and the `7616e58` runner (`git show`);
  - `reviews/4_integration.md:814–1246`;
  - `local-rules.md`, `tests/mutate.mjs:1–60` and `:420–540`, `package.json`, `package-lock.json`, `docs/work/.gitattributes`, `plan.md:215–216`;
  - W28's `test3.sh`, its stub and its three logs;
  - the copies of `tmp/proof-final/revision.txt` and `runner.log`.
- **Git checks:** `git diff --stat` confirms that `d69e6cd` added only the review record. `git log` gives the commit time, 19:46:53.
- **W28's counts hold:** 26 cases and 93 checks (30 + 33 + 30), all passing.
- **Not done:** I used no subagents, ran nothing and changed no file.
- **Could not check:**
  - **The runner's sha256** against `dd6f0cc4…`: I had no hashing tool. It has 251 lines, as the logs say, and the logs are stamped from 19:19 on, before the commit.
  - **The real `Win32_Process` query on this machine.** W28 never ran it either. Cases 18–19 answer from a stand-in PowerShell, either on a made-up table or listing only the runner itself.
  - **Whether the bash before `exec` really ends.** W28's fixture assumes it does (`tmp/w28/test3.sh:69`, `:76`).
  - **How Windows reuses PIDs.**
  - **The version check under this repo's `"type": "module"`.** `node -e` at `:158` ran only in W28's fixture, which has no such field. Node treats `--eval` input as CommonJS either way, so I expect it to work.
  - **What a session end here sends:** a signal, or a kill with none.

##### Findings

**C1 (minor; changes 1 and 9). PID reuse can hide another run from the process check, though the header says it fails safe.**
- **Where:** `proof-batches.sh:45` (walk up from each kin pid), `:48` (walk up from each match), `:57` (`PROOF_KIN` carries the pids walked), `:17–18` ("PID reuse fails safe").
- **The cause:** both walks follow `ParentProcessId` without checking that the parent is older than the child.
- **First scenario (`:45`):**
  - The copy's parent is the bash that `exec`'d it, which has ended. Its pid is also in `PROOF_KIN`.
  - So before every batch, the walk reaches that dead pid.
  - Suppose Windows has since given it to a process of another mutation run, such as a Chromium process under that run's `node tests/mutate.mjs`.
  - Then that process and all its ancestors (the other run's node and its runner bash) count as this runner's own and are skipped at `:47`. The next batch starts beside that run.
- **Mirror case (`:48`):** a process of another run counts as this runner's descendant when the pid of one of its dead ancestors now belongs to:
  - this runner;
  - the subshell of this very query;
  - its PowerShell.
- **Why minor:** this is the "runs beside" kind of defect, but it needs a PID reuse at the moment of a check. Even then:
  - a red control or a survivor still fails safe;
  - kills at the timing lines still rest on the F98–F100 audit.
- **Fix, either of:**
  - in both walks, follow a parent only when its `CreationDate` is earlier than the child's, and carry each pid with its `CreationDate` in `PROOF_KIN`;
  - or restate the header bound as "PID reuse fails safe for the lock but can hide another run from the process check".

**C2 (minor; change 4). `PROOF_RUNNER=new` overwrites a set-up proof's copy, so the proof can no longer resume.**
- **Where:** `:99–102`, `:116`, `:123–124`; header `:5–6`.
- **Scenario:**
  - 8 of 12 batches are done. A session reads `:5` and resumes with `PROOF_RUNNER=new` to get a newer runner.
  - `:101` copies the new runner over `run-batches.sh`, and the start check exits 3 on the runner line (W28's case 24, `test3.sh:431–432`).
  - The copy that set up the proof is now gone, so the plain command also exits 3.
  - ABORTED says to move the folder aside for a fresh proof. About 7 hours of batches are lost, unless someone thinks to restore the old bytes from git.
- **Fix, either of:**
  - when `names.txt` exists, refuse `PROOF_RUNNER=new` with exit 4 ("move $DIR aside for a fresh proof") before writing anything;
  - or keep the old copy as `run-batches.sh.prev` and name it in ABORTED.

**C3 (minor; change 3). A failed `own` in the copy leaves the lock held.**
- **Where:** `:80`, compared with `:84` and `:87`.
- **Scenario:**
  - In the copy, `mine` passes and `own` fails, for example because `owner.new` cannot be written or the rename is refused.
  - The copy exits 5 before its EXIT trap is set at `:87`.
  - The lock keeps the first run's owner line, whose Windows pid ended at the `exec`.
  - Every later run exits 5 with "Both have ended … move $LOCK aside by hand".
  - The first run's branch at `:84` cleans up after the same failure; this one does not.
- **Fix, either of:**
  - set the EXIT trap (it is already guarded by `mine`) before `:79`;
  - or remove the lock in `:80`'s failure branch while it is still this runner's.

##### The nine changes

1. **Made.** `:40–61`, called at `:82` and `:200`; header `:13–15`. It looks only at the first argument (bash/sh: the runner; node: `tests/mutate.mjs`), as the comment at `:40–42` says. Gap: C1.
2. **Made.** `:63–78` and `:83`. No takeover is left. The "no owner line" message says to retry, and every held message names each pid's program or "ended".
3. **Made.**
   - The trap is set at `:204–205`, before the batch starts at `:206`.
   - `own` is checked at `:80`, `:84`, `:207` and `:209`.
   - `mine` is checked before each batch at `:199`.
   - The EXIT trap at `:87` also removes `owner.new`.
   - Gap: C3.
4. **Made.**
   - `revision.txt` is written at `:167–168`, before the fingerprint at `:169`, and is hashed at `:116`.
   - `NODE` defaults to the recorded path at `:106`.
   - The folder's own copy runs at `:98–103`.
   - Gap: C2.
5. **Made.** `all.done` moves at `:104–105`, after the lock and the folder check. The note is at `:235–237` and `:241`. The write is checked at `:248`, and "all done" is logged after it at `:249`.
6. **Made.** `:91–96`.
7. **Made.** All of `node_modules` is copied at `:154–155`; the versions are checked at `:158–161`.
8. **Made.** `:122–124`.
9. **Made, but "PID reuse fails safe" (`:17–18`) is not true of the process check (C1).** `:15–19`.

##### Other limits

- A mutation run that starts during a batch is seen only at the next batch's check. The batch it overlapped is still marked done (case 18 asserts this, `test3.sh:336`), and no check runs after the last batch.
- The check sees only:
  - a bash or sh whose first argument is the runner;
  - a node whose first argument, after options without values, is `tests/mutate.mjs`;
  - and only when the script path has no space.

  So it misses `bash -x <runner>`, `node --require x tests/mutate.mjs`, a quoted path with a space, a command line Windows hides from this user (elevated, or another user's), and WSL.
- Two runners started within one query's time of each other can both exit 5, each seeing the other. W28's race cases (`test3.sh:350–355`) used a stand-in that lists only the runner itself, so they prove the lock, not the query.
- `own` (`:67`) writes without checking the token, so a runner that lost its lock can overwrite another runner's owner line. This needs the query to have missed one of them.
- The Playwright check (`:158–161`) compares versions only, not `package-lock.json`'s integrity hashes.
- The `all.done` note (`:235–237`) covers commits since the snapshot's commit, not uncommitted changes, and does not name the checkout's HEAD.
- A run that is refused or killed before `:104` (during the query, the lock, the folder check or the `exec`) leaves the earlier `all.done` in place.
- After a kill that skips the traps, the lock has to be moved aside by hand before "the same command resumes it" (`local-rules.md:7`). Line `:9` of the rule says so.
- A relative `NODE` is recorded as `command -v` prints it (`:157`), not as an absolute path.
- When no Windows pid is known, `stop` falls back to `kill` (`:142`), which can leave node running.

##### Read outside the diff

- `proof-batches.sh:129–138`, `:179–193`, `:223–231` (whole file read)
- `4f80295:docs/work/1_sentence-sequence/proof-batches.sh:1–187`
- `7616e58:docs/work/1_sentence-sequence/proof-batches.sh:1–34`
- `tests/mutate.mjs:1–60`, `:420–540`
- `tests/hygiene.test.mjs:178`, `:221` (`node_modules` is skipped, so copying all of it does not change the gate)
- `package.json:1–18`, `package-lock.json:1–48`, `docs/work/.gitattributes:1`
- `docs/work/1_sentence-sequence/plan.md:215–216`
- `docs/work/1_sentence-sequence/reviews/4_integration.md:814–1246`
- `tmp/w28/test3.sh:1–452`, `tmp/w28/fixture/mutate.stub.mjs:1–70`
- `tmp/w28/test3-final-1.log:1–172`, plus the result lines of `-2.log` and `-3.log`
- `tmp/proof-final/runner.log:1–24`, `tmp/proof-final/revision.txt:1`

### Findings and disposition

Both lanes found no way, through these changes, for the runner to write a CLEAN that is false for the snapshot's commit, or to exit 0 for a proof that is not clean. Claude found all nine changes made; Codex found six made and three partly made, through the gaps in F132, F133 and F136. Both found that the claim "PID reuse fails safe" holds for the lock but not for the new process scan. Codex rates its two findings on the scan major; Claude rates all its findings minor.

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F132 | Codex X2 (major) and Claude C1 (minor): the process scan trusts recorded parent pids, so a reused pid can hide another mutation run, and the header's "PID reuse fails safe" is not true of the scan. | Accepted as a bound. It needs a pid reused at the moment of a check. Even then no CLEAN is false: a red control or a survivor still shows, and kills at the timing lines still rest on the F98–F100 audit. | The header now says PID reuse fails safe for the lock but can hide another run from the scan. |
| F133 | Codex X1 (major), and a limit in Claude's report: the scan sees only a bash whose first argument is the runner and a node whose first argument after options without values is `tests/mutate.mjs`, in a path with no space. | Accepted as a bound. This repo's commands give those shapes, and its path has no space. | The header lists what the scan sees and what it misses. |
| F134 | Claude C2 (minor): `PROOF_RUNNER=new` overwrites the copy that set a proof up, so that proof aborts (exit 3) and can no longer resume. | Accepted as a bound. The header already said it means a fresh proof. | The header now says the proof can no longer resume. |
| F135 | Claude C3 (minor), and a limit in Codex's report: a failed lock write in the copy, before its EXIT trap is set, leaves the lock held. | Accepted as a bound. It fails safe: later runs refuse and say to move the lock aside by hand. | Stated in the header. |
| F136 | Codex X3 (minor): the `all.done` note on later commits follows renames, so a code file renamed to Markdown goes unnamed. | Accepted as a bound. The note is advice; the proof stays valid for its snapshot. | Stated in the header. |

The header also states the other limits both reports list:
- a run started during a batch is seen only before the next one, and not after the last (both);
- two runners started together can both refuse (Claude);
- the scan's query was tested only on a made-up process table (both);
- moving aside a lock whose runner still lives lets a run the scan misses take it (Claude);
- only Playwright's versions are compared, not its integrity hashes (Claude);
- a run refused before it holds the lock and passes the folder check leaves an earlier `all.done` (Claude);
- the note leaves out uncommitted changes (Claude);
- a stopped batch whose Windows pid is unknown gets a plain kill, which can leave node running (both);
- `NODE` should be an absolute path (Claude).

### Outcome

Accepted with bounds. As the second re-review's outcome set, the runner is not repaired again. The commit that records this review changes only its header's comments: with comment lines removed, the runner equals `b62b7db`'s line for line, and `bash -n` passes.

The scan's query has never run on this machine's processes. The permission classifier refused it twice when W28 ran it on its own, and the coordinator did not run it either. The proof now running uses `7616e58`'s runner and the coordinator's hand checks (F104, F105), so these bounds do not touch this work unit's proof.
