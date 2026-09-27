const request = require('supertest')

const app = require('../src/app')

const hobbit = {
  title: 'The Hobbit',
  authors: ['J.R.R. Tolkien'],
  year: 1937,
  genres: ['fantasy'],
  isbn: '978-0261103344',
  tags: ['classic']
}

const pragmatic = {
  title: 'The Pragmatic Programmer',
  authors: ['Andrew Hunt', 'David Thomas'],
  year: 2019,
  genres: ['software'],
  isbn: '978-0135957059',
  tags: ['classic', 'career']
}

const cleanCode = {
  title: 'Clean Code',
  authors: ['Robert C. Martin'],
  year: 2008,
  isbn: '978-0132350884'
}

async function createBook (book) {
  const res = await request(app).post('/books').send(book)
  return res.body
}

describe('POST /books', () => {
  it('should create a book and return it with an id', async () => {
    const res = await request(app).post('/books').send(hobbit)

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('_id')
    expect(res.body.title).toBe('The Hobbit')
    expect(res.body).toHaveProperty('createdAt')
  })

  it('should return 400 when the title is missing', async () => {
    const res = await request(app).post('/books').send({ ...hobbit, title: undefined })

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('Validation failed')
  })

  it('should return 400 when there are no authors', async () => {
    const res = await request(app).post('/books').send({ ...hobbit, authors: [] })

    expect(res.statusCode).toBe(400)
    expect(res.body.details).toContain('A book needs at least one author')
  })

  it('should return 400 when the year is too early', async () => {
    const res = await request(app).post('/books').send({ ...hobbit, year: 1200 })

    expect(res.statusCode).toBe(400)
    expect(res.body.details).toContain('Year must be 1450 or later')
  })

  it('should return 400 when the isbn already exists', async () => {
    await createBook(hobbit)

    const res = await request(app).post('/books').send({ ...cleanCode, isbn: hobbit.isbn })

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('A book with this isbn already exists')
  })
})

describe('GET /books', () => {
  it('should return every book sorted by title', async () => {
    await createBook(hobbit)
    await createBook(cleanCode)
    await createBook(pragmatic)

    const res = await request(app).get('/books')

    expect(res.statusCode).toBe(200)
    expect(res.body.map((book) => book.title)).toEqual([
      'Clean Code',
      'The Hobbit',
      'The Pragmatic Programmer'
    ])
  })

  it('should respect a limit', async () => {
    await createBook(hobbit)
    await createBook(cleanCode)

    const res = await request(app).get('/books?limit=1')

    expect(res.body).toHaveLength(1)
  })

  it('should search by author, ignoring case', async () => {
    await createBook(hobbit)
    await createBook(pragmatic)

    const res = await request(app).get('/books?author=thomas')

    expect(res.body).toHaveLength(1)
    expect(res.body[0].title).toBe('The Pragmatic Programmer')
  })

  it('should search by title', async () => {
    await createBook(hobbit)
    await createBook(cleanCode)

    const res = await request(app).get('/books?title=hobbit')

    expect(res.body).toHaveLength(1)
  })

  it('should search by tag', async () => {
    await createBook(hobbit)
    await createBook(pragmatic)
    await createBook(cleanCode)

    const res = await request(app).get('/books?tag=classic')

    expect(res.body).toHaveLength(2)
  })

  it('should combine search fields', async () => {
    await createBook(hobbit)
    await createBook(pragmatic)

    const res = await request(app).get('/books?tag=classic&author=tolkien')

    expect(res.body).toHaveLength(1)
    expect(res.body[0].title).toBe('The Hobbit')
  })
})

describe('GET /books/:id', () => {
  it('should return the book', async () => {
    const book = await createBook(hobbit)

    const res = await request(app).get(`/books/${book._id}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.title).toBe('The Hobbit')
  })

  it('should return 404 for an id that does not exist', async () => {
    const res = await request(app).get('/books/650000000000000000000000')

    expect(res.statusCode).toBe(404)
  })

  it('should return 400 for an id that is not an ObjectId', async () => {
    const res = await request(app).get('/books/not-an-id')

    expect(res.statusCode).toBe(400)
  })
})

describe('PUT /books/:id', () => {
  it('should update the book and return the new version', async () => {
    const book = await createBook(hobbit)

    const res = await request(app).put(`/books/${book._id}`).send({ ...hobbit, year: 1938 })

    expect(res.statusCode).toBe(200)
    expect(res.body.year).toBe(1938)
  })

  it('should run the schema validators on an update', async () => {
    const book = await createBook(hobbit)

    const res = await request(app).put(`/books/${book._id}`).send({ ...hobbit, year: 1200 })

    expect(res.statusCode).toBe(400)
  })

  it('should return 404 for an id that does not exist', async () => {
    const res = await request(app).put('/books/650000000000000000000000').send(hobbit)

    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /books/:id', () => {
  it('should delete the book', async () => {
    const book = await createBook(hobbit)

    const res = await request(app).delete(`/books/${book._id}`)
    expect(res.statusCode).toBe(204)

    const after = await request(app).get(`/books/${book._id}`)
    expect(after.statusCode).toBe(404)
  })
})
