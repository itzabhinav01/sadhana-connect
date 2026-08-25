jest.mock('../../../../packages/auth/src/use-sign-up', () => ({
  useSignUp: jest.fn(),
}))

jest.mock('expo-router', () => {
  const { Text } = require('react-native')
  return {
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <Text>
        link:{href}:{children}
      </Text>
    ),
    useRouter: jest.fn(),
  }
})

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { useSignUp } from '@sadhana-connect/auth'
import { useRouter } from 'expo-router'

import RegisterScreen from './register'

const mockUseSignUp = useSignUp as jest.Mock
const mockUseRouter = useRouter as jest.Mock

type GetByLabelText = Awaited<ReturnType<typeof render>>['getByLabelText']

async function fillForm(getByLabelText: GetByLabelText, phoneNumber: string) {
  await fireEvent.changeText(getByLabelText('Full name'), 'Test Devotee')
  await fireEvent.changeText(getByLabelText('Email'), 'devotee@example.com')
  await fireEvent.changeText(getByLabelText('Phone number'), phoneNumber)
  await fireEvent.changeText(getByLabelText('Password'), 'password123')
  await fireEvent.changeText(getByLabelText('Confirm password'), 'password123')
}

describe('RegisterScreen', () => {
  let mockReplace: jest.Mock

  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseSignUp.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: false })
    mockReplace = jest.fn()
    mockUseRouter.mockReturnValue({ replace: mockReplace })
  })

  it('navigates home when signUp succeeds with a session', async () => {
    const mutate = jest.fn((_values, { onSuccess }: { onSuccess: (r: { session: unknown }) => void }) => {
      onSuccess({ session: { userId: 'u1', email: 'devotee@example.com', emailConfirmedAt: null } })
    })
    mockUseSignUp.mockReturnValue({ mutate, isPending: false, isError: false })

    const { getByLabelText, getByRole } = await render(<RegisterScreen />)
    await fillForm(getByLabelText, '+919876543210')
    await fireEvent.press(getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'))
  })

  it('shows an inline message and does not navigate when signUp succeeds without a session', async () => {
    const mutate = jest.fn((_values, { onSuccess }: { onSuccess: (r: { session: unknown }) => void }) => {
      onSuccess({ session: null })
    })
    mockUseSignUp.mockReturnValue({ mutate, isPending: false, isError: false })

    const { getByLabelText, getByRole, findByText } = await render(<RegisterScreen />)
    await fillForm(getByLabelText, '+919876543210')
    await fireEvent.press(getByRole('button', { name: 'Create account' }))

    await findByText(/couldn't complete your registration/i)
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('does not submit when the phone number is missing the country code', async () => {
    const mutate = jest.fn()
    mockUseSignUp.mockReturnValue({ mutate, isPending: false, isError: false })

    const { getByLabelText, getByRole, findByText } = await render(<RegisterScreen />)
    await fillForm(getByLabelText, '9876543210')
    await fireEvent.press(getByRole('button', { name: 'Create account' }))

    await findByText(/enter a valid phone number/i)
    expect(mutate).not.toHaveBeenCalled()
  })
})
