import express from 'express'
import db from '../db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

const env = dotenv.config().parsed

const router = express.Router()

// Секрет для JWT
const JWT_SECRET = env.JWT_SECRET || 'supersecretkey'

// ===== Регистрация =====
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    // Хешируем пароль
    const hash = await bcrypt.hash(password, 10)

    // Сохраняем в БД
    const [result] = await db.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hash]
    )

    res.json({ id: result.insertId, username })
  } catch (err) {
    console.error('Registration error:', err)

    // Дубликат username
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username already exists' })
    }

    console.error('Registration error:', err)
    res.status(500).json({ error: err.message, code: err.code })
  }
})

// ===== Логин =====
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    // Получаем пользователя из БД
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    )

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username or password' })
    }

    const user = rows[0]

    // Сравниваем пароль
    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      return res.status(400).json({ error: 'Invalid username or password' })
    }

    // Генерируем JWT
const token = jwt.sign(
  { id: user.id, username: user.username },
    env.JWT_SECRET,
  { expiresIn: "1h" }
)


    res.json({ token })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Database error' })
  }
})

export default router
