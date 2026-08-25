# `lecture.md`

## Purpose

The deliverable. A polished, self-contained learning aid produced after the class from [`lecture-steps.md`](lecture-steps.md). A student who missed the session should be able to read it alone and end up where the room ended up — not just knowing the conclusions, but having been walked through the same failures that produced them.

It is not a transcript, not a summary, and not a reference sheet. It is the class, rewritten so it reads.

## When it exists

Every taught lesson has exactly one, at the lesson folder root. Self-study lessons have one too, but shaped differently — it frames the Moodle tasks and the assigned reading rather than reconstructing a session (see `05-self-study`).

## Skeleton

```markdown
# Title

> Intro blockquote: what this covers, what it assumes, and — if the page is
> jargon-dense — a line saying new terms get a plain-English gloss in brackets.
> If the lesson has a central failure, name it here.

## 1. First topic
...prose, with ### 1.1 sub-sections where a topic has parts

> One-line takeaway, when the section proved something worth compressing.

## N. Command reference        <- only for tool-heavy lessons
## N. Sources
```

Section count tracks the lesson, not a target. `03-cost-and-virtualization` is 100 lines across 3 sections; `01-docker-networking-and-compose` is 644 across 6. Both are correct.

Formatting rules — glosses, bold, backticks, takeaway blockquotes, tables, code comments — live in [../style.md](../style.md).

## Rules

- **Pedagogical order survives; my headings do not.** `lecture-steps.md` headings organise *my* thinking. Restructure freely. What must survive is the sequence: if I hit a problem in class and then introduced the tool that solves it, the document keeps that order. The failure comes first, then the fix.
- **Keep the naive version.** See [naive first, then fix](../pedagogy.md). The wrong Dockerfile stays in the document.
- **Obey directions in the steps, don't transcribe them.** "Same shape as module 1, so don't re-teach it — walk it and let them recognise it" is an instruction about how to write the section. It is not content, and it never appears in the output.
- **Recap sections are recaps.** When a lesson builds on the last one, open by re-establishing where we left off in a few sentences. Don't re-teach; link to the previous `lecture.md`.
- **Anchor claims about the demo in the demo.** The `class-demo/` source is right there. Quote the real file, not a paraphrase of it.
- **Flag additions.** If a section needs connective tissue that wasn't in the notes, write it and say so in the response — what was added and why. Never quietly invent detail.
- **Soft forward references only.** Mention what's coming; don't teach it.

## Failure modes

Things that go wrong specifically when this is generated. Check every one before handing it back.

| Failure | What it looks like |
|---|---|
| **Mirroring the scratchpad** | The output has the same headings as `lecture-steps.md`, in the same order, including "PART 2" and "DEMO:". |
| **Tidying away the failure** | The naive Dockerfile is gone, or the broken state is described in past tense in one sentence instead of being walked through. The most damaging failure on this list. |
| **Transcribing an instruction** | "We won't re-teach this here" reaches the student, because it was in my notes. |
| **Silent invention** | A plausible technical detail that was in neither the class nor the sources. Usually a version number, a default value, or a mechanism explained one level deeper than anyone actually knows. |
| **Fabricated sources** | A well-formed URL to a page that does not exist. Never guess a link. |
| **Bullet collapse** | Reasoning that was a paragraph in the notes becomes four bullet fragments, and the causal connective — the *because* — is lost. |
| **Takeaway inflation** | A blockquote at the end of every section, including ones that proved nothing. They stop being memorable the moment they are routine. |
| **Bolted-on summary** | A `## Summary` or `## Conclusion` section. Not house style; the takeaway blockquotes already do this job. |
| **Losing the aside** | The notes explain *why* something was done in a parenthetical, and the output keeps the what and drops the why. The asides are usually the most valuable content in the file. |

## Exemplars

- [`module-1/04-intro-to-docker/lecture.md`](../../01-cloud-services/module-1/04-intro-to-docker/lecture.md) — the model for naive-first. Also shows the `## Command reference` section and a "recurring mistakes" sub-section.
- [`module-2/01-docker-networking-and-compose/lecture.md`](../../01-cloud-services/module-2/01-docker-networking-and-compose/lecture.md) — the model for a lesson built around one central failure, and for opening with a recap of the previous lesson.
- [`module-1/03-cost-and-virtualization/lecture.md`](../../01-cloud-services/module-1/03-cost-and-virtualization/lecture.md) — the model for a short conceptual lesson with no demo. Best single example of the house voice.
