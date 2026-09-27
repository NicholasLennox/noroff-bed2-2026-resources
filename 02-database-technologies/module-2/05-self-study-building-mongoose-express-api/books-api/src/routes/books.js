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
