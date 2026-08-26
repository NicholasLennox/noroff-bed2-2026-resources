# BED 2 Cloud Services - Kata 2

## Intro

You are given a working product API. The three endpoints do what they should and the tests pass - as long as a MySQL database happens to be sitting on `localhost:3307` with the exact name, user and password that are typed into `src/config/database.js`. On any other machine, in any container, on any cloud provider, this project is dead on arrival.

This kata adds no features. By the end the API still has the same three endpoints. What changes is the layer underneath them: where the configuration comes from, and whether the running application can tell you anything useful about itself. Those two things decide whether an application can be deployed, and they are exactly what the starter is missing.

Try work from the references rather than from AI - a good part of this exercise is learning to find the right key in a Compose file and the right option in the Sequelize docs.

- Sequelize: https://sequelize.org/docs/v6/getting-started/
- dotenv: https://www.npmjs.com/package/dotenv
- Express: https://expressjs.com/en/5x/api/
- Jest: https://jestjs.io/docs/getting-started
- Supertest: https://www.npmjs.com/package/supertest
- Docker Compose services reference: https://docs.docker.com/reference/compose-file/services/
- Compose profiles: https://docs.docker.com/compose/how-tos/profiles/
- Environment variables in Compose: https://docs.docker.com/compose/how-tos/environment-variables/
- The official MySQL image: https://hub.docker.com/_/mysql

### The starter

Copy `starter/` out of this repository into a folder of your own before you begin. You will be changing it heavily, and you want your own Git history of it.

```
starter/
├── src/
│   ├── app.js              # Express app, three routes, exports app
│   ├── server.js           # requires app, calls app.listen()
│   ├── config/database.js  # Sequelize connection
│   └── models/product.js   # name, price, inStock
├── tests/
│   ├── setup.js            # resets the table before each test file
│   ├── health.test.js
│   └── products.test.js
├── .gitignore
└── package.json
```

The finish line: one request to `/health` tells you which configuration the process actually loaded and whether it can reach its database, and one file in the repository starts the whole thing on a machine that has never seen it.

## Stage 1: Run what you were given

**Goal:** the starter running against MySQL in a container, tests green, and a written note of what `/health` gets wrong.

1. Copy `starter/` to your own folder and run `npm i`.
2. Open `src/config/database.js`. It states the database name, user, password, host and port this app expects. Your MySQL container has to match all five - the app will not meet it halfway.
3. Start MySQL 8 in a container. You need the container's `3306` published on host port `3307`, and the database name, user, password and root password set through the image's environment variables (they are listed in the MySQL image docs linked above). Do this either with `docker run` flags or with a `docker-compose.yml` holding a single `db` service. Compose is where this ends up in stage 3, so starting there saves you the translation later.
4. `npm start`, then in a second terminal: `curl -v http://localhost:3000/health`
5. `npm test`. The four product tests and the one health test should pass.
6. Now stop the database container - `docker stop <name>` or `docker compose stop db` - leave the API running, and do both checks again:
   - `curl -v http://localhost:3000/health`
   - `npm test`

**Write down what happened in step 6.** The tests noticed. The health endpoint did not. Everything after this stage exists because of that gap.

Start the database again before moving on.

## Stage 2: Externalise the configuration and make `/health` mean something

**Goal:** every value the application needs comes from its environment, and a single request to `/health` says which configuration was loaded and whether the database is reachable.

1. `npm i dotenv`
2. Create a `.env` at the project root. It holds `ENVIRONMENT`, `PORT`, and one variable per Sequelize connection value: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_DIALECT`. The values are the ones currently hardcoded in `src/config/database.js`, plus `ENVIRONMENT=development` and `PORT=3000`.
3. Rewrite `src/config/database.js` so that all six connection values are read from `process.env`. Give `DB_DIALECT` a fallback of `'mysql'`. Do not give the other five a fallback - decide for yourself why that is the right call before the reflection asks you.
4. In `src/server.js`, read `PORT` from the environment with a fallback of `3000`.
5. In `src/app.js`, read `ENVIRONMENT` from the environment with a fallback of `'default'`, and add it to the `/health` response body as `environment`.
6. Make `/health` actually ask the database whether it is there. `sequelize.authenticate()` returns a promise that rejects when the connection fails; wrap it in `try`/`catch` and add a `database` field to the response body that is either `connected` or `disconnected`.
7. When the database is unreachable the endpoint has to stop claiming everything is fine: both the `status` field and the HTTP status code change. Look up which 5xx code means "this service is up, but something it depends on is not" - do not just reach for `500`.
8. Extend `tests/health.test.js` with two more cases inside the existing `describe`:
   - the body has an `environment` property whose value is `.not.toBe('default')`
   - the body has a `database` property whose value is `connected`
9. Verify all three checkpoints, in this order:

| # | What you do | What `/health` must say |
|---|---|---|
| 1 | `npm start` with your `.env` in place | `environment: "development"`, `database: "connected"`, `200` |
| 2 | rename `.env` to `.env.bak`, restart the app | `environment: "default"`, `database: "disconnected"`, and the status code you chose in step 7 |
| 3 | rename it back, restart | the same as checkpoint 1 |

Run `npm test` at checkpoint 2 as well, and read which assertions failed and which still passed.

### Reflection

- In stage 1 you stopped the database and `/health` still answered `200 ok`. Who would be misled by that answer, and how long would it take anyone to notice the API was broken?
- `DB_DIALECT` got a fallback and `DB_HOST` did not. What makes a value safe to default? What actually happens at startup when `DB_HOST` is undefined, and is failing there better or worse than starting up successfully?
- `ENVIRONMENT` falls back to `'default'` and not to `'development'`. Checkpoint 2 shows you why. Explain it in one sentence.
- The test asserts `environment` is **not** `'default'` rather than asserting it **is** `'development'`. Given where this application runs in stage 3, what does the weaker assertion buy you?
- Three files now read `process.env`: `src/app.js`, `src/server.js` and `src/config/database.js`. How many of them call `require('dotenv').config()`? Remove that call from one of them, restart, and read `/health`. Then put it back and remove it from the file that is loaded first instead. What does the difference between the two experiments tell you about what `dotenv` actually does, and when?
- `.env` is not in the starter's `.gitignore`. Should it be? The class demo from yesterday commits its `.env` on purpose - what makes that safe there and a serious problem in a real project?
- `npm test` only passes when a database is running. Is that a flaw in the tests or the point of them? What would have to change for the product tests to run with no Docker at all, and what would you stop being able to trust?

## Stage 3: Put the API in a container next to its database

**Goal:** `docker compose --profile app up -d` brings up the API and the database in containers, and `/health` reports `environment: "docker"` with the database connected - without you editing `.env` once.

### Target structure

```
project-root/
├── src/
├── tests/
├── .dockerignore           # new
├── .env                    # stays on your machine, never enters the image
├── .gitignore
├── docker-compose.yml      # db service, plus an app service behind a profile
├── Dockerfile              # new
└── package.json
```

1. Write the `Dockerfile`. Base it on `node:22-alpine`, set a working directory, copy the package files, install with `npm ci`, then copy the rest of the project, document the port with `EXPOSE`, and run the start script. Put a comment on each instruction saying **why** it is there - in particular, why the package files are copied on a line of their own before everything else.
2. Write `.dockerignore`. `node_modules` and `.env` both belong in it, for two completely different reasons. Work out both.
3. `docker build -t product-api .`, then confirm the image exists with `docker images`.
4. If you do not have a `docker-compose.yml` yet, write the `db` service now - it is a direct translation of the `docker run` from stage 1, one key per flag.
5. Add an `app` service to the same file. It uses `image: product-api`, publishes the API's port, carries an `environment:` block with the same eight variables your `.env` has, and has a `profiles:` entry so that it only starts when you ask for it by name.
6. **Two of those eight values cannot be the same as the ones in your `.env`.** Work out which two, and why, before you run anything. If you copy `.env` across wholesale the container will start and then fail to reach the database - and the error it logs names the mistake precisely.
7. Bring it up: `docker compose --profile app up -d`, then `docker compose ps` and `curl -v http://localhost:3000/health`. You are looking for `environment: "docker"` and `database: "connected"`.
8. Prove the two modes coexist. `docker compose down`, then `docker compose up -d` with no profile, then `npm start` on your own machine. `/health` says `development` again, from the same repository, with nothing edited.

### Reflection

- Name the two values that had to differ between `.env` and the `environment:` block, and explain each in one sentence.
- Set `DB_HOST` to `localhost` in the `app` service, recreate the container, then read `docker compose logs app` and `/health`. What does `localhost` refer to inside that container, and why is that a different machine from the one you were on in stage 2?
- With the app running, change `ENVIRONMENT` to `docker-test` in the Compose file and run `docker compose --profile app up -d` again *without* running `down` first. Does the running container report the new value? Now try it with `--force-recreate`. What does this tell you about when a container's environment is decided, and what does `docker exec <container> env` let you check when you are unsure?
- The `db` service still publishes `3307:3306` even though the API now reaches it on `3306`. Why keep the published port at all?
- `app` sits behind a profile and `db` does not. Describe the working day that arrangement is designed for.
- Your Dockerfile runs `npm ci` and not `npm i`. What does `npm ci` require that `npm i` does not, which file in your project provides it, and what breaks if that file is not committed?
- `.env` is excluded by `.dockerignore`. Suppose it were not, and the image contained a `.env` saying `DB_HOST=localhost` while the Compose `environment:` block said `DB_HOST=db`. Which one wins, and why? Do not guess - take `.env` out of `.dockerignore`, rebuild, recreate, and read `/health`.
- None of these credentials are real, but the Compose file still carries a database password in version control. Name two things that would have to change about this project before it went near a deployment anyone depended on.
