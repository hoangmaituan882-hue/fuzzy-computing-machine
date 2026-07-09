import { createFileRoute, useRouter, getRouteApi, Link } from '@tanstack/react-router'
import { useState, useTransition, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { ThumbsUp, Plus, Film, BookOpen, AlertCircle, Trophy, Gamepad2, Search, Settings } from 'lucide-react'
import { getOrigin } from '@/features/seo/seo.fns'
import { localeHead } from '@/features/seo/seo'
import type { Locale } from '@/features/i18n/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ThemeToggle } from '@/features/theme/theme-toggle'
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

type GroupId = 'group1' | 'group2' | 'group3'
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

const SCREENING_GROUPS: Array<{ id: GroupId; label: string; short: string; dot: string }> = [
  { id: 'group1', label: '船长一群群友', short: '一群', dot: 'bg-primary' },
  { id: 'group2', label: '船长二群群友', short: '二群', dot: 'bg-indigo-500' },
  { id: 'group3', label: '船长三群群友', short: '三群', dot: 'bg-emerald-500' },
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
  },
  {
    id: 'group2',
    tag: 'GROUP 02',
    title: '舰长二群',
    subtitle: '锋利押宝派',
    gradient: 'linear-gradient(135deg,#111827 0%,#4f46e5 44%,#f97316 100%)',
    pattern: 'radial-gradient(circle at 72% 22%,rgba(255,255,255,.35),transparent 26%), radial-gradient(circle at 18% 82%,rgba(249,115,22,.45),transparent 28%)',
    accentClass: 'text-orange-200',
  },
  {
    id: 'group3',
    tag: 'GROUP 03',
    title: '舰长三群',
    subtitle: '冷门奇袭派',
    gradient: 'linear-gradient(135deg,#052e2b 0%,#059669 48%,#bef264 100%)',
    pattern: 'radial-gradient(circle at 20% 78%,rgba(255,255,255,.35),transparent 26%), radial-gradient(circle at 84% 18%,rgba(190,242,100,.42),transparent 30%)',
    accentClass: 'text-lime-100',
  },
]

const PARTICIPANT_COOKIE = 'screening_participant_id'

function writeParticipantCookie(id: string) {
  document.cookie = `${PARTICIPANT_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; samesite=lax`
}

function normalizeNominationTitle(title: string): string {
  return title.trim().toLocaleLowerCase().replace(/\s+/g, '')
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
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const draggedRef = useRef(false)

  useGSAP(
    () => {
      const track = trackRef.current
      const container = containerRef.current
      if (!container || !track) return

      const firstCard = track.children[0] as HTMLElement | undefined
      if (!firstCard) return

      const cardWidth =
        firstCard.offsetWidth +
        parseFloat(getComputedStyle(firstCard).marginRight)
      const loopWidth = cardWidth * groups.length
      const speed = 90

      const loop = gsap.to(track, {
        x: -loopWidth,
        duration: loopWidth / speed,
        ease: 'none',
        repeat: -1,
      })

      const wrapTime = gsap.utils.wrap(0, loop.duration())
      const pxPerSec = loopWidth / loop.duration()

      let dragging = false
      let base = 1
      let targetBase = 1
      let scroll = 0
      let startX = 0
      let startTime = 0

      const tick = () => {
        base += (targetBase - base) * 0.1
        scroll *= 0.9
        if (Math.abs(scroll) < 0.001) scroll = 0
        if (!dragging) loop.timeScale(base + scroll)
      }
      gsap.ticker.add(tick)

      const onEnter = () => (targetBase = 0.15)
      const onLeave = () => (targetBase = 1)

      const onWheel = (e: WheelEvent) => {
        e.preventDefault()
        scroll = gsap.utils.clamp(-60, 1000, scroll + e.deltaY * 0.018)
      }

      const onDown = (e: PointerEvent) => {
        dragging = true
        draggedRef.current = false
        startX = e.clientX
        startTime = loop.time()
        loop.pause()
        container.setPointerCapture(e.pointerId)
        container.style.cursor = 'grabbing'
      }

      const onMove = (e: PointerEvent) => {
        if (!dragging) return
        const dx = e.clientX - startX
        if (Math.abs(dx) > 6) draggedRef.current = true
        loop.time(wrapTime(startTime - dx / pxPerSec))
      }

      const onUp = (e: PointerEvent) => {
        if (!dragging) return
        dragging = false
        loop.play()
        container.releasePointerCapture(e.pointerId)
        container.style.cursor = ''
        if (draggedRef.current || disabled) return

        const target = document.elementFromPoint(e.clientX, e.clientY)
        const card = target?.closest<HTMLButtonElement>('[data-screening-group]')
        const groupId = card?.dataset.screeningGroup
        if (groupId === 'group1' || groupId === 'group2' || groupId === 'group3') {
          onChoose(groupId)
        }
      }

      container.addEventListener('mouseenter', onEnter)
      container.addEventListener('mouseleave', onLeave)
      container.addEventListener('focusin', onEnter)
      container.addEventListener('focusout', onLeave)
      container.addEventListener('wheel', onWheel, { passive: false })
      container.addEventListener('pointerdown', onDown)
      container.addEventListener('pointermove', onMove)
      container.addEventListener('pointerup', onUp)
      container.addEventListener('pointercancel', onUp)

      return () => {
        gsap.ticker.remove(tick)
        loop.kill()
        container.removeEventListener('wheel', onWheel)
        container.removeEventListener('mouseenter', onEnter)
        container.removeEventListener('mouseleave', onLeave)
        container.removeEventListener('focusin', onEnter)
        container.removeEventListener('focusout', onLeave)
        container.removeEventListener('pointerdown', onDown)
        container.removeEventListener('pointermove', onMove)
        container.removeEventListener('pointerup', onUp)
        container.removeEventListener('pointercancel', onUp)
      }
    },
    { scope: containerRef, dependencies: [disabled, groups.length, onChoose] },
  )

  return (
    <div className="w-full px-0 py-5 md:px-4">
      <div
        ref={containerRef}
        className="w-full cursor-grab touch-none select-none overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        }}
      >
        <div ref={trackRef} className="flex w-max will-change-transform">
          {[...groups, ...groups].map((group, index) => (
            <button
              key={`${group.id}-${index}`}
              type="button"
              disabled={disabled}
              data-screening-group={group.id}
              onKeyDown={(event) => {
                if (disabled) return
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onChoose(group.id)
                }
              }}
              className="mr-7 flex h-[31rem] w-[22rem] shrink-0 flex-col justify-end overflow-hidden rounded-[2rem] border border-white/40 bg-cover bg-center p-7 text-left text-white shadow-none outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60 max-sm:h-[27rem] max-sm:w-[18.5rem]"
              style={{
                backgroundImage: group.imageUrl
                  ? `linear-gradient(to top,rgba(2,6,23,.92),rgba(2,6,23,.28) 52%,rgba(2,6,23,.08)), ${group.pattern}, url(${group.imageUrl})`
                  : `${group.pattern}, ${group.gradient}`,
              }}
            >
              <span className="mb-auto flex items-start justify-between">
                <span className="rounded-full border border-white/35 bg-white/15 px-3 py-1 text-xs font-black tracking-[0.22em] text-white/80 backdrop-blur">
                  {group.tag}
                </span>
                <span className="h-12 w-12 rounded-full bg-white/20" />
              </span>
              <span className={`text-base font-bold ${group.accentClass}`}>{group.subtitle}</span>
              <span className="mt-2 block text-5xl font-black leading-none tracking-tight max-sm:text-4xl">{group.title}</span>
            </button>
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

    const interval = setInterval(() => {
      const diff = targetTime - Date.now()
      if (diff <= 0) {
        clearInterval(interval)
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 })
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24))
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft({ d, h, m, s })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="inline-flex flex-col sm:flex-row gap-3 items-center justify-center bg-white/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 px-6 py-2.5 rounded-2xl shadow-sm backdrop-blur-md mt-4 mx-auto">
      <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-semibold tracking-wide flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
        距离周六晚 20:00 截止还剩：
      </span>
      <div className="flex gap-2">
        {[
          { label: '天', value: timeLeft.d },
          { label: '时', value: timeLeft.h },
          { label: '分', value: timeLeft.m },
          { label: '秒', value: timeLeft.s },
        ].map((item) => {
          const str = String(item.value).padStart(2, '0')
          const chars = str.split('')
          return (
            <div key={item.label} className="flex flex-col items-center bg-white/90 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-900 px-3 py-1 rounded-xl shadow-xs min-w-[42px]">
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

  // 按群归类提名数据
  useEffect(() => setActiveGroup(screeningIdentity?.group), [screeningIdentity?.group])

  const activeGroupMeta = SCREENING_GROUPS.find((group) => group.id === activeGroup)
  const canSwitchGroup = screeningIdentity?.canSwitch ?? false
  const selectedGroup = activeGroup ?? 'group1'
  const normalizedTitle = normalizeNominationTitle(title)
  const duplicateNomination = normalizedTitle
    ? nominations.find((nom) => normalizeNominationTitle(nom.title) === normalizedTitle)
    : undefined
  const normalizedQuery = normalizeNominationTitle(nominationQuery)
  const visibleNominations = normalizedQuery
    ? nominations.filter((nom) =>
        normalizeNominationTitle(`${nom.title} ${nom.nominatedByName} ${nom.reason}`).includes(normalizedQuery),
      )
    : nominations

  function nominationsForGroupFrom(items: typeof nominations, group: GroupId) {
    return items.filter((nom) => nom.type === group || (group === 'group1' && !nom.type.startsWith('group')))
  }

  function statsForNominations(items: Array<{ votesCount: number }>) {
    return {
      nominationsCount: items.length,
      votesCount: items.reduce((total, nom) => total + nom.votesCount, 0),
    }
  }

  function nominationsForGroup(group: GroupId) {
    return nominationsForGroupFrom(visibleNominations, group)
  }

  function nominationGroup(type: string): GroupId {
    return type === 'group2' || type === 'group3' ? type : 'group1'
  }

  const group1Nominations = nominationsForGroup('group1')
  const group2Nominations = nominationsForGroup('group2')
  const group3Nominations = nominationsForGroup('group3')
  const group1Stats = statsForNominations(nominationsForGroupFrom(nominations, 'group1'))
  const group2Stats = statsForNominations(nominationsForGroupFrom(nominations, 'group2'))
  const group3Stats = statsForNominations(nominationsForGroupFrom(nominations, 'group3'))
  const groupVisuals = GROUP_VISUALS.map((visual) => {
    const profile = groupProfiles.find((item) => item.groupId === visual.id)
    return {
      ...visual,
      title: profile?.title ?? visual.title,
      subtitle: profile?.subtitle ?? visual.subtitle,
      imageUrl: profile?.imageUrl ?? null,
    }
  })

  function chooseGroup(group: GroupId) {
    if (isPending) return
    startTransition(async () => {
      try {
        const identity = await setScreeningGroupFn({ data: group })
        writeParticipantCookie(identity.participantId)
        setActiveGroup(identity.group)
        setGroupSwitcherOpen(false)
        toast.success(`已记录为${SCREENING_GROUPS.find((item) => item.id === identity.group)?.label ?? '当前群友'}`)
        router.invalidate()
      } catch (err: any) {
        toast.error(err.message || '群身份记录失败，请重试。')
      }
    })
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

  function renderCompactCard(nom: any, idx: number) {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null
    const cleanReason = nom.reason.replace(/\[Bangumi 简介\]/g, '').trim()

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
      const tilt = e.currentTarget
      const card = tilt.querySelector(".t-tilt-card") as HTMLDivElement
      if (!card) return
      const r = tilt.getBoundingClientRect()
      const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
      const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
      const MAX = 12 // subtle tilt
      tilt.classList.add("is-hover")
      card.classList.add("is-tilting")
      card.style.setProperty("--tilt-ry", ((px - 0.5) * MAX).toFixed(2) + "deg")
      card.style.setProperty("--tilt-rx", ((0.5 - py) * MAX).toFixed(2) + "deg")
      card.style.setProperty("--tilt-gx", (px * 100).toFixed(1) + "%")
      card.style.setProperty("--tilt-gy", (py * 100).toFixed(1) + "%")
    }

    function handlePointerLeave(e: React.PointerEvent<HTMLDivElement>) {
      const tilt = e.currentTarget
      const card = tilt.querySelector(".t-tilt-card") as HTMLDivElement
      if (!card) return
      tilt.classList.remove("is-hover")
      card.classList.remove("is-tilting")
      card.style.setProperty("--tilt-rx", "0deg")
      card.style.setProperty("--tilt-ry", "0deg")
    }

    if (idx === 0) {
      return (
        <div
          key={nom.id}
          className="group/tile t-tilt w-full touch-action-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`t-tilt-card relative overflow-hidden rounded-2xl border bg-white/85 p-3 shadow-md transition-all duration-300 dark:bg-slate-900/70 ${
              nom.hasVoted
                ? 'border-primary/60 shadow-primary/10'
                : 'border-amber-300/70 hover:border-amber-400 dark:border-amber-500/30 dark:hover:border-amber-400/60'
            }`}
          >
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-amber-200/60 to-transparent dark:from-amber-500/15" />
            <div className="relative flex gap-3">
              <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-white/70 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                {nom.cover ? (
                  <img src={nom.cover} className="h-full w-full object-cover" alt="" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Film size={20} className="text-slate-400 dark:text-slate-700" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950">
                    TOP 1
                  </span>
                  <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {nom.votesCount} 票
                  </span>
                </div>
                <h4 className="line-clamp-2 text-sm font-black leading-snug text-slate-900 dark:text-white" title={nom.title}>
                  {nom.title}
                </h4>
                <div className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  发起：<span className="text-slate-700 dark:text-slate-200">{nom.nominatedByName}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-600 transition-all duration-300 group-hover/tile:line-clamp-none dark:text-slate-300">
                  {cleanReason}
                </p>
              </div>
            </div>
            <div className="relative mt-3 flex items-end justify-between gap-3">
              <div className="max-h-0 overflow-hidden text-[10px] leading-relaxed text-slate-500 opacity-0 transition-all duration-300 group-hover/tile:max-h-24 group-hover/tile:opacity-100 dark:text-slate-400">
                悬停展开后显示完整推荐理由，方便快速判断本群第一为什么领先。
              </div>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                disabled={isPending}
                onClick={() => handleVote(nom.id, nom.hasVoted)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-black transition-all duration-300 ${
                  nom.hasVoted
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                }`}
              >
                <ThumbsUp size={13} className={nom.hasVoted ? 'fill-primary' : ''} />
                {nom.hasVoted ? '已投' : '投它'}
              </motion.button>
            </div>
            <div className="t-tilt-glare" />
          </motion.div>
        </div>
      )
    }

    return (
      <div
        key={nom.id}
        className="group/tile t-tilt w-full touch-action-none"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`t-tilt-card flex gap-3 p-3 items-center overflow-hidden bg-white/70 dark:bg-slate-900/40 border rounded-xl transition-all duration-300 shadow-sm ${
            nom.hasVoted
              ? 'border-primary/50 bg-primary/5 dark:bg-primary/5'
              : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80'
          }`}
        >
          {/* Cover */}
          <div className="w-11 h-14 bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800/60 flex items-center justify-center relative">
            {nom.cover ? (
              <img src={nom.cover} className="w-full h-full object-cover" alt="" />
            ) : (
              <Film size={14} className="text-slate-400 dark:text-slate-700" />
            )}
            {medal && (
              <div className="absolute -top-1 -left-1.5 text-xs drop-shadow-md select-none">
                {medal}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors" title={nom.title}>
              {nom.title}
            </h4>
            <div className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">
              发起: <span className="text-slate-700 dark:text-slate-300">{nom.nominatedByName}</span>
            </div>
            <p className="text-[10px] text-slate-505 dark:text-slate-400 line-clamp-1 leading-snug transition-all duration-300 group-hover/tile:line-clamp-none" title={cleanReason}>
              {cleanReason}
            </p>
          </div>

          {/* Action / Vote count */}
          <div className="flex flex-col items-center gap-1 shrink-0 pl-2.5 border-l border-slate-200 dark:border-slate-800/80">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              type="button"
              disabled={isPending}
              onClick={() => handleVote(nom.id, nom.hasVoted)}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-300 ${
                nom.hasVoted
                  ? 'bg-primary/20 border-primary text-primary shadow-md shadow-primary/10'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              title={nom.hasVoted ? '取消投票' : '投它一票'}
            >
              <ThumbsUp size={11} className={nom.hasVoted ? 'fill-primary' : ''} />
            </motion.button>
            <span className="text-[9.5px] font-extrabold text-slate-700 dark:text-slate-200 font-mono">
              {nom.votesCount} 票
            </span>
          </div>

          {/* Glare effect */}
          <div className="t-tilt-glare" />
        </motion.div>
      </div>
    )
  }

  function renderEmptyState(groupName: string) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-850 p-6 text-center bg-slate-50/50 dark:bg-slate-900/10">
        <BookOpen size={24} className="mx-auto text-slate-400 dark:text-slate-700 mb-2" />
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500">{groupName}暂无猜想</h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-650 mt-1">点击上方按钮推荐你猜测的游戏！</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-primary selection:text-white">
      {/* Mesh Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 dark:from-indigo-900/40 via-slate-50 dark:via-slate-950 to-slate-50 dark:to-slate-950 pointer-events-none z-0" />
      {/* Radial Background Glow Circle */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Global Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/75 dark:bg-slate-950/75 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="text-primary h-6 w-6 animate-pulse" />
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-500 dark:to-indigo-400 bg-clip-text text-transparent">
              泛式 Galgame 竞猜
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden h-8 rounded-full border-slate-200 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white sm:inline-flex"
              >
                <Link to="/{-$locale}/admin/screening">
                  <Settings size={14} />
                  后台
                </Link>
              </Button>
            )}
            <ThemeToggle theme={theme} />
            {activeGroupMeta && (
              <Badge className="hidden sm:inline-flex bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                {activeGroupMeta.short}
              </Badge>
            )}
            {activeGroupMeta && canSwitchGroup && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGroupSwitcherOpen(true)}
                className="h-8 rounded-full border-slate-200 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white"
              >
                切换
              </Button>
            )}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            <span className="hidden text-xs font-semibold text-slate-500 dark:text-slate-400 sm:inline">
              匿名参与
            </span>
          </div>
        </div>
      </header>

      {/* Main Campaign Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 z-10 space-y-8">
        {/* Campaign Hero Banner */}
        <section className="text-center py-6 space-y-3.5 max-w-2xl mx-auto">
          <Badge className="bg-primary/10 text-primary border border-primary/20 font-mono py-1 px-3 text-xs tracking-wider rounded-full">
            🏆 泛式三个舰长群专属竞猜
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-transparent dark:bg-gradient-to-b dark:from-white dark:to-slate-300 dark:bg-clip-text">
            最最最喜欢你的100个饭团
          </h1>
          <p className="text-xs md:text-sm text-slate-650 dark:text-slate-400 leading-relaxed">
            你猜中泛式的心思了吗？每个人可以提名最多一款游戏，然后最多投一票进行猜想（数据实时更新，可退票重投）。快来贡献你的神之预测！
          </p>
          <CountdownClock />
          <div className="pt-2 flex justify-center gap-4">
            <Button
              onClick={() => setOpen(true)}
              size="lg"
              className="gap-2 bg-primary hover:bg-primary/95 text-white rounded-xl shadow-lg shadow-primary/20 text-sm font-bold h-11"
            >
              <Plus size={16} />
              <span>发起游戏猜想</span>
            </Button>
          </div>
        </section>

        {/* Three Columns Results */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Trophy className="text-amber-500 h-5 w-5" />
              <span>三个舰长群提名竞猜预测榜</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              已提名 {nominations.length} 款游戏
            </span>
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={nominationQuery}
              onChange={(e) => setNominationQuery(e.target.value)}
              placeholder="搜索已提名的 Galgame、昵称或理由"
              className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-sm dark:border-slate-800 dark:bg-slate-950"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Column 1: 舰长一群 */}
            <div className="space-y-4 bg-slate-100/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col h-[650px]">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <h3 className="font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  一群预测榜 (1群)
                </h3>
                <Badge className="text-[9px] font-mono py-0 px-1.5 bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  {group1Nominations.length} 款
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">总提名</div>
                  <div className="mt-0.5 font-mono text-sm font-black text-slate-900 dark:text-slate-100">{group1Stats.nominationsCount}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">总投票</div>
                  <div className="mt-0.5 font-mono text-sm font-black text-primary">{group1Stats.votesCount}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {group1Nominations.map((nom, idx) => renderCompactCard(nom, idx))}
                {group1Nominations.length === 0 && renderEmptyState('一群')}
              </div>
            </div>

            {/* Column 2: 舰长二群 */}
            <div className="space-y-4 bg-slate-100/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col h-[650px]">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <h3 className="font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  二群预测榜 (2群)
                </h3>
                <Badge className="text-[9px] font-mono py-0 px-1.5 bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  {group2Nominations.length} 款
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">总提名</div>
                  <div className="mt-0.5 font-mono text-sm font-black text-slate-900 dark:text-slate-100">{group2Stats.nominationsCount}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">总投票</div>
                  <div className="mt-0.5 font-mono text-sm font-black text-indigo-500">{group2Stats.votesCount}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {group2Nominations.map((nom, idx) => renderCompactCard(nom, idx))}
                {group2Nominations.length === 0 && renderEmptyState('二群')}
              </div>
            </div>

            {/* Column 3: 舰长三群 */}
            <div className="space-y-4 bg-slate-100/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col h-[650px]">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <h3 className="font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  三群预测榜 (3群)
                </h3>
                <Badge className="text-[9px] font-mono py-0 px-1.5 bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  {group3Nominations.length} 款
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">总提名</div>
                  <div className="mt-0.5 font-mono text-sm font-black text-slate-900 dark:text-slate-100">{group3Stats.nominationsCount}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">总投票</div>
                  <div className="mt-0.5 font-mono text-sm font-black text-emerald-500">{group3Stats.votesCount}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {group3Nominations.map((nom, idx) => renderCompactCard(nom, idx))}
                {group3Nominations.length === 0 && renderEmptyState('三群')}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Dialog
        open={!activeGroup || groupSwitcherOpen}
        onOpenChange={(open) => {
          if (activeGroup) setGroupSwitcherOpen(open)
        }}
      >
        <DialogContent className="max-h-[92vh] w-[min(96vw,1280px)] max-w-none overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
          <DialogHeader className="mx-auto max-w-3xl text-center">
            <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">选择你的群友身份</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
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
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">提名新的 Galgame 游戏猜想</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              输入你预测的泛式最近最喜欢的 Galgame。每个舰长最多只能提名一款游戏！
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Bangumi 导入工具 */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  🔍 Bangumi (番组计划) 快捷搜索
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setSearchType('game'); setSearchResults([]); }}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${
                      searchType === 'game'
                        ? 'bg-primary text-white'
                        : 'bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-800'
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
                        : 'bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-800'
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
                  className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
                  className="h-8 text-xs shrink-0 bg-primary text-white"
                >
                  {isSearching ? '搜索中...' : '搜索'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800/80">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSubject(item)}
                      className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex gap-2.5 items-center transition-colors duration-150"
                    >
                      {item.cover ? (
                        <img src={item.cover} className="w-8 h-10 object-cover rounded border border-slate-200 dark:border-slate-850 shrink-0" alt="" />
                      ) : (
                        <div className="w-8 h-10 bg-slate-100 dark:bg-slate-950 flex items-center justify-center rounded border border-slate-200 dark:border-slate-855 text-slate-400 dark:text-slate-500 shrink-0">
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
                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-sm outline-none text-slate-900 dark:text-slate-100"
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
                required
                className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-slate-700 dark:text-slate-300">游戏名称</Label>
              <Input
                id="title"
                placeholder="例如：白色相簿2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
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
                placeholder="https://example.com/cover.jpg"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-slate-700 dark:text-slate-300">推荐与猜想理由</Label>
              <Textarea
                id="reason"
                placeholder="介绍这款游戏，并分享为什么你觉得它近期会是泛式最喜欢的 Galgame？"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
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
      <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-6 text-center text-xs text-slate-500 z-10">
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
