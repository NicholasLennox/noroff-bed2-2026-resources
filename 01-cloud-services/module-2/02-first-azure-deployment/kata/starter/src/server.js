const app = require('./app')
const sequelize = require('./config/database')

const PORT = 3000

async function start () {
  try {
    await sequelize.authenticate()
    await sequelize.sync()

    console.log('Database connected')
  } catch (error) {
    // Deliberately not fatal. If the database is unreachable we still want the
    // API listening, so that we can ask it what is wrong.
    console.error('Database connection failed:', error.message)
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

start()
