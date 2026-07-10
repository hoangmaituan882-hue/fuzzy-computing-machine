import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { createServerEntry } from '@tanstack/react-start/server-entry'
import { assertEnvOnce } from '@/lib/env-validate'
import { withSecurityHeaders } from '@/lib/security-headers'

const startFetch = createStartHandler(defaultStreamHandler)

export default createServerEntry({
  async fetch(request) {
    await assertEnvOnce()
    return withSecurityHeaders(await startFetch(request))
  },
})
