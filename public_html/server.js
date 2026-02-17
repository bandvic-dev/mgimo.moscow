require('dotenv').config()
const express = require('express')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')

const authRoutes = require('./routes/auth')
const db = require('./db')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

io.on('connection', (socket) => {
  console.log('User connected')

  socket.on('joinChat', (chatId) => {
    socket.join(`chat_${chatId}`)
  })

  socket.on('sendMessage', async (data) => {
    const { chatId, userId, text } = data

    await db.query(
      'INSERT INTO messages (chat_id, user_id, text) VALUES (?, ?, ?)',
      [chatId, userId, text]
    )

    io.to(`chat_${chatId}`).emit('newMessage', {
      chatId,
      userId,
      text
    })
  })

  socket.on('disconnect', () => {
    console.log('User disconnected')
  })
})

server.listen(process.env.PORT, () => {
  console.log('Server running')
})
