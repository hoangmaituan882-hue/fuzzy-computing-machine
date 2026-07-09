import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Suspense } from 'react'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/features/i18n/provider'
import { selectChangelog, type ChangelogRaw, type ChangelogMeta } from '@/features/changelog/select'
import browserCollections from 'collections/browser'
import { dictionaries } from '@/features/i18n/locale'
import type { Locale } from '@/features/i18n/locale'


const rootRoute = getRouteApi('__root__')

const getEntries = createServerFn({ method: 'GET' })
  .validator((locale: string) => locale)
  .handler(async ({ data: locale }) => {
    const { changelog } = await import('collections/server')
    return selectChangelog(changelog as unknown as ChangelogRaw[], locale)
  })

const clientLoader = browserCollections.changelog.createClientLoader({
  id: 'changelog',
  component({ default: MDX }) {
    return <MDX />
  },
})

export const Route = createFileRoute('/{-$locale}/changelog')({
  loader: async ({ params }) => {
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const [origin, user, entries] = await Promise.all([
      getOrigin(),
      getOptionalUser(),
      getEntries({ data: locale }),
    ])
    await Promise.all(entries.map((e) => clientLoader.preload(e.path)))
    return { origin, loggedIn: !!user, entries }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/changelog',
      title: `${dict.changelog.title} — FlareStarter`,
      description: dict.changelog.subtitle,
    })
    return { meta, links }
  },
  component: Changelog,
})

function Changelog() {
  const { loggedIn, entries } = Route.useLoaderData()
  const { theme } = rootRoute.useLoaderData()
  const { t } = useTranslation()

  // Preprocess entries to insert year markers
  interface TimelineItem {
    type: 'year' | 'entry';
    year?: string;
    entry?: ChangelogMeta;
    key: string;
  }

  const timelineItems: TimelineItem[] = []
  let lastYear = ''

  for (const entry of entries) {
    const year = entry.date.split('-')[0]
    if (year !== lastYear) {
      timelineItems.push({
        type: 'year',
        year,
        key: `year-${year}`,
      })
      lastYear = year
    }
    timelineItems.push({
      type: 'entry',
      entry,
      key: `entry-${entry.path}`,
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <header className="mb-14 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-fg-2 to-fg-3 bg-clip-text text-transparent">{t('changelog.title')}</h1>
          <p className="mt-3 text-fg-2 max-w-md mx-auto">{t('changelog.subtitle')}</p>
        </header>

        {/* Timeline Container */}
        <div className="flex flex-col">
          {timelineItems.map((item, index) => {
            const isFirst = index === 0
            const isLast = index === timelineItems.length - 1

            if (item.type === 'year') {
              return (
                <div key={item.key} className="grid grid-cols-[70px_32px_1fr] md:grid-cols-[90px_40px_1fr] items-center py-2">
                  {/* Left Column: Year */}
                  <div className="text-right pr-4 font-black text-2xl md:text-3xl tracking-tight text-foreground select-none">
                    {item.year}
                  </div>
                  {/* Middle Column: Line and Hollow Circle */}
                  <div className="relative flex justify-center items-center h-10">
                    {/* Line segment */}
                    <div className={`absolute w-0 border-l-2 border-dashed border-border/55 ${isFirst ? 'top-5 bottom-0' : isLast ? 'top-0 h-5' : 'top-0 bottom-0'}`} />
                    
                    {/* Hollow Circle */}
                    <div className="z-10 flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full border-2 border-primary bg-background shadow-xs">
                      <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-background" />
                    </div>
                  </div>
                  {/* Right Column: Spacing */}
                  <div />
                </div>
              )
            }

            const e = item.entry!
            const monthDay = e.date.split('-').slice(1).join('-') // e.g. "01-20"

            return (
              <div key={item.key} className="grid grid-cols-[70px_32px_1fr] md:grid-cols-[90px_40px_1fr] group">
                {/* Left Column: Date */}
                <div className="text-right pr-4 pt-4 font-mono text-sm font-semibold text-fg-3 select-none">
                  {monthDay}
                </div>
                {/* Middle Column: Line and Dot */}
                <div className="relative flex justify-center pt-5">
                  {/* Line segment */}
                  <div className={`absolute top-0 w-0 border-l-2 border-dashed border-border/55 ${isLast ? 'h-5' : 'bottom-0'}`} />
                  
                  {/* Dot */}
                  <div className="z-10 h-2.5 w-2.5 rounded-full bg-fg-3/60 transition-all duration-300 group-hover:bg-primary group-hover:scale-125" />
                </div>
                {/* Right Column: Card Content */}
                <div className="pb-10 transition-all duration-300 hover:translate-x-1">
                  <Card className="overflow-hidden border border-border bg-card/60 backdrop-blur-xs transition-all duration-300 hover:shadow-md hover:border-fg-3/30">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary">
                            {e.title}
                          </CardTitle>
                          <Badge className="font-mono bg-bg-alt text-fg-2 hover:bg-bg-alt border border-border">
                            {e.version}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose dark:prose-invert max-w-none text-fg-2 leading-relaxed">
                        <Suspense>{clientLoader.useContent(e.path)}</Suspense>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )
          })}
        </div>
      </main>
      <Footer theme={theme} />
    </div>
  )
}
