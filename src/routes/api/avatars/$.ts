import { createFileRoute } from '@tanstack/react-router'
import { getAvatar } from '@/features/storage/storage.server'

/**
 * Stream a user's avatar from R2. R2 objects aren't public by default, so this
 * route is the read side — `user.image` points here. Avatars are non-sensitive,
 * so no auth gate; the userId is the last path segment.
 */
const handler = async ({ request }: { request: Request }) => {
  let userId = ''
  try {
    userId = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '')
  } catch {
    // 畸形百分号编码（如 /%E0%A4%A）→ 404，而不是未捕获的 URIError 500
  }
  const object = userId ? await getAvatar(userId) : null
  if (!object) return new Response('Not found', { status: 404 })

  const headers = new Headers()
  headers.set('Content-Type', object.contentType)
  headers.set('ETag', object.etag)
  headers.set('Cache-Control', 'public, max-age=60') // short: url is cache-busted on re-upload
  return new Response(object.body, { headers })
}

export const Route = createFileRoute('/api/avatars/$')({
  server: { handlers: { GET: handler } },
})
