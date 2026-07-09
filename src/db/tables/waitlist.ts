import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const waitlist = pgTable('waitlist', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  locale: text('locale').notNull(),
  source: text('source').notNull().default('waitlist'),
  createdAt: timestamp('created_at').notNull(),
})

export type Waitlist = typeof waitlist.$inferSelect
