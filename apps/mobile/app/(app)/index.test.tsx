jest.mock('../../../../packages/auth/src/use-profile', () => ({
  useProfile: jest.fn(),
}))

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native')
    return <Text>redirect:{href}</Text>
  },
}))

import { render } from '@testing-library/react-native'
import { useProfile } from '@sadhana-connect/auth'

import AppIndex from './index'

const mockUseProfile = useProfile as jest.Mock

describe('AppIndex (role router)', () => {
  beforeEach(() => {
    mockUseProfile.mockReset()
  })

  it('redirects to /devotee for a devotee profile', async () => {
    mockUseProfile.mockReturnValue({ data: { role: 'devotee' } })
    const { getByText } = await render(<AppIndex />)
    expect(getByText('redirect:/devotee')).toBeTruthy()
  })

  it('redirects to /mentor for a mentor profile', async () => {
    mockUseProfile.mockReturnValue({ data: { role: 'mentor' } })
    const { getByText } = await render(<AppIndex />)
    expect(getByText('redirect:/mentor')).toBeTruthy()
  })

  it('redirects to /admin for a super_admin profile', async () => {
    mockUseProfile.mockReturnValue({ data: { role: 'super_admin' } })
    const { getByText } = await render(<AppIndex />)
    expect(getByText('redirect:/admin')).toBeTruthy()
  })

  it('shows a loading state when the profile is not yet available', async () => {
    mockUseProfile.mockReturnValue({ data: undefined })
    const { queryByText } = await render(<AppIndex />)
    expect(queryByText(/redirect:/)).toBeNull()
  })
})
