# `class-demo/`

## Purpose

A real, runnable project built live in front of the class. It is the thing the lecture is *about* — when `lecture.md` quotes a Dockerfile or a config file, this is where that file actually is.

It is teaching code. Written to be read aloud and explained, not to be production-grade. Missing error handling and absent abstraction layers are often deliberate: `01-docker-networking-and-compose` keeps its routes in `app.js` with no controllers or routes folder specifically so that the architecture doesn't distract from the networking.

## When it exists

In any lesson with a live-coded build. One per lesson, at `class-demo/` inside the lesson folder. It carries its own `package.json`, `.gitignore`, `Dockerfile` and so on — it is a project, not a snippet directory.

Demos build across lessons: the `04-intro-to-docker` demo containerises the app from kata 1, and the `01-docker-networking-and-compose` demo reuses that Dockerfile shape deliberately so students recognise it.

## Skeleton

```
class-demo/
├── src/
│   ├── app.js          # Express app, exports app, no .listen()
│   ├── server.js       # requires app, calls app.listen()
│   ├── config/         # database.js etc
│   └── models/
├── tests/              # jest + supertest
├── .env                # committed on purpose - see below
├── .dockerignore
├── .gitignore
├── Dockerfile
└── package.json
```

The `app.js` / `server.js` split is taught in kata 1 and every demo after it keeps the shape.

## Rules

- **Frozen at the state the class ended in.** This is the hard rule. Reinstalling dependencies, upgrading a package, tidying the code or "fixing" an oversight changes what the students are looking at and desynchronises the demo from the lecture that describes it. **Ask before touching anything in here.**
- **Never run `npm install`, `npm ci`, `docker build` or start a server** in a demo folder unless asked. A regenerated `package-lock.json` is a real and confusing diff.
- **The `.env` is committed on purpose.** It holds teaching values only (`PORT`, `ENVIRONMENT`, and local-only DB credentials like `admin123`). The whole point of the Docker lesson is watching `.dockerignore` exclude it and the app fall back to its defaults. This is the one place a committed `.env` is correct — never treat it as a template for anything else, and never put a real secret in one.
- **The health endpoint is an instrument.** It reports `environment` and `database` because the lesson diagnoses failures by reading it. Don't simplify it.
- **`node_modules/` is ignored**, per the root `.gitignore`.
- **Reading it is encouraged.** When writing `lecture.md`, quote these files rather than paraphrasing them.

## Failure modes

| Failure | What it looks like |
|---|---|
| **Helpful maintenance** | Dependencies bumped, a lockfile regenerated, a lint fix applied. The demo no longer matches the lecture, and nobody notices until a student does. |
| **Fixing the teaching bug** | Removing a deliberate weakness — flattening the naive Dockerfile, adding error handling that the lesson later introduces as the fix. |
| **Treating the `.env` as a leak** | Rewriting it to `.env.example`, or scrubbing the values. The committed `.env` is load-bearing for the lesson. |
| **Adding structure** | Splitting routes into a `routes/` folder because that is better practice. It is, and it is off-topic, and the notes usually say so explicitly. |
| **Paraphrasing in the lecture** | The lecture describes a file that is close to, but not, the file on disk. |

## Exemplars

- [`04-intro-to-docker/class-demo/`](../../01-cloud-services/module-1/04-intro-to-docker/class-demo/) — the minimal shape: Express, one health route, jest + supertest, a Dockerfile with a comment on every instruction.
- [`01-docker-networking-and-compose/class-demo/`](../../01-cloud-services/module-2/01-docker-networking-and-compose/class-demo/) — the same shape plus Sequelize, a model, Compose, and a health endpoint that reports database connectivity.
