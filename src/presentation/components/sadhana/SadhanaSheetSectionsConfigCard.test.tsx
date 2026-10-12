import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SadhanaSheetSectionsConfigCard } from './SadhanaSheetSectionsConfigCard'

const mockToggleStandardSection = vi.fn()
const mockToggleCustomSection = vi.fn()
const mockAddCustomSection = vi.fn()
const mockDeleteCustomSection = vi.fn()
const mockResetToDefault = vi.fn()

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
      fieldType: 'number' as const,
      unit: 'mins',
      enabled: true,
      createdAt: '2026-10-12T00:00:00.000Z',
    },
  ],
}

vi.mock('@sadhana-connect/sadhana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/sadhana')>()
  return {
    ...actual,
    useSadhanaSectionsConfig: () => ({
      config: mockConfig,
      toggleStandardSection: mockToggleStandardSection,
      toggleCustomSection: mockToggleCustomSection,
      addCustomSection: mockAddCustomSection,
      deleteCustomSection: mockDeleteCustomSection,
      resetToDefault: mockResetToDefault,
    }),
  }
})

describe('SadhanaSheetSectionsConfigCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all 7 standard sections and does not offer a delete button for standard sections', () => {
    render(<SadhanaSheetSectionsConfigCard />)

    expect(screen.getByText('Chanting')).toBeInTheDocument()
    expect(screen.getByText('Reading')).toBeInTheDocument()
    expect(screen.getByText('Hearing')).toBeInTheDocument()
    expect(screen.getByText('Study')).toBeInTheDocument()
    expect(screen.getByText('Rest & Sleep')).toBeInTheDocument()
    expect(screen.getByText('Office Schedule')).toBeInTheDocument()
    expect(screen.getByText('Notes & Signature')).toBeInTheDocument()

    // No delete action for standard sections
    expect(screen.queryByLabelText('Delete Chanting')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Delete Office Schedule')).not.toBeInTheDocument()
  })

  it('renders custom sections with delete action and calls delete on confirmation', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<SadhanaSheetSectionsConfigCard />)

    expect(screen.getByText('Deity Worship')).toBeInTheDocument()
    const deleteBtn = screen.getByLabelText('Delete Deity Worship')
    expect(deleteBtn).toBeInTheDocument()

    await user.click(deleteBtn)
    expect(mockDeleteCustomSection).toHaveBeenCalledWith('custom-1')
  })

  it('toggles standard section visibility when button clicked', async () => {
    const user = userEvent.setup()
    render(<SadhanaSheetSectionsConfigCard />)

    const scheduleBtn = screen.getByLabelText('Toggle visibility of Office Schedule')
    await user.click(scheduleBtn)

    expect(mockToggleStandardSection).toHaveBeenCalledWith('schedule', false)
  })
})
