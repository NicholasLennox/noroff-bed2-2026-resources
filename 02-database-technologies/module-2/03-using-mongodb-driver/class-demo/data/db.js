// db.js
const { MongoClient } = require('mongodb')
require('dotenv').config()

const client = new MongoClient(process.env.MONGODB_URI, { family: 4 })
const db = client.db(process.env.DB_NAME)
const books = db.collection('books') // Lazy: created on first insert

module.exports = { client, db, books }