import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

export interface Preferences {
  theme: 'light' | 'dark'
  /** true = 用户显式选过主题（cookie 在）；false = theme 只是服务端回退值，
   *  客户端应继续跟随系统（boot script / next-themes system），谁也不许把回退值固化成 cookie。 */
  themeFromCookie: boolean
}

export const getPreferences = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Preferences> => {
    // Theme resolution: explicit cookie > light. First-time visitors always land
    // on the bright campaign theme; the toggle writes a cookie when they opt in
    // to dark mode.
    const cookie = getCookie('theme')
    const themeFromCookie = cookie === 'light' || cookie === 'dark'
    return { theme: cookie === 'dark' ? 'dark' : 'light', themeFromCookie }
  },
)
