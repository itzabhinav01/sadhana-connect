import { describe, expect, it } from 'vitest'

import { getBottomTabItemsForRole, getNavItemsForRole } from '@/presentation/navigation/nav-config'

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

describe('getBottomTabItemsForRole', () => {
  it('returns the 5 primary devotee destinations, not including Profile/Settings/Announcements', () => {
    const labels = getBottomTabItemsForRole('devotee')?.map((item) => item.label)
    expect(labels).toEqual(['Home', 'Sadhana', 'History', 'Analytics', 'Alerts'])
  })

  it('points the devotee Alerts tab at /notifications', () => {
    const alerts = getBottomTabItemsForRole('devotee')?.find(
      (item) => item.label === 'Alerts',
    )
    expect(alerts?.href).toBe('/notifications')
  })

  it('returns the mentor destinations', () => {
    const labels = getBottomTabItemsForRole('mentor')?.map((item) => item.label)
    expect(labels).toEqual(['Devotees', 'Announcements'])
  })

  it('returns null for super_admin — it keeps the drawer nav instead', () => {
    expect(getBottomTabItemsForRole('super_admin')).toBeNull()
  })

  it('returns null when there is no role', () => {
    expect(getBottomTabItemsForRole(undefined)).toBeNull()
  })
})
