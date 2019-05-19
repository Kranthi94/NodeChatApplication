const path = require('path')

const http = require('http')

const Badwords = require('bad-words')

const {generateMessage, generateLocationMessage} = require('./utils/messages')

const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const express = require('express')

const socketio = require('socket.io')

const app = express()

const server = http.createServer(app)

const io = socketio.listen(server)

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {

    socket.on('join', ({username, room}, callback) => {

        const {error, user} = addUser({
            id : socket.id,
            username, 
            room
        })

        if(error) {
            return callback(error) 
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))

        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined`))

        io.to(user.room).emit('room_data', {
            room : user.room,
            users : getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('send_message', (message, callback) => {

        const user = getUser(socket.id)

        const filter = new Badwords()

        if (filter.isProfane(message)) {

            return callback('Profanity is not allowed')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))

        callback()
    })

    socket.on('share_location', ({latitude, longitude}, callback) => {

        const user = getUser(socket.id)

        const url = `https://www.google.com/maps?q=${latitude},${longitude}`

        io.to(user.room).emit('location_message', generateLocationMessage(user.username, url))

        callback()
    })

    socket.on('disconnect', () => {

        const user = removeUser(socket.id)

        if(user) {

            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))

            io.to(user.room).emit('room_data', {
                room : user.room,
                users : getUsersInRoom(user.room)
            })
        }
    })
})

const port = process.env.PORT || 3000

server.listen(port, () => {

    console.log(`Server started in port : ${port}`)
})