require('dotenv').config()

const express = require('express')
const cors = require('cors')
const proxy = require('express-http-proxy')
const rateLimit = require('express-rate-limit')

const app = express()

const SERVICE_NAME = process.env.SERVICE_NAME || 'gateway'
const ENVIRONMENT = process.env.ENVIRONMENT || 'default'
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001'
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:8080'

// One fixed key for now, not one per user. No default on purpose - a key
// written in the code is a key anyone reading the code has.
const API_KEY = process.env.API_KEY

// Log every request that reaches the gateway. It is the single way in, so
// this one log line covers every service behind it.
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)

  next()
})

// CORS. The website is on a different origin (:8080) from the gateway (:3000),
// so the browser blocks its requests unless the gateway says that origin is
// allowed. Only the website is whitelisted - any other site is still blocked.
// This has to come before the proxy, so it also answers the browser's
// preflight OPTIONS request for the POST.
app.use(cors({ origin: ALLOWED_ORIGIN }))

// Rate limit: each client (by IP) gets 20 requests a minute, then 429s until
// the window resets. Low so it can be hit by hand in class.
// It sits after CORS, so the 429 still carries the CORS header (the page can
// read it instead of seeing a CORS error), and the preflights CORS answers
// don't use up the limit.
const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, try again in a minute' }
})

app.use(limiter)

// Health endpoint for the gateway itself. It says the gateway is up, not that
// the user service behind it is.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: SERVICE_NAME,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT
  })
})

// API key check. Every request below this point must send the key in the
// x-api-key header, or it never reaches a service.
// It sits after CORS, so the browser's preflight OPTIONS (which never carries
// the key) is already answered, and after /health, so health stays open.
// `!API_KEY` matters: if .env has no API_KEY, both sides would be undefined
// and a request with no header would match - and get in.
app.use((req, res, next) => {
  if (!API_KEY || req.get('x-api-key') !== API_KEY) {
    return res.status(401).json({ error: 'Missing or invalid API key' })
  }

  next()
})

// The one forwarding rule. The mount path is stripped before the request is
// forwarded, so GET /users/1 reaches the user service as GET /1.
app.use('/users', proxy(USER_SERVICE_URL))

module.exports = app
