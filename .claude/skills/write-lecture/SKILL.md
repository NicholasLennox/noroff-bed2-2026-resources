---
name: write-lecture
description: Turn a lesson's lecture-steps.md into the polished student-facing lecture.md. Use when Nicholas says "write the lecture", "use the write-lecture skill", or points at a lesson folder whose raw class notes are ready to be written up. Also use when revising an existing lecture.md against the notes.
---

# write-lecture

Transforms raw post-class notes into the lesson's `lecture.md`. The output goes at the **lesson folder root**, overwriting any existing `lecture.md`.

This is not a summarisation task. The notes are a record of what happened in a room, including things that were done wrong on purpose. The job is to rebuild that experience as something readable.

## 1. Locate

Work out which lesson folder is meant — from the argument, from the file currently open, or from the working directory. If it is genuinely ambiguous, ask; don't guess between two lessons.

Find `lecture-steps.md`. It is usually at the lesson root, but sometimes inside `class-demo/` (as in `04-intro-to-docker`). Check both before reporting it missing.

## 2. Read the specs

Read all four, in this order, before reading the notes:

- `docs/artifacts/lecture-steps.md` — how to read the notes, and how to tell direction from content
- `docs/artifacts/lecture.md` — the output spec and its failure-mode table
- `docs/style.md` — prose rules
- `docs/pedagogy.md` — why lessons are shaped the way they are

## 3. Gather the lesson's own material

Beyond the notes:

- **The `class-demo/` source, if there is one.** Read the actual files. Every code block in the lecture that describes the demo must be the real file, not a reconstruction.
- **`boards/` filenames** — they name the concepts covered and give the order they were drawn.
- **`images/`** — anything here is meant to be referenced.
- **The previous lesson's `lecture.md`** — for continuity of terminology, and so the recap section links rather than repeats.
- **Any kata whose output this lesson builds on.**

Do not run anything. No `npm install`, no `docker build`, no servers.

## 4. Plan before writing

Work out, explicitly:

- **What broke, and in what order.** If the lesson has a central failure, the document is built around it.
- **Which parts of the notes are direction, not content.** Directions like "don't re-teach this, walk it and let them recognise it" or "worth one sentence on X" constrain how you write and never appear in the output.
- **Which naive versions must survive.** Anything taught wrong on purpose stays visible.
- **What's missing.** Gaps you will need to fill in to make a section coherent. Keep this list — it goes in the response.

Then restructure freely. The notes' headings are Nicholas's thinking, not the reader's path.

## 5. Write

Write `lecture.md` to the lesson root. Follow the skeleton and rules in `docs/artifacts/lecture.md`. Length tracks the lesson — a short conceptual class produces ~100 lines, a long demo-heavy one produces 600+. Don't pad and don't compress.

## 6. Check your own output

Go through the failure-mode table in `docs/artifacts/lecture.md` one row at a time against what you just wrote. The ones that need real attention:

- [ ] **Headings.** Compare your section list to the notes' structure. If it maps 1:1, you mirrored the scratchpad — restructure.
- [ ] **The naive version is still there**, walked through, not summarised in retrospect.
- [ ] **No directions leaked.** Search your output for anything that reads as an instruction about the document rather than to the student.
- [ ] **Every code block matches a real file** in `class-demo/`, character for character where it is quoted.
- [ ] **Every URL in `## Sources` is one you have actually seen** — in the notes, in the existing lessons, or fetched. Delete any you can't stand behind; cite by name instead.
- [ ] **Takeaway blockquotes are earned.** One per major section at most, and not on sections that proved nothing.
- [ ] **Glosses present** for terms a second-year student meets for the first time here.
- [ ] **No `## Summary` or `## Conclusion`.**

Fix what fails, then report.

## 7. Report

In the response, not in the file:

1. The structure you chose and why it differs from the notes' ordering.
2. **Everything you added that wasn't in the notes** — each item, and why the section needed it. This is the part Nicholas cannot check by reading, so it must be complete.
3. Anything in the notes you deliberately left out.
4. Anything ambiguous you resolved by choosing, and what you chose.
