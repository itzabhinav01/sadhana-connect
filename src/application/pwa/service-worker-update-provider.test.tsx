import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { registerSWMock } = vi.hoisted(() => ({
  registerSWMock: vi.fn(),
}))

vi.mock('virtual:pwa-register', () => ({
  registerSW: registerSWMock,
}))

import { ServiceWorkerUpdateProvider } from '@/application/pwa/service-worker-update-provider'
import { useServiceWorkerUpdate } from '@/application/pwa/use-service-worker-update'

function Probe() {
  const { needRefresh, refresh, dismiss } = useServiceWorkerUpdate()
  return (
    <div>
      <span>needRefresh:{String(needRefresh)}</span>
      <button onClick={refresh}>refresh</button>
      <button onClick={dismiss}>dismiss</button>
    </div>
  )
}

describe('ServiceWorkerUpdateProvider', () => {
  const updateFnMock = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    registerSWMock.mockReset()
    updateFnMock.mockClear()
    registerSWMock.mockReturnValue(updateFnMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('useServiceWorkerUpdate throws outside a provider', () => {
    expect(() => render(<Probe />)).toThrow(
      'useServiceWorkerUpdate must be used within a ServiceWorkerUpdateProvider',
    )
  })

  it('does not register a service worker outside of production', () => {
    vi.stubEnv('PROD', false)

    render(
      <ServiceWorkerUpdateProvider>
        <Probe />
      </ServiceWorkerUpdateProvider>,
    )

    expect(registerSWMock).not.toHaveBeenCalled()
  })

  it('registers the service worker in production, starting with needRefresh false', () => {
    vi.stubEnv('PROD', true)

    render(
      <ServiceWorkerUpdateProvider>
        <Probe />
      </ServiceWorkerUpdateProvider>,
    )

    expect(registerSWMock).toHaveBeenCalledWith(
      expect.objectContaining({ onNeedRefresh: expect.any(Function) }),
    )
    expect(screen.getByText('needRefresh:false')).toBeInTheDocument()
  })

  it('flips needRefresh to true when the worker reports onNeedRefresh', () => {
    vi.stubEnv('PROD', true)
    render(
      <ServiceWorkerUpdateProvider>
        <Probe />
      </ServiceWorkerUpdateProvider>,
    )

    const onNeedRefresh = registerSWMock.mock.calls[0][0].onNeedRefresh as () => void
    act(() => {
      onNeedRefresh()
    })

    expect(screen.getByText('needRefresh:true')).toBeInTheDocument()
  })

  it('refresh() calls the update function with reloadPage: true', async () => {
    vi.stubEnv('PROD', true)
    const user = userEvent.setup()
    render(
      <ServiceWorkerUpdateProvider>
        <Probe />
      </ServiceWorkerUpdateProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'refresh' }))

    expect(updateFnMock).toHaveBeenCalledWith(true)
  })

  it('dismiss() clears needRefresh without calling the update function', async () => {
    vi.stubEnv('PROD', true)
    const user = userEvent.setup()
    render(
      <ServiceWorkerUpdateProvider>
        <Probe />
      </ServiceWorkerUpdateProvider>,
    )
    const onNeedRefresh = registerSWMock.mock.calls[0][0].onNeedRefresh as () => void
    act(() => {
      onNeedRefresh()
    })
    expect(screen.getByText('needRefresh:true')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'dismiss' }))

    expect(screen.getByText('needRefresh:false')).toBeInTheDocument()
    expect(updateFnMock).not.toHaveBeenCalled()
  })

  it('shares a single registration across multiple consumers', () => {
    vi.stubEnv('PROD', true)

    render(
      <ServiceWorkerUpdateProvider>
        <Probe />
        <Probe />
      </ServiceWorkerUpdateProvider>,
    )

    expect(registerSWMock).toHaveBeenCalledTimes(1)
  })
})
