import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfilePage } from '@/presentation/pages/ProfilePage'

const { useProfileMock, useUpdatePhoneNumberMock, mutateMock } = vi.hoisted(
  () => ({
    useProfileMock: vi.fn(),
    useUpdatePhoneNumberMock: vi.fn(),
    mutateMock: vi.fn(),
  }),
)

vi.mock('@sadhana-connect/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/auth')>()
  return {
    ...actual,
    useProfile: useProfileMock,
  }
})

vi.mock('@/application/profile/use-update-phone-number', () => ({
  useUpdatePhoneNumber: useUpdatePhoneNumberMock,
}))

const activeProfile = {
  id: 'user-1',
  fullName: 'User One',
  role: 'devotee' as const,
  templeGroupId: null,
  isActive: true,
  phoneNumber: '+919876543210',
}

describe('ProfilePage', () => {
  beforeEach(() => {
    useProfileMock.mockReset()
    useUpdatePhoneNumberMock.mockReset()
    mutateMock.mockReset()
    useUpdatePhoneNumberMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      isError: false,
    })
  })

  it('shows a loading state while the profile is pending', () => {
    useProfileMock.mockReturnValue({ isPending: true, isError: false, data: undefined })

    render(<ProfilePage />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state when the profile fails to load', () => {
    useProfileMock.mockReturnValue({ isPending: false, isError: true, data: undefined })

    render(<ProfilePage />)

    expect(
      screen.getByText(/something went wrong loading your profile/i),
    ).toBeInTheDocument()
  })

  it('shows the existing phone number with an Edit action', () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: activeProfile,
    })

    render(<ProfilePage />)

    expect(screen.getByText('+919876543210')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
  })

  it('shows "Not provided" with an Add action when there is no phone number yet', () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...activeProfile, phoneNumber: null },
    })

    render(<ProfilePage />)

    expect(screen.getByText('Not provided')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
  })

  it('saves a new phone number and returns to the view state on success', async () => {
    mutateMock.mockImplementation((_value, options) => {
      options?.onSuccess?.()
    })
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...activeProfile, phoneNumber: null },
    })

    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /add/i }))
    await user.type(
      screen.getByPlaceholderText('+919876543210'),
      '+919876543210',
    )
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith(
      '+919876543210',
      expect.anything(),
    ))
    // The mocked profile query still returns phoneNumber: null (it isn't
    // refetched), so leaving edit mode falls back to the "Add" action.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument(),
    )
  })

  it('does not submit an invalid phone number', async () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...activeProfile, phoneNumber: null },
    })

    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /add/i }))
    await user.type(screen.getByPlaceholderText('+919876543210'), '12345')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('discards edits when Cancel is clicked', async () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: activeProfile,
    })

    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.clear(screen.getByPlaceholderText('+919876543210'))
    await user.type(screen.getByPlaceholderText('+919876543210'), '+911111111111')
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.getByText('+919876543210')).toBeInTheDocument()
    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('shows an inline error in the edit form when the update failed', async () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: activeProfile,
    })
    useUpdatePhoneNumberMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      isError: true,
    })

    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /edit/i }))

    expect(
      screen.getByText(/something went wrong saving your phone number/i),
    ).toBeInTheDocument()
  })
})
