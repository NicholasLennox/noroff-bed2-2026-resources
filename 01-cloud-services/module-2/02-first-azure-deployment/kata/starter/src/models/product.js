const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'name cannot be empty' }
    }
  },
  price: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'price cannot be negative' }
    }
  },
  inStock: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
})

module.exports = Product
