# Express CI Starter

A deliberately tiny Express app used to teach Continuous Integration with GitHub Actions.

## The app

A single endpoint:

```
GET /health  ->  200  { "status": "ok" }
```

- `src/app.js` — the Express app, exported without listening (so tests can import it)
- `src/server.js` — starts the app on port 3000
- `tests/health.test.js` — integration test with jest + supertest

## Running it locally

```bash
npm ci        # install exactly what package-lock.json specifies
npm start     # http://localhost:3000/health
npm test      # run the integration tests
```

## The lecture: building CI one stage at a time

Each stage adds one concept to `.github/workflows/CI.yml`. Do not jump ahead — the
point is that students see each piece do its job before the next one appears.

### Stage 1 — Make something run

Trigger a workflow on every push to `main`. One job, one step, `echo "hello world"`.

**What to see:** push to `main`, open the **Actions** tab, watch the runner get picked up
and the job go green. Open the logs and find the `hello world` line.

**Concepts:** a workflow is a file in the repo; an event triggers it; a runner is a fresh
machine GitHub gives you; the logs are where you look when something goes wrong.

### Stage 2 — Add a check that can fail

Rename the job to `test`. Give it real steps:

1. `actions/checkout` — the runner starts empty, you have to pull your code onto it
2. `npm ci` — install dependencies
3. `npm test` — run the suite

**What to see:** a green run first, then deliberately break a test, push, and watch the
workflow go red.

**Concepts:** a step that exits non-zero fails the job; a failed job stops the ones that
depend on it. This is the whole idea of CI - an automated gate.

### Stage 3 — Move the gate to pull requests

Now that a failing check means something, `main` is no longer safe to push to directly.
Introduced **GitHub Flow**: branch, commit, open a PR, get it checked, merge.

Change the trigger from `push` to `pull_request` targeting `main`.

**What to see:**
1. Create a local branch and change the message the endpoint returns
2. Push the branch and open a PR on GitHub
3. Watch the pipeline start from the PR itself
4. Break a test to show the PR being blocked from merging
5. Fix it, watch the check go green, merge the PR
6. `git pull` on main, then delete the local branch (GitHub offers to delete the remote one)

**Concepts:** CI protects the shared branch; the PR is where the conversation and the
automated check meet; a red check is a merge blocker, not a suggestion.

*Next step (not covered yet): a `build` job that `needs` the test job to pass, then builds
the Docker image and pushes it to GHCR. A `Dockerfile` is already in the repo, ready for
when we get there.*
