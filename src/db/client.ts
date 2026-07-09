import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let client: postgres.Sql | undefined

function getClient() {
  if (!client) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is required')
    client = postgres(url, { max: Number(process.env.DATABASE_POOL_SIZE ?? 10) })
  }
  return client
}

/**
 * PostgreSQL database entry. The optional argument keeps existing
 * `createDb(env.DB)` call sites working after leaving Cloudflare D1.
 */
export function createDb(_ignored?: unknown) {
  return drizzle(getClient(), { schema })
}

export type DB = ReturnType<typeof createDb>
