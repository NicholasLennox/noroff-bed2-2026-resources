require('dotenv').config()

const mongoose = require('mongoose')

const app = require('./app')

const PORT = process.env.PORT || 3000

// The only file that knows about the network: which database, which port.
// Connect first, then listen, so the API never accepts a request it can't serve.
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')

    app.listen(PORT, () => {
      console.log(`Books API listening on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Could not connect to MongoDB:', error.message)
    process.exit(1)
  })
