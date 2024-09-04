const express = require('express')
const app = express()
const port = process.env.PORT || 8000
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})
app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
