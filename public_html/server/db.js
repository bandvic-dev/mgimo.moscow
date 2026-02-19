import mysql from 'mysql2'
import dotenv from 'dotenv'

const env = dotenv.config().parsed

const pool = mysql.createPool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME
})

export default pool.promise()
