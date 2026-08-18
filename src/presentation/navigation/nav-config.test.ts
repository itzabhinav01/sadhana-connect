import { describe, expect, it } from 'vitest'

import { getNavItemsForRole } from '@/presentation/navigation/nav-config'

describe('getNavItemsForRole', () => {
  it('returns the common foundation items plus the devotee Sadhana/History/Analytics/Japa/Verse items', () => {
    const labels = getNavItemsForRole('devotee').map((item) => item.label)
    expect(labels).toEqual([
      'Home',
      'Profile',
      'Settings',
      'Sadhana',
      'History',
      'Analytics',
      'Japa Counter',
      'Verse of the Day',
    ])
  })

  it('returns the common items plus the Mentor Dashboard item for mentor', () => {
    const mentorLabels = getNavItemsForRole('mentor').map((item) => item.label)
    expect(mentorLabels).toEqual([
      'Home',
      'Profile',
      'Settings',
      'Mentor Dashboard',
    ])
  })

  it('returns only the common items for super_admin (no role-specific items yet)', () => {
    const adminLabels = getNavItemsForRole('super_admin').map(
      (item) => item.label,
    )
    expect(adminLabels).toEqual(['Home', 'Profile', 'Settings'])
  })

  it('never shows Mentor Dashboard to a devotee', () => {
    const labels = getNavItemsForRole('devotee').map((item) => item.label)
    expect(labels).not.toContain('Mentor Dashboard')
  })

  it('returns no items when there is no role', () => {
    expect(getNavItemsForRole(undefined)).toEqual([])
  })

  it('every item has a unique href', () => {
    const hrefs = getNavItemsForRole('devotee').map((item) => item.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})
