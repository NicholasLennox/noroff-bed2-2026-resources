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

// One search that takes whichever fields it is given and builds the filter.
// Callers never see the query syntax, and adding a field later changes only this function.
bookSchema.statics.search = function ({ title, author, tag } = {}) {
  const filter = {}

  if (title) filter.title = new RegExp(title, 'i')
  if (author) filter.authors = new RegExp(author, 'i') // Matches any element of the array
  if (tag) filter.tags = tag

  return this.find(filter)
}

module.exports = mongoose.model('Book', bookSchema)
