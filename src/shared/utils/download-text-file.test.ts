import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadTextFile } from '@/shared/utils/download-text-file'

describe('downloadTextFile', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:mock-url')
    revokeObjectURLSpy = vi.fn()
    URL.createObjectURL = createObjectURLSpy as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = revokeObjectURLSpy as unknown as typeof URL.revokeObjectURL
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    clickSpy.mockRestore()
  })

  it('creates a text Blob and clicks a download link with the exact filename', () => {
    let clickedHref: string | undefined
    let clickedDownload: string | undefined
    clickSpy.mockImplementation(function (this: HTMLAnchorElement) {
      clickedHref = this.href
      clickedDownload = this.download
    })

    downloadTextFile('Sadhana-2026-08-19.txt', 'hello world')

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    const [blobArg] = createObjectURLSpy.mock.calls[0]
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg.type).toContain('text/plain')

    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(clickedHref).toBe('blob:mock-url')
    expect(clickedDownload).toBe('Sadhana-2026-08-19.txt')
  })

  it('revokes the object URL after triggering the download', () => {
    downloadTextFile('Sadhana-2026-08-19.txt', 'hello world')

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
  })

  it('does not leave the temporary anchor in the DOM', () => {
    downloadTextFile('Sadhana-2026-08-19.txt', 'hello world')

    expect(document.querySelector('a[download]')).toBeNull()
  })
})
