import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, getRouteApi } from '@tanstack/react-router'
import { Settings, Gauge, Users, Menu, ClipboardList, PanelLeftClose, PanelLeftOpen, Heart, MessageSquare, Ticket, Images } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/features/theme/theme-toggle'
import { LangSwitch } from '@/features/i18n/lang-switch'
import { useTranslation } from '@/features/i18n/provider'
import { PaymentFailedBanner } from '@/features/billing/components/payment-failed-banner'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

const rootRoute = getRouteApi('__root__')

const COLLAPSE_KEY = 'sidebar-collapsed'

export interface ShellUser {
  name?: string | null
  email: string
  role?: string | null
  image?: string | null
}

function initials(primary: string): string {
  const parts = primary.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return primary.slice(0, 2).toUpperCase()
}

/**
 * Shared sidebar + topbar shell for every signed-in surface. One unified nav:
 * Workspace + Account for everyone, plus an Admin group rendered only for
 * `role === 'admin'` (non-admins get no hint the console exists). Admin routes
 * stay under /admin with their own gate — only the navigation is merged.
 *
 * Desktop sidebar collapses to an icon rail; the choice sticks across pages
 * via localStorage (applied after mount so SSR markup stays deterministic).
 */
export function AppShell({
  user,
  isPro,
  active,
  crumb,
  paymentFailed,
  children,
}: {
  user: ShellUser
  isPro?: boolean
  active: string
  crumb: string
  paymentFailed?: boolean
  children: ReactNode
}) {
  const { theme } = rootRoute.useLoaderData()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1'), [])
  function toggleCollapsed() {
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSE_KEY, v ? '0' : '1')
      return !v
    })
  }

  // admin pages don't load billing, so the topbar badge shows the role there
  const onAdminPage = active.startsWith('admin-')
  const primary = user.name || user.email
  const secondary = user.email

  // `rail` = collapsed icon rail (desktop only; the mobile drawer is always full-width)
  const sidebar = (rail: boolean) => {
    const item = (isActive: boolean) =>
      `app-nav-item ${isActive ? 'active' : ''} ${rail ? 'justify-center' : ''}`
    const label = (text: string) => (
      <AnimatePresence initial={false} mode="wait">
        {!rail && (
          <motion.span
            key={text + '-label'}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="truncate"
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    )
    // group boundaries: text label expanded, slim centered divider on the rail
    const grp = (text: string) =>
      rail ? <div className="mx-auto my-2 h-px w-6 bg-border" aria-hidden="true" /> : <div className="grp">{text}</div>
    return (
      <>
        <div className={rail ? 'brand justify-center' : 'brand'}>
          <Logo compact={rail} />
        </div>
        {grp("三个舰长群专属")}
        <Link to="/{-$locale}/app/cinema/plaza" activeProps={{}} className={item(active === 'cinema-plaza')} title="猜游广场">
          <Ticket size={18} className="shrink-0" />
          {label("猜游广场")}
        </Link>
        {grp(t('app.navAccount'))}
        <Link to="/{-$locale}/app/account" activeProps={{}} className={item(active === 'account')} title={t('app.account')}>
          <Settings size={18} className="shrink-0" />
          {label(t('app.account'))}
        </Link>
        {user.role === 'admin' && (
          <>
            {grp(t('admin.navAdmin'))}
            <Link to="/{-$locale}/admin" activeProps={{}} className={item(active === 'admin-dashboard')} title={t('admin.dashboard')}>
              <Gauge size={18} className="shrink-0" />
              {label(t('admin.dashboard'))}
            </Link>
            <Link to="/{-$locale}/admin/users" activeProps={{}} className={item(active === 'admin-users')} title={t('admin.users')}>
              <Users size={18} className="shrink-0" />
              {label(t('admin.users'))}
            </Link>
            <Link to="/{-$locale}/admin/screening" activeProps={{}} className={item(active === 'admin-screening')} title="群身份">
              <Images size={18} className="shrink-0" />
              {label("群身份")}
            </Link>
            <Link to="/{-$locale}/admin/waitlist" activeProps={{}} className={item(active === 'admin-waitlist')} title={t('admin.waitlist')}>
              <ClipboardList size={18} className="shrink-0" />
              {label(t('admin.waitlist'))}
            </Link>
            <Link to="/{-$locale}/admin/sponsors" activeProps={{}} className={item(active === 'admin-sponsors')} title={t('admin.sponsors')}>
              <Heart size={18} className="shrink-0" />
              {label(t('admin.sponsors'))}
            </Link>
            <Link to="/{-$locale}/admin/feedback" activeProps={{}} className={item(active === 'admin-feedback')} title={t('admin.feedbackAdmin')}>
              <MessageSquare size={18} className="shrink-0" />
              {label(t('admin.feedbackAdmin'))}
            </Link>
          </>
        )}
        <div className="flex-1" />
        <div className={`flex items-center gap-2.5 border-t border-border pt-3 ${rail ? 'justify-center' : ''}`}>
          <Avatar>
            <AvatarImage src={user.image ?? undefined} alt={primary} />
            <AvatarFallback>{initials(primary)}</AvatarFallback>
          </Avatar>
          <AnimatePresence initial={false}>
            {!rail && (
              <motion.div
                key="user-info"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="min-w-0 flex-1 overflow-hidden"
              >
                <div className="truncate text-[13px] font-semibold text-foreground">{primary}</div>
                <div className="truncate text-xs text-fg-3">{secondary}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen md:flex">
      {/* desktop sidebar — animated width via framer-motion spring */}
      <motion.div
        className="hidden md:block shrink-0 overflow-hidden"
        animate={{ width: collapsed ? 64 : 248 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.8 }}
      >
        <aside className="app-side h-full" style={{ width: collapsed ? 64 : 248 }}>
          {sidebar(collapsed)}
        </aside>
      </motion.div>

      {/* mobile drawer (always full-width, never the rail) */}
      {open && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="app-side fixed inset-y-0 left-0 z-50 w-[248px]" onClick={() => setOpen(false)}>
            {sidebar(false)}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <div className="app-topbar">
          <button
            type="button"
            className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg text-fg-2 hover:bg-bg-alt hover:text-foreground md:hidden"
            aria-label="Menu"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
          <button
            type="button"
            className="hidden h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg text-fg-2 hover:bg-bg-alt hover:text-foreground md:inline-flex"
            aria-label={collapsed ? t('app.expandSidebar') : t('app.collapseSidebar')}
            title={collapsed ? t('app.expandSidebar') : t('app.collapseSidebar')}
            onClick={toggleCollapsed}
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>
          <span className="app-crumb">
            <span className="hidden md:inline">
              泛式舰长投票 <span className="mx-1.5 text-fg-3">/</span>
            </span>
            <b>{crumb}</b>
          </span>
          <div className="flex-1" />
          {onAdminPage ? (
            <Badge variant="pro" dot className="shrink-0">
              {user.role || 'admin'}
            </Badge>
          ) : (
            <Badge variant={isPro ? 'pro' : 'free'} dot className="shrink-0">
              {isPro ? t('billing.pro') : t('billing.free')}
            </Badge>
          )}
          <ThemeToggle theme={theme} />
          <LangSwitch />
        </div>
        <div className="app-main">
          <PaymentFailedBanner show={!!paymentFailed} />
          {children}
        </div>
      </div>
    </div>
  )
}
