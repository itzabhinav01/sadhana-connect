jest.mock('../../../../../packages/auth/src/use-profile', () => ({
  useProfile: jest.fn(),
}))

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native')
    return <Text>redirect:{href}</Text>
  },
  Stack: () => {
    const { Text } = require('react-native')
    return <Text>admin-stack</Text>
  },
}))

import { render } from '@testing-library/react-native'
import { useProfile } from '@sadhana-connect/auth'

import AdminLayout from './_layout'

const mockUseProfile = useProfile as jest.Mock

describe('AdminLayout (RequireRole equivalent)', () => {
  beforeEach(() => {
    mockUseProfile.mockReset()
  })

  it('redirects to / when the profile role is not super_admin', async () => {
    mockUseProfile.mockReturnValue({ data: { role: 'devotee' } })
    const { getByText } = await render(<AdminLayout />)
    expect(getByText('redirect:/')).toBeTruthy()
  })

  it('renders the admin stack for a super_admin profile', async () => {
    mockUseProfile.mockReturnValue({ data: { role: 'super_admin' } })
    const { getByText } = await render(<AdminLayout />)
    expect(getByText('admin-stack')).toBeTruthy()
  })
})
