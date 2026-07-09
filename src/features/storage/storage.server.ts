import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from '@/lib/env'
import { avatarObjectKey } from './storage'

export type LocalStoredObject = {
  body: ArrayBuffer
  contentType: string
  etag: string
  httpMetadata: { contentType: string }
  httpEtag: string
  arrayBuffer(): Promise<ArrayBuffer>
}

function uploadRoot() {
  return path.resolve(env.UPLOAD_DIR)
}

function safeObjectPath(key: string) {
  const resolved = path.resolve(uploadRoot(), key)
  const root = uploadRoot()
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error('Invalid upload path')
  }
  return resolved
}

async function putLocalObject(key: string, body: ArrayBuffer, contentType: string): Promise<string> {
  const filePath = safeObjectPath(key)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, Buffer.from(body))
  await writeFile(`${filePath}.type`, contentType)
  return key
}

export async function getLocalObject(key: string): Promise<LocalStoredObject | null> {
  try {
    const filePath = safeObjectPath(key)
    const [body, contentType] = await Promise.all([
      readFile(filePath),
      readFile(`${filePath}.type`, 'utf8').catch(() => 'application/octet-stream'),
    ])
    const arrayBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer
    const etag = `"${body.byteLength}-${body[0] ?? 0}-${body[body.byteLength - 1] ?? 0}"`
    return {
      body: arrayBuffer,
      contentType,
      etag,
      httpMetadata: { contentType },
      httpEtag: etag,
      arrayBuffer: async () => arrayBuffer,
    }
  } catch {
    return null
  }
}

/** Store (overwrite) a user's avatar. Returns the object key written. */
export function putAvatar(
  userIdOrBucket: string | unknown,
  bodyOrUserId: ArrayBuffer | string,
  contentTypeOrBody: string | ArrayBuffer,
  maybeContentType?: string,
): Promise<string> {
  const userId = typeof userIdOrBucket === 'string' ? userIdOrBucket : String(bodyOrUserId)
  const body = typeof userIdOrBucket === 'string' ? bodyOrUserId as ArrayBuffer : contentTypeOrBody as ArrayBuffer
  const contentType = typeof userIdOrBucket === 'string' ? contentTypeOrBody as string : maybeContentType ?? 'application/octet-stream'
  return putLocalObject(avatarObjectKey(userId), body, contentType)
}

/** Fetch a user's avatar object (or null). */
export function getAvatar(userIdOrBucket: string | unknown, maybeUserId?: string): Promise<LocalStoredObject | null> {
  const userId = typeof userIdOrBucket === 'string' ? userIdOrBucket : maybeUserId ?? ''
  return getLocalObject(avatarObjectKey(userId))
}
