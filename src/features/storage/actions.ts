import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import type { AvatarReason } from './storage'

export type UploadAvatarResult =
  | { ok: true; url: string }
  | { ok: false; reason: AvatarReason | 'noFile' }

/**
 * Accept a multipart avatar upload, validate it, write it to R2, and point
 * `user.image` at the serving route. Returns a discriminated result so the
 * client maps the reason to an i18n string (rather than throwing opaque errors).
 */
export const uploadAvatar = createServerFn({ method: 'POST' })
  .validator((d: FormData) => d)
  .handler(async ({ data }): Promise<UploadAvatarResult> => {
    const { env } = await import('@/lib/env')
    const { createDb } = await import('@/db/client')
    const { readUser } = await import('@/features/auth/readUser.server')
    const { validateAvatar } = await import('./storage')
    const { putAvatar } = await import('./storage.server')
    const { user: userTable } = await import('@/features/auth/auth.schema')
    const { eq } = await import('drizzle-orm')

    const user = await readUser()
    if (!user) throw redirect({ to: '/{-$locale}/login' })

    const file = data.get('file')
    if (!(file instanceof File)) return { ok: false, reason: 'noFile' }

    const check = validateAvatar({ type: file.type, size: file.size })
    if (!check.ok) return { ok: false, reason: check.reason }

    const bytes = await file.arrayBuffer()
    await putAvatar(user.id, bytes, file.type)

    // Cache-bust so the <img> refetches immediately after re-upload.
    const url = `/api/avatars/${user.id}?v=${Date.now()}`
    await createDb(env.DB).update(userTable).set({ image: url }).where(eq(userTable.id, user.id))
    return { ok: true, url }
  })
