import { pgTable, text, integer, uniqueIndex, index, timestamp } from 'drizzle-orm/pg-core'

export const screenings = pgTable('screenings', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  date: text('date').notNull(), // e.g. "2026-07-12" (Sunday)
  bilibiliBvid: text('bilibili_bvid'), // Bilibili BV ID for the trailer or recording
  description: text('description').notNull(),
  status: text('status').notNull().default('upcoming'), // 'upcoming' | 'completed'
  animeTitle: text('anime_title').notNull(), // The main show being screened
  animeCover: text('anime_cover').notNull(), // Cover image URL
  createdAt: timestamp('created_at').notNull(),
})

export const screeningParticipants = pgTable('screening_participants', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull(),
  createdAt: timestamp('created_at').notNull(),
  lastSeenAt: timestamp('last_seen_at').notNull(),
})

export const screeningGroupProfiles = pgTable('screening_group_profiles', {
  groupId: text('group_id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  imageKey: text('image_key'),
  updatedAt: timestamp('updated_at').notNull(),
})

export const nominations = pgTable('nominations', {
  id: text('id').primaryKey(),
  screeningId: text('screening_id'), // Can link to a screening if selected
  title: text('title').notNull(),
  normalizedTitle: text('normalized_title').notNull(),
  cover: text('cover'),
  type: text('type').notNull().default('anime'), // 'anime' | 'movie'
  nominatedById: text('nominated_by_id').notNull(),
  nominatedByName: text('nominated_by_name').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'selected' | 'rejected'
  createdAt: timestamp('created_at').notNull(),
}, (table) => [
  uniqueIndex('nominations_normalized_title_unique').on(table.normalizedTitle),
  uniqueIndex('nominations_nominated_by_id_unique').on(table.nominatedById),
  index('nominations_type_idx').on(table.type),
])

export const votes = pgTable('votes', {
  id: text('id').primaryKey(),
  nominationId: text('nomination_id').notNull(),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').notNull(),
}, (table) => [
  uniqueIndex('votes_user_id_unique').on(table.userId),
  index('votes_nomination_id_idx').on(table.nominationId),
])

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  screeningId: text('screening_id').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  rating: integer('rating').notNull(), // 1 to 5
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').notNull(),
})

export type Screening = typeof screenings.$inferSelect
export type ScreeningParticipant = typeof screeningParticipants.$inferSelect
export type ScreeningGroupProfile = typeof screeningGroupProfiles.$inferSelect
export type Nomination = typeof nominations.$inferSelect
export type Vote = typeof votes.$inferSelect
export type Review = typeof reviews.$inferSelect
