import { and, asc, count, desc, eq, sql } from 'drizzle-orm'
import type { DB } from '@/db/client'
import {
  nominations,
  reviews,
  screeningGroupProfiles,
  screeningParticipants,
  screenings,
  votes,
  type Nomination,
  type Review,
  type Screening,
  type ScreeningGroupProfile,
  type ScreeningParticipant,
} from './screening.schema'

export type ScreeningGroup = 'group1' | 'group2' | 'group3'

export function isScreeningGroup(value: unknown): value is ScreeningGroup {
  return value === 'group1' || value === 'group2' || value === 'group3'
}

const DEFAULT_GROUP_PROFILES: Array<{
  groupId: ScreeningGroup
  title: string
  subtitle: string
}> = [
  { groupId: 'group1', title: '船长一群', subtitle: '稳健预测派' },
  { groupId: 'group2', title: '船长二群', subtitle: '锋利押宝派' },
  { groupId: 'group3', title: '船长三群', subtitle: '冷门奇袭派' },
]

export type PublicScreeningGroupProfile = {
  groupId: ScreeningGroup
  title: string
  subtitle: string
  imageUrl: string | null
  updatedAt: number
}

function participantGroup(participant: ScreeningParticipant): ScreeningGroup {
  if (!isScreeningGroup(participant.groupId)) {
    throw new Error('当前群身份异常，请重新选择群身份后再试。')
  }
  return participant.groupId
}

function nominationGroup(type: string): ScreeningGroup {
  return type === 'group2' || type === 'group3' ? type : 'group1'
}

function timeValue(value: Date | number | null | undefined): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  return Date.now()
}

function publicGroupProfile(row: ScreeningGroupProfile | undefined, fallback: (typeof DEFAULT_GROUP_PROFILES)[number]): PublicScreeningGroupProfile {
  const updatedAt = timeValue(row?.updatedAt)
  return {
    groupId: fallback.groupId,
    title: row?.title?.trim() || fallback.title,
    subtitle: row?.subtitle?.trim() || fallback.subtitle,
    imageUrl: row?.imageKey ? `/api/screening-group-images/${fallback.groupId}?v=${updatedAt}` : null,
    updatedAt,
  }
}

export async function listScreeningGroupProfiles(db: DB): Promise<PublicScreeningGroupProfile[]> {
  let rows: ScreeningGroupProfile[] = []
  try {
    rows = await db.select().from(screeningGroupProfiles)
  } catch (error) {
    console.warn('Screening group profiles lookup failed:', error)
  }
  const byGroup = new Map(rows.map((row) => [row.groupId, row]))

  return DEFAULT_GROUP_PROFILES.map((fallback) => {
    const row = byGroup.get(fallback.groupId)
    return publicGroupProfile(row, fallback)
  })
}

export async function saveScreeningGroupProfile(
  db: DB,
  input: { groupId: ScreeningGroup; title: string; subtitle: string; imageKey?: string | null },
): Promise<PublicScreeningGroupProfile> {
  const fallback = DEFAULT_GROUP_PROFILES.find((profile) => profile.groupId === input.groupId)
  if (!fallback) throw new Error('请选择有效的群身份。')

  const title = input.title.trim().slice(0, 40)
  const subtitle = input.subtitle.trim().slice(0, 60)
  if (!title) throw new Error('身份称号不能为空。')
  if (!subtitle) throw new Error('身份说明不能为空。')

  const [existing] = await db
    .select()
    .from(screeningGroupProfiles)
    .where(eq(screeningGroupProfiles.groupId, input.groupId))
    .limit(1)

  const updatedAt = new Date()
  const values = {
    groupId: input.groupId,
    title,
    subtitle,
    imageKey: input.imageKey === undefined ? existing?.imageKey ?? null : input.imageKey,
    updatedAt,
  }

  await db
    .insert(screeningGroupProfiles)
    .values(values)
    .onConflictDoUpdate({
      target: screeningGroupProfiles.groupId,
      set: {
        title: values.title,
        subtitle: values.subtitle,
        imageKey: values.imageKey,
        updatedAt: values.updatedAt,
      },
    })

  return publicGroupProfile(values, fallback)
}

export function normalizeNominationTitle(title: string): string {
  return title.trim().toLocaleLowerCase().replace(/\s+/g, '')
}

export async function getScreeningParticipant(db: DB, participantId?: string): Promise<ScreeningParticipant | null> {
  const id = participantId?.trim()
  if (!id) return null

  let participant: ScreeningParticipant | undefined
  try {
    const result = await db
      .select()
      .from(screeningParticipants)
      .where(eq(screeningParticipants.id, id))
      .limit(1)
    participant = result[0]
  } catch (error) {
    console.warn('Screening participant lookup failed:', error)
    return null
  }

  if (!participant) return null

  await db
    .update(screeningParticipants)
    .set({ lastSeenAt: new Date() })
    .where(eq(screeningParticipants.id, participant.id))

  return participant
}

export async function canSwitchScreeningParticipantGroup(db: DB, participantId: string): Promise<boolean> {
  const [existingNomination] = await db
    .select({ id: nominations.id })
    .from(nominations)
    .where(eq(nominations.nominatedById, participantId))
    .limit(1)
  if (existingNomination) return false

  const [existingVote] = await db
    .select({ id: votes.id })
    .from(votes)
    .where(eq(votes.userId, participantId))
    .limit(1)
  return !existingVote
}

export async function ensureScreeningParticipant(
  db: DB,
  group: ScreeningGroup,
  participantId?: string,
): Promise<ScreeningParticipant> {
  const existing = await getScreeningParticipant(db, participantId)
  if (existing) {
    if (existing.groupId === group) return existing
    if (!(await canSwitchScreeningParticipantGroup(db, existing.id))) {
      throw new Error('你已经提名或投票，暂时不能切换群身份。')
    }

    const lastSeenAt = new Date()
    await db
      .update(screeningParticipants)
      .set({ groupId: group, lastSeenAt })
      .where(eq(screeningParticipants.id, existing.id))
    return { ...existing, groupId: group, lastSeenAt }
  }

  const now = new Date()
  const participant = {
    id: `anon-${crypto.randomUUID()}`,
    groupId: group,
    createdAt: now,
    lastSeenAt: now,
  }

  await db.insert(screeningParticipants).values(participant)
  return participant
}

export async function requireScreeningParticipant(db: DB, participantId?: string): Promise<ScreeningParticipant> {
  const participant = await getScreeningParticipant(db, participantId)
  if (!participant) {
    throw new Error('请先选择你所在的群，再参与提名或投票。')
  }
  return participant
}

export async function getUpcomingScreening(db: DB): Promise<Screening | null> {
  const result = await db
    .select()
    .from(screenings)
    .where(eq(screenings.status, 'upcoming'))
    .orderBy(asc(screenings.date))
    .limit(1)
  return result[0] ?? null
}

export async function listCompletedScreenings(db: DB): Promise<Screening[]> {
  return db
    .select()
    .from(screenings)
    .where(eq(screenings.status, 'completed'))
    .orderBy(desc(screenings.date))
}

export async function getScreeningDetails(
  db: DB,
  screeningId: string,
): Promise<{ screening: Screening | null; reviews: Review[] }> {
  const [screeningInfo] = await db.select().from(screenings).where(eq(screenings.id, screeningId))
  if (!screeningInfo) {
    return { screening: null, reviews: [] }
  }
  const screeningReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.screeningId, screeningId))
    .orderBy(desc(reviews.createdAt))
  return { screening: screeningInfo, reviews: screeningReviews }
}

export interface NominationWithVotes extends Nomination {
  votesCount: number
  hasVoted: boolean
}

export async function listNominations(db: DB, currentUserId?: string): Promise<NominationWithVotes[]> {
  const rawList = await db
    .select({
      id: nominations.id,
      screeningId: nominations.screeningId,
      title: nominations.title,
      cover: nominations.cover,
      type: nominations.type,
      nominatedById: nominations.nominatedById,
      nominatedByName: nominations.nominatedByName,
      reason: nominations.reason,
      status: nominations.status,
      createdAt: nominations.createdAt,
      votesCount: count(votes.id),
    })
    .from(nominations)
    .leftJoin(votes, eq(nominations.id, votes.nominationId))
    .where(eq(nominations.status, 'pending'))
    .groupBy(nominations.id)
    .orderBy(desc(count(votes.id)), desc(nominations.createdAt))

  let userVotedIds = new Set<string>()
  if (currentUserId) {
    const userVotes = await db
      .select({ nominationId: votes.nominationId })
      .from(votes)
      .where(eq(votes.userId, currentUserId))
    userVotedIds = new Set(userVotes.map((v) => v.nominationId))
  }

  return rawList.map((item) => ({
    ...item,
    normalizedTitle: normalizeNominationTitle(item.title),
    votesCount: item.votesCount,
    hasVoted: userVotedIds.has(item.id),
  }))
}

export async function submitNomination(
  db: DB,
  input: { title: string; cover?: string; reason: string },
  participant: ScreeningParticipant,
  userName: string,
): Promise<string> {
  const userGroup = participantGroup(participant)
  const title = input.title.trim()
  const normalizedTitle = normalizeNominationTitle(title)
  const reason = input.reason.trim()
  const nickname = userName.trim()

  if (!normalizedTitle) {
    throw new Error('游戏名称不能为空。')
  }
  if (!nickname) {
    throw new Error('请填写昵称。')
  }
  if (!reason) {
    throw new Error('推荐理由不能为空。')
  }

  const id = `nom-${crypto.randomUUID()}`
  try {
    await db.insert(nominations).values({
      id,
      title,
      normalizedTitle,
      cover: input.cover?.trim() || null,
      type: userGroup,
      nominatedById: participant.id,
      nominatedByName: nickname,
      reason,
      status: 'pending',
      createdAt: new Date(),
    })
  } catch (error) {
    const [duplicateTitle] = await db
      .select({ id: nominations.id })
      .from(nominations)
      .where(eq(nominations.normalizedTitle, normalizedTitle))
      .limit(1)
    if (duplicateTitle) {
      throw new Error('这个 Galgame 已经有人提名过了，请搜索现有提名后投票。')
    }

    const [existingNomination] = await db
      .select({ id: nominations.id })
      .from(nominations)
      .where(eq(nominations.nominatedById, participant.id))
      .limit(1)
    if (existingNomination) {
      throw new Error('你已经提名过游戏了，每人最多只能提名一个游戏。')
    }

    throw error
  }

  return id
}

export async function voteForNomination(
  db: DB,
  nominationId: string,
  participant: ScreeningParticipant,
): Promise<boolean> {
  const userGroup = participantGroup(participant)
  const [targetNomination] = await db
    .select({ id: nominations.id, type: nominations.type, status: nominations.status })
    .from(nominations)
    .where(eq(nominations.id, nominationId))
    .limit(1)
  if (!targetNomination || targetNomination.status !== 'pending') {
    throw new Error('这个提名暂时不能投票。')
  }
  if (nominationGroup(targetNomination.type) !== userGroup) {
    throw new Error('你只能给自己所在群的提名投票。')
  }

  try {
    await db.insert(votes).values({
      id: `vote-${crypto.randomUUID()}`,
      nominationId,
      userId: participant.id,
      createdAt: new Date(),
    })
  } catch (error) {
    const [existingVote] = await db
      .select({ id: votes.id })
      .from(votes)
      .where(eq(votes.userId, participant.id))
      .limit(1)
    if (existingVote) {
      throw new Error('你已经投票过了，每人最多只能投一个游戏。若要更换，请先取消上一张票。')
    }

    throw error
  }

  return true
}

export async function unvoteForNomination(db: DB, nominationId: string, userId: string): Promise<boolean> {
  const res = await db
    .delete(votes)
    .where(and(eq(votes.nominationId, nominationId), eq(votes.userId, userId)))
    .returning({ id: votes.id })
  return res.length > 0
}

export async function submitReview(
  db: DB,
  input: { screeningId: string; rating: number; comment: string },
  userId: string,
  userName: string,
): Promise<string> {
  const rating = Math.max(1, Math.min(5, input.rating))
  const id = `rev-${crypto.randomUUID()}`
  await db.insert(reviews).values({
    id,
    screeningId: input.screeningId,
    userId,
    userName,
    rating,
    comment: input.comment.trim(),
    createdAt: new Date(),
  })
  return id
}

export interface AnalyticsStats {
  totalScreenings: number
  totalNominations: number
  averageRating: number
  categoryDistribution: { type: string; count: number }[]
  ratingDistribution: { rating: number; count: number }[]
  popularNominations: { title: string; votesCount: number }[]
}

export async function getAnalyticsStats(db: DB): Promise<AnalyticsStats> {
  const [{ count: completedCount }] = await db
    .select({ count: count() })
    .from(screenings)
    .where(eq(screenings.status, 'completed'))
  const [{ count: nomCount }] = await db
    .select({ count: count() })
    .from(nominations)

  const [avgRes] = await db
    .select({ avg: sql<number>`avg(${reviews.rating})` })
    .from(reviews)
  const averageRating = avgRes?.avg ? Math.round(Number(avgRes.avg) * 10) / 10 : 0.0

  const categoryDistribution = await db
    .select({
      type: nominations.type,
      count: count(nominations.id),
    })
    .from(nominations)
    .groupBy(nominations.type)

  const rawRatingDist = await db
    .select({
      rating: reviews.rating,
      count: count(reviews.id),
    })
    .from(reviews)
    .groupBy(reviews.rating)

  const ratingDistribution = [1, 2, 3, 4, 5].map((stars) => {
    const found = rawRatingDist.find((r) => r.rating === stars)
    return { rating: stars, count: found ? found.count : 0 }
  })

  const popularNominations = await db
    .select({
      title: nominations.title,
      votesCount: count(votes.id),
    })
    .from(nominations)
    .leftJoin(votes, eq(nominations.id, votes.nominationId))
    .where(eq(nominations.status, 'pending'))
    .groupBy(nominations.id)
    .orderBy(desc(count(votes.id)))
    .limit(5)

  return {
    totalScreenings: completedCount,
    totalNominations: nomCount,
    averageRating,
    categoryDistribution,
    ratingDistribution,
    popularNominations,
  }
}

export interface UserDashboardData {
  myNominations: Nomination[]
  myReviews: (Review & { animeTitle: string; screeningDate: string })[]
}

export async function getUserDashboardData(db: DB, userId: string): Promise<UserDashboardData> {
  const myNoms = await db
    .select()
    .from(nominations)
    .where(eq(nominations.nominatedById, userId))
    .orderBy(desc(nominations.createdAt))

  const myRevs = await db
    .select({
      id: reviews.id,
      screeningId: reviews.screeningId,
      userId: reviews.userId,
      userName: reviews.userName,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      animeTitle: screenings.animeTitle,
      screeningDate: screenings.date,
    })
    .from(reviews)
    .innerJoin(screenings, eq(reviews.screeningId, screenings.id))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt))

  return {
    myNominations: myNoms,
    myReviews: myRevs,
  }
}
