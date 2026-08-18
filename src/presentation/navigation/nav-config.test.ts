import { describe, expect, it } from 'vitest'

import { getNavItemsForRole } from '@/presentation/navigation/nav-config'

describe('getNavItemsForRole', () => {
  it('returns the common foundation items plus the devotee Sadhana/History/Analytics/Japa items', () => {
    const labels = getNavItemsForRole('devotee').map((item) => item.label)
    expect(labels).toEqual([
      'Home',
      'Profile',
      'Settings',
      'Sadhana',
      'History',
      'Analytics',
      'Japa Counter',
    ])
  })

  it('returns the same common items for mentor and super_admin', () => {
    const mentorLabels = getNavItemsForRole('mentor').map((item) => item.label)
    const adminLabels = getNavItemsForRole('super_admin').map(
      (item) => item.label,
    )
    expect(mentorLabels).toEqual(['Home', 'Profile', 'Settings'])
    expect(adminLabels).toEqual(['Home', 'Profile', 'Settings'])
  })

  it('returns no items when there is no role', () => {
    expect(getNavItemsForRole(undefined)).toEqual([])
  })

  it('every item has a unique href', () => {
    const hrefs = getNavItemsForRole('devotee').map((item) => item.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})
