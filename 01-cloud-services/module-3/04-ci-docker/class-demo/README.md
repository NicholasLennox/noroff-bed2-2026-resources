# Express CI — Build and Push

The same Express app as the last lesson. There the pipeline stopped at "the tests passed".
Here it keeps going and produces something: a Docker image, pushed to a registry.

## The app

```
GET /health  ->  200  { "status": "ok" }
```

- `src/app.js` — the app, exported without listening so tests can import it
- `src/server.js` — starts it on port 3000
- `tests/health.test.js` — jest + supertest
- `Dockerfile` — unchanged from module 1. The pipeline is what is new, not the image

```bash
npm ci      # install exactly what package-lock.json says
npm start   # http://localhost:3000/health
npm test
```

## Starting point

`CI.yml` has one job, `test`, triggered on push to `main` — not `pull_request`. While the
pipeline is the thing being built, you push straight to `main`. Protecting the branch comes
after it works.

Each stage below is one commit. Push after each one and look at the Actions tab.

---

### Stage 1 — A second job that waits

Building an image should only happen if the tests passed, so it is a *second* job that
declares a dependency on the first. Add at the same indentation as `test`:

```yaml
    build-and-push:
        needs: test
        runs-on: ubuntu-latest
        steps:
            - name: Checkout code
              uses: actions/checkout@v4

            - name: Show what we have
              run: ls -la
```

**See:** two boxes with an arrow between them in the run summary.

**Why:** `needs` orders the jobs. The checkout is repeated on purpose — each job gets its
**own fresh runner**, so job two starts as empty as job one did.

---

### Stage 2 — Prove the dependency

Break the app on purpose (`status: "okk"` in `src/app.js`), commit, push.

**See:** `test` goes red, `build-and-push` is **skipped** — grey, never started, no runner.
A skipped job is not a failed job.

Put the `k` back before continuing.

---

### Stage 3 — Log in and push to GHCR

Three steps replace the commands you have been typing by hand. The job needs permission
first, above `runs-on`:

```yaml
        permissions:
          packages: write
```

```yaml
            - name: Log in to GHCR
              uses: docker/login-action@v4
              with:
                  registry: ghcr.io
                  username: ${{ github.actor }}
                  password: ${{ secrets.GITHUB_TOKEN }}

            - name: Build and push
              uses: docker/build-push-action@v7
              with:
                  context: .
                  push: true
                  tags: |
                    ghcr.io/${{ github.repository }}:${{ github.sha }}
                    ghcr.io/${{ github.repository }}:latest
```

Nothing here was configured by you. `github.actor` is whoever pushed, `github.sha` is the
commit being built, `github.repository` is `Owner/repo`, and `secrets.GITHUB_TOKEN` is a
token Actions mints per run and throws away after — read-only until the `permissions` block
widens it.

**See:** it fails. `github.repository` is `NicholasLennox/express-ci-docker`, capitals and
all, and Docker rejects a capital letter in an image name before anything reaches the
registry.

**Why two tags:** `|` makes `tags:` a list, and a list of names costs one build. The SHA
answers "which code is this?" and never moves. `latest` answers "what is current?" and moves
every push. Anything watching a registry for a change is watching a moving tag, so one is not
a substitute for the other.

---

### Stage 4 — Name the image yourself

There is no `toLowerCase` to reach for. Expressions are not a programming language — the
functions are `contains`, `startsWith`, `endsWith`, `format`, `join`, `toJSON`, `fromJSON`
and `hashFiles`, and that is the list.

Two ways out. The one used here: stop deriving the name from the repository and just state
it, as a job-level `env` above `steps`:

```yaml
        env:
          IMAGE: nicholaslennox/health-api
```

```yaml
                  tags: |
                    ghcr.io/${{ env.IMAGE }}:${{ github.sha }}
                    ghcr.io/${{ env.IMAGE }}:latest
```

The image name is now yours, not an accident of what the repo is called.

The other way, when you do need it derived (a fork, a repo you do not own) — do the work in a
`run` step, where you have a full shell:

```yaml
            - name: Lowercase the image name
              run: echo "IMAGE=ghcr.io/${GITHUB_REPOSITORY,,}" >> $GITHUB_ENV
```

Two surfaces onto one value: `${{ github.repository }}` is a **context expression** Actions
evaluates before the step runs, and the only form that works inside `with:`.
`$GITHUB_REPOSITORY` is an **environment variable** that only exists inside a `run` shell.
`${VAR,,}` is bash lowercasing it. `>> $GITHUB_ENV` hands the result to later steps.

**See:** the **Packages** panel on the repo — one digest, two tags.

---

### Stage 5 — The same image, into ACR

A second registry is a second job. It runs *in parallel* with the GHCR one, because both only
declare `needs: test`.

The credential is the difference. **ACR → Settings → Access keys → Admin user**, enabled;
then **repo → Settings → Secrets and variables → Actions**, twice: `ACR_USERNAME`,
`ACR_PASSWORD`.

```yaml
    push-to-acr:
        needs: test
        runs-on: ubuntu-latest
        steps:
            - name: Checkout code
              uses: actions/checkout@v4

            - name: Log in to ACR
              uses: docker/login-action@v4
              with:
                  registry: beddemo.azurecr.io
                  username: ${{ secrets.ACR_USERNAME }}
                  password: ${{ secrets.ACR_PASSWORD }}

            - name: Build and push
              uses: docker/build-push-action@v7
              with:
                  context: .
                  push: true
                  tags: |
                    beddemo.azurecr.io/health-api:${{ github.sha }}
                    beddemo.azurecr.io/health-api:latest
```

Same action, same steps, different registry — the only thing that changed is a name. Then try
to print a secret: `run: echo ${{ secrets.ACR_PASSWORD }}` puts `***` in the log.

**Why:** `GITHUB_TOKEN` was created for you, scoped to this repo, and expires with the run.
`ACR_PASSWORD` you created, and it expires when you say so. A credential the platform owns
versus one you own.

---

*Next: getting from the registry to a running App Service inside the pipeline, with
`azure/webapps-deploy` and a publish profile.*
