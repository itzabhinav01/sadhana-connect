import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { pwaManifest } from '@/shared/config/pwa-manifest'

function pngDimensions(path: string): { width: number; height: number } {
  const buffer = readFileSync(path)
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

describe('pwaManifest', () => {
  it('has the required identity and display fields', () => {
    expect(pwaManifest.name).toBe('Sadhana Connect')
    expect(pwaManifest.short_name).toBe('Sadhana Connect')
    expect(pwaManifest.start_url).toBe('/')
    expect(pwaManifest.scope).toBe('/')
    expect(pwaManifest.display).toBe('standalone')
  })

  it('uses the existing brand purple for theme_color and a light background_color', () => {
    expect(pwaManifest.theme_color).toBe('#7e14ff')
    expect(pwaManifest.background_color).toBe('#ffffff')
  })

  it('declares 192, 512, and maskable-512 icons', () => {
    const icons = pwaManifest.icons ?? []
    expect(icons).toContainEqual(
      expect.objectContaining({ src: '/icons/icon-192.png', sizes: '192x192' }),
    )
    expect(icons).toContainEqual(
      expect.objectContaining({ src: '/icons/icon-512.png', sizes: '512x512' }),
    )
    expect(icons).toContainEqual(
      expect.objectContaining({
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        purpose: 'maskable',
      }),
    )
  })

  it('every declared icon file exists in public/ at its declared pixel size', () => {
    const icons = pwaManifest.icons ?? []
    for (const icon of icons) {
      const path = resolve(import.meta.dirname, '../../../public', icon.src.replace(/^\//, ''))
      const [expectedWidth, expectedHeight] = icon.sizes!.split('x').map(Number)
      const { width, height } = pngDimensions(path)
      expect(width).toBe(expectedWidth)
      expect(height).toBe(expectedHeight)
    }
  })
})
