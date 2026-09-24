# Using the MongoDB driver

This project connects to MongoDB from Node.js with the official `mongodb` driver. There's no framework and no ORM, just the driver.

## `main-old.js` - everything in one place

This is where we started. One file creates the client, connects, creates the `bookstore` database and the `books` collection, seeds ten books and queries them. It's the most direct way to see what the driver does, step by step.

## `main.js` - split up

We then refactored the same code into three pieces:

- **[`data/db.js`](data/db.js)** holds everything about the database: the client, the database, and the `books` collection. Connection details come from `.env`.
- **[`data/seed.js`](data/seed.js)** clears the `books` collection and inserts the ten books again.
- **[`main.js`](main.js)** connects, runs the seed, and uses four functions: `getAll`, `getAfterYear`, `getById` and `insert`.

The client and the collections all live in `db.js` because they're one responsibility. Anything that needs the `books` collection requires it from there instead of creating its own.

## Running it

You need MongoDB running locally on port `27017`. The connection string and database name are in `.env`.

```bash
npm install
node main-old.js   # the single-file version
node main.js       # the refactored version
```
