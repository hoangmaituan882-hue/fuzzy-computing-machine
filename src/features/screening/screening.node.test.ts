import { describe, expect, test } from 'vitest'
import {
  normalizeNominationTitle,
  validateNominationFields,
} from './screening.server'

describe('screening nomination validation', () => {
  test('normalizes spacing and case for duplicate detection', () => {
    expect(normalizeNominationTitle('  White Album 2 ')).toBe('whitealbum2')
  })

  test('trims valid fields and accepts an HTTPS cover', () => {
    expect(validateNominationFields({
      title: '  White Album 2 ',
      cover: ' https://example.com/cover.jpg ',
      reason: ' classic ',
    }, ' alice ')).toEqual({
      title: 'White Album 2',
      cover: 'https://example.com/cover.jpg',
      reason: 'classic',
      nickname: 'alice',
    })
  })

  test('rejects unsafe cover schemes and oversized input', () => {
    expect(() => validateNominationFields({
      title: 'Game',
      cover: 'javascript:alert(1)',
      reason: 'reason',
    }, 'alice')).toThrow('HTTP')

    expect(() => validateNominationFields({
      title: 'x'.repeat(121),
      reason: 'reason',
    }, 'alice')).toThrow('120')
  })
})
