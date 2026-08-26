const request = require('supertest')

const app = require('../src/app')

describe('POST /products', () => {
  it('should create a product and return it with an id', async () => {
    const res = await request(app)
      .post('/products')
      .send({ name: 'Mechanical keyboard', price: 899.5 })

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe('Mechanical keyboard')
    expect(res.body.price).toBe(899.5)
    expect(res.body.inStock).toBe(true)
  })

  it('should return 400 when the name is missing', async () => {
    const res = await request(app).post('/products').send({ price: 10 })

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('Validation failed')
  })

  it('should return 400 when the price is negative', async () => {
    const res = await request(app)
      .post('/products')
      .send({ name: 'Broken pricing', price: -1 })

    expect(res.statusCode).toBe(400)
  })
})

describe('GET /products', () => {
  it('should return an array containing the product we posted', async () => {
    await request(app).post('/products').send({ name: 'Desk lamp', price: 249 })

    const res = await request(app).get('/products')

    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)

    const names = res.body.map((product) => product.name)
    expect(names).toContain('Desk lamp')
  })
})
