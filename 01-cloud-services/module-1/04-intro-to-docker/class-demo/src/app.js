const express = require('express')

const app = express()

require('dotenv').config()

const ENVIRONMENT = process.env.ENVIRONMENT || 'default'

app.use(express.json())

// Health endpoint
app.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT
  });
});

module.exports = app