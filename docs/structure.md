# Repository structure

How this repo is laid out, what each file type is for, and what is deliberately kept out of Git.

## Hierarchy

```
BED2-resources/
├── CLAUDE.md                     # entry point for Claude
├── docs/
│   └── structure.md              # this file
└── NN-course-topic/              # 01-cloud-services, 02-..., in delivery order
    └── module-N/                 # matches the Moodle module numbering
        ├── NN-lesson-slug/       # one folder per taught lesson, in delivery order
        └── plan-NN-slug/         # local-only planning space (not in Git)
```

Numeric prefixes are **delivery order**, not importance. They are two digits and zero-padded so directory listings sort correctly. Slugs are lowercase kebab-case.

`module-N` mirrors the module numbering on Moodle so that a lesson folder can be found from a Moodle reference and vice versa. A lesson folder does **not** need to map 1:1 to a Moodle sub-section — several Moodle tasks can land in one lesson, and one lesson can span two.

## Inside a lesson folder

Nothing here is mandatory. A lesson takes only the pieces it needs.

| Path | Role | Audience |
|---|---|---|
| `lecture.md` | The polished learning aid. Self-contained: a student who missed the class can read it and follow. | Students |
| `boards/` | Photos of the whiteboard from class, named `NN-topic.jpg\|jpeg` in the order they were drawn. | Students (and me, as a memory aid) |
| `kata/` | A staged, hands-on exercise the students build themselves. One file per kata, `BED2-<topic>-kata-N.md`. | Students |
| `class-demo/` | A runnable project built live in class. Committed in the state the class ended in. | Students |
| `<topic>-QUIZ.md` / `<topic>-ANSWER-KEY.md` | A paired knowledge check. Always both files, always the same stem. | Students / me |
| `lecture-steps.md` | My raw post-class notes. Input to `lecture.md`, never published. | Me and Claude only |

### `lecture.md`

The deliverable. Written after the class from `lecture-steps.md`. Style rules live in [../CLAUDE.md](../CLAUDE.md) — numbered sections, `*[bracketed glosses]*` for jargon, blockquote takeaways, a `## Sources` list at the end.

It follows what actually happened in class, including the wrong turns taken on purpose.

### `boards/`

Straight photos of physical whiteboards. The number prefix is the order they were drawn in, and the name says what is on them (`05-containers-vs-vm.jpeg`). These are referenced from `lecture.md` only when the board says something the prose cannot; most of the time the prose supersedes them and they stay as an archive.

Files are JPEG straight off the phone. Don't rename or re-encode them without asking.

### `kata/`

A kata is a build-it-yourself exercise, structured in **stages**:

- A short `## Intro` giving the framing and linking the official docs the student should use instead of AI.
- `## Stage N: Name` with a bolded `**Goal:**` line, then numbered steps.
- A `### Reflection` block of open questions at the end of a stage. These are the point of the exercise — they ask *why*, not *what*, and several are deliberately answerable only by breaking something and observing the result.

Code in a kata is a fragment to be completed, not a solution to be copied.

### `class-demo/`

A real, runnable project. It carries its own `package.json`, `.gitignore`, `Dockerfile`, and so on. Two rules:

- **It is frozen at the state the class ended in.** Reinstalling dependencies, upgrading, or "fixing" it changes what the students are looking at. Ask first.
- **Its `.env` is committed on purpose.** It holds only teaching values (`PORT`, `ENVIRONMENT`) and the whole point of the Docker lesson is watching `.dockerignore` exclude it and the app fall back to its defaults. This is the one place a committed `.env` is correct — never treat it as a template for anything else, and never put a real secret in one.

`node_modules/` inside a demo is ignored.

### Quizzes

Scenario-based multiple choice. The scenarios must **not** reuse the examples from class — the student should have to reason from the concept rather than pattern-match a phrase.

The answer key restates the correct option and then gives the *distinguishing feature* that rules the distractors out, rather than just repeating the definition.

Two files, always paired, always the same stem:

```
cloud-knowledge-check-QUIZ.md
cloud-knowledge-check-ANSWER-KEY.md
```

Distractors should be plausible neighbours from the same lesson. **Shuffle the correct option across A–D** — an unshuffled key is a real failure mode when these are generated.

### `plan-NN-slug/`

Planning space for a lesson that hasn't been delivered yet: outlines, half-formed task lists, notes on what to cover. Kept out of Git deliberately (see below). When the lesson is taught, the useful content moves into a proper `NN-lesson-slug/` folder and the plan folder is dropped.

## What goes into Git

Committed: everything student-facing or reusable — `lecture.md`, `boards/`, `kata/`, `class-demo/` source, quizzes and answer keys, and these meta docs.

Ignored, via [`.gitignore`](../.gitignore):

| Pattern | Why |
|---|---|
| `**/plan-*/` | Unfinished thinking. Noise in history, and often wrong by the time the lesson is taught. |
| `**.pdf` | Generated from the matching `.md`. The Markdown is the source of truth; committing both means they drift. |
| `node_modules` | Standard. |
| `.vscode` | Editor state, per-machine. |

The rule behind the rule: **commit the source, not the render, and not the scratch work.** A PDF handed to students is produced from a committed `.md`; if a PDF exists without a Markdown sibling, that's a bug in the workflow, not an exception to the policy.

## Adding a new lesson

1. Create `NN-lesson-slug/` under the right `module-N`, with `NN` continuing the sequence.
2. Drop board photos into `boards/`, numbered in drawing order.
3. Write `lecture-steps.md` while the class is still fresh.
4. Generate `lecture.md` from it.
5. Add a kata or a knowledge check if the lesson needs one.
