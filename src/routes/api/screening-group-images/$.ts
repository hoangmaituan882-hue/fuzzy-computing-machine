import { createFileRoute } from '@tanstack/react-router'
import { getScreeningGroupImage } from '@/features/screening/screening-assets.server'
import { isScreeningGroup } from '@/features/screening/screening.server'

const handler = async ({ request }: { request: Request }) => {
  let groupId = ''
  try {
    groupId = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '')
  } catch {
    return new Response('Not found', { status: 404 })
  }

  if (!isScreeningGroup(groupId)) return new Response('Not found', { status: 404 })

  const object = await getScreeningGroupImage(groupId)
  if (!object) return new Response('Not found', { status: 404 })

  const headers = new Headers()
  headers.set('Content-Type', object.contentType)
  headers.set('ETag', object.etag)
  headers.set('Cache-Control', 'public, max-age=60')
  return new Response(object.body, { headers })
}

export const Route = createFileRoute('/api/screening-group-images/$')({
  server: { handlers: { GET: handler } },
})
