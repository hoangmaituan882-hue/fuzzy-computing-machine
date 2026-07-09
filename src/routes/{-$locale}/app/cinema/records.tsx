import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useTransition } from 'react'
import { Star, MessageSquare, Send, Film, ExternalLink } from 'lucide-react'
import { requireUser } from '@/features/auth/middleware'
import { getEntitlement } from '@/features/billing/middleware'
import { AppShell } from '@/components/app/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  listCompletedScreeningsFn,
  getScreeningDetailsFn,
  submitReviewFn,
} from '@/features/screening/screening.fns'

export const Route = createFileRoute('/{-$locale}/app/cinema/records')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  loader: async ({ params }) => {
    const locale = (params as { locale?: string }).locale
    const user = await requireUser({ data: { locale } })
    const [ent, screenings] = await Promise.all([
      getEntitlement(),
      listCompletedScreeningsFn(),
    ])
    
    // 预先拉取每期放映会的详情及评价
    const details = await Promise.all(
      screenings.map(async (s) => {
        const d = await getScreeningDetailsFn({ data: s.id })
        return { id: s.id, reviews: d.reviews }
      })
    )
    
    // 转为 Object 便于前端查找和序列化
    const reviewsMap = Object.fromEntries(details.map((d) => [d.id, d.reviews]))

    return { user, ent, screenings, reviewsMap }
  },
  component: Records,
})

function Records() {
  const { user, ent, screenings, reviewsMap } = Route.useLoaderData()
  const router = useRouter()
  const isPro = ent.plan === 'pro'

  const [isPending, startTransition] = useTransition()
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  // 整理时间轴渲染元素
  interface TimelineItem {
    type: 'year' | 'screening';
    year?: string;
    screening?: typeof screenings[0];
    key: string;
  }

  const timelineItems: TimelineItem[] = []
  let lastYear = ''

  for (const s of screenings) {
    const year = s.date.split('-')[0]
    if (year !== lastYear) {
      timelineItems.push({
        type: 'year',
        year,
        key: `year-${year}`,
      })
      lastYear = year
    }
    timelineItems.push({
      type: 'screening',
      screening: s,
      key: `screening-${s.id}`,
    })
  }

  // 评价提交处理器
  function handleSubmitReview(screeningId: string) {
    if (!comment.trim() || isPending) return
    startTransition(async () => {
      await submitReviewFn({
        data: {
          screeningId,
          rating,
          comment: comment.trim(),
        },
      })
      setComment('')
      setRating(5)
      router.invalidate()
    })
  }

  return (
    <AppShell user={user} isPro={isPro} active="cinema-records" crumb="放映历史轴" paymentFailed={ent.paymentFailed}>
      <div className="mb-6">
        <h1 className="page-h">放映历史轴</h1>
        <p className="mt-1.5 text-[14.5px] text-fg-2">
          追溯私域放映会的所有历史轨迹，欣赏群友留下的影评与二次元见解。
        </p>
      </div>

      {/* Timeline Grid */}
      {timelineItems.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border p-12 text-center bg-card/25">
          <Film size={36} className="mx-auto text-fg-3 mb-3 animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">暂无历史放映记录</h3>
          <p className="text-xs text-fg-3 mt-1.5 max-w-xs mx-auto">
            还没有任何已完成的放映会。每周日晚放映结束后，这里将沉淀我们的观影历史。
          </p>
        </div>
      ) : (
        <div className="flex flex-col max-w-3xl">
          {timelineItems.map((item, index) => {
            const isFirst = index === 0
            const isLast = index === timelineItems.length - 1

            // Year row
            if (item.type === 'year') {
              return (
                <div key={item.key} className="grid grid-cols-[70px_32px_1fr] md:grid-cols-[90px_40px_1fr] items-center py-2">
                  <div className="text-right pr-4 font-black text-2xl md:text-3xl tracking-tight text-foreground select-none">
                    {item.year}
                  </div>
                  <div className="relative flex justify-center items-center h-10">
                    <div className={`absolute w-0 border-l-2 border-dashed border-border/55 ${isFirst ? 'top-5 bottom-0' : isLast ? 'top-0 h-5' : 'top-0 bottom-0'}`} />
                    <div className="z-10 flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full border-2 border-primary bg-background shadow-xs">
                      <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-background" />
                    </div>
                  </div>
                  <div />
                </div>
              )
            }

            // Screening row
            const s = item.screening!
            const monthDay = s.date.split('-').slice(1).join('-')
            const reviews = reviewsMap[s.id] || []
            const isReplying = activeReviewId === s.id

            // 计算该期平均分
            const avgRating = reviews.length > 0 
              ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10 
              : 0

            return (
              <div key={item.key} className="grid grid-cols-[70px_32px_1fr] md:grid-cols-[90px_40px_1fr] group">
                {/* Left: Date */}
                <div className="text-right pr-4 pt-4 font-mono text-sm font-semibold text-fg-3 select-none">
                  {monthDay}
                </div>
                {/* Middle: Dot & Line */}
                <div className="relative flex justify-center pt-5">
                  <div className={`absolute top-0 w-0 border-l-2 border-dashed border-border/55 ${isLast ? 'h-5' : 'bottom-0'}`} />
                  <div className="z-10 h-2.5 w-2.5 rounded-full bg-fg-3/60 transition-all duration-300 group-hover:bg-primary group-hover:scale-125" />
                </div>
                {/* Right: Details Card */}
                <div className="pb-10 transition-all duration-300 hover:translate-x-0.5">
                  <div className="t-acc animate-in fade-in duration-300" data-open={isReplying ? 'true' : 'false'}>
                    <Card className="overflow-hidden border border-border bg-card/60 backdrop-blur-xs transition-all duration-300 hover:shadow-md hover:border-fg-3/30">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <CardTitle className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
                              {s.animeTitle}
                            </CardTitle>
                            <Badge className="font-mono bg-bg-alt text-fg-2 hover:bg-bg-alt border border-border">
                              {s.title}
                            </Badge>
                            {avgRating > 0 && (
                              <Badge className="font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-0.5">
                                ⭐ {avgRating} 分
                              </Badge>
                            )}
                          </div>
                          {s.bilibiliBvid && (
                            <a 
                              href={`https://www.bilibili.com/video/${s.bilibiliBvid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                            >
                              <span>B站回放</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-fg-2 mt-2 leading-relaxed">{s.description}</p>
                      </CardHeader>
                      
                      <CardContent className="pt-2 border-t border-border/60">
                        
                        {/* Reviews Toggle & Action */}
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            aria-expanded={isReplying ? 'true' : 'false'}
                            onClick={() => setActiveReviewId(isReplying ? null : s.id)}
                            className="t-acc-head inline-flex items-center gap-1.5 text-xs font-semibold text-fg-3 hover:text-foreground transition-colors"
                          >
                            <MessageSquare size={13} />
                            <span>{reviews.length} 条评价</span>
                            <span className="t-acc-chevron ml-1 text-fg-3">
                              <svg viewBox="0 0 16 16" className="w-3 h-3 fill-none stroke-current stroke-2"><path d="M4 6.5L8 10.5L12 6.5"/></svg>
                            </span>
                          </button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setActiveReviewId(isReplying ? null : s.id)
                            }}
                            className="h-8 text-xs font-semibold"
                          >
                            {isReplying ? '收起面板' : '发表评价/评分'}
                          </Button>
                        </div>

                        {/* Collapsible Panel with transitions.dev grid-rows animation */}
                        <div className="t-acc-panel">
                          <div className="t-acc-panel-inner">
                            <div className="pt-4 mt-4 border-t border-border/40 space-y-4">
                              
                              {/* Write Review Form */}
                              <div className="space-y-3 p-3 rounded-xl border border-border bg-card/80">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-foreground">我要评分：</span>
                                  {/* Stars Selector */}
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="text-amber-500 hover:scale-110 transition-transform duration-150"
                                      >
                                        <Star size={16} className={star <= rating ? 'fill-current' : ''} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Textarea
                                    placeholder="输入您对本期作品的吐槽与观后感..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={2}
                                    className="resize-none flex-1 min-h-[50px] text-xs py-2"
                                  />
                                  <Button
                                    size="icon"
                                    onClick={() => handleSubmitReview(s.id)}
                                    disabled={isPending || !comment.trim()}
                                    className="h-9 w-9 shrink-0 self-end"
                                  >
                                    <Send size={14} />
                                  </Button>
                                </div>
                              </div>

                              {/* Reviews List */}
                              {reviews.length === 0 ? (
                                <p className="text-xs text-fg-3 text-center py-2">暂无讨论与评价，快留下第一条吐槽吧！</p>
                              ) : (
                                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                                  {reviews.map((rev) => (
                                    <div key={rev.id} className="text-xs space-y-1 p-2.5 rounded-lg bg-bg-alt/40 border border-border/40">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-foreground">{rev.userName}</span>
                                        <div className="flex items-center gap-0.5 text-amber-500">
                                          {Array.from({ length: rev.rating }).map((_, i) => (
                                            <Star key={i} size={10} className="fill-current" />
                                          ))}
                                        </div>
                                      </div>
                                      <p className="text-fg-2 leading-relaxed">{rev.comment}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                            </div>
                          </div>
                        </div>

                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
