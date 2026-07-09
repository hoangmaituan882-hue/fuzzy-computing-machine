import { useRouter } from '@tanstack/react-router'
import { Sun, Moon } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { useResolvedTheme } from '@/features/theme/use-resolved-theme'

export function ThemeToggle({ theme }: { theme: 'light' | 'dark' }) {
  const router = useRouter()
  const { t } = useTranslation()
  // trust the DOM, not the loader: a cookie-less light-OS visitor is on light
  // even though SSR said dark (see the boot script in __root)
  const resolved = useResolvedTheme(theme)

  function toggle() {
    const next = resolved === 'dark' ? 'light' : 'dark'
    document.cookie = `theme=${next}; path=/; max-age=31536000`
    // apply immediately: React's vDOM may still think the class is unchanged
    // when the boot script flipped it (cookie-less visitor), so diffing alone
    // wouldn't touch the DOM
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(next)
    // Keep next-themes' store in sync so the docs theme switch reflects this too.
    try {
      localStorage.setItem('theme', next)
    } catch {
      // ignore (e.g. storage disabled)
    }
    router.invalidate()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('common.toggleTheme')}
      className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-transparent text-fg-2 transition-colors hover:bg-bg-alt hover:text-foreground"
    >
      <span className="t-icon-swap" data-state={resolved === 'dark' ? 'a' : 'b'}>
        <span className="t-icon" data-icon="a">
          <Sun size={18} />
        </span>
        <span className="t-icon" data-icon="b">
          <Moon size={18} />
        </span>
      </span>
    </button>
  )
}
