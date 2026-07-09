import type { ScreeningGroup } from './screening.server'

export const SCREENING_GROUP_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const SCREENING_GROUP_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp'

const ALLOWED_SCREENING_GROUP_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export type ScreeningGroupImageReason = 'empty' | 'type' | 'size'
export type ScreeningGroupImageValidation =
  | { ok: true }
  | { ok: false; reason: ScreeningGroupImageReason }

export function screeningGroupImageObjectKey(groupId: ScreeningGroup): string {
  return `screening/group-identities/${groupId}`
}

export function validateScreeningGroupImage(input: {
  type: string
  size: number
}): ScreeningGroupImageValidation {
  if (input.size === 0) return { ok: false, reason: 'empty' }
  if (!ALLOWED_SCREENING_GROUP_IMAGE_TYPES.includes(input.type as (typeof ALLOWED_SCREENING_GROUP_IMAGE_TYPES)[number])) {
    return { ok: false, reason: 'type' }
  }
  if (input.size > SCREENING_GROUP_IMAGE_MAX_BYTES) return { ok: false, reason: 'size' }
  return { ok: true }
}
