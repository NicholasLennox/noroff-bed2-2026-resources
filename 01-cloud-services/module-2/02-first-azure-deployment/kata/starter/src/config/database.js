const { Sequelize } = require('sequelize')

const sequelize = new Sequelize('products', 'admin', 'admin123', {
  host: 'localhost',
  port: 3307,
  dialect: 'mysql',
  logging: false
})

module.exports = sequelize
