const express = require('express')

const Book = require('./models/book')
const BookService = require('./services/bookService')
const indexRouter = require('./routes/index')
const healthRouter = require('./routes/health')
const createBooksRouter = require('./routes/books')
const errorHandler = require('./middleware/errorHandler')

const app = express()

app.use(express.json())

// Wiring: the one place that decides which model the service works with
const bookService = new BookService(Book)

app.use('/', indexRouter)
app.use('/health', healthRouter)
app.use('/books', createBooksRouter(bookService))

// Registered last, so an error from any route above ends up here
app.use(errorHandler)

module.exports = app
