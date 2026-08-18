import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { JapaSadhanaIntegration } from '@/presentation/pages/japa/JapaSadhanaIntegration'
import { getLocalDateIso } from '@/shared/utils/date'

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateMock }
})

function renderIntegration(completedRounds: number) {
  return render(
    <MemoryRouter>
      <JapaSadhanaIntegration completedRounds={completedRounds} />
    </MemoryRouter>,
  )
}

describe('JapaSadhanaIntegration', () => {
  beforeEach(() => {
    navigateMock.mockReset()
  })

  it('renders nothing when zero rounds are completed', () => {
    const { container } = renderIntegration(0)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the action once at least one round is completed', () => {
    renderIntegration(1)
    expect(
      screen.getByRole('button', { name: /use today's completed rounds/i }),
    ).toBeInTheDocument()
  })

  it('navigates to /sadhana with the date and completed rounds, never writing to Supabase directly', async () => {
    const user = userEvent.setup()
    renderIntegration(3)

    await user.click(
      screen.getByRole('button', { name: /use today's completed rounds/i }),
    )

    const today = getLocalDateIso()
    expect(navigateMock).toHaveBeenCalledWith(
      `/sadhana?date=${today}&prefillRounds=3`,
    )
  })
})
