require('dotenv').config()

const express = require('express')

const db = require('./models')
const UserService = require('./services/userService')
const HealthService = require('./services/healthService')
const errorHandler = require('./middleware/errorHandler')

const app = express()

const SERVICE_NAME = process.env.SERVICE_NAME || 'user-service'
const ENVIRONMENT = process.env.ENVIRONMENT || 'default'

const userService = new UserService(db.User)
const healthService = new HealthService(db.sequelize)

app.use(express.json())

// Health endpoint.
// `service` says which service answered once requests come through the
// gateway. `database` says whether this service can still reach Azure SQL.
app.get('/health', async (req, res) => {
  const connected = await healthService.isDatabaseConnected()

  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    service: SERVICE_NAME,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT,
    database: connected ? 'connected' : 'disconnected'
  })
})

// No try/catch in the routes below. If anything throws, Express 5 passes the
// error to errorHandler at the bottom of this file.

// All users, or only those whose email contains ?email=...
app.get('/', async (req, res) => {
  const users = await userService.list({ email: req.query.email })

  res.status(200).json(users)
})

// User by email.
// This has to sit above /:id. Express matches routes in order, and /:id
// would otherwise swallow /email/... as an id.
app.get('/email/:email', async (req, res) => {
  const user = await userService.getByEmail(req.params.email)

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.status(200).json(user)
})

// User by id.
app.get('/:id', async (req, res) => {
  const user = await userService.getById(req.params.id)

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.status(200).json(user)
})

// Create a user.
app.post('/', async (req, res) => {
  const user = await userService.create({
    username: req.body.username,
    email: req.body.email
  })

  res.status(201).json(user)
})

// Last, after every route - it only sees errors the routes above threw.
app.use(errorHandler)

module.exports = app
