jest.mock('../../application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

import { cleanup, fireEvent, render, renderHook } from '@testing-library/react-native'
import { useState } from 'react'
import { Text } from 'react-native'

import { sectionAccents } from '../../shared/theme'
import { Accordion, useSectionAccent } from './Accordion'

function ControlledAccordion({ initialExpanded = false }: { initialExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(initialExpanded)
  return (
    <Accordion
      title="Chanting"
      accent={sectionAccents.light.chanting}
      expanded={expanded}
      onToggle={() => setExpanded((prev) => !prev)}
      summary="16 rounds"
    >
      <Text>Rounds before 4:30 AM</Text>
    </Accordion>
  )
}

describe('Accordion', () => {
  afterEach(async () => {
    await cleanup()
  })

  it('renders its title always, and children only while expanded', async () => {
    const { getByText, queryByText } = await render(<ControlledAccordion />)
    expect(getByText('Chanting')).toBeTruthy()
    expect(queryByText('Rounds before 4:30 AM')).toBeNull()
  })

  it('shows the collapsed summary and hides it once expanded', async () => {
    const { getByText, queryByText, getByRole } = await render(<ControlledAccordion />)
    expect(getByText('16 rounds')).toBeTruthy()
    await fireEvent.press(getByRole('button', { name: 'Chanting, 16 rounds' }))
    expect(queryByText('16 rounds')).toBeNull()
    expect(getByText('Rounds before 4:30 AM')).toBeTruthy()
  })

  it('toggles children visibility when the header is pressed', async () => {
    const { getByText, queryByText, getByRole } = await render(<ControlledAccordion />)
    await fireEvent.press(getByRole('button', { name: 'Chanting, 16 rounds' }))
    expect(getByText('Rounds before 4:30 AM')).toBeTruthy()
    await fireEvent.press(getByRole('button', { name: 'Chanting' }))
    expect(queryByText('Rounds before 4:30 AM')).toBeNull()
  })
})

describe('useSectionAccent', () => {
  afterEach(async () => {
    await cleanup()
  })

  it('resolves the light-mode accent for a named section', async () => {
    const { result } = await renderHook(() => useSectionAccent('reading'))
    expect(result.current).toEqual(sectionAccents.light.reading)
  })
})
