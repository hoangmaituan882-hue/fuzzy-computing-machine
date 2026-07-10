import { createFileRoute, useRouter, getRouteApi, Link } from '@tanstack/react-router'
import { useState, useTransition, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, Film, AlertCircle, Trophy, Gamepad2, Settings, UserRoundCog } from 'lucide-react'
import { getOrigin } from '@/features/seo/seo.fns'
import { localeHead } from '@/features/seo/seo'
import type { Locale } from '@/features/i18n/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useReducedMotion } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ThemeToggle } from '@/features/theme/theme-toggle'
import {
  ScreeningResults,
  type ScreeningResultGroupId,
} from '@/features/screening/components/screening-results'
import {
  listNominationsFn,
  getScreeningIdentityFn,
  listScreeningGroupProfilesFn,
  setScreeningGroupFn,
  submitNominationFn,
  voteForNominationFn,
  unvoteForNominationFn,
  searchBangumiFn,
} from '@/features/screening/screening.fns'

const rootRoute = getRouteApi('__root__')
gsap.registerPlugin(useGSAP)

type GroupId = ScreeningResultGroupId
type BangumiResult = { id: string; title: string; originalTitle?: string; cover?: string; summary?: string; score: number }
type GroupVisual = {
  id: GroupId
  tag: string
  title: string
  subtitle: string
  imageUrl?: string | null
  gradient: string
  pattern: string
  accentClass: string
}

const SCREENING_GROUPS: Array<{ id: GroupId; label: string; short: string }> = [
  { id: 'group1', label: '舰长一群群友', short: '一群' },
  { id: 'group2', label: '舰长二群群友', short: '二群' },
  { id: 'group3', label: '舰长三群群友', short: '三群' },
]

const GROUP_VISUALS: GroupVisual[] = [
  {
    id: 'group1',
    tag: 'GROUP 01',
    title: '舰长一群',
    subtitle: '稳健预测派',
    gradient: 'linear-gradient(135deg,#0f172a 0%,#2563eb 48%,#38bdf8 100%)',
    pattern: 'radial-gradient(circle at 22% 18%,rgba(255,255,255,.36),transparent 28%), radial-gradient(circle at 82% 76%,rgba(56,189,248,.45),transparent 26%)',
    accentClass: 'text-sky-200',
    imageUrl: '/screening-heroes/group1.png',
  },
  {
    id: 'group2',
    tag: 'GROUP 02',
    title: '舰长二群',
    subtitle: '锋利押宝派',
    gradient: 'linear-gradient(135deg,#111827 0%,#4f46e5 44%,#f97316 100%)',
    pattern: 'radial-gradient(circle at 72% 22%,rgba(255,255,255,.35),transparent 26%), radial-gradient(circle at 18% 82%,rgba(249,115,22,.45),transparent 28%)',
    accentClass: 'text-orange-200',
    imageUrl: '/screening-heroes/group2.png',
  },
  {
    id: 'group3',
    tag: 'GROUP 03',
    title: '舰长三群',
    subtitle: '冷门奇袭派',
    gradient: 'linear-gradient(135deg,#052e2b 0%,#059669 48%,#bef264 100%)',
    pattern: 'radial-gradient(circle at 20% 78%,rgba(255,255,255,.35),transparent 26%), radial-gradient(circle at 84% 18%,rgba(190,242,100,.42),transparent 30%)',
    accentClass: 'text-lime-100',
    imageUrl: '/screening-heroes/group3.png',
  },
]

function normalizeNominationTitle(title: string): string {
  return title.trim().toLocaleLowerCase().replace(/\s+/g, '')
}

function GroupIdentityCard({
  group,
  disabled,
  duplicate,
  mobile,
  onSelect,
}: {
  group: GroupVisual
  disabled?: boolean
  duplicate?: boolean
  mobile?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      data-screening-group={group.id}
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : undefined}
      onClick={onSelect}
      className={`flex shrink-0 flex-col justify-end overflow-hidden rounded-lg border border-white/40 bg-white text-left text-white shadow-none outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60 ${
        mobile
          ? 'h-[clamp(17rem,52dvh,22rem)] w-[clamp(13.5rem,72vw,18rem)] p-4 min-[380px]:p-5'
          : 'h-[clamp(22rem,58dvh,28rem)] w-[clamp(17rem,25vw,20rem)] p-5 lg:p-7'
      }`}
      style={{
        backgroundImage: group.imageUrl
          ? `linear-gradient(to top,rgba(2,6,23,.92),rgba(2,6,23,.28) 52%,rgba(2,6,23,.08)), ${group.pattern}, url(${group.imageUrl})`
          : `${group.pattern}, ${group.gradient}`,
        backgroundPosition: group.imageUrl ? 'center, center, center 12px' : undefined,
        backgroundRepeat: 'no-repeat',
        backgroundSize: group.imageUrl ? '100% 100%, cover, auto 94%' : 'cover',
      }}
    >
      <span className="mb-auto flex w-full items-start justify-between gap-3">
        <span className={`rounded-full border border-white/35 bg-white/15 py-1 font-black text-white/80 backdrop-blur ${
          mobile ? 'px-2.5 text-[10px] tracking-[0.18em]' : 'px-3 text-xs tracking-[0.22em]'
        }`}>
          {group.tag}
        </span>
        <span className={`inline-flex shrink-0 items-center justify-center rounded-md bg-white/20 ${mobile ? 'h-9 w-9' : 'h-11 w-11'}`}>
          <Gamepad2 className={mobile ? 'h-4 w-4' : 'h-5 w-5'} />
        </span>
      </span>
      <span className={`${mobile ? 'text-xs min-[380px]:text-sm' : 'text-sm lg:text-base'} font-bold ${group.accentClass}`}>
        {group.subtitle}
      </span>
      <span className={`${mobile ? 'text-3xl min-[380px]:text-4xl' : 'text-4xl lg:text-5xl'} mt-2 line-clamp-2 break-words font-black leading-none tracking-tight`}>
        {group.title}
      </span>
    </button>
  )
}

function GroupIdentityCarousel({
  groups,
  onChoose,
  disabled,
}: {
  groups: GroupVisual[]
  onChoose: (group: GroupId) => void
  disabled?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const mobileContainerRef = useRef<HTMLDivElement>(null)
  const mobileTrackRef = useRef<HTMLDivElement>(null)
  const desktopContainerRef = useRef<HTMLDivElement>(null)
  const desktopTrackRef = useRef<HTMLDivElement>(null)
  const mobileDraggedRef = useRef(false)
  const desktopDraggedRef = useRef(false)
  const [viewportWidth, setViewportWidth] = useState(0)

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth)
    updateViewportWidth()
    window.addEventListener('resize', updateViewportWidth)
    return () => window.removeEventListener('resize', updateViewportWidth)
  }, [])

  useGSAP(
    () => {
      const container = mobileContainerRef.current
      const track = mobileTrackRef.current
      if (!container || !track || reduceMotion || window.matchMedia('(min-width: 768px)').matches) return

      const firstCard = track.children[0] as HTMLElement | undefined
      const duplicateCard = track.children[groups.length] as HTMLElement | undefined
      if (!firstCard || !duplicateCard) return

      const loopWidth = duplicateCard.offsetLeft - firstCard.offsetLeft
      if (loopWidth <= 0) return

      const loop = gsap.fromTo(
        container,
        { scrollLeft: 0 },
        { scrollLeft: loopWidth, duration: loopWidth / 32, ease: 'none', repeat: -1 },
      )
      let startX = 0
      let startScrollLeft = 0
      let interacting = false
      let resumeCall: ReturnType<typeof gsap.delayedCall> | undefined

      const resume = () => {
        const normalized = gsap.utils.wrap(0, loopWidth, container.scrollLeft)
        container.scrollLeft = normalized
        loop.progress(normalized / loopWidth).play()
      }
      const scheduleResume = () => {
        resumeCall?.kill()
        resumeCall = gsap.delayedCall(1.2, resume)
      }
      const onDown = (event: PointerEvent) => {
        interacting = true
        startX = event.clientX
        startScrollLeft = container.scrollLeft
        mobileDraggedRef.current = false
        resumeCall?.kill()
        loop.pause()
        container.setPointerCapture(event.pointerId)
      }
      const onMove = (event: PointerEvent) => {
        if (!interacting) return
        const dx = event.clientX - startX
        if (Math.abs(dx) > 6) mobileDraggedRef.current = true
        if (event.pointerType === 'mouse') container.scrollLeft = startScrollLeft - dx
      }
      const onInteractionEnd = (event: PointerEvent) => {
        interacting = false
        if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId)
        scheduleResume()
      }
      const onWheel = () => {
        loop.pause()
        scheduleResume()
      }
      const onFocusIn = () => {
        resumeCall?.kill()
        loop.pause()
      }
      const onFocusOut = () => scheduleResume()

      container.addEventListener('pointerdown', onDown)
      container.addEventListener('pointermove', onMove)
      container.addEventListener('pointerup', onInteractionEnd)
      container.addEventListener('pointercancel', onInteractionEnd)
      container.addEventListener('wheel', onWheel, { passive: true })
      container.addEventListener('focusin', onFocusIn)
      container.addEventListener('focusout', onFocusOut)

      return () => {
        resumeCall?.kill()
        loop.kill()
        container.removeEventListener('pointerdown', onDown)
        container.removeEventListener('pointermove', onMove)
        container.removeEventListener('pointerup', onInteractionEnd)
        container.removeEventListener('pointercancel', onInteractionEnd)
        container.removeEventListener('wheel', onWheel)
        container.removeEventListener('focusin', onFocusIn)
        container.removeEventListener('focusout', onFocusOut)
      }
    },
    { scope: mobileContainerRef, dependencies: [disabled, groups.length, reduceMotion, viewportWidth] },
  )

  useGSAP(
    () => {
      const container = desktopContainerRef.current
      const track = desktopTrackRef.current
      if (!container || !track || reduceMotion || !window.matchMedia('(min-width: 768px)').matches) return

      const firstCard = track.children[0] as HTMLElement | undefined
      const duplicateCard = track.children[groups.length] as HTMLElement | undefined
      if (!firstCard || !duplicateCard) return

      const loopWidth = duplicateCard.offsetLeft - firstCard.offsetLeft
      if (loopWidth <= 0) return

      const speed = 76
      const loop = gsap.fromTo(track, { x: 0 }, { x: -loopWidth, duration: loopWidth / speed, ease: 'none', repeat: -1 })
      const wrapTime = gsap.utils.wrap(0, loop.duration())
      const pxPerSec = loopWidth / loop.duration()
      let dragging = false
      let base = 1
      let targetBase = 1
      let wheelBoost = 0
      let startX = 0
      let startTime = 0

      const tick = () => {
        base += (targetBase - base) * 0.12
        wheelBoost *= 0.9
        if (Math.abs(wheelBoost) < 0.001) wheelBoost = 0
        if (!dragging) loop.timeScale(Math.max(0.08, base + wheelBoost))
      }
      const onEnter = () => (targetBase = 0.45)
      const onLeave = () => (targetBase = 1)
      const onWheel = (event: WheelEvent) => {
        wheelBoost = gsap.utils.clamp(-0.35, 2.5, wheelBoost + event.deltaY * 0.003)
      }
      const onDown = (event: PointerEvent) => {
        dragging = true
        desktopDraggedRef.current = false
        startX = event.clientX
        startTime = loop.time()
        loop.pause()
        container.setPointerCapture(event.pointerId)
        container.style.cursor = 'grabbing'
      }
      const onMove = (event: PointerEvent) => {
        if (!dragging) return
        const dx = event.clientX - startX
        if (Math.abs(dx) > 6) desktopDraggedRef.current = true
        loop.time(wrapTime(startTime - dx / pxPerSec))
      }
      const onUp = (event: PointerEvent) => {
        if (!dragging) return
        dragging = false
        loop.play()
        if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId)
        container.style.cursor = ''
      }

      gsap.ticker.add(tick)
      container.addEventListener('mouseenter', onEnter)
      container.addEventListener('mouseleave', onLeave)
      container.addEventListener('focusin', onEnter)
      container.addEventListener('focusout', onLeave)
      container.addEventListener('wheel', onWheel, { passive: true })
      container.addEventListener('pointerdown', onDown)
      container.addEventListener('pointermove', onMove)
      container.addEventListener('pointerup', onUp)
      container.addEventListener('pointercancel', onUp)

      return () => {
        gsap.ticker.remove(tick)
        loop.kill()
        container.removeEventListener('mouseenter', onEnter)
        container.removeEventListener('mouseleave', onLeave)
        container.removeEventListener('focusin', onEnter)
        container.removeEventListener('focusout', onLeave)
        container.removeEventListener('wheel', onWheel)
        container.removeEventListener('pointerdown', onDown)
        container.removeEventListener('pointermove', onMove)
        container.removeEventListener('pointerup', onUp)
        container.removeEventListener('pointercancel', onUp)
      }
    },
    { scope: desktopContainerRef, dependencies: [disabled, groups.length, reduceMotion, viewportWidth] },
  )

  const mobileGroups = reduceMotion ? groups : [...groups, ...groups]
  const desktopGroups = reduceMotion ? groups : [...groups, ...groups]

  return (
    <div className="w-full py-3 sm:py-5 md:px-4">
      <div
        ref={mobileContainerRef}
        className="w-full select-none overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 4%, black 94%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 94%, transparent)',
        }}
      >
        <div ref={mobileTrackRef} className={`flex w-max gap-3 px-4 pb-1 ${reduceMotion ? 'snap-x snap-mandatory' : '[will-change:scroll-position]'}`}>
          {mobileGroups.map((group, index) => (
            <GroupIdentityCard
              key={`${group.id}-${index}`}
              group={group}
              disabled={disabled}
              duplicate={!reduceMotion && index >= groups.length}
              mobile
              onSelect={() => {
                if (mobileDraggedRef.current) {
                  mobileDraggedRef.current = false
                  return
                }
                if (!disabled) onChoose(group.id)
              }}
            />
          ))}
        </div>
      </div>

      <div
        ref={desktopContainerRef}
        className={`hidden w-full select-none md:block ${reduceMotion ? 'overflow-x-auto' : 'cursor-grab touch-pan-y overflow-hidden'}`}
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
      >
        <div ref={desktopTrackRef} className={`flex w-max gap-5 pb-1 lg:gap-7 ${reduceMotion ? 'snap-x snap-mandatory px-1' : 'will-change-transform'}`}>
          {desktopGroups.map((group, index) => (
            <GroupIdentityCard
              key={`${group.id}-${index}`}
              group={group}
              disabled={disabled}
              duplicate={!reduceMotion && index >= groups.length}
              onSelect={() => {
                if (desktopDraggedRef.current) {
                  desktopDraggedRef.current = false
                  return
                }
                if (!disabled) onChoose(group.id)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function CountdownClock() {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    function getTargetTime() {
      const now = new Date()
      const daysUntilSaturday = (6 - now.getDay() + 7) % 7
      const target = new Date(now)
      target.setDate(now.getDate() + daysUntilSaturday)
      target.setHours(20, 0, 0, 0)

      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 7)
      }
      return target.getTime()
    }

    const targetTime = getTargetTime()

    let interval: ReturnType<typeof setInterval> | undefined
    const updateTimeLeft = () => {
      const diff = targetTime - Date.now()
      if (diff <= 0) {
        if (interval) clearInterval(interval)
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 })
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24))
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft({ d, h, m, s })
      }
    }

    updateTimeLeft()
    interval = setInterval(updateTimeLeft, 1000)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  return (
    <div className="mx-auto mt-4 flex w-full max-w-sm flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur-md dark:border-orange-900/50 dark:bg-[#21140d]/70 sm:inline-flex sm:w-auto sm:max-w-none sm:flex-row sm:px-6 sm:py-2.5">
      <span className="flex items-center gap-1.5 text-center font-sans text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500 motion-reduce:animate-none" />
        距离周六晚 20:00 截止还剩：
      </span>
      <div className="grid w-full grid-cols-4 gap-1.5 sm:flex sm:w-auto sm:gap-2">
        {[
          { label: '天', value: timeLeft.d },
          { label: '时', value: timeLeft.h },
          { label: '分', value: timeLeft.m },
          { label: '秒', value: timeLeft.s },
        ].map((item) => {
          const str = String(item.value).padStart(2, '0')
          const chars = str.split('')
          return (
            <div key={item.label} className="flex min-w-0 flex-col items-center rounded-xl border border-slate-200/70 bg-slate-50 px-2 py-1 shadow-xs dark:border-orange-900/40 dark:bg-[#150d09]/80 sm:min-w-[42px] sm:px-3">
              <span key={item.value} className="t-digit-group is-animating text-sm font-extrabold text-primary font-mono inline-flex">
                {chars.map((ch, idx) => {
                  let stagger: string | undefined = undefined
                  if (idx === chars.length - 2) stagger = '1'
                  else if (idx === chars.length - 1) stagger = '2'
                  return (
                    <span key={idx} className="t-digit" data-stagger={stagger}>
                      {ch}
                    </span>
                  )
                })}
              </span>
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 font-sans">{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/{-$locale}/')({
  loader: async () => {
    const [origin, nominations, screeningIdentity, groupProfiles] = await Promise.all([
      getOrigin(),
      listNominationsFn(),
      getScreeningIdentityFn(),
      listScreeningGroupProfilesFn(),
    ])
    return { origin, nominations, screeningIdentity, groupProfiles }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/',
      title: '泛式最爱 Galgame 竞猜 — 三个舰长群专属大选',
      description: '泛式 UP 主三个舰长群专属活动。竞猜投票泛式最近最喜欢的 Galgame，每人限提名 1 款，投票 1 次，数据实时更新！',
    })
    return { meta, links }
  },
  component: CampaignHome,
})

function CampaignHome() {
  const { nominations, screeningIdentity, groupProfiles } = Route.useLoaderData()
  const { theme, user } = rootRoute.useLoaderData()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeGroup, setActiveGroup] = useState<GroupId | undefined>(screeningIdentity?.group)
  const [viewGroup, setViewGroup] = useState<GroupId>(screeningIdentity?.group ?? 'group1')
  const [groupSwitcherOpen, setGroupSwitcherOpen] = useState(false)

  // Nomination dialog state
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [cover, setCover] = useState('')
  const [reason, setReason] = useState('')
  const [nickname, setNickname] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [nominationQuery, setNominationQuery] = useState('')

  // Bangumi Search State
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchType, setSearchType] = useState<'anime' | 'game'>('game')
  const [searchResults, setSearchResults] = useState<BangumiResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchCacheRef = useRef(new Map<string, BangumiResult[]>())
  const searchRequestSeqRef = useRef(0)

  // 身份变化时默认回到自己的群；之后可在结果区旁观其他群。
  useEffect(() => {
    setActiveGroup(screeningIdentity?.group)
    if (screeningIdentity?.group) {
      setViewGroup(screeningIdentity.group)
      setNominationQuery('')
    }
  }, [screeningIdentity?.group])

  const activeGroupMeta = SCREENING_GROUPS.find((group) => group.id === activeGroup)
  const canSwitchGroup = screeningIdentity?.canSwitch ?? false
  const selectedGroup = activeGroup ?? 'group1'
  const normalizedTitle = normalizeNominationTitle(title)
  const duplicateNomination = normalizedTitle
    ? nominations.find((nom) => normalizeNominationTitle(nom.title) === normalizedTitle)
    : undefined
  function nominationsForGroupFrom(items: typeof nominations, group: GroupId) {
    return items.filter((nom) => nom.type === group || (group === 'group1' && !nom.type.startsWith('group')))
  }

  function nominationGroup(type: string): GroupId {
    return type === 'group2' || type === 'group3' ? type : 'group1'
  }

  const groupVisuals = GROUP_VISUALS.map((visual) => {
    const profile = groupProfiles.find((item) => item.groupId === visual.id)
    return {
      ...visual,
      title: profile?.title ?? visual.title,
      subtitle: profile?.subtitle ?? visual.subtitle,
      imageUrl: profile?.imageUrl ?? visual.imageUrl ?? null,
    }
  })
  const resultGroups = SCREENING_GROUPS.map((group) => ({
    ...group,
    subtitle: groupVisuals.find((visual) => visual.id === group.id)?.subtitle ?? '',
    nominations: nominationsForGroupFrom(nominations, group.id),
  }))

  function chooseGroup(group: GroupId) {
    if (isPending) return
    startTransition(async () => {
      try {
        const identity = await setScreeningGroupFn({ data: group })
        setActiveGroup(identity.group)
        setViewGroup(identity.group)
        setGroupSwitcherOpen(false)
        toast.success(`已记录为${SCREENING_GROUPS.find((item) => item.id === identity.group)?.label ?? '当前群友'}`)
        router.invalidate()
      } catch (err: any) {
        toast.error(err.message || '群身份记录失败，请重试。')
      }
    })
  }

  function viewResultsForGroup(group: GroupId) {
    setViewGroup(group)
    setNominationQuery('')
  }

  async function handleSearch() {
    if (!searchKeyword.trim()) return
    const keyword = searchKeyword.trim()
    const cacheKey = `${searchType}:${keyword.toLocaleLowerCase()}`
    const cachedResults = searchCacheRef.current.get(cacheKey)
    if (cachedResults) {
      setSearchResults(cachedResults)
      return
    }

    const requestSeq = searchRequestSeqRef.current + 1
    searchRequestSeqRef.current = requestSeq
    setIsSearching(true)
    try {
      const results = await searchBangumiFn({ data: { keyword, type: searchType } })
      if (requestSeq !== searchRequestSeqRef.current) return
      searchCacheRef.current.set(cacheKey, results)
      setSearchResults(results)
    } catch (e) {
      if (requestSeq !== searchRequestSeqRef.current) return
      console.error(e)
      toast.error('Bangumi 搜索失败，请重试')
    } finally {
      if (requestSeq === searchRequestSeqRef.current) setIsSearching(false)
    }
  }

  function handleSelectSubject(item: BangumiResult) {
    setTitle(item.title)
    if (item.cover) setCover(item.cover)
    if (item.summary) {
      setReason(prev => {
        const cleanSummary = item.summary ? item.summary.replace(/\r\n/g, '\n').slice(0, 250) + '...' : ''
        return `[Bangumi 简介] ${cleanSummary}\n\n我的猜想理由：${prev}`.trim()
      })
    }
    setSearchResults([])
    setSearchKeyword('')
  }

  // 投票/取消投票处理器
  function handleVote(nominationId: string, hasVoted: boolean) {
    if (!activeGroup) {
      toast.error('请先选择你所在的群。')
      return
    }
    const target = nominations.find((nom) => nom.id === nominationId)
    if (target && nominationGroup(target.type) !== activeGroup) {
      toast.error('只能给自己群的提名投票。')
      return
    }
    if (isPending) return
    startTransition(async () => {
      try {
        if (hasVoted) {
          await unvoteForNominationFn({ data: nominationId })
          toast.success('已取消此投票猜想！')
        } else {
          await voteForNominationFn({ data: nominationId })
          toast.success('投票成功，感谢参与竞猜！')
        }
        router.invalidate()
      } catch (err: any) {
        toast.error(err.message || '操作失败，请重试！')
      }
    })
  }

  // 提交提名处理器
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeGroup) {
      setErrorMsg('请先选择你所在的群。')
      return
    }
    if (!nickname.trim()) {
      setErrorMsg('请填写昵称。')
      return
    }

    if (!title.trim() || !reason.trim()) {
      setErrorMsg('游戏名称与猜想理由不能为空！')
      return
    }
    if (duplicateNomination) {
      setErrorMsg(`《${duplicateNomination.title}》已经有人提名过了，请直接搜索后投票。`)
      return
    }
    startTransition(async () => {
      try {
        await submitNominationFn({
          data: {
            title: title.trim(),
            cover: cover.trim() || undefined,
            reason: reason.trim(),
            nickname: nickname.trim(),
          },
        })
        setTitle('')
        setCover('')
        setReason('')
        setErrorMsg('')
        setOpen(false)
        toast.success('游戏提名成功！')
        router.invalidate()
      } catch (err: any) {
        const msg = err.message || '提交失败，请重试！'
        setErrorMsg(msg)
        toast.error(msg)
      }
    })
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900 antialiased selection:bg-primary selection:text-white dark:bg-[#120b08] dark:text-orange-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100/80 via-white to-white pointer-events-none dark:from-orange-950/55 dark:via-[#120b08] dark:to-[#080504]" />

      {/* Global Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-md dark:border-orange-900/40 dark:bg-[#120b08]/82 dark:shadow-none">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Gamepad2 className="h-5 w-5 shrink-0 animate-pulse text-primary motion-reduce:animate-none sm:h-6 sm:w-6" />
            <span className="truncate bg-gradient-to-r from-primary via-orange-500 to-sky-500 bg-clip-text text-sm font-extrabold tracking-tight text-transparent dark:to-indigo-400 sm:text-lg">
              泛式 Galgame 竞猜
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {user?.role === 'admin' && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden h-8 rounded-full border-slate-200 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 dark:border-orange-900/45 dark:text-orange-100/80 dark:hover:text-white sm:inline-flex"
              >
                <Link to="/{-$locale}/admin/screening">
                  <Settings size={14} />
                  后台
                </Link>
              </Button>
            )}
            <ThemeToggle theme={theme} />
            {activeGroupMeta && (
              <Badge className="hidden border border-slate-200 bg-slate-100 text-slate-700 dark:border-orange-900/45 dark:bg-[#1f130d] dark:text-orange-100/80 sm:inline-flex">
                {activeGroupMeta.short}
              </Badge>
            )}
            {activeGroupMeta && canSwitchGroup && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGroupSwitcherOpen(true)}
                aria-label={`切换群身份，当前为${activeGroupMeta.short}`}
                className="h-8 gap-1.5 rounded-md border-slate-200 px-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:border-orange-900/45 dark:text-orange-100/80 dark:hover:text-white sm:px-3"
              >
                <UserRoundCog size={14} />
                <span className="sm:hidden">{activeGroupMeta.short}身份</span>
                <span className="hidden sm:inline">切换身份</span>
              </Button>
            )}
            <div className="mx-1 hidden h-4 w-px bg-slate-200 dark:bg-orange-900/45 sm:block" />

            <span className="hidden text-xs font-semibold text-slate-500 dark:text-slate-400 sm:inline">
              匿名参与
            </span>
          </div>
        </div>
      </header>

      {/* Main Campaign Layout */}
      <main className="z-10 mx-auto w-full max-w-6xl flex-1 space-y-6 px-3 py-5 sm:px-4 sm:py-8 md:space-y-8">
        {/* Campaign Hero Banner */}
        <section className="mx-auto max-w-2xl space-y-3.5 py-3 text-center sm:py-6">
          <Badge className="gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1 font-mono text-xs tracking-wider text-primary shadow-[0_10px_28px_rgba(15,23,42,0.06)] dark:border-primary/20 dark:bg-primary/10">
            <Trophy size={13} /> 泛式三个舰长群专属竞猜
          </Badge>
          <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-950 dark:bg-gradient-to-b dark:from-white dark:to-slate-300 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-5xl">
            最最最喜欢你的100个饭团
          </h1>
          <p className="mx-auto max-w-[34rem] text-[12px] leading-relaxed text-slate-600 dark:text-slate-400 sm:text-xs md:text-sm">
            你猜中泛式的心思了吗？每个人可以提名最多一款游戏，然后最多投一票进行猜想（数据实时更新，可退票重投）。快来贡献你的神之预测！
          </p>
          <CountdownClock />
          <div className="flex justify-center gap-4 pt-2">
            <Button
              onClick={() => setOpen(true)}
              size="lg"
              className="h-11 w-full max-w-sm gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-[0_16px_40px_rgba(226,83,28,0.26)] hover:bg-primary/95 sm:w-auto"
            >
              <Plus size={16} />
              <span>发起游戏猜想</span>
            </Button>
          </div>
        </section>

        <ScreeningResults
          groups={resultGroups}
          ownGroup={activeGroup}
          viewGroup={viewGroup}
          query={nominationQuery}
          isPending={isPending}
          onQueryChange={setNominationQuery}
          onViewGroup={viewResultsForGroup}
          onVote={handleVote}
          onNominate={() => setOpen(true)}
        />
      </main>

      <Dialog
        open={!activeGroup || groupSwitcherOpen}
        onOpenChange={(open) => {
          if (activeGroup) setGroupSwitcherOpen(open)
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white p-3 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-orange-900/45 dark:bg-[#1a100b] dark:text-orange-50 sm:max-h-[92vh] sm:w-[min(96vw,1280px)] sm:p-5 lg:p-7">
          <DialogHeader className="mx-auto max-w-3xl px-6 text-center sm:px-0">
            <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl lg:text-3xl">选择你的英雄</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 sm:text-[14.5px]">
              {activeGroup
                ? '你还没有提名或投票，可以切换一次群身份。'
                : '选择后将只显示并参与对应群的提名与投票。'}
            </DialogDescription>
          </DialogHeader>
          <GroupIdentityCarousel groups={groupVisuals} onChoose={chooseGroup} disabled={isPending} />
        </DialogContent>
      </Dialog>

      {/* Campaign Nomination Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-md overflow-y-auto border border-slate-200 bg-white p-4 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-orange-900/45 dark:bg-[#1a100b] dark:text-orange-50 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg text-slate-900 dark:text-slate-100 sm:text-xl">提名新的 Galgame 游戏猜想</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 sm:text-[14.5px]">
              输入你预测的泛式最近最喜欢的 Galgame。每个舰长最多只能提名一款游戏！
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 pt-1 sm:space-y-4 sm:pt-2">
            {errorMsg && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Bangumi 导入工具 */}
            <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-orange-900/45 dark:bg-[#150d09]/80">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  🔍 Bangumi (番组计划) 快捷搜索
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setSearchType('game'); setSearchResults([]); }}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${
                      searchType === 'game'
                        ? 'bg-primary text-white'
                        : 'border border-slate-300 bg-slate-200 text-slate-500 dark:border-orange-900/45 dark:bg-[#1f130d] dark:text-orange-100/70'
                    }`}
                  >
                    Galgame
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSearchType('anime'); setSearchResults([]); }}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${
                      searchType === 'anime'
                        ? 'bg-primary text-white'
                        : 'border border-slate-300 bg-slate-200 text-slate-500 dark:border-orange-900/45 dark:bg-[#1f130d] dark:text-orange-100/70'
                    }`}
                  >
                    动漫
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder={searchType === 'game' ? "输入 Galgame，如: 白色相簿" : "输入动漫，如: 芙莉莲"}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                maxLength={100}
                  className="h-9 min-w-0 bg-white text-xs text-slate-900 placeholder:text-slate-400 dark:border-orange-900/45 dark:bg-[#150d09] dark:text-orange-50 dark:placeholder:text-orange-100/35 sm:h-8"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching}
                  size="sm"
                  className="h-9 shrink-0 bg-primary text-xs text-white sm:h-8"
                >
                  {isSearching ? '搜索中...' : '搜索'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-200 dark:divide-orange-900/35 dark:border-orange-900/45 dark:bg-[#150d09]">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSubject(item)}
                      className="flex w-full items-center gap-2.5 p-2 text-left transition-colors duration-150 hover:bg-slate-100 dark:hover:bg-[#2a1a12]"
                    >
                      {item.cover ? (
                        <img src={item.cover} className="h-10 w-8 shrink-0 rounded border border-slate-200 object-cover dark:border-orange-900/45" alt="" />
                      ) : (
                        <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-100 text-slate-400 dark:border-orange-900/45 dark:bg-[#120b08] dark:text-orange-100/35">
                          <Film size={12} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0 flex-1 truncate text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</div>
                          <span className="shrink-0 rounded-full border border-amber-300/70 bg-amber-50 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                            {item.score.toFixed(1)} 分
                          </span>
                        </div>
                        {item.originalTitle && item.originalTitle !== item.title && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-550 truncate">{item.originalTitle}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="group" className="text-slate-700 dark:text-slate-300">你所属的舰长群</Label>
              <select
                id="group"
                disabled
                value={selectedGroup}
                onChange={() => undefined}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 outline-none dark:border-orange-900/45 dark:bg-[#150d09] dark:text-orange-50"
              >
                <option value="group1">舰长一群</option>
                <option value="group2">舰长二群</option>
                <option value="group3">舰长三群</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nickname" className="text-slate-700 dark:text-slate-300">昵称</Label>
              <Input
                id="nickname"
                placeholder="用于显示是谁发起了这个猜想"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={40}
                required
                className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-orange-900/45 dark:bg-[#150d09] dark:text-orange-50 dark:placeholder:text-orange-100/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-slate-700 dark:text-slate-300">游戏名称</Label>
              <Input
                id="title"
                placeholder="例如：白色相簿2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
                className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-orange-900/45 dark:bg-[#150d09] dark:text-orange-50 dark:placeholder:text-orange-100/30"
              />
              {duplicateNomination && (
                <p className="text-xs font-semibold text-rose-500">
                  《{duplicateNomination.title}》已经有人提名过了，请搜索后直接投票。
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cover" className="text-slate-700 dark:text-slate-300">游戏封面 URL (可选)</Label>
              <Input
                id="cover"
                type="url"
                placeholder="https://example.com/cover.jpg"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                maxLength={2048}
                className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-orange-900/45 dark:bg-[#150d09] dark:text-orange-50 dark:placeholder:text-orange-100/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-slate-700 dark:text-slate-300">推荐与猜想理由</Label>
              <Textarea
                id="reason"
                placeholder="介绍这款游戏，并分享为什么你觉得它近期会是泛式最喜欢的 Galgame？"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={2000}
                rows={4}
                required
                className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-orange-900/45 dark:bg-[#150d09] dark:text-orange-50 dark:placeholder:text-orange-100/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 sm:flex sm:justify-end sm:gap-3 sm:pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-orange-900/45 dark:text-orange-100/75 dark:hover:bg-[#2a1a12] dark:hover:text-white"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isPending || !!duplicateNomination || !nickname.trim()}
                className="bg-primary text-white hover:bg-primary/95"
              >
                {isPending ? '提交中...' : '提交猜想'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="z-10 w-full border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 dark:border-orange-900/45 dark:bg-[#120b08]">
        <p>© 2026 泛式三个舰长群专属竞猜系统. All Rights Reserved.</p>
        <p className="mt-1">数据源由 Bangumi 代理直连提供加速.</p>
        <a
          className="mt-2 inline-block transition-colors hover:text-slate-700 dark:hover:text-slate-300"
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noreferrer"
        >
          赣ICP备2026006064号
        </a>
      </footer>
    </div>
  )
}
