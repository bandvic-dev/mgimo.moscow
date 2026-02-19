import jwt from "jsonwebtoken"
import dotenv from 'dotenv'

const env = dotenv.config().parsed

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ error: "No token" })
  }

  const token = authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "No token provided" })
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    req.user = decoded   // 🔥 КЛАДЕМ пользователя
    next()
  } catch (err) {
    console.error("JWT ERROR:", err.message)
    return res.status(403).json({ error: "Invalid token" })
  }
}
