# BED2 Resources

Teaching materials for **BED2 (Back-End Development, year 2)** at Noroff, written and maintained by Nicholas Lennox. Everything here supports classroom delivery; the online course on **Moodle** is the spine the lessons loosely follow, so Moodle task numbers get referenced by name (e.g. "Task 1.5") without being reproduced here.

This is a **content repository, not a software project**. Most changes are prose. The code that does exist (`class-demo/`, kata solutions) is teaching material — it is written to be read and explained, not to be production-grade.

## Layout

`NN-course-topic/module-N/NN-lesson-slug/` — see [docs/structure.md](docs/structure.md) for the full conventions: what each lesson folder holds, the file types and their roles, naming rules, and what is deliberately kept out of Git.

Read `docs/structure.md` before creating any new folder or file.

## The core workflow

The main thing I use Claude for:

1. I teach a class, improvising against a rough outline.
2. Afterwards I dump what actually happened into `lecture-steps.md` — unordered, typo-ridden, stream of consciousness, with asides about *why* I did something and what is coming later.
3. Claude turns that into `lecture.md`: a polished, self-contained learning aid a student can read on their own after the class.

`lecture-steps.md` is my scratchpad, not a spec. Its headings organise **my** thinking; don't mirror them in `lecture.md`. Restructure freely. What must survive the translation is the *pedagogical order* — if I hit a problem in class and then introduced the tool that solves it, `lecture.md` keeps that sequence. The failure comes first, then the fix.

## House style for student-facing prose

Match the existing `lecture.md` files (`01-cloud-services/module-1/03-cost-and-virtualization/lecture.md` is a good reference). Concretely:

- **Numbered sections** — `## 1. Topic`, `### 1.1 Sub-topic`. A closing `## Sources` section with a numbered list of real, linked references.
- **Plain-English glosses in italic brackets** immediately after a term that might be new: `depreciation *[the accounting practice of writing off an asset's cost gradually over its useful life]*`. This is the signature move of these notes — use it generously for jargon, and say so in the intro blockquote when a page is dense with it.
- **Bold for the term being defined**, backticks for commands, filenames, flags, and exact spec terms (`rapid elasticity`, `docker run`).
- **A blockquote for the one-line takeaway** at the end of a section, when there is a sentence worth remembering: `> The client is a remote control. The daemon is the machine.` Use sparingly — one per major section at most, never as decoration.
- **Tables for genuine comparisons** (VM vs container), not for lists that happen to have two columns.
- **Diagrams by link**, not by ASCII art. Official docs images are preferred.
- Prose over bullet fragments. Bullets are for genuinely parallel items; anything with reasoning behind it gets a sentence.
- Plain, direct register. Explain the *why* behind a practice rather than asserting it as a rule. No hype, no "simply", no "as we all know".

### Teaching-specific rules

- **Naive first, then fix.** Where I deliberately taught something the wrong way to motivate a tool, keep the wrong version visible in the notes. Deleting it destroys the lesson.
- **Forward references stay soft.** If I mention Compose is coming later, note it as context, don't teach it early.
- **Every claim traceable.** Facts come from the class, the linked sources, or official docs. If something is needed to make a section coherent and I didn't say it, add it and flag it to me — don't quietly invent detail.
- **British/Norwegian-adjacent spelling** is inconsistent in my drafts; don't spend effort normalising it unless asked.

## Working with me

- **Ask before restructuring folders.** The layout is still settling and I want to be the one deciding it.
- **Don't run `npm install`, `docker build`, or start servers** unless I ask. Demo projects are pinned to the state the class ended in; a stray lockfile change is a real diff.
- **Don't commit or push** unless I ask.
- The vision for this repo is deliberately unfinished. When you spot a pattern worth codifying — a recurring prompt, a document type produced the same way twice — say so and offer to write it up as a skill or a doc, rather than doing it silently.
