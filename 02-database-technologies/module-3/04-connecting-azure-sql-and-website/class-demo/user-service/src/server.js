require('dotenv').config()

const app = require('./app')
const db = require('./models')

const PORT = process.env.PORT || 3001
const SERVICE_NAME = process.env.SERVICE_NAME || 'user-service'

async function start () {
  try {
    await db.sequelize.authenticate()

    console.log('Connected to Azure SQL')
  } catch (error) {
    // Not fatal. The service still starts, so /health can report that the
    // database is unreachable instead of the process just disappearing.
    console.error('Database connection failed:', error.message)
  }

  app.listen(PORT, () => {
    console.log(`${SERVICE_NAME} running on port ${PORT}`)
  })
}

start()
