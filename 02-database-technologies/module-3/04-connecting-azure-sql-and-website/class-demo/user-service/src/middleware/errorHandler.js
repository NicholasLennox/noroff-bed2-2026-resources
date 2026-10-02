// Four arguments is what tells Express this is an error handler.
// Express 5 sends anything thrown in an async route here.
function errorHandler (err, req, res, next) {
  // Sequelize: the data broke a rule in the model (e.g. a missing username)
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => e.message)
    })
  }

  console.error(err)

  res.status(500).json({ error: 'Something went wrong' })
}

module.exports = errorHandler
