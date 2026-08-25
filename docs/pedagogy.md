# Pedagogy

The why-layer. Everything in [artifacts/](artifacts/) says *what a document looks like*; this file says *why a lesson is shaped the way it is*. When the two conflict, this file wins and the artifact spec is the thing that needs updating.

**Status: mostly a stub.** The principles below are the ones already visible in the delivered lessons, reverse-engineered from them rather than written down in advance. The formal material from the university is not here yet.

## Principles currently in force

### Naive first, then fix

Where something was deliberately taught the wrong way in order to motivate a tool, **the wrong version stays visible in the notes**. The naive Dockerfile that copies `node_modules` into the image is not an error to be corrected away — it is the entire reason `.dockerignore` exists, and deleting it destroys the lesson.

The sequence is always: do the obvious thing → hit the wall → name the wall → introduce the fix. Never: here is the fix, and here is the problem it would have solved.

### The failure is the lesson

In `01-docker-networking-and-compose`, the API loses the database the moment it moves into a container. That break is not an incident in the lesson, it *is* the lesson. When a lesson has a central failure, the document should build towards it, sit in it long enough for the student to feel it, and only then resolve it.

Corollary: when two things break at once, fix them one at a time and in an order that makes the remaining failure impossible to misattribute.

### Forward references stay soft

If Compose is coming in three weeks, a lesson may say so as context. It does not teach it early. A soft forward reference orients the student; a hard one steals the next lesson's payoff.

### Reflection over recall

Kata reflection questions ask *why*, and several are deliberately answerable only by breaking something and observing the result. "Rename the `tests` folder and run your tests — what does that tell you about how Jest finds tests?" is the shape. "What does `--save-dev` do?" is not.

### Every claim traceable

Facts come from the class, the linked sources, or official docs. If something is needed to make a section coherent and it wasn't in the class notes, it gets added **and flagged** — never quietly invented.

## Not here yet

- **The university's pedagogical framework.** To be brought in and used to rework the existing lessons.
- **Learning outcomes.** Currently implicit in prose and folder ordering. If the framework is constructive-alignment-shaped, outcomes will need somewhere concrete to live — probably frontmatter in each `lecture.md` — so that activities and assessment can be checked against them rather than eyeballed.
- **Assessment design beyond the quiz format.** `artifacts/quiz.md` describes the mechanics of a good multiple-choice item; it says nothing about what the quiz is *for*, how much of a lesson should be assessed, or where a quiz is the wrong instrument.
