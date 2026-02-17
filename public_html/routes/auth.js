const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../db')

const router = express.Router()

router.post('/register', async (req, res) => {
  const { username, password } = req.body

  const hash = await bcrypt.hash(password, 10)

  await db.query(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, hash]
  )

  res.json({ message: 'User created' })
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body

  const [rows] = await db.query(
    'SELECT * FROM users WHERE username = ?',
    [username]
  )

  if (!rows.length) return res.status(400).json({ error: 'User not found' })

  const user = rows[0]

  const valid = await bcrypt.compare(password, user.password)

  if (!valid) return res.status(400).json({ error: 'Wrong password' })

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET
  )

  res.json({ token })
})

module.exports = router
