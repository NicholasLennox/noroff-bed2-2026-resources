require('dotenv').config()

const path = require('path')
const express = require('express')

const app = express()

const SERVICE_NAME = process.env.SERVICE_NAME || 'website'
const ENVIRONMENT = process.env.ENVIRONMENT || 'default'

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: SERVICE_NAME,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT
  })
})

// Everything in public/ is sent to the browser as-is. The page then talks to
// the gateway on :3000 by itself - this server never touches the users.
app.use(express.static(path.join(__dirname, '..', 'public')))

module.exports = app
