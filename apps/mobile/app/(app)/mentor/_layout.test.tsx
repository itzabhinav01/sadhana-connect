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
    return <Text>mentor-stack</Text>
  },
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

  it('renders the mentor stack for a mentor profile', async () => {
    mockUseProfile.mockReturnValue({ data: { role: 'mentor' } })
    const { getByText } = await render(<MentorLayout />)
    expect(getByText('mentor-stack')).toBeTruthy()
  })
})
