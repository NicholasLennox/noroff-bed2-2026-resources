const sequelize = require('../src/config/database')

// Runs once per test file. force: true drops and recreates the table, so each
// file starts from a known empty database instead of whatever the last run left
// behind. This is why the test script uses --runInBand: the files share one
// real database, so they must not run at the same time.
beforeAll(async () => {
  await sequelize.sync({ force: true })
})

// Sequelize holds a connection pool open. Without closing it, Jest finishes the
// tests and then hangs waiting for a handle that will never close.
afterAll(async () => {
  await sequelize.close()
})
