import { describe, expect, it } from 'vitest'

import { getNavItemsForRole } from '@/presentation/navigation/nav-config'

describe('getNavItemsForRole', () => {
  it('returns the common foundation items plus the devotee Sadhana/History/Analytics/Announcements/Japa/Verse items', () => {
    const labels = getNavItemsForRole('devotee').map((item) => item.label)
    expect(labels).toEqual([
      'Home',
      'Profile',
      'Settings',
      'Sadhana',
      'History',
      'Analytics',
      'Announcements',
      'Japa Counter',
      'Verse of the Day',
    ])
  })

  it('returns the common items plus Mentor Dashboard and Announcements for mentor', () => {
    const mentorLabels = getNavItemsForRole('mentor').map((item) => item.label)
    expect(mentorLabels).toEqual([
      'Home',
      'Profile',
      'Settings',
      'Mentor Dashboard',
      'Announcements',
    ])
  })

  it('returns the common items plus the Phase 14 Super Admin items for super_admin', () => {
    const adminLabels = getNavItemsForRole('super_admin').map(
      (item) => item.label,
    )
    expect(adminLabels).toEqual([
      'Home',
      'Profile',
      'Settings',
      'Admin Dashboard',
      'Users',
      'Mentors',
      'Assignments',
      'Temple Groups',
      'Announcements',
    ])
  })

  it('never shows the mentor/admin Mentor Dashboard nav item to a devotee (the devotee Announcements item links to the /announcements feed, not /mentor/announcements)', () => {
    const labels = getNavItemsForRole('devotee').map((item) => item.label)
    expect(labels).not.toContain('Mentor Dashboard')
    const announcementsHref = getNavItemsForRole('devotee').find(
      (item) => item.label === 'Announcements',
    )?.href
    expect(announcementsHref).toBe('/announcements')
  })

  it('returns no items when there is no role', () => {
    expect(getNavItemsForRole(undefined)).toEqual([])
  })

  it('every item has a unique href', () => {
    const hrefs = getNavItemsForRole('devotee').map((item) => item.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})
