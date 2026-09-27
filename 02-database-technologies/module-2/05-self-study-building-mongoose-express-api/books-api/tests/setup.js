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
