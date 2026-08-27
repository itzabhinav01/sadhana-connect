import { describe, expect, it } from 'vitest'

import { adminQueryKeys } from './admin-query-keys'

// Every key must be scoped by the viewing admin's own userId — this is the
// mechanism that prevents one admin's cached list/detail/count data from
// leaking into another admin's session after a logout/login switch (the
// same reasoning already relied on for profileQueryKeys/mentorQueryKeys).
describe('adminQueryKeys', () => {
  it('produces different users() keys for different admins with identical filters', () => {
    const keyA = adminQueryKeys.users('admin-a', { role: 'mentor' })
    const keyB = adminQueryKeys.users('admin-b', { role: 'mentor' })
    expect(keyA).not.toEqual(keyB)
  })

  it('produces different userDetail() keys for different admins viewing the same target', () => {
    const keyA = adminQueryKeys.userDetail('admin-a', 'target-1')
    const keyB = adminQueryKeys.userDetail('admin-b', 'target-1')
    expect(keyA).not.toEqual(keyB)
  })

  it('produces different assignments() keys for different admins with identical filters', () => {
    const keyA = adminQueryKeys.assignments('admin-a', { mentorId: 'm1' })
    const keyB = adminQueryKeys.assignments('admin-b', { mentorId: 'm1' })
    expect(keyA).not.toEqual(keyB)
  })

  it('produces different mentorDevoteeCounts() keys for different admins', () => {
    const keyA = adminQueryKeys.mentorDevoteeCounts('admin-a')
    const keyB = adminQueryKeys.mentorDevoteeCounts('admin-b')
    expect(keyA).not.toEqual(keyB)
  })

  it('produces different templeGroups() keys for different admins', () => {
    const keyA = adminQueryKeys.templeGroups('admin-a')
    const keyB = adminQueryKeys.templeGroups('admin-b')
    expect(keyA).not.toEqual(keyB)
  })

  it('produces different dashboardSummary() keys for different admins', () => {
    const keyA = adminQueryKeys.dashboardSummary('admin-a')
    const keyB = adminQueryKeys.dashboardSummary('admin-b')
    expect(keyA).not.toEqual(keyB)
  })

  it('every list/detail key starts with the shared "admin" prefix used by logout cleanup', () => {
    expect(adminQueryKeys.all).toEqual(['admin'])
    expect(adminQueryKeys.users('a', {})[0]).toBe('admin')
    expect(adminQueryKeys.userDetail('a', 't')[0]).toBe('admin')
  })
})
