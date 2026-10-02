const Sequelize = require('sequelize')
require('dotenv').config()

// The connection string from the Azure portal, split into the pieces Sequelize
// wants. Azure SQL only accepts encrypted connections, hence `encrypt: true`.
const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.ADMIN_USERNAME,
  process.env.ADMIN_PASSWORD,
  {
    host: process.env.HOST,
    dialect: process.env.DIALECT,
    dialectOptions: {
      options: {
        encrypt: true
      }
    },
    logging: false
  }
)

const db = {}
db.sequelize = sequelize
db.User = require('./user')(sequelize, Sequelize)

module.exports = db
