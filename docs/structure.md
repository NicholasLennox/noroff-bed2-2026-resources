# Repository structure

Where things live, what they are called, and what is deliberately kept out of Git. **This file does not describe what goes inside each document** — each artifact type has its own spec in [artifacts/](artifacts/).

## Hierarchy

```
BED2-resources/
├── README.md                     # for students. the only committed doc at root.
├── CLAUDE.md                     # router: identity, workflow, where to look
├── .claude/skills/               # write-lecture, write-quiz
├── docs/                         # the specs (this folder)
│   ├── README.md                 # how Claude is used here
│   ├── structure.md              # this file
│   ├── style.md                  # house prose style
│   ├── pedagogy.md               # the why-layer
│   └── artifacts/                # one spec per document type
└── NN-course-topic/              # 01-cloud-services, 02-..., in delivery order
    └── module-N/                 # matches the Moodle module numbering
        ├── NN-lesson-slug/       # one folder per taught lesson, in delivery order
        └── plan-NN-slug/         # local-only planning space (not in Git)
```

Numeric prefixes are **delivery order**, not importance. Two digits, zero-padded, so directory listings sort correctly. Slugs are lowercase kebab-case.

`module-N` mirrors the module numbering on Moodle so that a lesson folder can be found from a Moodle reference and vice versa. A lesson folder does **not** need to map 1:1 to a Moodle sub-section — several Moodle tasks can land in one lesson, and one lesson can span two.

## Inside a lesson folder

Nothing here is mandatory. A lesson takes only the pieces it needs.

| Path | Role | Audience | Spec |
|---|---|---|---|
| `lecture.md` | The polished learning aid, at the folder root. | Students | [artifacts/lecture.md](artifacts/lecture.md) |
| `boards/` | Photos of the whiteboard, `NN-topic.jpg\|jpeg`, in drawing order. | Students, and me | [artifacts/boards.md](artifacts/boards.md) |
| `kata/` | Staged hands-on exercises, `BED2-<topic>-kata-N.md`. | Students | [artifacts/kata.md](artifacts/kata.md) |
| `class-demo/` | A runnable project built live in class. | Students | [artifacts/class-demo.md](artifacts/class-demo.md) |
| `<topic>-QUIZ.md` + `<topic>-ANSWER-KEY.md` | A paired knowledge check, same stem, always both. | Students / me | [artifacts/quiz.md](artifacts/quiz.md) |
| `images/` | Diagrams and screenshots referenced from `lecture.md`. | Students | — |
| `lecture-steps.md` | My raw post-class notes. Input only, never published. | Me and Claude | [artifacts/lecture-steps.md](artifacts/lecture-steps.md) |

Two placement quirks worth knowing:

- `lecture-steps.md` usually sits at the lesson root, but in `04-intro-to-docker` it lives inside `class-demo/`. Look in both.
- Quiz pairs sit at the lesson root of the lesson where the quiz is *handed out*, which is often the lesson **after** the one being tested.

### `plan-NN-slug/`

Planning space for a lesson that hasn't been delivered yet: outlines, half-formed task lists, notes on what to cover. Kept out of Git deliberately. When the lesson is taught, the useful content moves into a proper `NN-lesson-slug/` folder and the plan folder is dropped.

## What goes into Git

Committed: everything student-facing or reusable — the root [`README.md`](../README.md), `lecture.md`, `boards/`, `kata/`, `class-demo/` source, quizzes and answer keys. Students clone this repo, so the committed tree is the thing they see.

Ignored, via [`.gitignore`](../.gitignore):

| Pattern | Why |
|---|---|
| `CLAUDE.md`, `/docs/`, `.claude` | The harness and its specs. Work in progress, and not for students to read. Local-only for now; whether it eventually goes public, or onto a private branch, is an open decision — see [docs/README.md](README.md). |
| `lecture-steps.md` | My scratchpad. Contains asides, notes to self, and things I got wrong in class. |
| `**/plan-*/` | Unfinished thinking. Noise in history, and often wrong by the time the lesson is taught. |
| `**.pdf` | Generated from the matching `.md`. The Markdown is the source of truth; committing both means they drift. |
| `node_modules`, `.vscode` | Standard, and per-machine. |

The rule behind the rule: **commit the source, not the render, and not the scratch work.** A PDF handed to students is produced from a committed `.md`; if a PDF exists without a Markdown sibling, that's a bug in the workflow, not an exception to the policy.

## Adding a new lesson

1. Create `NN-lesson-slug/` under the right `module-N`, with `NN` continuing the sequence.
2. Drop board photos into `boards/`, numbered in drawing order.
3. Write `lecture-steps.md` while the class is still fresh.
4. Run the `write-lecture` skill to produce `lecture.md`.
5. Add a kata or a knowledge check if the lesson needs one — `write-quiz` for the latter.
