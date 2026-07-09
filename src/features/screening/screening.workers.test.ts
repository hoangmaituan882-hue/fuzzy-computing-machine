import { beforeEach, describe, expect, test } from 'vitest'
import { env } from 'cloudflare:test'
import { createDb } from '@/db/client'
import {
  canSwitchScreeningParticipantGroup,
  ensureScreeningParticipant,
  listNominations,
  submitNomination,
  voteForNomination,
} from './screening.server'

async function resetScreeningSchema() {
  await env.DB.exec('DROP TABLE IF EXISTS votes')
  await env.DB.exec('DROP TABLE IF EXISTS nominations')
  await env.DB.exec('DROP TABLE IF EXISTS screening_participants')
  await env.DB.exec(
    'CREATE TABLE screening_participants (id TEXT PRIMARY KEY NOT NULL, group_id TEXT NOT NULL, created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL)',
  )
  await env.DB.exec(
    'CREATE TABLE nominations (id TEXT PRIMARY KEY NOT NULL, screening_id TEXT, title TEXT NOT NULL, normalized_title TEXT NOT NULL, cover TEXT, type TEXT DEFAULT \'anime\' NOT NULL, nominated_by_id TEXT NOT NULL, nominated_by_name TEXT NOT NULL, reason TEXT NOT NULL, status TEXT DEFAULT \'pending\' NOT NULL, created_at INTEGER NOT NULL)',
  )
  await env.DB.exec('CREATE UNIQUE INDEX nominations_normalized_title_unique ON nominations (normalized_title)')
  await env.DB.exec('CREATE UNIQUE INDEX nominations_nominated_by_id_unique ON nominations (nominated_by_id)')
  await env.DB.exec('CREATE INDEX nominations_type_idx ON nominations (type)')
  await env.DB.exec(
    'CREATE TABLE votes (id TEXT PRIMARY KEY NOT NULL, nomination_id TEXT NOT NULL, user_id TEXT NOT NULL, created_at INTEGER NOT NULL)',
  )
  await env.DB.exec('CREATE UNIQUE INDEX votes_user_id_unique ON votes (user_id)')
  await env.DB.exec('CREATE INDEX votes_nomination_id_idx ON votes (nomination_id)')
}

beforeEach(resetScreeningSchema)

describe('screening anonymous participant rules', () => {
  test('allows switching group before any nomination or vote', async () => {
    const db = createDb(env.DB)
    const first = await ensureScreeningParticipant(db, 'group1')
    const second = await ensureScreeningParticipant(db, 'group3', first.id)

    expect(second.id).toBe(first.id)
    expect(second.groupId).toBe('group3')
    await expect(canSwitchScreeningParticipantGroup(db, first.id)).resolves.toBe(true)
  })

  test('blocks switching group after nomination or vote', async () => {
    const db = createDb(env.DB)
    const nominator = await ensureScreeningParticipant(db, 'group1')
    await submitNomination(db, {
      title: 'White Album 2',
      reason: 'classic winter heartbreak',
    }, nominator, 'alice')

    await expect(ensureScreeningParticipant(db, 'group2', nominator.id)).rejects.toThrow('不能切换')
    await expect(canSwitchScreeningParticipantGroup(db, nominator.id)).resolves.toBe(false)

    const voter = await ensureScreeningParticipant(db, 'group1')
    await voteForNomination(db, (await listNominations(db))[0].id, voter)
    await expect(ensureScreeningParticipant(db, 'group2', voter.id)).rejects.toThrow('不能切换')
    await expect(canSwitchScreeningParticipantGroup(db, voter.id)).resolves.toBe(false)
  })

  test('lists all groups but only lets a participant vote in their own group', async () => {
    const db = createDb(env.DB)
    const group1 = await ensureScreeningParticipant(db, 'group1')
    const group2 = await ensureScreeningParticipant(db, 'group2')

    const group1Nomination = await submitNomination(db, {
      title: 'White Album 2',
      reason: 'classic winter heartbreak',
    }, group1, 'alice')
    const group2Nomination = await submitNomination(db, {
      title: 'Summer Pockets',
      reason: 'summer island feeling',
    }, group2, 'bob')

    const allNominations = await listNominations(db, group1.id)
    expect(allNominations.map((nomination) => nomination.id).sort()).toEqual(
      [group1Nomination, group2Nomination].sort(),
    )

    await expect(voteForNomination(db, group2Nomination, group1)).rejects.toThrow('自己所在群')
    await expect(voteForNomination(db, group1Nomination, group1)).resolves.toBe(true)

    const afterVote = await listNominations(db, group1.id)
    expect(afterVote.find((nomination) => nomination.id === group1Nomination)?.hasVoted).toBe(true)
    expect(afterVote.find((nomination) => nomination.id === group2Nomination)?.hasVoted).toBe(false)
  })

  test('blocks duplicate galgame nominations through the database unique index', async () => {
    const db = createDb(env.DB)
    const first = await ensureScreeningParticipant(db, 'group1')
    const second = await ensureScreeningParticipant(db, 'group2')

    await submitNomination(db, {
      title: '  White Album 2 ',
      reason: 'first',
    }, first, 'alice')

    await expect(submitNomination(db, {
      title: 'whitealbum2',
      reason: 'duplicate normalized title',
    }, second, 'bob')).rejects.toThrow('已经有人提名')
  })

  test('blocks a second nomination by the same participant', async () => {
    const db = createDb(env.DB)
    const participant = await ensureScreeningParticipant(db, 'group1')

    await submitNomination(db, {
      title: 'Game A',
      reason: 'first pick',
    }, participant, 'alice')

    await expect(submitNomination(db, {
      title: 'Game B',
      reason: 'second pick',
    }, participant, 'alice')).rejects.toThrow('已经提名')
  })

  test('blocks a second vote by the same participant', async () => {
    const db = createDb(env.DB)
    const voter = await ensureScreeningParticipant(db, 'group1')
    const nominatorA = await ensureScreeningParticipant(db, 'group1')
    const nominatorB = await ensureScreeningParticipant(db, 'group1')
    const firstNomination = await submitNomination(db, {
      title: 'Game A',
      reason: 'first pick',
    }, nominatorA, 'alice')
    const secondNomination = await submitNomination(db, {
      title: 'Game B',
      reason: 'second pick',
    }, nominatorB, 'bob')

    await expect(voteForNomination(db, firstNomination, voter)).resolves.toBe(true)
    await expect(voteForNomination(db, secondNomination, voter)).rejects.toThrow('已经投票')
  })
})
