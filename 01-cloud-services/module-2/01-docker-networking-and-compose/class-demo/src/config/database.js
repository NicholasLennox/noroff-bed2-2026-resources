require('dotenv').config()

const { Sequelize } = require('sequelize')

// DB_HOST is the interesting one. Right now it is localhost, because the
// database is port-forwarded onto this machine. Once the API itself is in a
// container, localhost means "this container" - and this line has to change.
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false
  }
)

module.exports = sequelize
