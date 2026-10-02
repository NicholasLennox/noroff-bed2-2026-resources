// Answers one question for /health: can this service still reach Azure SQL?
class HealthService {
  constructor (sequelize) {
    this.sequelize = sequelize
  }

  async isDatabaseConnected () {
    try {
      await this.sequelize.authenticate()

      return true
    } catch (error) {
      return false
    }
  }
}

module.exports = HealthService
