const { Op } = require('sequelize')

// Everything that talks to the Users table lives here. The routes in app.js
// only deal with requests and responses - they never see Sequelize.
class UserService {
  // The model is passed in rather than required here, so app.js decides what
  // the service talks to
  constructor (User) {
    this.User = User
  }

  // All users, or only those whose email contains `email`.
  // LIKE '%gra%' matches any email with "gra" anywhere in it.
  list ({ email } = {}) {
    const where = {}

    if (email) {
      where.Email = { [Op.like]: `%${email}%` }
    }

    return this.User.findAll({ where })
  }

  getById (id) {
    return this.User.findByPk(id)
  }

  getByEmail (email) {
    return this.User.findOne({ where: { Email: email } })
  }

  // The API takes lowercase fields; the table columns are PascalCase.
  create ({ username, email }) {
    return this.User.create({
      Username: username,
      Email: email
    })
  }
}

module.exports = UserService
