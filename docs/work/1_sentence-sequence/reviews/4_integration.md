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
