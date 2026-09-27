# Books API

A CRUD API for books, built with Express and Mongoose on MongoDB. It has a search across title, author and tag, and it returns proper error responses for bad input.

## Running it

With MongoDB installed locally (the one you use with Compass):

```bash
npm install
npm run dev
```

`npm run dev` restarts the API every time you save a file. The API listens on `http://localhost:3000`.

No local MongoDB? Start just the database in Docker instead, then run `npm run dev` as above:

```bash
docker compose up db
```

## Running it like a deployment

Docker Compose runs the API as a container built from an image, next to a MongoDB container, the way it would run once deployed. You don't need it for development. Use it to check the packaged version works.

Build the image first, then start both containers:

```bash
docker build -t books-api .
docker compose up
```

The image holds your code as it was when you built it. After changing the code, run `docker build` again before `docker compose up`.

## Trying the endpoints

Open [`requests.http`](requests.http) in VS Code with the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension and click **Send Request** above any request. Run "Create a book" first - the requests after it reuse the id it returns.

| Method | Path | Success | Errors |
|---|---|---|---|
| `GET` | `/books` | 200 | |
| `GET` | `/books?title=&author=&tag=&limit=` | 200 | |
| `GET` | `/books/:id` | 200 | 400 bad id, 404 |
| `POST` | `/books` | 201 | 400 validation, 400 duplicate isbn |
| `PUT` | `/books/:id` | 200 | 400 bad id, 400 validation, 404 |
| `DELETE` | `/books/:id` | 204 | 400 bad id, 404 |
| `GET` | `/health` | 200 | 503 database disconnected |

## Tests

```bash
npm test
```

The tests use Jest and Supertest and need a MongoDB running on `127.0.0.1:27017`, local or `docker compose up db`. They connect to `MONGODB_TEST_URI`, a separate `books-test` database, empty it before every test, and drop it at the end - your development data in `books` is never touched.

Mongoose is pinned to `~9.9.5`. Mongoose 9.10 installs a MongoDB driver that can't connect from inside Jest ([Mongoose issue #16499](https://github.com/Automattic/mongoose/issues/16499)). Move to the newest Mongoose once that's fixed.

## Structure

```
src/
  server.js                  connects to MongoDB, then listens on a port
  app.js                     builds the Express app and wires the parts together
  models/book.js             the schema, its validation, and the search static
  services/bookService.js    what the routes call - sorting and limits live here
  routes/                    HTTP only: read the request, pick a status, respond
  middleware/                the id check and the error handler, shared by every route
tests/                       Jest + Supertest, against the books-test database
requests.http                every endpoint, for trying by hand
```
