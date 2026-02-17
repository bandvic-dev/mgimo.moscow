require('dotenv').config()
const express = require('express')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')

const authRoutes = require('./routes/auth')
const chatRoutes = require('./server/routes/chats')

const db = require('./db')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/chats', chatRoutes)

const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: '*' }
})

io.use((socket, next) => {
  const token = socket.handshake.auth.token

  if (!token) return next(new Error('Unauthorized'))

  try {
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.user = decoded
    next()
  } catch {
    next(new Error('Unauthorized'))
  }
})


io.on('connection', (socket) => {
  console.log('User connected')

  socket.on('joinChat', (chatId) => {
    socket.join(`chat_${chatId}`)
  })

  socket.on('sendMessage', async ({ chatId, text }) => {
    const userId = socket.user.id

    // ✅ Проверяем, состоит ли пользователь в чате
    const [rows] = await db.query(
      'SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ?',
      [chatId, userId]
    )

    if (!rows.length) {
      return // пользователь не участник — игнорируем
    }

    // ✅ Сохраняем сообщение
    await db.query(
      'INSERT INTO messages (chat_id, user_id, text) VALUES (?, ?, ?)',
      [chatId, userId, text]
    )

    // ✅ Отправляем в комнату
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
