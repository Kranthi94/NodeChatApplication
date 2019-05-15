const path = require('path')

const http = require('http')

const express = require('express')

const socketio = require('socket.io')

const app = express()

const server = http.createServer(app)

const io = socketio.listen(server)

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {

    console.log('New WebSocket connection')

    socket.emit('message', 'Welcome!')
})

const port = process.env.PORT || 3000

server.listen(port, () => {

    console.log(`Server started in port : ${port}`)
})