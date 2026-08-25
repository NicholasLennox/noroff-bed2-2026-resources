const request = require('supertest')

const app = require('../src/app')

describe('POST /todos', () => {
  it('should create a todo and return it with an id', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: 'Learn Docker networking' })

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.title).toBe('Learn Docker networking')
    expect(res.body.completed).toBe(false)
  })

  it('should return 400 when the title is missing', async () => {
    const res = await request(app).post('/todos').send({})

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('Validation failed')
  })

  it('should return 400 when the title is empty', async () => {
    const res = await request(app).post('/todos').send({ title: '' })

    expect(res.statusCode).toBe(400)
  })
})

describe('GET /todos', () => {
  it('should return an array containing the todo we posted', async () => {
    await request(app).post('/todos').send({ title: 'Check the volume' })

    const res = await request(app).get('/todos')

    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)

    const titles = res.body.map((todo) => todo.title)
    expect(titles).toContain('Check the volume')
  })
})
