---
name: write-quiz
description: Plan and then generate a scenario-based multiple-choice quiz and its answer key from lesson content. Use when Nicholas says "write a quiz", "use the write-quiz skill", or asks for a knowledge check on a lesson or module. Runs in two phases with an approval stop between them.
---

# write-quiz

Produces a `-QUIZ.md` / `-ANSWER-KEY.md` pair from delivered lesson content.

**This skill has a hard stop in the middle.** Phase 1 proposes a plan and writes nothing. Phase 2 runs only after Nicholas has approved or amended the plan. The plan exists so coverage and emphasis get fixed before any questions are written — reworking a plan costs a minute, rewriting twelve questions does not.

## Phase 1 — Plan

### Scope it

Work out what is being tested. It may be one lesson, or a module's worth. Ask if it isn't clear — this determines everything downstream.

Then read:

- `docs/artifacts/quiz.md` — the spec and its failure-mode table
- `docs/style.md` — scenario prose follows house style
- The `lecture.md` of every lesson in scope
- Any kata in scope, for what students have already had to reason about
- Existing quizzes in the repo, to match the naming convention already in use and to avoid repeating a scenario

### Propose

Present, in the response only:

**Where it goes** — target folder and both filenames, following the naming already used in that lesson.

**Total question count**, with a sentence of reasoning. Ten to fifteen is typical for a module recap.

**The split**, as a table:

| # | Concept | Source | Questions | Depth |
|---|---|---|---|---|
| 1 | The 5 essential characteristics | `01-intro-to-cloud` §3 | 4 | apply |
| 2 | Deployment models | `02-cloud-responsibility` §1 | 3 | apply |
| 3 | Shared responsibility | `02-cloud-responsibility` §3 | 2 | reason |

`Depth` is `recall`, `apply`, or `reason` — recognising a definition, mapping a new scenario onto a concept, or working out a consequence. Most items should be `apply`. Say what the ratio is and why.

**Anything deliberately left out**, and why. A lesson section with no question on it is a decision, and Nicholas should see it.

**Scenario domains you intend to use** — one line. This is where reuse of class examples gets caught early, so name the lecture example you are avoiding for each concept.

### Stop

Do not write files. Ask for approval or amendments and wait. He will often want the split different — that is the point of the phase.

## Phase 2 — Generate

Only after approval.

### Write the quiz

Follow the skeleton in `docs/artifacts/quiz.md`. For each item:

- A concrete scenario in one to three sentences, in a domain **not used in the lecture** for that concept.
- One unambiguously correct option.
- Three distractors that are plausible neighbours from the same lesson — each one the answer a student would give if they had misunderstood one specific thing.

### Write the answer key

Same stem, `-ANSWER-KEY.md`. For each item: the letter, the correct option restated **verbatim from the quiz**, the distinguishing feature that makes it right, and then what each distractor would have needed to be true for it to win. Never restate the definition and stop.

### Verify

Mechanical checks, not intentions. Run them and report the results.

- [ ] **Answer distribution.** Count correct answers by letter. With 8+ questions, no letter above ~40%, no letter absent, and no visible pattern (`ABCDABCD` is as bad as `AAAA`). If it fails: swap the *text* of the correct option with a distractor, then re-read that item's key entry — the restated text and the "why not" reasoning both have to move with it.

  ```bash
  grep -oE '^## [0-9]+\. Correct answer: [A-D]' <answer-key> | grep -oE '[A-D]$' | sort | uniq -c
  ```

- [ ] **Verbatim match.** Every option text quoted in the key appears identically in the quiz. This breaks constantly after a shuffle.
- [ ] **No recycled scenarios.** Check each scenario against the source `lecture.md`. A renamed company is still the same example.
- [ ] **Distractor defensibility.** For every wrong option, name the specific misunderstanding that would lead a student to it. If you can't, it's filler — replace it.
- [ ] **Lesson-dependence.** For each item, ask whether general technical knowledge would pick the right answer. If yes, the item tests nothing.
- [ ] **Terminology.** Terms match the lecture exactly.
- [ ] **Coverage.** The finished quiz matches the approved plan's split. Say so, or say where it drifted and why.

### Report

The distribution count, the checks that passed, and anything you changed during verification. Do not generate PDFs — they are rendered separately and are git-ignored.
