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

jest.mock('../../../../../packages/notifications/src/use-notifications-realtime', () => ({
  useNotificationsRealtime: jest.fn(),
}))

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native')
    return <Text>redirect:{href}</Text>
  },
  Stack: () => {
    const { Text } = require('react-native')
    return <Text>devotee-stack</Text>
  },
}))

import { render } from '@testing-library/react-native'
import { useProfile } from '@sadhana-connect/auth'

import DevoteeLayout from './_layout'

const mockUseProfile = useProfile as jest.Mock

describe('DevoteeLayout (RequireRole equivalent)', () => {
  beforeEach(() => {
    mockUseProfile.mockReset()
  })

  it('redirects to / when the profile role is not devotee', async () => {
    mockUseProfile.mockReturnValue({ data: { role: 'mentor' } })
    const { getByText } = await render(<DevoteeLayout />)
    expect(getByText('redirect:/')).toBeTruthy()
  })

  it('redirects to / when there is no profile yet', async () => {
    mockUseProfile.mockReturnValue({ data: undefined })
    const { getByText } = await render(<DevoteeLayout />)
    expect(getByText('redirect:/')).toBeTruthy()
  })

  it('renders the devotee stack for a devotee profile', async () => {
    mockUseProfile.mockReturnValue({ data: { role: 'devotee' } })
    const { getByText } = await render(<DevoteeLayout />)
    expect(getByText('devotee-stack')).toBeTruthy()
  })
})
