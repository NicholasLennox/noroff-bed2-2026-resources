const request = require('supertest')

const app = require('../src/app')

describe('GET /health', () => {
  it('should return 200 and status ok', async () => {
    const res = await request(app).get('/health')

    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('should report the database as connected', async () => {
    const res = await request(app).get('/health')

    expect(res.body).toHaveProperty('database')
    expect(res.body.database).toBe('connected')
  })

  it('should return the environment from .env', async () => {
    const res = await request(app).get('/health')

    expect(res.body.environment).not.toBe('default')
  })
})
