const app = require('./app')
const sequelize = require('./config/database')

require('dotenv').config()

const PORT = process.env.PORT || 3000

async function start () {
  try {
    await sequelize.authenticate()
    await sequelize.sync()

    console.log('Database connected')
  } catch (error) {
    // Deliberately not fatal. If the database is unreachable we still want the
    // API listening, so /health can tell us *that* it is unreachable. A process
    // that exits on boot tells us nothing we can inspect.
    console.error('Database connection failed:', error.message)
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

start()
