jest.mock('../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../../packages/admin/src/use-admin-temple-groups', () => ({
  useAdminTempleGroups: jest.fn(),
}))

jest.mock('../../../../../packages/admin/src/use-temple-group-mutations', () => ({
  useCreateTempleGroup: jest.fn(),
  useRenameTempleGroup: jest.fn(),
  useDeleteTempleGroup: jest.fn(),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import {
  useAdminTempleGroups,
  useCreateTempleGroup,
  useDeleteTempleGroup,
  useRenameTempleGroup,
} from '@sadhana-connect/admin'

import AdminTempleGroupsScreen from './temple-groups'

const mockUseAdminTempleGroups = useAdminTempleGroups as jest.Mock
const mockUseCreateTempleGroup = useCreateTempleGroup as jest.Mock
const mockUseRenameTempleGroup = useRenameTempleGroup as jest.Mock
const mockUseDeleteTempleGroup = useDeleteTempleGroup as jest.Mock

const group = {
  id: 'g1',
  name: 'Main Temple',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('AdminTempleGroupsScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseAdminTempleGroups.mockReset()
    mockUseCreateTempleGroup.mockReset()
    mockUseRenameTempleGroup.mockReset()
    mockUseDeleteTempleGroup.mockReset()

    mockUseCreateTempleGroup.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: false })
    mockUseRenameTempleGroup.mockReturnValue({ mutate: jest.fn(), isPending: false })
    mockUseDeleteTempleGroup.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: false })
    mockUseAdminTempleGroups.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [] })
  })

  it('rejects an empty group name without calling the mutation', async () => {
    const mockCreate = jest.fn()
    mockUseCreateTempleGroup.mockReturnValue({ mutate: mockCreate, isPending: false, isError: false })

    const { getByRole, getByText } = await render(<AdminTempleGroupsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Create' }))

    expect(mockCreate).not.toHaveBeenCalled()
    expect(getByText('Name is required.')).toBeTruthy()
  })

  it('creates a group with a valid name', async () => {
    const mockCreate = jest.fn()
    mockUseCreateTempleGroup.mockReturnValue({ mutate: mockCreate, isPending: false, isError: false })

    const { getByRole, getByLabelText } = await render(<AdminTempleGroupsScreen />)
    await fireEvent.changeText(getByLabelText('Group name'), 'New Group')
    await fireEvent.press(getByRole('button', { name: 'Create' }))

    expect(mockCreate).toHaveBeenCalledWith('New Group', expect.anything())
  })

  it('shows an empty state when there are no groups', async () => {
    const { getByText } = await render(<AdminTempleGroupsScreen />)
    expect(getByText('No temple groups yet.')).toBeTruthy()
  })

  it('renames a group', async () => {
    const mockRename = jest.fn()
    mockUseRenameTempleGroup.mockReturnValue({ mutate: mockRename, isPending: false })
    mockUseAdminTempleGroups.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [group] })

    const { getByRole, getByLabelText } = await render(<AdminTempleGroupsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Rename' }))
    await fireEvent.changeText(getByLabelText('Edit temple group name'), 'Renamed Temple')
    await fireEvent.press(getByRole('button', { name: 'Save' }))

    expect(mockRename).toHaveBeenCalledWith({ id: 'g1', name: 'Renamed Temple' }, expect.anything())
  })

  it('requires delete confirmation before calling the mutation', async () => {
    const mockDelete = jest.fn()
    mockUseDeleteTempleGroup.mockReturnValue({ mutate: mockDelete, isPending: false, isError: false })
    mockUseAdminTempleGroups.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [group] })

    const { getByRole, getByText } = await render(<AdminTempleGroupsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Delete' }))
    expect(mockDelete).not.toHaveBeenCalled()
    expect(getByText('Delete?')).toBeTruthy()

    await fireEvent.press(getByRole('button', { name: 'Confirm' }))
    expect(mockDelete).toHaveBeenCalledWith('g1')
  })

  it('shows the fixed in-use error message when delete fails', async () => {
    mockUseDeleteTempleGroup.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: true })
    mockUseAdminTempleGroups.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [group] })

    const { getByText } = await render(<AdminTempleGroupsScreen />)
    expect(getByText("This group is still in use and can't be deleted.")).toBeTruthy()
  })
})
