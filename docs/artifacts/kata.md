# Katas

## Purpose

A build-it-yourself exercise. The student writes the code; the kata gives the staging, the constraints, and the questions. It is not a walkthrough with the answers removed — the point is that a student who finishes it has a working thing they built and can explain.

The reflection questions are the assessment. Everything before them is scaffolding to make the questions answerable.

## When it exists

When a lesson has something a student can only learn by typing it. Concept lessons (`01-intro-to-cloud` aside, `02-cloud-responsibility`, `03-cost-and-virtualization`) don't have one; lessons that end in running code do.

Lives in `kata/` inside the lesson folder, named `BED2-<topic>-kata-N.md`. `N` counts within the topic, not the lesson.

## Skeleton

```markdown
# BED 2 <Topic> - Kata N

## Intro

Framing: what we are building and why it is built this way. Links to the
official docs for every library used, and an explicit line about using those
instead of AI.

## Stage 1: Name

**Goal:** one sentence, the observable end state.

1. Numbered steps.
2. Commands in backticks, code as fragments.
3. A step that verifies the stage worked (`curl -v ...`, `npm test`).

## Stage 2: Name

**Goal:** ...

### Reflection

- Why questions.
- At least one that requires breaking something to answer.
```

Not every stage needs a `### Reflection`; the last one always does. A `### Target structure` block showing the intended file tree belongs in any stage that reorganises the project.

## Rules

- **Stages are cumulative and each one ends running.** The student should never be more than one stage away from something that works. Stage 2 changes what stage 1 built; it doesn't start over.
- **Every stage has a verification step.** Hit the endpoint, run the tests, read the response. A stage the student can't confirm is a stage they will get wrong silently.
- **Code is a fragment, never a solution.** Give the shape — the `describe`/`it` skeleton, the response body they must produce — and let them write the connecting code. If a block could be pasted in and work, it is too much.
- **Point at docs, not at AI.** The intro links the real reference for every library involved and asks them not to use AI. This is deliberate: the exercise is partly about learning to read documentation.
- **Reflection questions ask why.** See [reflection over recall](../pedagogy.md). Good: "There are two places this project reads `process.env`. Do you need `dotenv` in both? What does that tell you about how the package works?" Bad: "What does `dotenv` do?"
- **At least one question per kata is answered by breaking something.** "Rename the `tests` folder, then run your tests. Now rename `health.test.js` to `health.e2e.js` instead. What happens in each case?" The student discovers Jest's resolution rules by watching them fail.
- **Questions may reach past the lesson.** Asking what they'd `.gitignore`, or why `--save-dev` differs from `npm i`, pulls in things they should be connecting. This is fine and wanted.

## Failure modes

| Failure | What it looks like |
|---|---|
| **Recall questions in the reflection** | Every question is answerable by re-reading the stage above it. The kata still "works" and teaches nothing. |
| **The answer is in the step** | The step says "add an async `/health` route **so the event loop isn't blocked**" and then the reflection asks why the route is async. |
| **Complete solutions** | A code block that runs as-is. Fragments only. |
| **No break-it question** | Everything can be answered from the armchair. |
| **Verification drift** | A stage tells the student to check `localhost:3000` after an earlier stage moved the port to 5000. Trace the port, the paths and the file locations through every stage. |
| **Stage sprawl** | Nine stages. Three or four, each with a real goal, beats a long list of micro-steps. |
| **AI-shaped hint text** | "Simply add the following", "Don't worry, this is easy". Kills the difficulty the exercise depends on. |

## Exemplar

[`module-1/01-intro-to-cloud/kata/BED2-cloud-services-kata-1.md`](../../01-cloud-services/module-1/01-intro-to-cloud/kata/BED2-cloud-services-kata-1.md) — three stages, cumulative, each verifiable. The stage 3 reflection is the model: seven questions, none of them recall, two of them requiring the student to break the project on purpose.

Its output is also the app that gets containerised in `04-intro-to-docker`, which is worth knowing — a kata can be the setup for a later lesson's demo.
