require('dotenv').config()

const app = require('./app')

const PORT = process.env.PORT || 8080
const SERVICE_NAME = process.env.SERVICE_NAME || 'website'

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`)
})
