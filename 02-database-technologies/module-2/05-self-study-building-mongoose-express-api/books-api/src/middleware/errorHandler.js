// Four arguments is what tells Express this is an error handler.
// Express 5 sends anything thrown in an async route here.
function errorHandler (err, req, res, next) {
  // Mongoose: the data broke a rule in the schema
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map((e) => e.message)
    })
  }

  // MongoDB: a unique index already holds this value
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]

    return res.status(400).json({
      error: `A book with this ${field} already exists`
    })
  }

  console.error(err)

  res.status(500).json({ error: 'Something went wrong' })
}

module.exports = errorHandler
