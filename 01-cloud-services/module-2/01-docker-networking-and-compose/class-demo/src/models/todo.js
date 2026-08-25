const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Todo = sequelize.define('Todo', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'title cannot be empty' }
    }
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
})

module.exports = Todo
