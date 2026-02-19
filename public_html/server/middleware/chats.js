import express from 'express'
import db from '../db.js'
import auth from './auth.js'

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

router.get("/messages", auth, async (req, res) => {
  try {
    console.log("USER FROM TOKEN:", req.user)

    const userId = req.user.id

    const [rows] = await db.query(
      `SELECT 
        messages.id,
        messages.text,
        messages.created_at,
        users.username
      FROM messages
      JOIN users ON messages.user_id = users.id
      ORDER BY messages.created_at ASC
    `
    )

    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Database error" })
  }
})

router.post("/messages", auth, async (req, res) => {
  try {
    const userId = req.user.id
    const { text } = req.body

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Message text required" })
    }

    await db.query(
      "INSERT INTO messages (user_id, text) VALUES (?, ?)",
      [userId, text]
    )

    res.status(201).json({ message: "Message created" })

  } catch (err) {
    console.error("POST MESSAGE ERROR:", err)
    res.status(500).json({ error: "Database error" })
  }
})


export default router
