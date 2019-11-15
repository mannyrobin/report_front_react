//server.js
const express = require('express')
const path = require('path')
const compression = require('compression')
const port = process.env.PORT || 3000
const app = express()


function shouldCompress(req, res) {
  if (req.headers['x-no-compression']) {
    return false
  }
  return compression.filter(req, res)
}

app.use(compression({ filter: shouldCompress }))

// the __dirname is the current directory from where the script is running
app.use(express.static(__dirname))
app.use(express.static(path.join(__dirname, 'build')))

app.get('/ping', function (req, res) {
  return res.send('pong')
})

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

app.listen(port, (err) => {
  console.log(`App listen on port: ${port}`)
})