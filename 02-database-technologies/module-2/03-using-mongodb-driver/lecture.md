# Using the MongoDB Node.js Driver

> In this lesson you will connect to MongoDB from a Node.js script with the official driver, build a `bookstore` database with a `books` collection, seed it and query it, all in one file. Then you will split that file into a database module, a seed module and a `main.js` with four functions for reading and writing books. Along the way you will hit a `connect ECONNREFUSED ::1:27017` error and fix it. New terms get a plain-English version in brackets.

**By the end of this lesson you should be able to:**

1. **Demonstrate** a connection to a local MongoDB server using the Node.js driver's `MongoClient`.
2. **Explain** why `client.close()` belongs in a `finally` block.
3. **Analyze** a `connect ECONNREFUSED ::1` error to find its cause.
4. **Use** the driver's CRUD methods to seed and query a collection.
5. **Explain** why the client, the database and its collections belong together in one module.
6. **Apply** `ObjectId` to find a document by its `_id`.

## Contents

1. [Where we left off](#1-where-we-left-off)
2. [The Node.js driver](#2-the-nodejs-driver)
3. [A starting point for the program](#3-a-starting-point-for-the-program)
   - [3.1 The `main` function](#31-the-main-function)
   - [3.2 try, catch and finally](#32-try-catch-and-finally)
4. [Connecting](#4-connecting)
   - [4.1 The client and the connection string](#41-the-client-and-the-connection-string)
   - [4.2 Connection refused on `::1`](#42-connection-refused-on-1)
   - [4.3 Opening the connection](#43-opening-the-connection)
5. [Building the bookstore in one file](#5-building-the-bookstore-in-one-file)
   - [5.1 The database and the collection](#51-the-database-and-the-collection)
   - [5.2 Seeding](#52-seeding)
   - [5.3 Reading it back](#53-reading-it-back)
6. [Splitting it up](#6-splitting-it-up)
   - [6.1 Configuration in `.env`](#61-configuration-in-env)
   - [6.2 Everything about the database in one place](#62-everything-about-the-database-in-one-place)
   - [6.3 The seed on its own](#63-the-seed-on-its-own)
7. [Four functions for the books](#7-four-functions-for-the-books)
   - [7.1 Reading](#71-reading)
   - [7.2 Finding one book by its `_id`](#72-finding-one-book-by-its-_id)
   - [7.3 Inserting, and the round trip](#73-inserting-and-the-round-trip)
8. [Command reference](#8-command-reference)
9. [Sources](#9-sources)

## 1. Where we left off

[Last lesson](../02-intro-to-mongo/lecture.md) we ran MongoDB locally and worked with it by typing into `mongosh` and Compass. We created a database and a collection, inserted documents, filtered with operators like `$gt`, and chose which fields came back with a projection.

Your application can't type into a shell, though. In this lesson you do the same things from JavaScript code, in a Node.js script.

[Back to contents](#contents)

## 2. The Node.js driver

A **driver** *[a library your code uses to talk to a database server]* is how a program talks to MongoDB. The [MongoDB Node.js driver documentation](https://www.mongodb.com/docs/drivers/node/current/) calls it the official driver, which you add to your application to work with MongoDB in JavaScript or TypeScript. You use the same library whether the server is on your own machine, as ours is, or hosted in MongoDB Atlas.

The driver is not an ORM. An ORM, like Sequelize, sits between your code and the database, translating objects into SQL rows. There's nothing to translate here, because MongoDB already stores documents shaped like JavaScript objects. The driver passes the objects you write to the server and gives you back the documents it returns. The filters and projections look exactly like the ones you typed in `mongosh`.

It is an npm package called `mongodb`:

```bash
npm init -y
npm install mongodb
```

[Back to contents](#contents)

## 3. A starting point for the program

### 3.1 The `main` function

Before writing any database code, we built the frame the code would go inside.

Many languages have a fixed **entry point** *[the place where a program starts running]*. C, Java and C# all start by calling a function named `main`. Node has no such rule, and it runs a file from top to bottom. We gave the script a `main` anyway, so that one function holds the whole program and the last line of the file starts it:

```js
// Scaffold main function
async function main() {
    try {

    } catch(error) {

        console.error(error)

    } finally {
        await client.close()
    }
    
}

main()
```

`main` is `async` because almost every call to the driver has to go over the network to the server and wait for an answer, so it returns a **promise** *[an object standing in for a result that hasn't arrived yet]*. `await` pauses until that result arrives, and in a file that uses `require`, you can only use `await` inside an `async` function.

### 3.2 try, catch and finally

The three blocks each do a separate job:

- **`try`** holds the work: connecting, creating, inserting, querying.
- **`catch`** receives any error thrown along the way, from any line in `try`. We only print it, but one `catch` is enough for the whole program.
- **`finally`** runs whether `try` succeeded or failed. That makes it the right place for `client.close()`. If a query fails halfway through, the connection still gets closed.

If you don't close the client, the connections it opened stay open, and the script may not exit when it has finished.

The driver's own [Get Started](https://www.mongodb.com/docs/drivers/node/current/get-started/) example uses `try` and `finally` without a `catch`, and handles errors on the outside instead, with `runGetStarted().catch(console.dir)`. It's the same idea with the catch in a different place.

[Back to contents](#contents)

## 4. Connecting

### 4.1 The client and the connection string

The [MongoClient](https://www.mongodb.com/docs/drivers/node/current/connect/mongoclient/) page says that to connect you need two things:

- a **connection URI** *[a single string saying where the server is and how to reach it]*, also called a connection string
- a **`MongoClient`** object, which creates the connection and performs operations on the server

We didn't write the connection string by hand. Compass shows it for the connection you already made last lesson, so we copied it from there:

```js
// Get connection string
const connectionString = 'mongodb://localhost:27017/'
```

The string has the parts the MongoClient page lists:

| Part | Here | What it is |
|---|---|---|
| Prefix | `mongodb://` | Marks this as a standard MongoDB connection string |
| Host | `localhost` | The machine the server is on |
| Port | `27017` | MongoDB's default port, the one `mongod` listens on |

There's no username and password, because the local server we installed doesn't ask for one. A connection string for Atlas would have credentials after the prefix, `username:password@`, and options at the end as `?name=value` pairs.

Next we imported the client class from the driver and created a client with the string:

```js
// Import MongoDB
const { MongoClient } = require('mongodb')
```

```js
const client = new MongoClient(connectionString)
```

### 4.2 Connection refused on `::1`

On a lot of machines, including in class, running the script with that client fails straight away:

```
MongoServerSelectionError: connect ECONNREFUSED ::1:27017
```

**ECONNREFUSED** *[connection refused - nothing was listening at the address the driver tried]* means the driver never reached a server. The address in the message tells you why. `::1` is the **loopback address** *[the address a machine uses to reach itself]* in **IPv6**. The IPv4 loopback address is `127.0.0.1`. Both mean "this machine", but they're two separate addresses, and a server listening on one doesn't answer on the other.

`localhost` in the connection string is a name, and your machine turns that into an IP, and sometimes thats `::1` (IPv6). The MongoDB server we installed was listening on `127.0.0.1` (IPv4).

There are two ways to fix it. You can write the IPv4 address into the connection string instead of the name:

```js
const connectionString = 'mongodb://127.0.0.1:27017/'
```

Or you can keep `localhost` and tell the client to use IPv4 only, which is the fix we used:

```js
// Get connection string
const connectionString = 'mongodb://localhost:27017/' // IPv4 (127.0.0.1) vs IPv6 (::1) (MongoServerSelectionError: connect ECONNREFUSED ::1:27017)

// Create the client
const client = new MongoClient(connectionString, {family: 4})
```

### 4.3 Opening the connection

With the client created, the first line in `try` opens the connection:

```js
        // Connect to server
        await client.connect()
        console.log('Connected!');
```

The MongoClient page notes that the driver calls `connect()` for you the first time you run an operation, so strictly you could leave this line out. Calling it yourself means a bad connection string or a stopped server fails here, on the line about connecting, instead of on your first query.

The same page also says that one `MongoClient` represents a **connection pool** *[a set of open connections the client keeps and reuses]*, and that most applications only need a single instance, even when they handle many requests.

[Back to contents](#contents)

## 5. Building the bookstore in one file

All of this section is [`main-old.js`](class-demo/main-old.js), the first version of the demo, written one line at a time inside `try`.

### 5.1 The database and the collection

```js
        // Select DB (not created until something is inserted)
        const db = client.db('bookstore')

        // Create collection
        const books = await db.createCollection('books')
        console.log('Collection created!');
```

`client.db('bookstore')` selects the `bookstore` database, like `use` in the shell. According to the driver's [Databases and Collections](https://www.mongodb.com/docs/drivers/node/current/databases-collections/) page, the database isn't created until you first insert data into it. That's why there's no `await`: this line doesn't talk to the server.

`db.createCollection('books')` does create something, which is why it's awaited. The collection it returns is the object we call every other method on: insert, delete, find.

### 5.2 Seeding

To **seed** a database *[fill it with a known set of starting data]*, we emptied the collection first and then inserted ten books:

```js
        await books.deleteMany({}) // Truncate
```

`deleteMany` takes a filter, the same filter object `find` takes. An empty filter matches every document, so this deletes them all. This is the SQL idea of **truncating** a table *[removing every row but keeping the table]*. Without it, every run of the script would insert another ten books, and after five runs you would have five copies of each.

```js
        // Insert many books (different shapes, some with embedded data)
        await books.insertMany([
            {title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937, genres: ['fantasy', 'adventure']},
            {title: '1984', author: {name: 'George Orwell', born: 1903, country: 'UK'}, year: 1949, inStock: true},
            {title: 'Neuromancer', author: 'William Gibson', price: 149.99, tags: ['cyberpunk', 'sci-fi']},
            {title: 'The Name of the Wind', author: 'Patrick Rothfuss', series: {name: 'The Kingkiller Chronicle', book: 1}},
            {title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', pages: 464},
            {title: 'Sapiens', author: 'Yuval Noah Harari', reviews: [
                {user: 'kari', rating: 5, comment: 'Changed how I think about history'},
                {user: 'ola', rating: 3}
            ]},
            {title: 'The Pragmatic Programmer', authors: ['Andrew Hunt', 'David Thomas'], edition: 2, year: 2019},
            {title: 'Norwegian Wood', author: 'Haruki Murakami', translation: {from: 'Japanese', translator: 'Jay Rubin'}},
            {title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', stock: {oslo: 12, bergen: 4}, price: 199},
            {title: 'The Martian', author: 'Andy Weir', year: 2011, genres: ['sci-fi'], adaptations: [{type: 'film', year: 2015}]}
        ])
```

No two of these books have the same shape. `1984` has an embedded author document where the others have a string. The Pragmatic Programmer has an `authors` array. Sapiens embeds an array of reviews. Half of the books have no `year` at all. The collection accepts every one of them, which is the flexible schema from [last lesson's section 4](../02-intro-to-mongo/lecture.md#4-databases-collections-and-documents), now from code.

### 5.3 Reading it back

```js
        // Read books
        const allBooks = await books.find().toArray()
```

`find()` with no filter matches every document, as it did in the shell. The difference is `.toArray()`. In Node, `find()` doesn't hand you documents. It returns a **cursor** *[an object that fetches the matching documents from the server as you ask for them]*. `toArray()` asks for all of them and gives you a plain JavaScript array, and that's the step you `await`.

Filters and projections are chained onto the cursor before `toArray()`:

```js
        const recent = await books.find({year: { $gt: 2000}})
                        .project({title: 1, year: 1})
                        .toArray() // Terminator

        console.log(recent);
```

The filter is the same object you wrote in `mongosh`. The projection is also the same object, but it goes into its own method, `.project()`, instead of being passed as the second argument to `find`. Each method in the chain returns the cursor, so you can call the next method on it. `toArray()` ends the chain, which is why the comment calls it the terminator. It's the one that runs the query and gives you a result instead of another cursor.

Two books come back: The Pragmatic Programmer (2019) and The Martian (2011). Each has only `title` and `year`, plus the `_id` an inclusion projection always keeps ([last lesson, 9.3](../02-intro-to-mongo/lecture.md#93-_id-is-the-exception)).

Neuromancer isn't there, and it wouldn't be for any year you filter on. It has no `year` field, and `$gt` only matches documents where the field exists. With a flexible schema, a missing field doesn't match the query, and you don't get an error either.

> In the driver, `find` returns a cursor, and `toArray()` turns it into documents.

[Back to contents](#contents)

## 6. Splitting it up

`main-old.js` works, but everything in it lives in `main`: the connection details, the database, the seed data and the queries. We refactored it into three files:

```
class-demo/
├── data/
│   ├── db.js      # the client, the database, the collections
│   └── seed.js    # empties books and inserts the ten books
├── .env           # connection string and database name
├── main-old.js    # the one-file version, kept as it was
└── main.js        # connects, seeds, and reads and writes books
```

The behaviour doesn't change, only where each piece lives.

### 6.1 Configuration in `.env`

The connection string was written straight into the code. It's the one line that changes between your machine, a classmate's machine running MongoDB in Docker, and an Atlas cluster. So it moves out of the code into **external configuration** *[settings the program reads when it starts, instead of having them written into its code]*, the same `.env` and `dotenv` setup you've used since [the Docker lesson](../../../01-cloud-services/module-1/04-intro-to-docker/lecture.md#2-the-application-we-containerised). The database name moves out with it:

```
# DB URI
MONGODB_URI='mongodb://localhost:27017/'
# DB name
DB_NAME='bookstore'
```

This `.env` holds local teaching values only. A real connection string with a password in it doesn't get committed.

### 6.2 Everything about the database in one place

[`data/db.js`](class-demo/data/db.js):

```js
// db.js
const { MongoClient } = require('mongodb')
require('dotenv').config()

const client = new MongoClient(process.env.MONGODB_URI, { family: 4 })
const db = client.db(process.env.DB_NAME)
const books = db.collection('books') // Lazy: created on first insert

module.exports = { client, db, books }
```

This file is the only place that knows how to reach the database. This is a programming principle called **cohesion** *[how closely the things inside one module belong together]*. Everything in `db.js` is about the database, and nothing about the database lives anywhere else.

The `books` collection belongs in this file. A collection is part of the database, so it sits next to the database it comes from. Any file that needs `books` requires it from here. It doesn't get its own client, database or collection. The MongoClient page's advice from 4.3, one client for the whole application, works the same way: this module creates the client once, and everything else shares it.

Notice that `db.js` gets the collection with `db.collection('books')`, not `createCollection`. It works the same way as `client.db`: the collection isn't created until something is inserted into it ([Databases and Collections](https://www.mongodb.com/docs/drivers/node/current/databases-collections/)). Here, that first insert is the seed's `insertMany`.

`db.collection` doesn't talk to the server, so there's no `await`. That's what lets `db.js` export `books` like any other value.

`createCollection` is still useful when a collection needs options, such as validation rules that check the shape of every document going in. We don't have any of those yet, but we could add them later.

### 6.3 The seed on its own

[`data/seed.js`](class-demo/data/seed.js) requires the `books` collection from `db.js` and does what the start of `main-old.js` did:

```js
// seed.js
const { books } = require('./db.js')

async function seed() {
    await books.deleteMany({}) // Truncate

    // Insert many books (different shapes, some with embedded data)
    await books.insertMany([
        // ...the same ten books as in 5.2
    ])
}

module.exports = { seed }
```

`seed` has no `try`/`catch` of its own. If the insert fails, the error goes up to the `catch` in `main`, and the program stops. If `seed` caught its own errors and carried on, the queries after it would run against an empty or half-filled collection.

> `db.js` is the only file that knows where the database is.

[Back to contents](#contents)

## 7. Four functions for the books

[`main.js`](class-demo/main.js) is now only the program: connect, seed, and use the books.

```js
// Import ObjectId, client, books collection and seed
const { ObjectId } = require('mongodb')
const { client, books } = require('./data/db.js')
const { seed } = require('./data/seed.js')

// Main function
async function main() {
    try {
        await client.connect()

        await seed()

        const allBooks = await getAll()
        console.log(allBooks);

        const newerBooks = await getAfterYear(2000)
        console.log(newerBooks);

        // Round trip: insert, then read it back by its new _id
        const id = await insert({ title: 'Dune', author: 'Frank Herbert', year: 1965 })
        const dune = await getById(id)
        console.log(dune);

    } catch (error) {
        console.error(error);
    } finally {
        await client.close()
    }
}

async function getAll() {
    return await books.find().toArray()
}

async function getAfterYear(year) {
    return await books.find({ year: { $gt: year } })
        .project({ title: 1, year: 1 })
        .toArray() // Terminator
}

async function getById(id) {
    return await books.findOne({ _id: new ObjectId(id) })
}

async function insert(book) {
    const result = await books.insertOne(book)
    return result.insertedId
}

main()
```

`main` keeps the one `try`/`catch`/`finally` from section 3, around everything. Each operation is a named function that `main` calls.

### 7.1 Reading

`getAll` is the `find().toArray()` from 5.3.

`getAfterYear` is the "recent" query from 5.3 with the year taken out as a parameter. `main-old.js` could only ask for books after 2000.

### 7.2 Finding one book by its `_id`

`findOne` returns the first document that matches the filter, or `null` if nothing does. Here the filter is on `_id`.

The `_id` of each book is an ObjectId, the BSON type from [last lesson's section 6](../02-intro-to-mongo/lecture.md#6-where-the-_id-comes-from). It isn't a string. An id that reaches your code as text, for example from a URL, is a string, and a string never matches an ObjectId even when the hex characters are identical. `new ObjectId(id)` turns the string into the right type before the query, and it accepts a value that is already an ObjectId too. That's why `ObjectId` is imported from `mongodb` at the top of the file.

If you pass `new ObjectId` a string that isn't a valid id, it throws, and the error goes to the `catch` in `main`. Checking for that belongs to the layer that receives ids from users, which we don't have yet.

### 7.3 Inserting, and the round trip

`insertOne` comes back with the same acknowledgement you saw in the shell ([last lesson, 5.2](../02-intro-to-mongo/lecture.md#52-the-first-document)): `acknowledged: true` and an `insertedId`. `insert` returns just the id, because that's the part the caller needs.

The last three lines of `main`'s `try` use the two functions together. They insert Dune, take the id the server generated, pass it to `getById`, and print the document that comes back, now with the `_id` you never wrote.

These four functions are the start of what will later sit behind a repository or a service. Next lesson brings in Express and Mongoose to give the application that structure.

[Back to contents](#contents)

## 8. Command reference

| Code | What it does |
|---|---|
| `npm install mongodb` | Add the driver to the project |
| `new MongoClient(uri, options)` | Create a client for the server at `uri` |
| `{ family: 4 }` | Client option: use IPv4 only |
| `await client.connect()` | Open the connection |
| `await client.close()` | Close the connection |
| `client.db(name)` | Get a database handle, creating nothing |
| `db.collection(name)` | Get a collection handle, creating nothing |
| `await db.createCollection(name)` | Create a collection explicitly |
| `await coll.insertOne(doc)` | Insert one document, returns `insertedId` |
| `await coll.insertMany([docs])` | Insert an array of documents |
| `coll.find(filter)` | Return a cursor over the matching documents |
| `.project({ field: 1 })` | Choose which fields come back |
| `await cursor.toArray()` | Run the query and return an array |
| `await coll.findOne(filter)` | Return the first match, or `null` |
| `await coll.deleteMany({})` | Delete every document in the collection |
| `new ObjectId(id)` | Turn a string id into an ObjectId |

[Back to contents](#contents)

## 9. Sources

1. MongoDB, *MongoDB Node.js Driver* - [mongodb.com/docs/drivers/node/current](https://www.mongodb.com/docs/drivers/node/current/)
2. MongoDB, *Get Started with the Node.js Driver* - [mongodb.com/docs](https://www.mongodb.com/docs/drivers/node/current/get-started/)
3. MongoDB, *Create a MongoClient* - [mongodb.com/docs](https://www.mongodb.com/docs/drivers/node/current/connect/mongoclient/#std-label-node-mongoclient)
4. MongoDB, *Databases and Collections* (Node.js driver) - [mongodb.com/docs](https://www.mongodb.com/docs/drivers/node/current/databases-collections/)

[Back to contents](#contents)
