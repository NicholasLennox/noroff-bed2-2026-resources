const express = require('express')

const sequelize = require('./config/database')
const Todo = require('./models/todo')

require('dotenv').config()

const app = express()

const ENVIRONMENT = process.env.ENVIRONMENT || 'default'

app.use(express.json())

// Health endpoint.
// It no longer just says "the process is alive" - it also asks the database
// whether it can still be reached. That second answer is the one we care about
// once the API moves into its own container.
app.get('/health', async (req, res) => {
  let database = 'connected'

  try {
    await sequelize.authenticate()
  } catch (error) {
    database = 'disconnected'
  }

  res.status(database === 'connected' ? 200 : 503).json({
    status: database === 'connected' ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT,
    database
  })
})

// Create a todo.
app.post('/todos', async (req, res) => {
  try {
    const todo = await Todo.create({ title: req.body.title })

    res.status(201).json(todo)
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map((e) => e.message)
      })
    }

    res.status(500).json({ error: 'Could not create todo' })
  }
})

// Read all todos
app.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.findAll()

    res.status(200).json(todos)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch todos' })
  }
})

module.exports = app
