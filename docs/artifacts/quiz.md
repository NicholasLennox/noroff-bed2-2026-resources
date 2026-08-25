# Quizzes and answer keys

## Purpose

A scenario-based multiple-choice knowledge check. It tests whether a student can *apply* a concept to a situation they have not seen, not whether they can recognise a definition they have read.

Handed out on paper or as a PDF, usually at the start of the lesson after the one being tested — a recap instrument, not a graded assessment.

## When it exists

When a block of conceptual material needs to be checked before the course builds on it. Always as a **pair**, always the same stem, always both files:

```
cloud-knowledge-check-QUIZ.md
cloud-knowledge-check-ANSWER-KEY.md
```

At the lesson root of the lesson where the quiz is handed out — often the lesson *after* the one being tested. `cloud-intro-recap-quiz` sits in `02-cloud-responsibility` and tests `01-intro-to-cloud`.

The `.pdf` renders are generated from these and are git-ignored. The Markdown is the source of truth.

## Skeleton

Quiz:

```markdown
# <Topic> Knowledge Check

Brief instruction line: how many questions, whether it is open book.

## 1. <Scenario, 1-3 sentences of a concrete situation>

Which <concept> does this describe?

A. ...
B. ...
C. ...
D. ...
```

Answer key:

```markdown
# <Topic> Knowledge Check - Answer Key

## 1. Correct answer: C - <restate the option text>

Why: the distinguishing feature that makes C right.

Why not the others: what each distractor would have needed to be correct.
```

## Rules

- **Scenarios must not reuse class examples.** If the lecture used Netflix for elasticity, the quiz uses something else. Reusing an example turns the question into pattern-matching on a phrase, which is precisely what this instrument is trying not to measure.
- **Distractors are plausible neighbours from the same lesson.** The wrong answers for a `rapid elasticity` question are the other four essential characteristics — not unrelated nonsense. A student who half-understands must be able to fall for one.
- **The key discriminates; it does not define.** Restate the correct option, then give the *distinguishing feature* that rules the others out. "Resource pooling is about the provider serving many tenants from shared hardware; the scenario says nothing about other customers, so it is elasticity" is a key. "Rapid elasticity means resources scale with demand" is a definition, and it is not enough.
- **Shuffle the correct option across A-D.** This is a mechanical check, not an intention — see below.
- **The question must not be answerable without the lesson.** If general technical knowledge or common sense picks the right option, the item is not testing anything.
- **One concept per question.** A question that needs two ideas to answer can't tell you which one the student is missing.

## Failure modes

These are specific to generated quizzes and every one of them has happened.

| Failure | What it looks like | Check |
|---|---|---|
| **Unshuffled key** | The correct answer is A for most or all questions, or falls into a visible pattern. **The single most common failure here.** | Count the answers by letter. For 8+ questions no letter should hold more than ~40%, and no letter should be absent. Fix by swapping option *text*, then re-reading the key. |
| **Class examples recycled** | The scenario is the lecture's example with the company name changed. | Diff the scenarios against the source `lecture.md`. |
| **Giveaway distractors** | Three options are obviously absurd. Answerable without reading the stem. | Each distractor must be defensible by a student who misunderstood one specific thing. |
| **Key restates the definition** | "Why: because SaaS means software as a service." Says nothing about why B was wrong. | Every key entry names what would have had to be different for each distractor to win. |
| **Key/quiz drift** | An option was reworded in the quiz and not in the key, so the key quotes text that no longer exists. | Read the key's restated option text against the quiz, verbatim, question by question. |
| **Terminology drift** | The quiz says "service model" where the lecture said "cloud service model". | Terms come from the lecture, exactly. |
| **Uneven coverage** | Six questions on one section and none on the other four. | This is what the planning phase exists to catch. |

## Process

Generated in two phases by the `write-quiz` skill: a **plan** — question count and concept split — reviewed by Nicholas before anything is written, then generation and verification. Don't skip to generation; the plan is where coverage gets fixed cheaply.

## Exemplars

- [`02-cloud-responsibility/cloud-intro-recap-quiz.md`](../../01-cloud-services/module-1/02-cloud-responsibility/cloud-intro-recap-quiz.md) and its [answer key](../../01-cloud-services/module-1/02-cloud-responsibility/cloud-intro-recap-quiz-answers.md)
- [`04-intro-to-docker/cloud-knowledge-check-QUIZ.md`](../../01-cloud-services/module-1/04-intro-to-docker/cloud-knowledge-check-QUIZ.md) and its [answer key](../../01-cloud-services/module-1/04-intro-to-docker/cloud-knowledge-check-ANSWER-KEY.md)

Note the two different naming conventions in use. `<topic>-QUIZ.md` / `<topic>-ANSWER-KEY.md` is the newer one — prefer it, and match whatever a lesson already uses.
