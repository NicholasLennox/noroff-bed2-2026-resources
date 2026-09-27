const express = require('express')
const mongoose = require('mongoose')

const router = express.Router()

// All it needs is whether the connection is up, so it asks Mongoose directly
router.get('/', (req, res) => {
  const connected = mongoose.connection.readyState === 1

  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    uptime: process.uptime(),
    database: connected ? 'connected' : 'disconnected'
  })
})

module.exports = router
