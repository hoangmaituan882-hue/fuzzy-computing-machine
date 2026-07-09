import { readFile } from 'node:fs/promises'
import path from 'node:path'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const sql = postgres(databaseUrl, { max: 1 })
const file = path.resolve('drizzle/postgres/0000_init.sql')
const ddl = await readFile(file, 'utf8')

try {
  await sql.unsafe(ddl)
  console.log('[db] PostgreSQL schema is ready')
} finally {
  await sql.end()
}
