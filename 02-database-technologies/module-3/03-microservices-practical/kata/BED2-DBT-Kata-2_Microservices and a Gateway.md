# BED 2 Database Technologies - Kata 2

## Contents

- [Intro](#intro)
- [Stage 1: The books service](#stage-1-the-books-service)
- [Stage 2: The members service](#stage-2-the-members-service)
- [Stage 3: The gateway](#stage-3-the-gateway)
- [Stage 4: Logging and rate limiting](#stage-4-logging-and-rate-limiting)
- [Reflection](#reflection)
- [Bonus](#bonus)
  - [Bonus 1: Tests](#bonus-1-tests)
  - [Bonus 2: A database for each service](#bonus-2-a-database-for-each-service)

## Intro

This kata is about building two microservices that each own their own data, and putting an API gateway in front of them as the single entry point. The gateway forwards requests with `express-http-proxy`, logs every request, and rate limits clients with `express-rate-limit`.

A town library is replacing its old front-desk system. The catalogue team and the membership team want to release changes on their own schedules, so the new system is split into two services: one for **books** and one for **members**. The library's website and its self-checkout kiosks will only ever call one address, which is the gateway.

| Project | Port | Owns |
|---|---|---|
| `gateway/` | 3000 | Nothing. It forwards `/books` and `/members` to the services |
| `books-service/` | 3001 | The library's books |
| `members-service/` | 3002 | The library's members |

Each service keeps its data in an in-memory array. There's no database in this kata until the bonus.

Work through the [Adding a Gateway lecture](../../02-adding-a-gateway/lecture.md) alongside this kata. Sections 4 to 6 build the same kind of gateway in front of the health-monitoring services.

You can work from the following references:

- Express routing: https://expressjs.com/en/guide/routing.html
- Express `req` and `res`: https://expressjs.com/en/5x/api/
- `crypto.randomUUID()`: https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
- express-http-proxy: https://www.npmjs.com/package/express-http-proxy
- express-rate-limit: https://www.npmjs.com/package/express-rate-limit
- Jest: https://jestjs.io/docs/getting-started
- Supertest: https://www.npmjs.com/package/supertest
- Mongoose: https://mongoosejs.com/docs/guide.html
- REST Client for VS Code: https://marketplace.visualstudio.com/items?itemName=humao.rest-client

This kata is split into 4 stages. The first builds the books service, the second builds the members service, the third puts the gateway in front of both, and the fourth adds logging and a rate limit to the gateway.

## Stage 1: The books service

**Goal:** a books service on port `3001` that can list books, find one by its ID, and add a new one.

### Target structure

```
library/
└── books-service/
    ├── src/
    │   ├── app.js       # Express app, exports app
    │   └── server.js    # requires app, calls app.listen()
    ├── .env
    └── package.json
```

### Steps

1. Create a `library/` folder for the whole kata, and a `books-service/` folder inside it. Set it up as its own Node project with Express and dotenv, with `start` and `dev` scripts.
2. Create `.env`:
   ```
   PORT=3001
   SERVICE_NAME=books-service
   ENVIRONMENT=development
   ```
3. In `src/app.js`, create an array of 3 or 4 books to start with. Every book has this shape:
   ```js
   {
     id: '0b7c5e2a-4f1d-4c39-9a7e-2d6f1b8e3c55',
     title: 'The Hobbit',
     author: 'J.R.R. Tolkien',
     year: 1937
   }
   ```
   Don't type the IDs by hand. Generate each one with `crypto.randomUUID()`, which is built into Node. It returns a **UUID** *[universally unique identifier: a random ID written as 36 characters, like the one above. You'll also see it called a **GUID**, which is Microsoft's name for the same thing]*.
4. Build these endpoints:

   | Endpoint | Response |
   |---|---|
   | `GET /health` | `200` with `status`, `service` (from `SERVICE_NAME`), `uptime`, `timestamp` and `environment` |
   | `GET /` | `200` with every book |
   | `GET /:id` | `200` with that book, or `404` with `{ "error": "..." }` if there's no book with that ID |
   | `POST /` | `201` with the new book, or `400` with `{ "error": "..." }` if the body is invalid |

5. `POST /` takes a JSON body with a `title`, an `author` and a `year`. Reject it with a `400` if:
   - any of the three is missing,
   - `title` or `author` isn't a string, or is an empty string,
   - `year` isn't a whole number,
   - `year` is in the future.

   Write these checks yourself, without a validation library. The service generates the new book's `id`. If the client sends an `id` in the body, it's ignored.
6. Run the service with `npm run dev` and check every endpoint:
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3001/
   curl http://localhost:3001/<an id from the list>
   curl -X POST http://localhost:3001/ -H "Content-Type: application/json" -d '{"title":"Dune","author":"Frank Herbert","year":1965}'
   ```
   Instead of curl, you can keep your requests in a `requests.http` file and send them with the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension in VS Code, the same way as in the module 2 books API. A POST in a `.http` file looks like this:
   ```http
   POST http://localhost:3001/
   Content-Type: application/json

   {
     "title": "Dune",
     "author": "Frank Herbert",
     "year": 1965
   }
   ```
   Separate requests in the file with a line of `###`. The file stays in the project, so you can run every check again in later stages.
7. Now check the failures: an ID that doesn't exist, a POST with no `title`, a POST with `"year": 2999`, and a POST with `"year": "1965"`.

**Verification:** after you POST a book, `GET /` includes it. A request for an ID that doesn't exist returns `404`. The three bad POSTs each return `400` with an `error` message, and none of them shows up in `GET /`.

## Stage 2: The members service

**Goal:** a members service on port `3002` that can list members, find one by its ID, and add a new one.

### Steps

1. Create `library/members-service/` as a separate Node project, with its own `package.json` and its own `.env`:
   ```
   PORT=3002
   SERVICE_NAME=members-service
   ENVIRONMENT=development
   ```
2. Start it with an array of 3 or 4 members. Every member has this shape:
   ```js
   {
     id: 'c41e9d70-8a2b-4f6e-b1d3-57a0e6f2c918',
     name: 'Ada Lovelace',
     email: 'ada@example.com',
     joined: '2026-09-14T10:30:00.000Z'
   }
   ```
   The IDs work the same way as in the books service: each `id` is a UUID generated with `crypto.randomUUID()`, never typed by hand.
3. Build the same four endpoints as the books service: `GET /health`, `GET /`, `GET /:id` and `POST /`, with the same status codes.
4. `POST /` takes a `name` and an `email`. Reject it with a `400` if either is missing, isn't a string, or is empty, or if `email` has no `@` in it. The service sets both `id` and `joined` (the current date and time, as an ISO string). If the client sends either one, it's ignored.
5. Run both services at the same time, each in its own terminal.

**Verification:** `curl http://localhost:3002/health` names `members-service`, a POST to `http://localhost:3002/` adds a member with a `joined` date you didn't send, and the books service on `3001` still answers.

## Stage 3: The gateway

**Goal:** a gateway on port `3000` that forwards `/books` to the books service and `/members` to the members service.

### Target structure

```
library/
├── gateway/
│   ├── src/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   └── package.json
├── books-service/
└── members-service/
```

### Steps

1. Create `library/gateway/` as a third Node project, with Express, dotenv and `express-http-proxy`.
2. Create `.env`. The gateway reads the two service addresses from here rather than having them written into the code:
   ```
   PORT=3000
   SERVICE_NAME=gateway
   ENVIRONMENT=development

   BOOKS_URL=http://localhost:3001
   MEMBERS_URL=http://localhost:3002
   ```
3. Give the gateway its own `GET /health`, with the same shape as the services' health endpoints.
4. Mount one proxy for each service: `/books` forwards to `BOOKS_URL`, and `/members` forwards to `MEMBERS_URL`. Neither service changes.
5. Run all three projects, each in its own terminal.
6. Repeat every check from stages 1 and 2, this time through the gateway. For example:
   ```bash
   curl http://localhost:3000/books
   curl http://localhost:3000/members/<an id from the list>
   curl -X POST http://localhost:3000/books -H "Content-Type: application/json" -d '{"title":"Dune","author":"Frank Herbert","year":1965}'
   ```
   If you're using `.http` files, change the address in each request to port `3000` and add the service's path.

**Verification:** every request from stages 1 and 2 gets the same response through port `3000` as it did directly, including the POSTs and the failures.

## Stage 4: Logging and rate limiting

**Goal:** the gateway logs one line for every request it receives, and turns a client away after 10 requests in a minute.

### Steps

1. Add a logging middleware to the gateway. It writes one line with `console.log` as each request arrives, and then calls `next()`. The line says which service the request is heading for:
   ```
   09:12:44 - books-bound GET /books/0b7c5e2a-4f1d-4c39-9a7e-2d6f1b8e3c55
   09:12:51 - members-bound POST /members
   09:13:02 - gateway-bound GET /health
   ```
   To get the service name:
   - Use `req.path`. Your logger runs before the proxies, so it still sees the full path, such as `/books/0b7c...`.
   - Splitting `req.path` on `/` gives you an array whose second item is the service name.
   - `/health` is the gateway answering for itself, so label it `gateway`.
2. Send a few requests to each service and to `/health`, and check the gateway's terminal.
3. Install `express-rate-limit` in the gateway, and add a limiter that covers every request. Set two options only:
   - `windowMs`: one minute, in milliseconds.
   - `limit`: 10 requests.
4. Send requests to `http://localhost:3000/books`, more than 10 within a minute, and watch the status code of each response.

**Verification:** the first requests return `200`, and once you go past 10 they return `429 Too Many Requests`. The gateway's terminal has a log line for each request it let through. The limit resets when the gateway restarts, so if the numbers don't add up, wait a minute or restart it and try again.

## Reflection

1. A librarian adds a new book through the gateway, and you copy its `id`. Overnight, the books service is restarted. Restart yours, then request that `id` again. What came back, and why?
2. Your services ignore any `id` the client sends and always generate their own. Imagine the self-checkout kiosk were allowed to choose the `id` of a new book instead. What could go wrong?
3. Stop the members service, then call `/members` through the gateway, and then call `/books`. What does the difference between the two responses tell you about how a microservice system fails, compared to a monolith?
4. Validation lives inside each service, while logging and rate limiting live in the gateway. Why shouldn't the gateway also check that a new book has a `title`?
5. The library wants to start lending books. A loan records which member has borrowed which book. The books service can't see the members array, and the members service can't see the books array. Where would you put loans? Think about how, from wherever you put them, you'd know the book and the member actually exist.

## Bonus

### Bonus 1: Tests

**Goal:** Jest and Supertest tests for each service, inside that service's own folder, that cover every endpoint and every way it can succeed or fail.

For this bonus, you'll use an AI to write the first version of the tests, and then check how well it did.

#### Steps

1. Before asking an AI anything, go through the endpoint table and the validation rules for the books service. Write down every case that needs a test. For example, `GET /:id` has two outcomes, and `POST /` has one success case and a `400` for each rule.
2. Install Jest and Supertest as dev dependencies of the books service, and add a `test` script. Tests go in `books-service/tests/`.
3. Give an AI your `src/app.js` and ask it to write Jest and Supertest tests for it.
4. Run `npm test`. Then go through your list from step 1 and tick off each case the AI's tests actually cover.
5. Remove one validation rule from `app.js`, such as the check that `year` isn't in the future, and run the tests again. Put the rule back afterwards.
6. Write tests by hand for every case on your list that isn't covered yet.
7. Do the same for the members service, starting again from step 1.

**Verification:** `npm test` passes in each service on its own, and every case on your list has a test.

#### Reflection

- Which cases on your list did the AI's tests miss?
- In step 5, did any test fail? What did that tell you that reading the tests didn't?

### Bonus 2: A database for each service

The prototype works. The library's teams are happy with how both services behave, and now they want to try them with real data that survives a restart. That means each service gets its own MongoDB database, and the arrays go.

Recall the Mongoose books API from module 2. It had a schema with its validation rules, a model, an error handler that turned a `ValidationError` into a `400`, and middleware that rejected an ID that couldn't be an `ObjectId`. Each service here needs the same parts.

**The IDs change.** MongoDB gives every document an `_id` when it's saved, so the services stop generating their own and `randomUUID()` comes out. Records now come back with `_id` instead of `id`. `GET /:id` gains a third outcome: a `400` for an ID that isn't a valid `ObjectId` at all, using `mongoose.isObjectIdOrHexString()`, alongside the `200` and `404` it already had.

**The databases share a server.** Both services connect to the same MongoDB server, but each one uses its own database:

```
books-service    MONGODB_URI=mongodb://127.0.0.1:27017/library-books
members-service  MONGODB_URI=mongodb://127.0.0.1:27017/library-members
```

Each service only knows its own connection string, so each one still owns its data, which is what a microservice should do. What the library gives up is that the server is a **single point of failure** *[one part that takes the whole system down when it fails]*: if it goes down, both services go down with it. The library accepts that for now, because one server is cheaper and simpler to run while the system is small.

**Goal:** both services store their data in their own MongoDB database, and the gateway works exactly as before.

#### Steps

1. Install Mongoose in each service. Pin it to `~9.9.5`, as in module 2: version 9.10 installs a MongoDB driver that can't connect from inside Jest.
2. Add `MONGODB_URI` to each service's `.env`.
3. Change each service's `server.js` so it connects to MongoDB before it starts listening.
4. Give each service a schema and a model. The validation rules from stages 1 and 2 move into the schema, and the hand-written checks come out.
5. Replace every use of the array with the model.
6. Add the `400` for an invalid ID to `GET /:id`.
7. Run all three projects and repeat the checks from stage 3 through the gateway.

**Verification:** a book you add through the gateway is still there after you restart the books service, and fetching it by its `_id` returns it.

#### Fixing the tests

Run `npm test` in each service. Tests that passed against the arrays fail now.

The tests use `app.js`, which never connects to MongoDB, so they need a connection of their own. They get their own database too, so a test run never touches your real data:

```
MONGODB_TEST_URI=mongodb://127.0.0.1:27017/library-books-test
```

In each service:

1. Add `MONGODB_TEST_URI` to `.env`.
2. Create `tests/setup.js`, the same way as in module 2. It connects before the tests, and drops the database and disconnects after them. Before each test, it empties the collection and inserts your starting data with `insertMany()`. Your array from stage 1 is that starting data, without the `id`s.
3. Add this to `package.json`, and change the `test` script to `jest --runInBand`:
   ```json
   "jest": {
     "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"]
   }
   ```
4. Run `npm test` again, and fix whatever still fails.

**Verification:** `npm test` passes in each service.

#### Reflection

- Go back to reflection question 1 and do it again. What's different now, and what changed to make it different?
- Some of your tests still failed after you added `setup.js`. What did you have to change in them?
- Some of your tests passed without any change, even though you swapped the array for a database. What were those tests actually checking?
