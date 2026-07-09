import type { ScreeningGroup } from './screening.server'
import { getLocalObject } from '@/features/storage/storage.server'
import { screeningGroupImageObjectKey } from './screening-assets'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from '@/lib/env'

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

export async function putScreeningGroupImage(
  groupId: ScreeningGroup,
  body: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const key = screeningGroupImageObjectKey(groupId)
  const filePath = safeObjectPath(key)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, Buffer.from(body))
  await writeFile(`${filePath}.type`, contentType)
  return key
}

export function getScreeningGroupImage(groupId: ScreeningGroup) {
  return getLocalObject(screeningGroupImageObjectKey(groupId))
}
