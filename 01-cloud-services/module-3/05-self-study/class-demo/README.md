# Express CD Starter

The same shape as the last two lessons, with one addition: the app reads a value from its
environment, and `/health` reports it back.

```
GET /health  ->  200  { "status": "ok", "environment": "development" }
```

- `src/app.js` — the app, exported without listening so tests can import it
- `src/server.js` — starts it on `PORT`, defaulting to 3000
- `tests/health.test.js` — jest + supertest
- `.env` — `ENVIRONMENT` and `PORT` for local runs
- `Dockerfile` — same shape as module 1
- `.github/workflows/ci-cd.yml` — test, then build and push to GHCR

## Running it locally

```bash
npm ci        # install exactly what package-lock.json specifies
npm start     # http://localhost:3000/health
```

`npm start` reads `.env`, so `/health` reports `"environment": "development"`.

The tests are different. They assert the app reports `"test"`, which is not what `.env` says,
so the value has to come from the environment the tests run in:

```bash
ENVIRONMENT=test npm test
```

Run `npm test` on its own and the third test fails with `expected "test", received
"development"` — the app is reporting what `.env` gave it. That is the same failure the
pipeline hits, for the same reason.

## Configuration, and where it comes from

The app never asks where `ENVIRONMENT` came from. It reads `process.env` and reports what is
there. What changes between one place and another is who put the value in:

| Where it runs | Who supplies `ENVIRONMENT` |
|---|---|
| Your machine, `npm start` | `.env`, loaded by `dotenv` |
| Your machine, `npm test` | your shell, on the command line |
| The runner, in CI | the `env:` block on the `test` job |
| A container | whatever the platform passes in — `.env` is excluded by `.dockerignore` |

That last row is the one the deployment depends on. `.env` is a local convenience and never
travels: it is not in the image, so a container gets its configuration from the App Service
app settings instead.

## Starting point

`ci-cd.yml` goes as far as the last lesson did, plus the `env:` block on the `test` job:

```yaml
    test:
        runs-on: ubuntu-latest

        env:
          ENVIRONMENT: test

        steps:
            ...
```

Delete those two lines and push to watch the test job fail on the runner.

The rest of the file is the `build-and-push` job from lesson 4 — log in to GHCR with
`GITHUB_TOKEN`, build, and push under two tags, the commit SHA and `latest`.

Deployment is what this lesson adds.
