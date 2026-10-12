const mockToggleStandardSection = jest.fn()
const mockToggleCustomSection = jest.fn()
const mockAddCustomSection = jest.fn()
const mockDeleteCustomSection = jest.fn()
const mockResetToDefault = jest.fn()

let mockConfig = {
  standardSections: {
    chanting: true,
    reading: true,
    hearing: true,
    study: true,
    rest: true,
    schedule: true,
    details: true,
  },
  customSections: [
    {
      id: 'custom-1',
      title: 'Deity Worship',
      description: 'Morning puja and offering',
      fieldType: 'number',
      unit: 'mins',
      enabled: true,
      createdAt: '2026-10-12T00:00:00.000Z',
    },
  ],
}

jest.mock('../../../../../packages/sadhana/src/use-sadhana-sections-config', () => ({
  useSadhanaSectionsConfig: () => ({
    config: mockConfig,
    toggleStandardSection: mockToggleStandardSection,
    toggleCustomSection: mockToggleCustomSection,
    addCustomSection: mockAddCustomSection,
    deleteCustomSection: mockDeleteCustomSection,
    resetToDefault: mockResetToDefault,
  }),
}))


jest.mock('../../application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../shared/theme').lightColors,
  }),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { Alert } from 'react-native'

import { SadhanaSheetSectionsConfigSection } from './SadhanaSheetSectionsConfigSection'

describe('SadhanaSheetSectionsConfigSection', () => {
  afterEach(async () => {
    await cleanup()
    jest.clearAllMocks()
  })

  it('renders all 7 standard sections and does not have delete buttons for them', async () => {
    const { getByText, queryByLabelText } = await render(
      <SadhanaSheetSectionsConfigSection />,
    )

    expect(getByText('Chanting')).toBeTruthy()
    expect(getByText('Reading')).toBeTruthy()
    expect(getByText('Hearing')).toBeTruthy()
    expect(getByText('Study')).toBeTruthy()
    expect(getByText('Rest & Sleep')).toBeTruthy()
    expect(getByText('Office Schedule')).toBeTruthy()
    expect(getByText('Notes & Signature')).toBeTruthy()

    // Standard sections should NEVER have delete buttons
    expect(queryByLabelText('Delete Chanting')).toBeNull()
    expect(queryByLabelText('Delete Office Schedule')).toBeNull()
  })

  it('renders custom sections with delete action', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert')

    const { getByText, getByLabelText } = await render(
      <SadhanaSheetSectionsConfigSection />,
    )

    expect(getByText('Deity Worship')).toBeTruthy()
    const deleteBtn = getByLabelText('Delete Deity Worship')
    expect(deleteBtn).toBeTruthy()

    await fireEvent.press(deleteBtn)
    expect(alertSpy).toHaveBeenCalledWith(
      'Delete Section',
      expect.stringContaining('Deity Worship'),
      expect.any(Array),
    )
  })

  it('toggles standard section visibility when switch is changed', async () => {
    const { getByLabelText } = await render(
      <SadhanaSheetSectionsConfigSection />,
    )

    const scheduleSwitch = getByLabelText('Toggle visibility of Office Schedule')
    await fireEvent(scheduleSwitch, 'valueChange', false)
    expect(mockToggleStandardSection).toHaveBeenCalledWith('schedule', false)
  })
})
