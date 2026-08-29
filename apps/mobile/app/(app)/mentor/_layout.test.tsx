jest.mock('../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../../packages/auth/src/use-profile', () => ({
  useProfile: jest.fn(),
}))

jest.mock('../../../../../packages/notifications/src/use-unread-notification-count', () => ({
  useUnreadNotificationCount: jest.fn(() => ({ data: 0 })),
}))

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native')
    return <Text>redirect:{href}</Text>
  },
  Tabs: Object.assign(
    () => {
      const { Text } = require('react-native')
      return <Text>mentor-tabs</Text>
    },
    { Screen: () => null },
  ),
}))

import { render } from '@testing-library/react-native'
import { useProfile } from '@sadhana-connect/auth'

import MentorLayout from './_layout'

const mockUseProfile = useProfile as jest.Mock

describe('MentorLayout (RequireRole equivalent)', () => {
  beforeEach(() => {
    mockUseProfile.mockReset()
  })

  it('redirects to / when the profile role is not mentor', async () => {
    mockUseProfile.mockReturnValue({ data: { role: 'devotee' } })
    const { getByText } = await render(<MentorLayout />)
    expect(getByText('redirect:/')).toBeTruthy()
  })

  it('renders the mentor tab bar for a mentor profile', async () => {
    mockUseProfile.mockReturnValue({ data: { role: 'mentor' } })
    const { getByText } = await render(<MentorLayout />)
    expect(getByText('mentor-tabs')).toBeTruthy()
  })
})
