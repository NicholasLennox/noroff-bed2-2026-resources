const express = require('express')

const app = express()

// App Service expects port 80 unless it is told otherwise with the WEBSITES_PORT setting.
const PORT = 3000

// The one line we come back and change, so we can watch a new image reach Azure.
app.get('/greeting', (req, res) => {
  res.status(200).json({ greeting: 'howzit' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
