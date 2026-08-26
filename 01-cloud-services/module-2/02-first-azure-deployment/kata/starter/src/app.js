const express = require('express')

const Product = require('./models/product')

const app = express()

app.use(express.json())

// Health endpoint. It reports that this process is running, and nothing else.
app.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

// Create a product.
app.post('/products', async (req, res) => {
  try {
    const product = await Product.create({
      name: req.body.name,
      price: req.body.price
    })

    res.status(201).json(product)
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map((e) => e.message)
      })
    }

    res.status(500).json({ error: 'Could not create product' })
  }
})

// Read all products.
app.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll()

    res.status(200).json(products)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch products' })
  }
})

module.exports = app
