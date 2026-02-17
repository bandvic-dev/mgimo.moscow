const express = require('express')
const db = require('../db')
const auth = require('./auth')

const router = express.Router()

// создать личный чат
router.post('/private', auth, async (req, res) => {
  const { userId } = req.body
  const currentUser = req.user.id

  // создаём чат
  const [chatResult] = await db.query(
    'INSERT INTO chats (name, is_group) VALUES (?, ?)',
    [null, false]
  )

  const chatId = chatResult.insertId

  // добавляем участников
  await db.query(
    'INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?), (?, ?)',
    [chatId, currentUser, chatId, userId]
  )

  res.json({ chatId })
})

router.post('/group', auth, async (req, res) => {
  const { name, participants } = req.body
  const currentUser = req.user.id

  const [chatResult] = await db.query(
    'INSERT INTO chats (name, is_group) VALUES (?, ?)',
    [name, true]
  )

  const chatId = chatResult.insertId

  // добавляем создателя
  await db.query(
    'INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)',
    [chatId, currentUser]
  )

  // добавляем остальных
  for (const userId of participants) {
    await db.query(
      'INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)',
      [chatId, userId]
    )
  }

  res.json({ chatId })
})

router.get('/', auth, async (req, res) => {
  const userId = req.user.id

  const [rows] = await db.query(`
    SELECT c.*
    FROM chats c
    JOIN chat_participants cp ON cp.chat_id = c.id
    WHERE cp.user_id = ?
  `, [userId])

  res.json(rows)
})

router.get('/:chatId/messages', auth, async (req, res) => {
  const { chatId } = req.params

  const [messages] = await db.query(`
    SELECT m.*, u.username
    FROM messages m
    JOIN users u ON u.id = m.user_id
    WHERE m.chat_id = ?
    ORDER BY m.created_at ASC
  `, [chatId])

  res.json(messages)
})

module.exports = router
