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

  getById (id) {
    return this.Book.findById(id)
  }

  create (data) {
    return this.Book.create(data)
  }

  update (id, data) {
    return this.Book.findByIdAndUpdate(id, data, {
      returnDocument: 'after', // Send back the book as it is now, not as it was
      runValidators: true // Updates skip schema validation unless told otherwise
    })
  }

  remove (id) {
    return this.Book.findByIdAndDelete(id)
  }
}

module.exports = BookService
