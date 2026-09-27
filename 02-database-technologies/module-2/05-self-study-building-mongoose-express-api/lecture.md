# Building a Books API with Mongoose and Express

> In this self-study lesson you will build a books API with Express and Mongoose, from an empty folder to the finished project in [`books-api/`](books-api/). You will start from what the whole API would look like in one file, split it into the concerns hiding inside that file, and give each concern its own home: a model, a service, routes and middleware. Then you will add a search across title, author and tag, and decide where that search should live. New terms get a plain-English version in brackets.

**By the end of this lesson you should be able to:**

1. **Explain** how the amount of information a developer must hold in mind affects how hard a codebase is to change.
2. **Break down** a single-file API into its separate concerns.
3. **Build** an Express API whose routes reach a Mongoose model only through a service.
4. **Use** middleware to reject an invalid id before it reaches the service.
5. **Use** an error-handling middleware to turn validation and duplicate-key errors into 400 responses.
6. **Justify** one search method that takes options over one search method per field.

## Contents

1. [Where we left off](#1-where-we-left-off)
2. [What design is for](#2-what-design-is-for)
   - [2.1 Complexity](#21-complexity)
   - [2.2 Whose job gets easier](#22-whose-job-gets-easier)
   - [2.3 Small modules with simple interfaces](#23-small-modules-with-simple-interfaces)
3. [What we are building](#3-what-we-are-building)
4. [What if it's all one file?](#4-what-if-its-all-one-file)
   - [4.1 The one-file version](#41-the-one-file-version)
   - [4.2 Changing one thing](#42-changing-one-thing)
   - [4.3 The concerns inside it](#43-the-concerns-inside-it)
5. [Setting up the project](#5-setting-up-the-project)
6. [The network and the app](#6-the-network-and-the-app)
   - [6.1 `server.js`](#61-serverjs)
   - [6.2 `app.js` and the first two routes](#62-appjs-and-the-first-two-routes)
7. [The model](#7-the-model)
8. [The service](#8-the-service)
   - [8.1 Why the routes don't call the model](#81-why-the-routes-dont-call-the-model)
   - [8.2 Handing the service its model](#82-handing-the-service-its-model)
9. [The routes](#9-the-routes)
   - [9.1 A router that is handed its service](#91-a-router-that-is-handed-its-service)
   - [9.2 What can go wrong](#92-what-can-go-wrong)
   - [9.3 Checking the id before the route](#93-checking-the-id-before-the-route)
   - [9.4 One place for errors](#94-one-place-for-errors)
   - [9.5 Writing the routes](#95-writing-the-routes)
   - [9.6 Trying it with `requests.http`](#96-trying-it-with-requestshttp)
   - [9.7 An update that skips validation](#97-an-update-that-skips-validation)
10. [Adding a search](#10-adding-a-search)
    - [10.1 One method per field](#101-one-method-per-field)
    - [10.2 One search that takes options](#102-one-search-that-takes-options)
    - [10.3 The model builds the filter, the service sets the rules](#103-the-model-builds-the-filter-the-service-sets-the-rules)
11. [What else is in the project](#11-what-else-is-in-the-project)
    - [11.1 Tests](#111-tests)
    - [11.2 Docker Compose](#112-docker-compose)
    - [11.3 The finished structure](#113-the-finished-structure)
12. [Command reference](#12-command-reference)
13. [Sources](#13-sources)

## 1. Where we left off

Over this module you have talked to MongoDB three ways: by hand in `mongosh`, from Node with the driver, and through Mongoose. Recall where the Mongoose lesson ended: one script with a schema, validation rules with their own messages, a `ValidationError` you could tell apart from other errors, a search attached to the model as a static, and timestamps on every document.

That script ran from top to bottom and then disconnected. In this lesson the same ideas go behind an Express API that stays running and answers requests, and you'll decide where each piece of it belongs.

[Back to contents](#contents)

## 2. What design is for

### 2.1 Complexity

The goal of **software design** is a system that is easy to understand and easy to change.

**Complexity** *[anything about a system that makes it hard to understand or change]* is what works against that. Most of it comes down to information, and two questions measure it:

- How much does a developer have to hold in their head to carry out a task?
- How easy is it to find that information, and how obvious is it once found?

The more a developer has to know before they can safely change one line, the harder it is to work on the system.

### 2.2 Whose job gets easier

It's tempting to think design is about making things easier for whoever writes the code. It isn't. The author already has the whole thing in their head.

Design is for the person who has to **read** code written by somebody else. Often that's a colleague, and just as often it's you, six months later, having forgotten all of it. Developers spend far more time reading code than writing it, and more so now that an LLM can write a first draft in seconds and someone still has to read it and decide whether it's right.

### 2.3 Small modules with simple interfaces

**Modular design** divides code into relatively small units, each with a job. A unit takes a complex piece of functionality and hides it behind a simple **interface** *[the part of a unit other code calls: its function names, what they take and what they return]*.

That reduces how much anyone has to keep in mind. A developer can use what a module does without learning how it does it.

You have already used a module like this. `Book.find()` hides connection pools, the wire protocol, casting, and the query language, and you used it without knowing any of that. Mongoose is a module with a simple interface over a lot of complexity, and in this lesson you'll build a few small ones of your own.

> Design is for the person reading the code.

[Back to contents](#contents)

## 3. What we are building

A user sends HTTP requests to our API. The API uses Mongoose, and Mongoose talks to MongoDB:

```
user  <->  Express API  <->  Mongoose  <->  MongoDB
```

A book has six fields:

| Field | Type | Rules |
|---|---|---|
| `title` | string | required |
| `authors` | array of strings | at least one |
| `year` | number | 1450 or later |
| `genres` | array of strings | optional |
| `isbn` | string | required, and no two books share one |
| `tags` | array of strings | optional |

Authors, genres and tags are plain strings. An author is just a name, not an object of its own.

The API needs the five CRUD endpoints, a health endpoint, and later on a search:

| Method | Path | Does |
|---|---|---|
| `GET` | `/books` | list books |
| `GET` | `/books/:id` | one book |
| `POST` | `/books` | create a book |
| `PUT` | `/books/:id` | update a book |
| `DELETE` | `/books/:id` | delete a book |
| `GET` | `/health` | is the API up, and can it reach the database? |

[Back to contents](#contents)

## 4. What if it's all one file?

### 4.1 The one-file version

Before choosing any folders, consider the simplest thing that would work. Everything you've written this module has been one script, and this API could be too:

```js
// index.js
const express = require('express')
const mongoose = require('mongoose')

// the schema, with its validation rules
// the model, with a search static

const app = express()
app.use(express.json())

// GET /books
// GET /books/:id     - check the id, find, 404 if missing
// POST /books        - create, catch validation errors
// PUT /books/:id     - check the id, update, catch validation errors, 404 if missing
// DELETE /books/:id  - check the id, delete, 404 if missing
// GET /health

// connect to MongoDB, then listen on a port
```

Written out in full, that's around a hundred lines, and a hundred lines is manageable. It would run, and there's nothing wrong with it as a first version.

### 4.2 Changing one thing

In [section 2](#2-what-design-is-for) we saw you can measure complexity by seeing how much you have to know before you can make a change. Here are four changes you might make:

- **Change the port.** You have to scroll past the schema and every route to find it at the bottom of the file.
- **Add a field to a book.** You change the schema, then check every route that creates or returns a book to see whether it needs changing too.
- **Test a route.** A test has to load the file to reach the routes, and loading the file also connects to the database and starts listening on a port. You can't get the routes on their own.
- **Add a search.** You add more code to a file that is already long, in between routes that have nothing to do with searching.

None of these is hard at a hundred lines. But every change means reading the whole file, because nothing in it tells you which parts you can safely ignore, and the file only gets longer.

### 4.3 The concerns inside it

The one file does several different kinds of work. Each kind is a **concern** *[one area of responsibility in a program, which can change for its own reasons]*:

1. **Network** - read the settings, connect to MongoDB, listen on a port.
2. **App setup** - build the Express app and plug the parts into it.
3. **Data shape** - the schema and its validation rules.
4. **Data access** - the queries that read and write books.
5. **HTTP** - read the request, choose a status code, send the response.
6. **Shared checks** - the same id check and the same error handling, copied into several routes.

**Separation of concerns** means giving each of these its own place, so a change to one concern touches one place. The folder structure comes straight out of that list:

```
src/
  server.js                  1  network
  app.js                     2  app setup
  models/book.js             3  data shape, and 4, the queries that belong to a book
  services/bookService.js    4  data access, as the routes see it
  routes/                    5  HTTP
  middleware/                6  shared checks
```

Now "change the port" means opening `server.js`, and "add a field" starts in `models/book.js`. Knowing which file to open is information you no longer have to carry around.

> Each concern gets one home, so each change has one place to start.

[Back to contents](#contents)

## 5. Setting up the project

Create the folder and install the three packages the API needs, plus the two the tests need:

```bash
mkdir books-api
cd books-api
npm init -y
npm install express mongoose@~9.9.5 dotenv
npm install --save-dev jest supertest
```

The settings go in a `.env` file at the project root:

```
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/books
MONGODB_TEST_URI=mongodb://127.0.0.1:27017/books-test
```

Mongoose is pinned to version 9.9. The newest version, 9.10, installs a MongoDB driver with a bug that stops it connecting when it runs inside Jest, so the tests would fail. `~9.9.5` means "9.9.5 or a later 9.9 release, but not 9.10".

`MONGODB_TEST_URI` points at a second database on the same server, for the tests in [section 11.1](#111-tests).

Add three scripts to `package.json`:

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "node --watch src/server.js",
  "test": "jest --runInBand"
},
```

`node --watch` restarts the server every time you save a file, so you don't have to stop and start it by hand while you build.

[Back to contents](#contents)

## 6. The network and the app

### 6.1 `server.js`

Recall why an Express project has both an `app.js` and a `server.js`. `app.js` builds the app and exports it without ever calling `listen()`, so a test can require the app and send it requests without opening a port. `server.js` is the file that actually runs.

In this API, `server.js` is also the only file that knows about the network: which database to connect to and which port to listen on.

```js
require('dotenv').config()

const mongoose = require('mongoose')

const app = require('./app')

const PORT = process.env.PORT || 3000

// The only file that knows about the network: which database, which port.
// Connect first, then listen, so the API never accepts a request it can't serve.
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')

    app.listen(PORT, () => {
      console.log(`Books API listening on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Could not connect to MongoDB:', error.message)
    process.exit(1)
  })
```

If the connection fails, the process logs why and exits. An API that listens but can't reach its database would accept every request and then fail on it.

### 6.2 `app.js` and the first two routes

Each group of routes gets its own file in `src/routes/`, as an **Express router** *[a mini-app holding a group of routes, which the main app mounts at a path]*. The first two are small.

`src/routes/index.js`:

```js
const express = require('express')

const router = express.Router()

router.get('/', (req, res) => {
  res.json({ message: 'Books API' })
})

module.exports = router
```

`src/routes/health.js`:

```js
const express = require('express')
const mongoose = require('mongoose')

const router = express.Router()

// All it needs is whether the connection is up, so it asks Mongoose directly
router.get('/', (req, res) => {
  const connected = mongoose.connection.readyState === 1

  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    uptime: process.uptime(),
    database: connected ? 'connected' : 'disconnected'
  })
})

module.exports = router
```

A `readyState` of `1` means Mongoose's connection is open.

This route uses Mongoose directly. All a health endpoint needs to know is whether the database connection is up, and Mongoose can answer that in one line. Adding a service just to pass that one value through would be more code and give you nothing in return, so the simpler option is the right one here.

The first version of `src/app.js` mounts both:

```js
const express = require('express')

const indexRouter = require('./routes/index')
const healthRouter = require('./routes/health')

const app = express()

app.use(express.json())

app.use('/', indexRouter)
app.use('/health', healthRouter)

module.exports = app
```

A router's paths are relative to where it's mounted. The health router says `/`, and `app.use('/health', ...)` makes it `/health`.

Start it with `npm run dev`, open `http://localhost:3000/health`, and you should see `"database": "connected"`.

[Back to contents](#contents)

## 7. The model

`src/models/book.js` holds the data shape. Recall how a schema is defined, how a validator takes its own message, and what `timestamps: true` adds. All three are used here:

```js
const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  authors: {
    type: [String],
    // An array path defaults to [], so `required` alone would let an empty list through
    validate: {
      validator: (authors) => authors.length > 0,
      message: 'A book needs at least one author'
    }
  },
  year: {
    type: Number,
    min: [1450, 'Year must be 1450 or later']
  },
  genres: [String],
  isbn: {
    type: String,
    required: true,
    unique: true, // Builds a unique index in MongoDB - not a Mongoose validator
    trim: true
  },
  tags: [String]
}, { timestamps: true })

module.exports = mongoose.model('Book', bookSchema)
```

Three things are new:

- **`trim: true`** removes spaces from the start and end of the string before it's saved, so `"  The Hobbit "` is stored as `"The Hobbit"`.
- **`authors` uses a custom validator** instead of `required`. Mongoose gives every array path a default of `[]`, so a book sent with no authors at all arrives as an empty array. The validator function receives the value and returns `true` if it's allowed, and `message` is what goes into the `ValidationError` when it isn't.
- **`unique: true` on `isbn`** looks like a validation rule but isn't one. It comes back in [section 9.2](#92-what-can-go-wrong), where it produces a completely different error.

The model file exports the model and nothing else. Every file that needs books requires it from here.

[Back to contents](#contents)

## 8. The service

### 8.1 Why the routes don't call the model

A route could call `Book.find()` itself, and it would work. But then every route needs to know Mongoose: its method names, which ones take options, what they return. HTTP code and database code end up mixed together in one function.

A **service** is a layer between the routes and the model. The routes ask it for what they want - all the books, this book, a new book - and the service decides how to get it. The routes never see Mongoose.

For CRUD alone, the service is very thin. Most methods pass straight through to the model. It earns its place later, in [section 10.3](#103-the-model-builds-the-filter-the-service-sets-the-rules), when it gets rules of its own.

### 8.2 Handing the service its model

The service is a class, and it doesn't `require` the model. It's given the model when it's created:

```js
const bookService = new BookService(Book)
```

That's **dependency injection** *[giving a piece of code the things it depends on from outside, instead of letting it fetch them itself]*. The service doesn't decide which model it works with. Whoever creates it does, and in this API that's `app.js`. [Section 9.1](#91-a-router-that-is-handed-its-service) explains why.

Some languages and frameworks do this for you, with interfaces and a container that creates everything. Plain JavaScript has neither, so we do it by hand, with a constructor argument. That's all it needs to be.

The first version of `src/services/bookService.js`:

```js
class BookService {
  constructor (Book) {
    this.Book = Book
  }

  getAll () {
    return this.Book.find()
  }

  getById (id) {
    return this.Book.findById(id)
  }

  create (data) {
    return this.Book.create(data)
  }

  update (id, data) {
    return this.Book.findByIdAndUpdate(id, data)
  }

  remove (id) {
    return this.Book.findByIdAndDelete(id)
  }
}

module.exports = BookService
```

The methods don't `await` anything. They return what Mongoose returns, and the route that calls them does the awaiting.

[Back to contents](#contents)

## 9. The routes

### 9.1 A router that is handed its service

The books routes need a service to call. The obvious place to create one is at the top of the routes file:

```js
const express = require('express')

const Book = require('../models/book')
const BookService = require('../services/bookService')

const bookService = new BookService(Book)
const router = express.Router()

// ...routes that use bookService

module.exports = router
```

That works, but look at the second `require`. To create the service, the routes file has to require the model. The routes are back to knowing that Mongoose and a `Book` model exist, which is what [section 8.1](#81-why-the-routes-dont-call-the-model) set out to stop.

It also ties the routes to that one service. Nothing outside the file can give the router a different one. A test, for example, might want to hand the router a fake service that returns a fixed list of books, so it can check the routes without a database. With the service created inside the file, there's no way to do that. (This project's tests use a real test database, but the choice is only open because of how the router is built.)

The fix is the same one the service used for its model: don't create the thing you depend on, be given it. The routes file exports a **factory function** *[a function that builds and returns something, here a router]* that takes the service as its argument:

```js
function createBooksRouter (bookService) {
  const router = express.Router()

  // ...routes that use bookService

  return router
}

module.exports = createBooksRouter
```

The routes now only need *something* with `getById`, `create`, `update` and the rest. They don't know where it came from or what it talks to.

Something still has to create the service and pass it in. That job belongs to `app.js`, because building the app and plugging the parts together is its concern, number 2 in [section 4.3](#43-the-concerns-inside-it). It creates the service with the model, and hands the service to the router:

```js
const Book = require('./models/book')
const BookService = require('./services/bookService')
const createBooksRouter = require('./routes/books')

// Wiring: the one place that decides which model the service works with
const bookService = new BookService(Book)

app.use('/books', createBooksRouter(bookService))
```

The `require` lines go with the others at the top of `app.js`, and the rest goes after the `/health` line. `app.js` is the only file that knows how the pieces fit together, and none of the pieces know about each other.

### 9.2 What can go wrong

Before writing the routes, work out what can go wrong in them, and decide where each problem should be handled. That way each route only has to deal with its own job.

| Problem | Example | Handled by | Response |
|---|---|---|---|
| The id isn't an ObjectId | `GET /books/hello` | middleware, before the route | `400` |
| No book has that id | a book that was deleted | the route | `404` |
| The book breaks the schema | a book with no authors | the error handler, after the route | `400` |
| The ISBN is already used | a second book with The Hobbit's ISBN | the error handler | `400` |
| Anything else | the database goes down | the error handler | `500` |

**A bad id** has to be stopped before it reaches the service. `findById('hello')` doesn't return `null`. Mongoose throws a `CastError` trying to turn `hello` into an ObjectId, and the user would get a `500` for what is really their mistake. There's no point sending `hello` to the database at all.

**A missing book** isn't an error. "There's no book with that id" is a normal answer to the request, so the route itself sends the `404`.

**A book that breaks the schema** makes `create` or `update` throw a `ValidationError`. Recall that you can tell it apart from other errors by its `name`.

**A duplicate ISBN** looks like the same kind of problem, but it isn't. The [Mongoose validation guide](https://mongoosejs.com/docs/validation.html) says it plainly: "the `unique` option for schemas is _not_ a validator." According to the [Mongoose FAQ](https://mongoosejs.com/docs/faq.html), it's a shortcut for creating a **unique index** in MongoDB. A [unique index](https://www.mongodb.com/docs/manual/core/index-unique/) "ensures that the indexed fields do not store duplicate values", and MongoDB is the one enforcing it, not Mongoose. Mongoose validates the second Hobbit, finds nothing wrong, and sends it. MongoDB refuses it with an **E11000 duplicate key error**. That error comes from the database server, so it isn't a `ValidationError`. It has a numeric `code` of `11000`, and a `keyValue` saying which field and value clashed. It's still the client's mistake, so it should be a `400`.

**Anything else** is our problem, not the client's, and gets a `500`.

The next two sections build the two pieces that handle these: a middleware for the id, and an error handler for everything that's thrown.

### 9.3 Checking the id before the route

Three routes take an id: `GET /:id`, `PUT /:id` and `DELETE /:id`. All three need the same check before they do anything else. And the check needs Mongoose, which the routes shouldn't know about.

Express has a way to run code before a route: **middleware** *[a function Express runs on a request before it reaches the route handler]*. You've already used one. `app.use(express.json())` in `app.js` is middleware that reads the request body before any route sees it.

A middleware function takes three arguments, `(req, res, next)`. It looks at the request and then does one of two things:

- sends a response itself, and the request stops there, or
- calls `next()`, and Express moves on to the next function, which here is the route handler.

The id check fits that exactly: send a `400` if the id is bad, call `next()` if it's fine.

It doesn't belong to any one route, so it gets a new folder, `src/middleware/`, for code the routes share. This is concern 6 from [section 4.3](#43-the-concerns-inside-it). Create `src/middleware/validateObjectId.js`:

```js
const mongoose = require('mongoose')

// Runs before any /:id route. A request with an id that can't be an ObjectId
// is turned away here, before the service or the database sees it.
function validateObjectId (req, res, next) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ error: `'${req.params.id}' is not a valid id` })
  }

  next()
}

module.exports = validateObjectId
```

[`mongoose.isObjectIdOrHexString()`](https://mongoosejs.com/docs/api/mongoose.html) returns true if the id is a 24-character hex string, which is what an ObjectId looks like in a URL, such as `/books/6ab99622768da39fc0f1739d`.

### 9.4 One place for errors

The other problems are all thrown from inside a route, by the service call, so they need something that runs *after* the route.

Express 5 passes those errors on for you. The [Express error handling guide](https://expressjs.com/en/guide/error-handling.html) says that route handlers returning a Promise "call `next(value)` automatically when they reject or throw an error, and `async` functions always return a Promise". So a route doesn't need a `try`/`catch`. If the service throws, Express catches the error and hands it to your error handler.

That handler is an **error-handling middleware**. It's written like other middleware, except it takes four arguments instead of three: `(err, req, res, next)`. The four arguments are how Express knows it's an error handler.

Create `src/middleware/errorHandler.js`:

```js
// Four arguments is what tells Express this is an error handler.
// Express 5 sends anything thrown in an async route here.
function errorHandler (err, req, res, next) {
  // Mongoose: the data broke a rule in the schema
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map((e) => e.message)
    })
  }

  // MongoDB: a unique index already holds this value
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]

    return res.status(400).json({
      error: `A book with this ${field} already exists`
    })
  }

  console.error(err)

  res.status(500).json({ error: 'Something went wrong' })
}

module.exports = errorHandler
```

It checks for each problem from the table in turn:

- A `ValidationError`'s `errors` has one entry per field that failed. `Object.values(...).map(...)` turns it into a list of the messages from the schema.
- A duplicate key error names the field in `keyValue`, so a duplicate ISBN comes back as `{ "error": "A book with this isbn already exists" }`. The field name is read from the error rather than written in, so a second unique field later would need no new code.
- Anything else is logged on the server and gets a `500` with a JSON body, instead of Express's default HTML error page.

The guide says to define error handlers "last, after other `app.use()` and routes calls". Add it to the end of `app.js`, just before `module.exports`:

```js
const errorHandler = require('./middleware/errorHandler')

// Registered last, so an error from any route above ends up here
app.use(errorHandler)
```

### 9.5 Writing the routes

With the errors taken care of, every route does the same three things: it reads what it needs from the request, calls the service, and sends a response with the right status code.

Start `src/routes/books.js` with the factory from [section 9.1](#91-a-router-that-is-handed-its-service) and the id middleware:

```js
const express = require('express')

const validateObjectId = require('../middleware/validateObjectId')

// A factory rather than a plain router, so the service is handed in by app.js
function createBooksRouter (bookService) {
  const router = express.Router()

  // routes go here

  return router
}

module.exports = createBooksRouter
```

Write each route below in place of `// routes go here`.

**`GET /books`** returns every book, with the default status of `200`:

```js
  router.get('/', async (req, res) => {
    const books = await bookService.getAll()

    res.json(books)
  })
```

**`GET /books/:id`** returns one book. `validateObjectId` goes between the path and the handler, so Express runs it first. If the id is bad, the middleware sends the `400` and the handler never runs. If there's no book with that id, the service returns `null` and the route sends the `404`:

```js
  router.get('/:id', validateObjectId, async (req, res) => {
    const book = await bookService.getById(req.params.id)

    if (!book) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.json(book)
  })
```

**`POST /books`** creates a book and sends it back with `201 Created`. If the body breaks the schema or repeats an ISBN, `create` throws and the error handler sends the `400`:

```js
  router.post('/', async (req, res) => {
    const book = await bookService.create(req.body)

    res.status(201).json(book)
  })
```

**`PUT /books/:id`** updates a book. It uses the id middleware and the `404`, and the error handler catches anything `update` throws:

```js
  router.put('/:id', validateObjectId, async (req, res) => {
    const book = await bookService.update(req.params.id, req.body)

    if (!book) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.json(book)
  })
```

**`DELETE /books/:id`** deletes a book and sends `204 No Content`, a success with no body. `.end()` sends the response without one:

```js
  router.delete('/:id', validateObjectId, async (req, res) => {
    const book = await bookService.remove(req.params.id)

    if (!book) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.status(204).end()
  })
```

None of the routes mention Mongoose, and none of them has a `try`/`catch`.

### 9.6 Trying it with `requests.http`

To test the routes as you write them, you can send requests from an **HTTP file** *[a text file of HTTP requests that your editor can send for you]*. The project has one, [`books-api/requests.http`](books-api/requests.http), with a request for every endpoint. Install the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension for VS Code, open the file, and click **Send Request** above any request.

The create request is named, and the requests after it reuse the id it returns:

```http
### Create a book - the response id is saved for the requests below
# @name createBook
POST {{baseUrl}}/books
Content-Type: application/json

{
  "title": "The Hobbit",
  "authors": ["J.R.R. Tolkien"],
  "year": 1937,
  "genres": ["fantasy", "adventure"],
  "isbn": "978-0261103344",
  "tags": ["classic"]
}

### One book
GET {{baseUrl}}/books/{{createBook.response.body._id}}
```

The file also has a request for each row of the table in [section 9.2](#92-what-can-go-wrong) - a book with no authors, a duplicate ISBN, an id that isn't an ObjectId - so you can check the error responses too.

### 9.7 An update that skips validation

Mongoose only validates a book when it's created or saved. An update goes straight to the database without being checked.

You can see it with the `PUT` request in `requests.http`. Change the year to `1200` and send it. The update succeeds, even though the schema says the year must be 1450 or later. The [Mongoose validation guide](https://mongoosejs.com/docs/validation.html) puts it plainly: "Update validators are off by default - you need to specify the `runValidators` option."

Turn them on by passing options to `findByIdAndUpdate` in the service:

```js
  update (id, data) {
    return this.Book.findByIdAndUpdate(id, data, {
      returnDocument: 'after', // Send back the book as it is now, not as it was
      runValidators: true // Updates skip schema validation unless told otherwise
    })
  }
```

This replaces `update` in `src/services/bookService.js`. Send the same request again and you get a `400`.

The second option fixes a smaller problem you may have noticed. By default `findByIdAndUpdate` sends back the book as it was *before* the update, so the response showed the old values even though the new ones were saved. `returnDocument: 'after'` sends back the updated book. Older examples use `new: true` for this, which the [Mongoose 9 migration guide](https://mongoosejs.com/docs/migrating_to_9.html) deprecates.

Both options live in the service, so no route has to remember them.

> Each problem is handled in one place: bad ids before the route, missing books in it, and everything thrown after it.

[Back to contents](#contents)

## 10. Adding a search

The API can list every book. Now users want to find books by author, by title, or by tag.

### 10.1 One method per field

Recall how the Mongoose lesson moved a repeated query onto the model as a static. The obvious way to add three searches is three statics:

```js
bookSchema.statics.findByTitle = function (title) {
  return this.find({ title: new RegExp(title, 'i') })
}

bookSchema.statics.findByAuthor = function (author) {
  return this.find({ authors: new RegExp(author, 'i') })
}

bookSchema.statics.findByTag = function (tag) {
  return this.find({ tags: tag })
}
```

Then three matching methods on the service, and a route that works out which one to call:

```js
  router.get('/', async (req, res) => {
    let books

    if (req.query.title) {
      books = await bookService.searchByTitle(req.query.title)
    } else if (req.query.author) {
      books = await bookService.searchByAuthor(req.query.author)
    } else if (req.query.tag) {
      books = await bookService.searchByTag(req.query.tag)
    } else {
      books = await bookService.getAll()
    }

    res.json(books)
  })
```

Each method is simple, but the route has to know there are three searches and pick the right one. A user who asks for classics by Tolkien, `?tag=classic&author=tolkien`, gets every Tolkien book, because the first matching `if` wins and the tag is ignored. Supporting that combination means a fourth method, and every new field multiplies the combinations. The service has grown, and everything that uses it has to learn all of it.

These are **shallow** methods: each one does little, and the caller has to know about all of them.

### 10.2 One search that takes options

The alternative is one method that takes whichever fields it's given and builds a single filter from them. This replaces the three statics in `src/models/book.js`, just before `module.exports`:

```js
// One search that takes whichever fields it is given and builds the filter.
// Callers never see the query syntax, and adding a field later changes only this function.
bookSchema.statics.search = function ({ title, author, tag } = {}) {
  const filter = {}

  if (title) filter.title = new RegExp(title, 'i')
  if (author) filter.authors = new RegExp(author, 'i') // Matches any element of the array
  if (tag) filter.tags = tag

  return this.find(filter)
}
```

Each field that was given adds a condition to the filter, and MongoDB only returns books that match all of them, so `?tag=classic&author=tolkien` works with no extra code. With no fields at all the filter is `{}`, which matches every book, so the same method is also "get all". Matching a regular expression against `authors` checks every name in the array, so `thomas` finds The Pragmatic Programmer by its second author.

This is a **deep** module: a simple interface, one method with one options object, with the harder work of building the query hidden behind it. The caller says what it wants. How that becomes a MongoDB query is hidden in one function, and adding a fourth field later changes only that function.

### 10.3 The model builds the filter, the service sets the rules

Building a filter is MongoDB knowledge: regular expressions, how arrays are matched. It's the same kind of knowledge as the schema, and recall that a query you'd otherwise repeat belongs on the model as a static. So `search` goes on the model.

Deciding how results come back is different. Should a list be sorted? How many books should one request return at most? Those are rules about how this API behaves, not about how MongoDB works, and they're the service's job. This is the job [section 8.1](#81-why-the-routes-dont-call-the-model) said the service would get. `getAll` is replaced by `list` in `src/services/bookService.js`:

```js
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

class BookService {
  // The model is passed in rather than required here, so app.js decides what the service talks to
  constructor (Book) {
    this.Book = Book
  }

  // Every list of books comes back in the same order and in a sensible size,
  // whatever the caller asked for
  list ({ title, author, tag, limit } = {}) {
    const size = Math.min(Number(limit) || DEFAULT_LIMIT, MAX_LIMIT)

    return this.Book.search({ title, author, tag })
      .sort({ title: 1 })
      .limit(size)
  }
```

`search` returns a Mongoose query that hasn't run yet, so the service can add `.sort()` and `.limit()` to it before it's awaited. Query-string values always arrive as strings, so `Number(limit)` converts the limit, and anything missing or unreadable falls back to 20. `Math.min` stops anyone asking for a million books at once.

`GET /books` now passes the search fields and the limit from the query string to `list`. This is the finished `src/routes/books.js`:

```js
const express = require('express')

const validateObjectId = require('../middleware/validateObjectId')

// A factory rather than a plain router, so the service is handed in by app.js
function createBooksRouter (bookService) {
  const router = express.Router()

  router.get('/', async (req, res) => {
    const { title, author, tag, limit } = req.query

    const books = await bookService.list({ title, author, tag, limit })

    res.json(books)
  })

  router.get('/:id', validateObjectId, async (req, res) => {
    const book = await bookService.getById(req.params.id)

    if (!book) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.json(book)
  })

  router.post('/', async (req, res) => {
    const book = await bookService.create(req.body)

    res.status(201).json(book)
  })

  router.put('/:id', validateObjectId, async (req, res) => {
    const book = await bookService.update(req.params.id, req.body)

    if (!book) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.json(book)
  })

  router.delete('/:id', validateObjectId, async (req, res) => {
    const book = await bookService.remove(req.params.id)

    if (!book) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.status(204).end()
  })

  return router
}

module.exports = createBooksRouter
```

The route picks out the four query parameters it supports and passes them on. It doesn't know how searching works or what the default limit is.

> Each layer holds one kind of knowledge: the route knows HTTP, the service knows the rules, the model knows MongoDB.

[Back to contents](#contents)

## 11. What else is in the project

The finished project in [`books-api/`](books-api/) has three more things that make it a complete repository. Its [README](books-api/README.md) covers how to run each one.

### 11.1 Tests

`tests/` holds integration tests written with Jest and Supertest, which you can run with `npm test`. They send real requests to `app` and check the responses: every status code in [section 9.2](#92-what-can-go-wrong), the validation and duplicate-ISBN messages, the sort order, and each search field alone and combined.

Because `app.js` never connects, the tests connect for themselves in `tests/setup.js`. They use a separate database, so a test run can never delete your development data:

```js
require('dotenv').config()

const mongoose = require('mongoose')

const Book = require('../src/models/book')

// app.js never connects, so the tests do it themselves - to a separate
// database, never the one you develop against.
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_TEST_URI)

  // Wait for the unique index on isbn to exist, or duplicates slip through
  await Book.init()
})

// Every test starts with an empty collection
beforeEach(async () => {
  await Book.deleteMany()
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})
```

`Book.init()` is there because of [section 9.2](#92-what-can-go-wrong). The unique index only rejects duplicates once MongoDB has built it, and on a freshly dropped test database it may not exist yet. The Mongoose FAQ gives `init()` as the way to wait for it.

This is also where the Mongoose version from [section 5](#5-setting-up-the-project) matters. With Mongoose 9.10, every test fails with "Missing required sub-document 'driver' in the client metadata document". The bug is tracked in [Mongoose issue #16499](https://github.com/Automattic/mongoose/issues/16499), and once it's fixed you can move to the newest Mongoose.

### 11.2 Docker Compose

You don't need Docker to develop this API. Everything so far has run with `npm run dev` against the MongoDB installed on your machine, and that's still how you work on the code.

Docker Compose is there for a different job: running the API the way it would run once it's deployed, as a container built from an image, talking to a database in another container. It's a quick way to check that the whole thing works when it's packaged up, before you send it anywhere.

`docker-compose.yml` defines two services, the database and the API:

```yaml
services:
  db:
    image: mongo:8
    container_name: books-db
    ports:
      - "27017:27017" # So npm run dev on your machine can reach it too
    volumes:
      - books-data:/data/db # Keeps the books when the container is removed

  app:
    image: books-api # Built first with: docker build -t books-api .
    container_name: books-api
    environment:
      PORT: 3000
      MONGODB_URI: mongodb://db:27017/books # "db" is the service name above
    ports:
      - "3000:3000"
    depends_on:
      - db

volumes:
  books-data:
```

The `app` service runs the `books-api` image, so that image has to exist before Compose can start it. Build it from the `Dockerfile` in the project root:

```bash
docker build -t books-api .
```

Then start both containers:

```bash
docker compose up
```

The API container connects to `db:27017` rather than `127.0.0.1`, because `db` is the database container's name on the network Compose creates.

The image is a snapshot of your code at the moment you built it. If you change the code, run `docker build` again before the next `docker compose up`, or the container will still be running the old version.

If you don't have MongoDB installed locally, `docker compose up db` starts only the database container, on port `27017`, and `npm run dev` reaches it through the same `MONGODB_URI` in `.env`.

### 11.3 The finished structure

```
books-api/
├── src/
│   ├── server.js                  network: connect, then listen
│   ├── app.js                     wiring: builds the app, plugs the parts in
│   ├── models/
│   │   └── book.js                schema, validation, search static
│   ├── services/
│   │   └── bookService.js         sort and limit rules
│   ├── routes/
│   │   ├── index.js               GET /
│   │   ├── health.js              GET /health
│   │   └── books.js               the five book routes
│   └── middleware/
│       ├── validateObjectId.js    400 for a bad id, before the route
│       └── errorHandler.js        400 or 500 for anything thrown, after the route
├── tests/
│   ├── setup.js                   connects to books-test, empties it between tests
│   ├── health.test.js
│   └── books.test.js
├── requests.http                  every endpoint, for trying by hand
├── .env
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

Compare it with the list of concerns in [section 4.3](#43-the-concerns-inside-it). Each concern has one home, and you can tell from the tree where to start any of the changes from [section 4.2](#42-changing-one-thing).

[Back to contents](#contents)

## 12. Command reference

| Command | What it does |
|---|---|
| `npm run dev` | Start the API, restarting on every save |
| `npm start` | Start the API |
| `npm test` | Run the tests against the `books-test` database |
| `docker build -t books-api .` | Build the API image from the current code |
| `docker compose up` | Start the API and MongoDB (build the image first) |
| `docker compose up db` | Start only MongoDB, on port `27017` |
| `docker compose down` | Stop and remove the containers (the `books-data` volume stays) |

[Back to contents](#contents)

## 13. Sources

1. Mongoose. [Validation](https://mongoosejs.com/docs/validation.html) - update validators, cast errors, and "The `unique` Option is Not a Validator".
2. Mongoose. [FAQ](https://mongoosejs.com/docs/faq.html) - why `unique` doesn't stop duplicates until the index exists.
3. Mongoose. [Migrating to Mongoose 9](https://mongoosejs.com/docs/migrating_to_9.html) - `returnDocument` replacing `new`.
4. Mongoose. [Mongoose API](https://mongoosejs.com/docs/api/mongoose.html) - `isObjectIdOrHexString()`.
5. Mongoose. [Schemas](https://mongoosejs.com/docs/guide.html) - statics.
6. MongoDB. [Unique Indexes](https://www.mongodb.com/docs/manual/core/index-unique/) - the E11000 duplicate key error.
7. Express. [Error Handling](https://expressjs.com/en/guide/error-handling.html) - async errors in Express 5 and error-handling middleware.
8. Automattic/mongoose. [Issue #16499](https://github.com/Automattic/mongoose/issues/16499) - the MongoDB 7.6 driver failing under Jest.
9. Huachao Mao. [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) for VS Code.
10. John Ousterhout. *A Philosophy of Software Design*. The ideas of complexity as information a developer must hold in mind, and of deep modules with simple interfaces. (Book, not linked.)

[Back to contents](#contents)
