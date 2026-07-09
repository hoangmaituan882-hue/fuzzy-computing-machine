import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { BarChart3, Clock, Star, Heart, TrendingUp, Award, Smile } from 'lucide-react'
import { requireUser } from '@/features/auth/middleware'
import { getEntitlement } from '@/features/billing/middleware'
import { AppShell } from '@/components/app/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getAnalyticsStatsFn } from '@/features/screening/screening.fns'

export const Route = createFileRoute('/{-$locale}/app/cinema/dashboard')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  loader: async ({ params }) => {
    const locale = (params as { locale?: string }).locale
    const user = await requireUser({ data: { locale } })
    const [ent, stats] = await Promise.all([
      getEntitlement(),
      getAnalyticsStatsFn(),
    ])
    return { user, ent, stats }
  },
  component: Dashboard,
})

function Dashboard() {
  const { user, ent, stats } = Route.useLoaderData()
  const isPro = ent.plan === 'pro'

  // 计算评分柱状图的最高值以归一化高度
  const maxRatingCount = Math.max(...stats.ratingDistribution.map((r) => r.count), 1)

  // 类别比重统计（计算百分比）
  const totalCategoryCount = stats.categoryDistribution.reduce((acc, c) => acc + c.count, 0) || 1

  return (
    <AppShell user={user} isPro={isPro} active="cinema-dashboard" crumb="放映数据看板" paymentFailed={ent.paymentFailed}>
      <div className="mb-6">
        <h1 className="page-h">放映数据看板</h1>
        <p className="mt-1.5 text-[14.5px] text-fg-2">
          分析私域放映会的历史数据，浏览动漫品类偏好、评分曲线以及群友们支持度最高的明星提名。
        </p>
      </div>

      {/* 第一行：指标卡片网格 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        
        <Card className="border border-border bg-card/60 backdrop-blur-xs">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-fg-3 uppercase tracking-wider">累计举办</p>
              <h3 className="text-2xl font-bold text-foreground font-mono mt-0.5">
                <CountUp end={stats.totalScreenings} /> 期
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/60 backdrop-blur-xs">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-fg-3 uppercase tracking-wider">放映累计时长</p>
              <h3 className="text-2xl font-bold text-foreground font-mono mt-0.5">
                <CountUp end={stats.totalScreenings * 2} />.5 小时
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/60 backdrop-blur-xs">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Star size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-fg-3 uppercase tracking-wider">历史平均评分</p>
              <h3 className="text-2xl font-bold text-foreground font-mono mt-0.5">
                <CountUp end={stats.averageRating || 0} decimals={1} /> 分
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/60 backdrop-blur-xs">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
              <Heart size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-fg-3 uppercase tracking-wider">总提案数</p>
              <h3 className="text-2xl font-bold text-foreground font-mono mt-0.5">
                <CountUp end={stats.totalNominations} /> 部
              </h3>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 第二行：图表与列表 */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* A. 评分曲线分布柱状图 */}
        <Card className="border border-border bg-card/60 backdrop-blur-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" />
              <span>历史评分分布统计</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col justify-between h-[220px]">
            {/* Bars container */}
            <div className="flex items-end justify-around h-[140px] px-2 border-b border-border/80 pb-2">
              {stats.ratingDistribution.map((item) => {
                const heightPct = Math.max(8, (item.count / maxRatingCount) * 100)
                return (
                  <div key={item.rating} className="flex flex-col items-center gap-2 group w-12">
                    {/* Tooltip value */}
                    <span className="text-[10px] font-mono font-bold text-fg-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {item.count}次
                    </span>
                    {/* Bar */}
                    <div 
                      className="w-8 bg-primary/80 rounded-t-md transition-all duration-300 group-hover:bg-primary group-hover:shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                )
              })}
            </div>
            {/* Labels */}
            <div className="flex justify-around px-2 pt-2 text-xs font-semibold text-fg-3">
              {[1, 2, 3, 4, 5].map((stars) => (
                <span key={stars} className="w-12 text-center flex items-center justify-center gap-0.5">
                  {stars}<Star size={10} className="fill-current text-amber-500" />
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* B. 动漫分类偏好百分比 */}
        <Card className="border border-border bg-card/60 backdrop-blur-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Smile size={16} className="text-primary" />
              <span>动漫类型偏好偏重</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.categoryDistribution.map((cat) => {
              const pct = Math.round((cat.count / totalCategoryCount) * 100)
              const label = cat.type === 'movie' ? '剧场版/电影' : 'TV 连载新番'
              return (
                <div key={cat.type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-foreground">{label}</span>
                    <span className="text-fg-2 font-mono">{pct}% ({cat.count}部)</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2.5 w-full bg-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* C. 提名支持度排行榜 */}
        <Card className="border border-border bg-card/60 backdrop-blur-xs md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Award size={16} className="text-primary" />
              <span>提名支持度星级榜（候选热门）</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.popularNominations.length === 0 ? (
              <p className="text-sm text-fg-3 text-center py-4">暂无候选热门作品</p>
            ) : (
              <div className="divide-y divide-border/60">
                {stats.popularNominations.map((nom, idx) => (
                  <div key={nom.title} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className={`h-5 w-5 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                        idx === 0 
                          ? 'bg-amber-500 text-white' 
                          : idx === 1 
                            ? 'bg-slate-300 text-slate-800' 
                            : idx === 2 
                              ? 'bg-amber-700 text-white' 
                              : 'bg-bg-alt text-fg-3'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-foreground">{nom.title}</span>
                    </div>
                     <Badge className="font-mono bg-primary/10 text-primary border border-primary/20">
                       🔥 {nom.votesCount} 票支持
                     </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AppShell>
  )
}

function CountUp({ end, decimals = 0, duration = 1000 }: { end: number; decimals?: number; duration?: number }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      setValue(progress * end)
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }, [end, duration])

  return <>{value.toFixed(decimals)}</>
}

