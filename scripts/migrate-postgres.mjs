import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const sql = postgres(databaseUrl, { max: 1 })
const migrationsDir = path.resolve('drizzle/postgres')
const lockId = 96_220_260_710

try {
  await sql`select pg_advisory_lock(${lockId})`
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "_app_migrations" (
      "name" text PRIMARY KEY,
      "checksum" text NOT NULL,
      "applied_at" timestamptz NOT NULL DEFAULT now()
    )
  `)

  const files = (await readdir(migrationsDir))
    .filter((name) => /^\d+.*\.sql$/.test(name))
    .sort((a, b) => a.localeCompare(b, 'en'))
  const appliedRows = await sql`select "name", "checksum" from "_app_migrations"`
  const applied = new Map(appliedRows.map((row) => [row.name, row.checksum]))

  for (const name of files) {
    const ddl = await readFile(path.join(migrationsDir, name), 'utf8')
    const checksum = createHash('sha256').update(ddl).digest('hex')
    const previousChecksum = applied.get(name)

    if (previousChecksum === checksum) continue
    if (previousChecksum) {
      throw new Error(`Applied migration was modified: ${name}`)
    }

    await sql.begin(async (tx) => {
      await tx.unsafe(ddl)
      await tx`
        insert into "_app_migrations" ("name", "checksum")
        values (${name}, ${checksum})
      `
    })
    console.log(`[db] applied ${name}`)
  }

  console.log(`[db] PostgreSQL schema is ready (${files.length} migrations)`)
} finally {
  await sql`select pg_advisory_unlock(${lockId})`.catch(() => undefined)
  await sql.end()
}
