import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import type { PublicScreeningGroupProfile, ScreeningGroup } from './screening.server'

type ScreeningIdentity = {
  participantId: string
  group: ScreeningGroup
  canSwitch: boolean
}

type GroupProfileImageUploadResult =
  | { ok: true; profile: PublicScreeningGroupProfile }
  | { ok: false; reason: 'noFile' | 'group' | import('./screening-assets').ScreeningGroupImageReason }

type BangumiSearchItem = {
  id: number
  name: string
  name_cn: string
  summary: string
  score?: number
  rating?: {
    score?: number
  }
  images?: {
    large?: string
    common?: string
    medium?: string
  }
}

type BangumiSearchResult = {
  id: string
  title: string
  originalTitle: string
  cover: string
  summary: string
  score: number
}

const BANGUMI_SEARCH_CACHE_TTL_MS = 10 * 60 * 1000
const BANGUMI_SEARCH_CACHE_MAX = 120
const bangumiSearchCache = new Map<string, { expiresAt: number; results: BangumiSearchResult[] }>()
const bangumiSearchInFlight = new Map<string, Promise<BangumiSearchResult[]>>()

function bangumiSearchCacheKey(keyword: string, type: 'anime' | 'game'): string {
  return `${type}:${keyword.trim().toLocaleLowerCase()}`
}

function getCachedBangumiSearch(key: string): BangumiSearchResult[] | undefined {
  const cached = bangumiSearchCache.get(key)
  if (!cached) return undefined
  if (cached.expiresAt <= Date.now()) {
    bangumiSearchCache.delete(key)
    return undefined
  }
  return cached.results
}

function setCachedBangumiSearch(key: string, results: BangumiSearchResult[]) {
  if (bangumiSearchCache.size >= BANGUMI_SEARCH_CACHE_MAX) {
    const oldestKey = bangumiSearchCache.keys().next().value
    if (oldestKey) bangumiSearchCache.delete(oldestKey)
  }
  bangumiSearchCache.set(key, {
    expiresAt: Date.now() + BANGUMI_SEARCH_CACHE_TTL_MS,
    results,
  })
}

async function currentUser() {
  const { readUser } = await import('@/features/auth/readUser.server')
  const user = await readUser()
  if (!user) throw redirect({ to: '/{-$locale}/login' })
  return user
}

async function currentParticipantId(): Promise<string | undefined> {
  const { getCookie } = await import('@tanstack/react-start/server')
  const id = getCookie('screening_participant_id')?.trim()
  return id || undefined
}

async function currentScreeningIdentity(): Promise<ScreeningIdentity | undefined> {
  const { createDb } = await import('@/db/client')
  const { env } = await import('@/lib/env')
  const { canSwitchScreeningParticipantGroup, getScreeningParticipant, isScreeningGroup } = await import('./screening.server')
  const db = createDb(env.DB)
  const participant = await getScreeningParticipant(db, await currentParticipantId())

  if (!participant || !isScreeningGroup(participant.groupId)) return undefined
  return {
    participantId: participant.id,
    group: participant.groupId,
    canSwitch: await canSwitchScreeningParticipantGroup(db, participant.id),
  }
}

async function requireCurrentParticipant() {
  const { createDb } = await import('@/db/client')
  const { env } = await import('@/lib/env')
  const { requireScreeningParticipant } = await import('./screening.server')
  return requireScreeningParticipant(createDb(env.DB), await currentParticipantId())
}

export const getScreeningGroupFn = createServerFn({ method: 'GET' }).handler(async () => {
  return (await currentScreeningIdentity())?.group
})

export const getScreeningIdentityFn = createServerFn({ method: 'GET' }).handler(currentScreeningIdentity)

export const listScreeningGroupProfilesFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { createDb } = await import('@/db/client')
  const { env } = await import('@/lib/env')
  const { listScreeningGroupProfiles } = await import('./screening.server')
  return listScreeningGroupProfiles(createDb(env.DB))
})

export const getAdminScreeningGroupProfilesFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { createDb } = await import('@/db/client')
  const { env } = await import('@/lib/env')
  const { assertAdmin } = await import('@/features/admin/assert-admin.server')
  const { listScreeningGroupProfiles } = await import('./screening.server')
  await assertAdmin()
  return listScreeningGroupProfiles(createDb(env.DB))
})

export const saveScreeningGroupProfileFn = createServerFn({ method: 'POST' })
  .validator((d: { groupId: ScreeningGroup; title: string; subtitle: string }) => d)
  .handler(async ({ data }) => {
    const { createDb } = await import('@/db/client')
    const { env } = await import('@/lib/env')
    const { assertAdmin } = await import('@/features/admin/assert-admin.server')
    const { isScreeningGroup, saveScreeningGroupProfile } = await import('./screening.server')
    await assertAdmin()
    if (!isScreeningGroup(data.groupId)) throw new Error('请选择有效的群身份。')
    return saveScreeningGroupProfile(createDb(env.DB), data)
  })

export const uploadScreeningGroupProfileImageFn = createServerFn({ method: 'POST' })
  .validator((d: FormData) => d)
  .handler(async ({ data }): Promise<GroupProfileImageUploadResult> => {
    const { createDb } = await import('@/db/client')
    const { env } = await import('@/lib/env')
    const { assertAdmin } = await import('@/features/admin/assert-admin.server')
    const { putScreeningGroupImage } = await import('./screening-assets.server')
    const { validateScreeningGroupImage } = await import('./screening-assets')
    const { isScreeningGroup, saveScreeningGroupProfile } = await import('./screening.server')

    await assertAdmin()
    const groupId = data.get('groupId')
    if (!isScreeningGroup(groupId)) return { ok: false, reason: 'group' }

    const file = data.get('file')
    if (!(file instanceof File)) return { ok: false, reason: 'noFile' }

    const check = validateScreeningGroupImage({ type: file.type, size: file.size })
    if (!check.ok) return { ok: false, reason: check.reason }

    const imageKey = await putScreeningGroupImage(groupId, await file.arrayBuffer(), file.type)
    const db = createDb(env.DB)
    const profiles = await import('./screening.server').then((mod) => mod.listScreeningGroupProfiles(db))
    const current = profiles.find((profile) => profile.groupId === groupId)
    const profile = await saveScreeningGroupProfile(db, {
      groupId,
      title: current?.title ?? '群友身份',
      subtitle: current?.subtitle ?? '点击选择你的群',
      imageKey,
    })
    return { ok: true, profile }
  })

export const setScreeningGroupFn = createServerFn({ method: 'POST' })
  .validator((group: ScreeningGroup) => group)
  .handler(async ({ data: group }) => {
    const { createDb } = await import('@/db/client')
    const { env } = await import('@/lib/env')
    const { ensureScreeningParticipant, isScreeningGroup } = await import('./screening.server')
    if (!isScreeningGroup(group)) throw new Error('请选择有效的群身份。')

    const participant = await ensureScreeningParticipant(createDb(env.DB), group, await currentParticipantId())
    if (!isScreeningGroup(participant.groupId)) throw new Error('当前群身份异常，请重新选择群身份后再试。')
    const { canSwitchScreeningParticipantGroup } = await import('./screening.server')
    return {
      participantId: participant.id,
      group: participant.groupId,
      canSwitch: await canSwitchScreeningParticipantGroup(createDb(env.DB), participant.id),
    } satisfies ScreeningIdentity
  })

export const getUpcomingScreeningFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { createDb } = await import('@/db/client')
  const { env } = await import('@/lib/env')
  const { getUpcomingScreening } = await import('./screening.server')
  return getUpcomingScreening(createDb(env.DB))
})

export const listCompletedScreeningsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { createDb } = await import('@/db/client')
  const { env } = await import('@/lib/env')
  const { listCompletedScreenings } = await import('./screening.server')
  return listCompletedScreenings(createDb(env.DB))
})

export const getScreeningDetailsFn = createServerFn({ method: 'GET' })
  .validator((screeningId: string) => screeningId)
  .handler(async ({ data: screeningId }) => {
    const { createDb } = await import('@/db/client')
    const { env } = await import('@/lib/env')
    const { getScreeningDetails } = await import('./screening.server')
    return getScreeningDetails(createDb(env.DB), screeningId)
  })

export const listNominationsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { createDb } = await import('@/db/client')
  const { env } = await import('@/lib/env')
  const { listNominations } = await import('./screening.server')
  const identity = await currentScreeningIdentity()
  return listNominations(createDb(env.DB), identity?.participantId)
})

export const submitNominationFn = createServerFn({ method: 'POST' })
  .validator((d: { title: string; cover?: string; reason: string; nickname: string }) => d)
  .handler(async ({ data }) => {
    const { createDb } = await import('@/db/client')
    const { env } = await import('@/lib/env')
    const { submitNomination } = await import('./screening.server')
    return submitNomination(createDb(env.DB), data, await requireCurrentParticipant(), data.nickname)
  })

export const voteForNominationFn = createServerFn({ method: 'POST' })
  .validator((nominationId: string) => nominationId)
  .handler(async ({ data: nominationId }) => {
    const { createDb } = await import('@/db/client')
    const { env } = await import('@/lib/env')
    const { voteForNomination } = await import('./screening.server')
    return voteForNomination(createDb(env.DB), nominationId, await requireCurrentParticipant())
  })

export const unvoteForNominationFn = createServerFn({ method: 'POST' })
  .validator((nominationId: string) => nominationId)
  .handler(async ({ data: nominationId }) => {
    const { createDb } = await import('@/db/client')
    const { env } = await import('@/lib/env')
    const { unvoteForNomination } = await import('./screening.server')
    const participant = await requireCurrentParticipant()
    return unvoteForNomination(createDb(env.DB), nominationId, participant.id)
  })

export const submitReviewFn = createServerFn({ method: 'POST' })
  .validator((d: { screeningId: string; rating: number; comment: string }) => d)
  .handler(async ({ data }) => {
    const { createDb } = await import('@/db/client')
    const { env } = await import('@/lib/env')
    const { submitReview } = await import('./screening.server')
    const user = await currentUser()
    const userName = user.name || user.email.split('@')[0]
    return submitReview(createDb(env.DB), data, user.id, userName)
  })

export const getAnalyticsStatsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { createDb } = await import('@/db/client')
  const { env } = await import('@/lib/env')
  const { getAnalyticsStats } = await import('./screening.server')
  return getAnalyticsStats(createDb(env.DB))
})

export const getUserDashboardDataFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { createDb } = await import('@/db/client')
  const { env } = await import('@/lib/env')
  const { getUserDashboardData } = await import('./screening.server')
  const user = await currentUser()
  return getUserDashboardData(createDb(env.DB), user.id)
})

export const searchBangumiFn = createServerFn({ method: 'GET' })
  .validator((d: { keyword: string; type?: 'anime' | 'game' }) => d)
  .handler(async ({ data }) => {
    const { keyword, type = 'game' } = data
    const trimmedKeyword = keyword.trim()
    if (!trimmedKeyword) return []

    const bgmType = type === 'anime' ? 2 : 4
    const cacheKey = bangumiSearchCacheKey(trimmedKeyword, type)
    const cached = getCachedBangumiSearch(cacheKey)
    if (cached) return cached

    const inFlight = bangumiSearchInFlight.get(cacheKey)
    if (inFlight) return inFlight

    const searchPromise = (async (): Promise<BangumiSearchResult[]> => {
      const response = await fetch('https://bgmapi.anibt.net/v0/search/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'flarestarter-app (https://github.com/starc007/ui-components)',
        },
        body: JSON.stringify({
          keyword: trimmedKeyword,
          filter: {
            type: [bgmType],
          },
          limit: 20,
        }),
      })

      if (!response.ok) {
        throw new Error(`Bangumi API error: ${response.statusText}`)
      }

      const resData = (await response.json()) as {
        data?: BangumiSearchItem[]
      }

      const items = resData.data || []
      const results = items.flatMap((item) => {
        const score = item.score ?? item.rating?.score ?? 0
        if (score < 8.5) return []

        let coverUrl = item.images?.large || item.images?.common || ''
        if (coverUrl) {
          coverUrl = coverUrl.replace(/lain\.bgm\.tv/g, 'bgmimg.anibt.net')
        }

        return {
          id: item.id.toString(),
          title: item.name_cn || item.name,
          originalTitle: item.name,
          cover: coverUrl,
          summary: item.summary || '',
          score,
        }
      }).slice(0, 8)

      setCachedBangumiSearch(cacheKey, results)
      return results
    })()

    bangumiSearchInFlight.set(cacheKey, searchPromise)

    try {
      return await searchPromise
    } catch (error) {
      console.error('Error searching Bangumi:', error)
      return []
    } finally {
      bangumiSearchInFlight.delete(cacheKey)
    }
  })
