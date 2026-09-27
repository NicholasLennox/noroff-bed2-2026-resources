const mongoose = require('mongoose')

// Runs before any /:id route. A request with an id that can't be an ObjectId
// is turned away here, before the service or the database sees it.
function validateObjectId (req, res, next) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ error: `'${req.params.id}' is not a valid id` })
  }

  next()
}

module.exports = validateObjectId
