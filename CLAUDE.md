# BED2 Resources

Teaching materials for **BED2 (Back-End Development, year 2)** at Noroff, written and maintained by Nicholas Lennox. Everything here supports classroom delivery; the online course on **Moodle** is the spine the lessons loosely follow, so Moodle task numbers get referenced by name (e.g. "Task 1.5") without being reproduced here.

This is a **content repository, not a software project**. Most changes are prose. The code that does exist (`class-demo/`, kata solutions) is teaching material — written to be read and explained, not to be production-grade.

## The core workflow

The main thing I use Claude for:

1. I teach a class, improvising against a rough outline.
2. Afterwards I dump what actually happened into `lecture-steps.md` — unordered, typo-ridden, stream of consciousness, with asides about *why* I did something and what is coming later.
3. Claude turns that into `lecture.md`: a polished, self-contained learning aid a student can read on their own after the class.

Quizzes, katas and demos hang off that same spine.

## Where to look

These docs are the spec, not background reading. Read the relevant one **before** writing, not after.

| If you are… | Read |
|---|---|
| creating any new folder or file | [docs/structure.md](docs/structure.md) |
| writing any student-facing prose | [docs/style.md](docs/style.md) |
| writing or editing a `lecture.md` | [docs/artifacts/lecture.md](docs/artifacts/lecture.md) |
| reading my raw post-class notes | [docs/artifacts/lecture-steps.md](docs/artifacts/lecture-steps.md) |
| writing a kata | [docs/artifacts/kata.md](docs/artifacts/kata.md) |
| generating a quiz and answer key | [docs/artifacts/quiz.md](docs/artifacts/quiz.md) |
| touching a `class-demo/` project | [docs/artifacts/class-demo.md](docs/artifacts/class-demo.md) |
| referencing whiteboard photos | [docs/artifacts/boards.md](docs/artifacts/boards.md) |
| deciding *why* a lesson is shaped a certain way | [docs/pedagogy.md](docs/pedagogy.md) |
| wondering how this setup fits together | [docs/README.md](docs/README.md) |

Two skills automate the recurring transforms: **`write-lecture`** (`lecture-steps.md` → `lecture.md`) and **`write-quiz`** (lesson content → a plan I approve, then the quiz pair). Invoke them by name.

## Two READMEs, two audiences

- [`README.md`](README.md) at the root is **for students**. They clone this repo. It is committed, and nothing about the Claude setup, my notes, or how lessons get written belongs in it.
- [`docs/README.md`](docs/README.md) is **for me** — how Claude is used here, and what is still unsettled. Git-ignored, along with everything else in `docs/` and `.claude/`.

Keep them apart. When adding something, ask which audience it serves.

## Working with me

- **Ask before restructuring folders.** The layout is still settling and I want to be the one deciding it.
- **Don't run `npm install`, `docker build`, or start servers** unless I ask. Demo projects are pinned to the state the class ended in; a stray lockfile change is a real diff.
- **Don't commit or push** unless I ask.
- **Flag, don't invent.** If a section needs a fact I didn't give you, add it and tell me you added it. Silent invention is the one failure I can't catch by reading.
- The vision for this repo is deliberately unfinished. When you spot a pattern worth codifying — a recurring prompt, a document type produced the same way twice — say so and offer to write it up as a skill or a doc, rather than doing it silently.
