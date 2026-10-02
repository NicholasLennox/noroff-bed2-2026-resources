require('dotenv').config()

const express = require('express')

const db = require('./models')

const app = express()

const SERVICE_NAME = process.env.SERVICE_NAME || 'user-service'
const ENVIRONMENT = process.env.ENVIRONMENT || 'default'

app.use(express.json())

// Health endpoint.
// `service` says which service answered once requests come through the
// gateway. `database` says whether this service can still reach Azure SQL.
app.get('/health', async (req, res) => {
  let database = 'connected'

  try {
    await db.sequelize.authenticate()
  } catch (error) {
    database = 'disconnected'
  }

  res.status(database === 'connected' ? 200 : 503).json({
    status: database === 'connected' ? 'ok' : 'degraded',
    service: SERVICE_NAME,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT,
    database
  })
})

// All users.
app.get('/', async (req, res) => {
  try {
    const users = await db.User.findAll()

    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch users' })
  }
})

// User by email.
// This has to sit above /:id. Express matches routes in order, and /:id
// would otherwise swallow /email/... as an id.
app.get('/email/:email', async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { Email: req.params.email } })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch user' })
  }
})

// User by id.
app.get('/:id', async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch user' })
  }
})

// Create a user.
app.post('/', async (req, res) => {
  try {
    const user = await db.User.create({
      Username: req.body.username,
      Email: req.body.email
    })

    res.status(201).json(user)
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map((e) => e.message)
      })
    }

    res.status(500).json({ error: 'Could not create user' })
  }
})

module.exports = app
