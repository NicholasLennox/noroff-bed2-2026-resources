require('dotenv').config()

const app = require('./app')

const PORT = process.env.PORT || 3000
const SERVICE_NAME = process.env.SERVICE_NAME || 'gateway'

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`)
})
