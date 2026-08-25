# How Claude is used in this repo

> **This is an experiment in progress.** Everything in this folder is a first attempt, written in August 2026 after two modules had already been delivered — the specs were reverse-engineered from lessons that already existed, not designed up front. Expect the structure, the skills, and the rules to change substantially as they get used. Nothing here is settled, and no part of it should be treated as a standard to preserve. If a rule gets in the way, the rule is wrong.

## Why this exists

BED2 lessons are improvised. I teach against a rough outline, take whatever turns the room needs, and only afterwards write down what actually happened. That leaves a gap between **a class that went well** and **a resource a student can learn from**, and closing it by hand takes hours per lesson.

Claude closes that gap. The value is not that it writes faster than I do — it is that the pedagogical decisions I make live in class survive into the written version instead of being smoothed away.

That is the whole design constraint. A generic AI write-up of my notes would tidy up the deliberately broken Dockerfile, drop the aside about why we didn't use the local MySQL, and produce something accurate and useless. These docs exist to stop that happening.

## The two layers

| Folder | What it is | Committed? |
|---|---|---|
| `docs/` (this one) | **Specs.** What each document type is, what makes a good one, and how each one fails. Written for a human as much as for Claude. | No — git-ignored |
| `.claude/` | **Machinery.** Skills, and eventually settings, hooks and slash commands. Claude Code discovers these automatically. | No — git-ignored |

Kept separate on purpose. `.claude/` is a namespace the tool reads and its layout is not mine to choose; `docs/` is repo documentation that happens to double as Claude's brief. The split also means that if this repo ever goes public, `docs/` is the part worth showing.

[`CLAUDE.md`](../CLAUDE.md) sits at the root and is the only file loaded into context automatically. It is deliberately short — identity, workflow, and a table pointing here. Everything else is read on demand, when it is relevant.

## The docs

| File | Contents |
|---|---|
| [structure.md](structure.md) | Where things live, naming, what is and isn't in Git. Layout only. |
| [style.md](style.md) | House prose style — numbered sections, plain-English glosses, takeaway blockquotes, sourcing. |
| [pedagogy.md](pedagogy.md) | Why lessons are shaped the way they are. Currently reverse-engineered from delivered lessons; the university's framework goes here when it lands. |
| [artifacts/](artifacts/) | One spec per document type: `lecture.md`, `lecture-steps.md`, kata, quiz, `class-demo/`, `boards/`. |

Every artifact spec has the same six sections, so the same thing is always in the same place:

1. **Purpose** — who reads it and what it is for
2. **When it exists** — and when a lesson correctly skips it
3. **Skeleton** — the structural shape
4. **Rules** — the non-obvious constraints
5. **Failure modes** — what goes wrong *specifically when generated*
6. **Exemplar** — a path to the best real one in the repo

Sections 5 and 6 are the ones doing the work. Section 6 points at live files rather than templates, so improving a lesson improves the spec for free. Section 5 is the accumulated list of ways generation goes wrong — it is the part that should grow every time something comes back subtly off.

## The skills

Invoke by name: *"use the write-lecture skill on module 2 lesson 1"*.

### `write-lecture`

`lecture-steps.md` → `lecture.md`, written to the lesson folder root.

Reads the four relevant specs, then the notes, then the lesson's own material — `class-demo/` source, `boards/` filenames, the previous lesson for continuity. Plans the failure order before writing, runs the failure-mode checklist against its own output, and then reports **everything it added that wasn't in the notes**.

That last part matters most. Invented detail reads exactly like real detail, so it is the one error that cannot be caught by reading the output. Forcing it into the response makes it checkable.

### `write-quiz`

Lesson content → a `-QUIZ.md` / `-ANSWER-KEY.md` pair.

Two phases with a hard stop between them. Phase 1 writes nothing and proposes a plan: question count, a concept split with counts and depth (recall / apply / reason), what is deliberately left out, and which scenario domains it intends to use. I approve or amend. Phase 2 generates and then verifies mechanically — including counting the correct answers by letter, because an unshuffled answer key is the single most reliable way a generated quiz fails.

The stop exists because reworking a plan costs a minute and rewriting twelve questions does not.

## Working notes

- **Failure-mode tables are the maintenance surface.** When something comes back wrong, add a row rather than rewriting prose. Most of the current rows are predictions, not observations — they need replacing with real ones.
- **Exemplars beat templates.** No skeleton file anywhere is a copy-me template; they are illustrative shapes, and the real examples are in the lessons.
- **The specs are descriptive, the skills are procedural.** `docs/artifacts/quiz.md` says what a quiz is; `write-quiz` says how to make one. They reference each other and should never duplicate.

## Open questions

- **Learning outcomes have no home.** They are currently implicit in prose and folder ordering. If the university's framework turns out to be constructive-alignment-shaped, they will need somewhere concrete — probably frontmatter in each `lecture.md` — so activities and assessment can be checked against them rather than eyeballed.
- **Citation style.** Pages currently use a numbered linked list; Harvard is coming. Flagged in [style.md](style.md) so it changes in one place.
- **Whether any of this gets committed.** Local-only for now: it is unfinished, and students clone this repo. Options later are a private branch, a second repo, or just publishing it. Undecided, and there is no hurry.
- **Whether more artifact types are needed.** Self-study pages currently borrow the `lecture.md` spec and don't quite fit it.
