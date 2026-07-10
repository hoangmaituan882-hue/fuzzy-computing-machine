import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Crown, Eye, Film, Plus, RotateCcw, Search, ThumbsUp, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { NominationWithVotes } from '../screening.server'

export type ScreeningResultGroupId = 'group1' | 'group2' | 'group3'

export type ScreeningResultGroup = {
  id: ScreeningResultGroupId
  label: string
  short: string
  subtitle: string
  nominations: NominationWithVotes[]
}

type ScreeningResultsProps = {
  groups: ScreeningResultGroup[]
  ownGroup?: ScreeningResultGroupId
  viewGroup: ScreeningResultGroupId
  query: string
  isPending: boolean
  onQueryChange: (query: string) => void
  onViewGroup: (group: ScreeningResultGroupId) => void
  onVote: (nominationId: string, hasVoted: boolean) => void
  onNominate: () => void
}

const GROUP_THEME: Record<ScreeningResultGroupId, {
  dot: string
  active: string
  vote: string
}> = {
  group1: {
    dot: 'bg-orange-500',
    active: 'border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-200',
    vote: 'text-orange-600 dark:text-orange-300',
  },
  group2: {
    dot: 'bg-indigo-500',
    active: 'border-indigo-300 text-indigo-700 dark:border-indigo-700 dark:text-indigo-200',
    vote: 'text-indigo-600 dark:text-indigo-300',
  },
  group3: {
    dot: 'bg-emerald-500',
    active: 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-200',
    vote: 'text-emerald-600 dark:text-emerald-300',
  },
}

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, '')
}

function votesFor(group: ScreeningResultGroup): number {
  return group.nominations.reduce((total, nomination) => total + nomination.votesCount, 0)
}

function NominationCard({
  nomination,
  rank,
  canVote,
  isPending,
  onVote,
}: {
  nomination: NominationWithVotes
  rank: number
  canVote: boolean
  isPending: boolean
  onVote: (nominationId: string, hasVoted: boolean) => void
}) {
  const reduceMotion = useReducedMotion()
  const featured = rank === 1
  const cleanReason = nomination.reason.replace(/\[Bangumi 简介\]/g, '').trim()

  return (
    <motion.article
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: reduceMotion ? 0 : 0.18 }}
      className={`relative overflow-hidden rounded-lg border bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:bg-[#1a100b] dark:shadow-none ${
        featured ? 'border-amber-300 dark:border-amber-700/70 lg:col-span-2' : 'border-slate-200 dark:border-orange-900/45'
      } ${nomination.hasVoted ? 'ring-1 ring-primary/45' : ''}`}
    >
      <div className={`flex gap-3 ${featured ? 'sm:gap-4' : ''}`}>
        <div className={`relative shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 dark:border-orange-900/45 dark:bg-[#120b08] ${
          featured ? 'h-28 w-20 sm:h-32 sm:w-24' : 'h-24 w-[4.25rem]'
        }`}>
          {nomination.cover ? (
            <img src={nomination.cover} alt={`${nomination.title} 封面`} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Film size={18} className="text-slate-400 dark:text-orange-900" />
            </div>
          )}
          <span className={`absolute left-1 top-1 inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[10px] font-black shadow-sm ${
            featured ? 'bg-amber-400 text-slate-950' : 'bg-slate-950/80 text-white'
          }`}>
            {featured ? <Crown size={12} aria-label="第一名" /> : rank}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={`${featured ? 'text-base sm:text-lg' : 'text-sm'} line-clamp-2 break-words font-black leading-snug text-slate-900 dark:text-white`}>
                {nomination.title}
              </h3>
              <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                发起人：<span className="text-slate-700 dark:text-slate-200">{nomination.nominatedByName}</span>
              </p>
            </div>
            {featured && (
              <span className="hidden shrink-0 items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800 dark:bg-amber-500/15 dark:text-amber-200 sm:inline-flex">
                <Trophy size={12} /> 当前领先
              </span>
            )}
          </div>
          <p className={`${featured ? 'line-clamp-3' : 'line-clamp-2'} mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300`}>
            {cleanReason}
          </p>
        </div>
      </div>

      <div className="mt-3 flex min-h-9 items-center justify-between gap-3 border-t border-slate-100 pt-2.5 dark:border-orange-950/70">
        <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-200">
          {nomination.votesCount} 票
        </span>
        {canVote ? (
          <motion.button
            type="button"
            disabled={isPending}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            onClick={() => onVote(nomination.id, nomination.hasVoted)}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-black transition-colors disabled:cursor-wait disabled:opacity-60 ${
              nomination.hasVoted
                ? 'border-primary bg-primary text-white'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-primary/50 hover:text-primary dark:border-orange-900/55 dark:bg-[#120b08] dark:text-orange-100'
            }`}
          >
            <ThumbsUp size={14} className={nomination.hasVoted ? 'fill-current' : ''} />
            {nomination.hasVoted ? '已投，点击退票' : '投它一票'}
          </motion.button>
        ) : (
          <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-500 dark:border-orange-900/45 dark:bg-[#120b08] dark:text-orange-200/65">
            <Eye size={14} /> 旁观结果
          </span>
        )}
      </div>
    </motion.article>
  )
}

export function ScreeningResults({
  groups,
  ownGroup,
  viewGroup,
  query,
  isPending,
  onQueryChange,
  onViewGroup,
  onVote,
  onNominate,
}: ScreeningResultsProps) {
  const reduceMotion = useReducedMotion()
  const selected = groups.find((group) => group.id === viewGroup) ?? groups[0]
  const isOwnGroup = selected.id === ownGroup
  const normalizedQuery = normalizeSearch(query)
  const visibleNominations = normalizedQuery
    ? selected.nominations.filter((nomination) =>
        normalizeSearch(`${nomination.title} ${nomination.nominatedByName} ${nomination.reason}`).includes(normalizedQuery),
      )
    : selected.nominations
  const totalNominations = groups.reduce((total, group) => total + group.nominations.length, 0)

  return (
    <section aria-labelledby="screening-results-heading" className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 dark:border-orange-900/45 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="screening-results-heading" className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white sm:text-lg">
            <Trophy className="h-5 w-5 text-amber-500" /> 群内预测榜
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            默认展示你的群；切换标签可以旁观另外两个群的实时结果。
          </p>
        </div>
        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
          全部 {totalNominations} 款提名
        </span>
      </div>

      <div role="tablist" aria-label="选择查看的舰长群" className="grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-orange-900/55 dark:bg-[#120b08]">
        {groups.map((group) => {
          const active = group.id === selected.id
          const own = group.id === ownGroup
          const theme = GROUP_THEME[group.id]
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              id={`screening-group-tab-${group.id}`}
              aria-selected={active}
              aria-controls={`screening-results-${group.id}`}
              onClick={() => onViewGroup(group.id)}
              className={`relative min-h-[68px] min-w-0 rounded-md border px-1.5 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 sm:min-h-[74px] sm:px-3 ${
                active ? `${theme.active} border-current` : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-orange-200/60 dark:hover:text-orange-100'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="screening-group-tab"
                  className="absolute inset-0 rounded-md bg-white shadow-sm dark:bg-[#24150e]"
                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <span className="relative flex h-full flex-col justify-between gap-1">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${theme.dot}`} />
                  <span className="truncate text-xs font-black sm:text-sm">{group.short}</span>
                  {own && <span className="shrink-0 rounded bg-primary/10 px-1 py-0.5 text-[9px] font-black text-primary sm:px-1.5">我的群</span>}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold sm:text-[11px]">
                  <span>{group.nominations.length} 款</span>
                  <span aria-hidden="true">·</span>
                  <span className={theme.vote}>{votesFor(group)} 票</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={selected.id}
          id={`screening-results-${selected.id}`}
          role="tabpanel"
          aria-labelledby={`screening-group-tab-${selected.id}`}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          className="space-y-4"
        >
          <div className="flex flex-col gap-3 border-y border-slate-200 py-3 dark:border-orange-900/45 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${GROUP_THEME[selected.id].dot}`} />
                <h3 className="text-sm font-black text-slate-900 dark:text-white sm:text-base">{selected.label}</h3>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{selected.subtitle}</span>
              </div>
              {!isOwnGroup && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-orange-200/70">
                  <span className="inline-flex items-center gap-1.5"><Eye size={13} /> 正在旁观，只能查看结果</span>
                  {ownGroup && (
                    <button type="button" onClick={() => onViewGroup(ownGroup)} className="inline-flex items-center gap-1 font-black text-primary hover:underline">
                      <RotateCcw size={12} /> 返回我的群
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder={`搜索${selected.short}提名`}
                aria-label={`搜索${selected.label}提名`}
                className="h-10 rounded-md border-slate-200 bg-white pl-9 text-sm dark:border-orange-900/45 dark:bg-[#120b08]"
              />
            </div>
          </div>

          {visibleNominations.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {visibleNominations.map((nomination) => (
                <NominationCard
                  key={nomination.id}
                  nomination={nomination}
                  rank={selected.nominations.findIndex((item) => item.id === nomination.id) + 1}
                  canVote={isOwnGroup}
                  isPending={isPending}
                  onVote={onVote}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 px-5 py-10 text-center dark:border-orange-900/55">
              <Film size={28} className="text-slate-300 dark:text-orange-900" />
              <h3 className="mt-3 text-sm font-black text-slate-700 dark:text-orange-100">
                {query ? '没有匹配的提名' : `${selected.short}还没有提名`}
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-orange-200/60">
                {query ? '换一个关键词，或切换群组继续查看。' : isOwnGroup ? '成为第一个发起猜想的人。' : '可以先旁观其他群，稍后再回来看看。'}
              </p>
              {!query && isOwnGroup && (
                <Button type="button" size="sm" onClick={onNominate} className="mt-4 rounded-md">
                  <Plus size={14} /> 发起猜想
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
