import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SADHANA_SECTIONS_CONFIG,
  STANDARD_SECTIONS,
  getSadhanaSectionsConfigAsync,
  getSadhanaSectionsConfigSync,
  parseSadhanaSectionsConfig,
  saveSadhanaSectionsConfig,
  setSadhanaSectionsStorageAdapter,
  type SadhanaSectionsConfig,
  type SadhanaSectionsStorageAdapter,
} from './sadhana-sections-config'

describe('sadhana-sections-config', () => {
  let mockStorage: Map<string, string>
  let mockAdapter: SadhanaSectionsStorageAdapter

  beforeEach(() => {
    mockStorage = new Map()
    mockAdapter = {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mockStorage.set(key, value)
      },
    }
    setSadhanaSectionsStorageAdapter(mockAdapter)
  })

  it('provides all 7 standard sections enabled by default', () => {
    expect(STANDARD_SECTIONS.length).toBe(7)
    const keys = STANDARD_SECTIONS.map((s) => s.key)
    expect(keys).toEqual([
      'chanting',
      'reading',
      'hearing',
      'study',
      'rest',
      'schedule',
      'details',
    ])

    for (const key of keys) {
      expect(DEFAULT_SADHANA_SECTIONS_CONFIG.standardSections[key]).toBe(true)
    }
    expect(DEFAULT_SADHANA_SECTIONS_CONFIG.customSections).toEqual([])
  })

  it('safely parses null or corrupted json', () => {
    expect(parseSadhanaSectionsConfig(null)).toEqual(DEFAULT_SADHANA_SECTIONS_CONFIG)
    expect(parseSadhanaSectionsConfig('not-json')).toEqual(DEFAULT_SADHANA_SECTIONS_CONFIG)
    expect(parseSadhanaSectionsConfig('{}')).toEqual(DEFAULT_SADHANA_SECTIONS_CONFIG)
  })

  it('preserves standard section defaults when only some are specified in json', () => {
    const raw = JSON.stringify({
      standardSections: {
        schedule: false, // Devotee (e.g. student) hid Office Schedule
      },
      customSections: [
        {
          id: 'c1',
          title: 'Deity Worship',
          fieldType: 'number',
          unit: 'mins',
          enabled: true,
        },
      ],
    })

    const parsed = parseSadhanaSectionsConfig(raw)
    // schedule is false
    expect(parsed.standardSections.schedule).toBe(false)
    // other standard sections default to true
    expect(parsed.standardSections.chanting).toBe(true)
    expect(parsed.standardSections.reading).toBe(true)
    expect(parsed.standardSections.rest).toBe(true)
    // custom section is kept
    expect(parsed.customSections.length).toBe(1)
    expect(parsed.customSections[0].title).toBe('Deity Worship')
  })

  it('saves and retrieves config via storage adapter', async () => {
    const profileId = 'test-profile-1'
    const customConfig: SadhanaSectionsConfig = {
      standardSections: {
        ...DEFAULT_SADHANA_SECTIONS_CONFIG.standardSections,
        schedule: false,
      },
      customSections: [
        {
          id: 'custom-seva',
          title: 'Temple Seva',
          fieldType: 'decimal',
          unit: 'hrs',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ],
    }

    saveSadhanaSectionsConfig(profileId, customConfig)

    // Check synchronous retrieval
    const syncResult = getSadhanaSectionsConfigSync(profileId)
    expect(syncResult.standardSections.schedule).toBe(false)
    expect(syncResult.customSections[0].title).toBe('Temple Seva')

    // Check asynchronous retrieval
    const asyncResult = await getSadhanaSectionsConfigAsync(profileId)
    expect(asyncResult.standardSections.schedule).toBe(false)
    expect(asyncResult.customSections[0].id).toBe('custom-seva')
  })
})
