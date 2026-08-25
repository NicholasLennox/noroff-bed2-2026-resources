# BED2 — Class Resources

Written notes, exercises and demo projects for **Back-End Development 2** at Noroff, maintained by Nicholas Lennox.

This repo is the *classroom* side of the course. **Moodle is still the spine** — your tasks, deadlines and submissions live there, and these notes refer to Moodle tasks by number (e.g. "Task 1.5") without repeating them. Use this repo to revisit what happened in a session, to catch up on one you missed, and to run the code we built together.

## Read this first

**Some of the code in these notes is wrong on purpose.**

Lessons are written the way the class actually ran. That often means we build something the obvious way, watch it break, and only then introduce the tool that fixes it. The broken version stays in the notes, because the break is the reason the fix exists.

So:

- **Read a `lecture.md` from the top, in order.** Don't skim to the first code block and copy it. The first Dockerfile in `04-intro-to-docker` is not the one you want.
- If a snippet looks off, keep reading — the section that follows almost certainly explains why.
- The **last** version of a file in a lesson is the one to learn from.

## Finding your way around

```
01-cloud-services/          # course topic, in delivery order
└── module-1/               # matches the module numbering on Moodle
    ├── 01-intro-to-cloud/  # one folder per lesson, in delivery order
    ├── 02-cloud-responsibility/
    └── ...
```

Numbers are **delivery order** — `01`, `02`, `03` is the order we covered them, and later lessons assume the earlier ones. `module-N` matches Moodle, so you can go from a Moodle module to the right folder and back.

Start at [`01-cloud-services/module-1/01-intro-to-cloud/lecture.md`](01-cloud-services/module-1/01-intro-to-cloud/lecture.md) and work forward.

## What's in a lesson folder

Not every lesson has all of these — each one takes what it needs.

| | What it is | What to do with it |
|---|---|---|
| `lecture.md` | The main resource. Self-contained: if you missed the class, this is the class. | **Read it.** This is the one thing in every lesson folder. |
| `kata/` | Hands-on exercises you build yourself, in stages. | **Do these.** See below. |
| `class-demo/` | The project we built live in the session. | Run it, read it, break it. |
| `boards/` | Photos of the whiteboard, numbered in the order they were drawn. | Reference, mostly. The notes usually say it better in words. |
| `*-QUIZ.md` + `*-ANSWER-KEY.md` | A knowledge check and its answers. | Do the quiz properly *before* opening the key. |
| `images/` | Diagrams the notes link to. | Nothing — they show up in `lecture.md`. |

New terms get a plain-English explanation in *[square brackets and italics]* right after they appear. If a term isn't glossed and you don't know it, that's a gap in the notes — tell me.

## Doing the katas

A kata is a build-it-yourself exercise, split into stages. Each stage ends with something that runs, and most end with **reflection questions**.

Those questions are the point of the exercise. Several of them can only be answered by deliberately breaking something and watching what happens — do that. It's meant to be done.

**Try these without AI.** Each kata links the official documentation for every library it uses. Learning to find an answer in the Express or Jest docs is a skill the course is actually assessing, and it's one you lose by shortcutting. Get stuck, sit with it, then ask me or ask a classmate.

## Running the class demos

You'll need [Node.js](https://nodejs.org/) 22 (the demos are containerised on `node:22-alpine`) and [Docker Desktop](https://www.docker.com/products/docker-desktop/) from module 1 lesson 4 onwards.

Dependencies aren't committed, so in any `class-demo/` folder:

```bash
npm install     # first time only
npm start       # run the API
npm test        # run the jest + supertest suite
```

The port comes from the demo's `.env` — `5000` in the module 1 demo, `3000` in module 2. Check the file; reading it is half the lesson.

**The `.env` files are committed on purpose.** They hold teaching values only, and one lesson depends on watching `.dockerignore` keep the `.env` *out* of an image. This is the one situation where a committed `.env` is correct — don't take it as a pattern. Real credentials never go in a repo.

### Module 2's demo also needs a database

[`01-docker-networking-and-compose/class-demo/`](01-cloud-services/module-2/01-docker-networking-and-compose/class-demo/) talks to MySQL in a container:

```bash
docker compose up -d               # database only — run the API on your machine with npm start
docker build -t todo-api .         # build the API image
docker compose --profile app up -d # database + API, both containerised
```

Those two modes are exactly the ones from the lesson, and the difference between them is the thing the lesson is about. If the API can't reach the database, re-read section 4 — that failure is the lesson, not a bug in the demo.

## A few practical notes

- **`git pull` before a session.** Notes get corrected and extended after class, sometimes days later.
- **Quiz and handout PDFs aren't in the repo** — they're handed out in class or on Moodle. The Markdown here is the source they're made from.
- **Found a mistake, a broken link, or something that doesn't make sense?** Tell me. These notes get rewritten based on what confuses people, and "I didn't understand section 3" is genuinely useful feedback.
