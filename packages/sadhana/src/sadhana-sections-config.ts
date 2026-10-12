export type StandardSectionKey =
  | 'chanting'
  | 'reading'
  | 'hearing'
  | 'study'
  | 'rest'
  | 'schedule'
  | 'details'

export interface StandardSectionMeta {
  key: StandardSectionKey
  title: string
  description: string
  defaultEnabled: boolean
}

export const STANDARD_SECTIONS: readonly StandardSectionMeta[] = [
  {
    key: 'chanting',
    title: 'Chanting',
    description: 'Japa rounds, morning checkpoints, and completion time',
    defaultEnabled: true,
  },
  {
    key: 'reading',
    title: 'Reading',
    description: 'Srila Prabhupada book reading minutes and title',
    defaultEnabled: true,
  },
  {
    key: 'hearing',
    title: 'Hearing',
    description: 'Lecture/katha hearing minutes and speaker',
    defaultEnabled: true,
  },
  {
    key: 'study',
    title: 'Study',
    description: 'Academic, sastric, or professional study hours',
    defaultEnabled: true,
  },
  {
    key: 'rest',
    title: 'Rest & Sleep',
    description: 'Bedtime, wake-up time, day rest, and total sleep',
    defaultEnabled: true,
  },
  {
    key: 'schedule',
    title: 'Office Schedule',
    description: 'Office or work arrival and departure times',
    defaultEnabled: true,
  },
  {
    key: 'details',
    title: 'Notes & Signature',
    description: 'Personal reflections, questions, and devotee signature',
    defaultEnabled: true,
  },
] as const

export type CustomSectionFieldType = 'number' | 'decimal' | 'text' | 'time' | 'boolean'

export interface CustomSadhanaSection {
  id: string
  title: string
  description?: string
  fieldType: CustomSectionFieldType
  unit?: string
  enabled: boolean
  createdAt: string
}

export interface SadhanaSectionsConfig {
  standardSections: Record<StandardSectionKey, boolean>
  customSections: CustomSadhanaSection[]
}

export const DEFAULT_SADHANA_SECTIONS_CONFIG: SadhanaSectionsConfig = {
  standardSections: {
    chanting: true,
    reading: true,
    hearing: true,
    study: true,
    rest: true,
    schedule: true,
    details: true,
  },
  customSections: [],
}

export interface SadhanaSectionsStorageAdapter {
  getItem: (key: string) => Promise<string | null> | string | null
  setItem: (key: string, value: string) => Promise<void> | void
}

const STORAGE_KEY_PREFIX = 'sadhana-connect:sadhana-sections-config:'

// Memory cache: profileId -> SadhanaSectionsConfig
const memoryCache = new Map<string, SadhanaSectionsConfig>()

let customAdapter: SadhanaSectionsStorageAdapter | null = null

export function setSadhanaSectionsStorageAdapter(
  adapter: SadhanaSectionsStorageAdapter | null,
): void {
  customAdapter = adapter
}

function getStorageKey(profileId: string): string {
  return `${STORAGE_KEY_PREFIX}${profileId}`
}

function getEffectiveAdapter(): SadhanaSectionsStorageAdapter | null {
  if (customAdapter) return customAdapter
  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      getItem: (key: string) => {
        try {
          return window.localStorage.getItem(key)
        } catch {
          return null
        }
      },
      setItem: (key: string, value: string) => {
        try {
          window.localStorage.setItem(key, value)
        } catch {
          // Ignore quota errors
        }
      },
    }
  }
  return null
}

export function parseSadhanaSectionsConfig(raw: string | null): SadhanaSectionsConfig {
  if (!raw) return { ...DEFAULT_SADHANA_SECTIONS_CONFIG }
  try {
    const parsed = JSON.parse(raw) as Partial<SadhanaSectionsConfig>
    const standard = { ...DEFAULT_SADHANA_SECTIONS_CONFIG.standardSections }
    if (parsed.standardSections && typeof parsed.standardSections === 'object') {
      for (const section of STANDARD_SECTIONS) {
        if (typeof parsed.standardSections[section.key] === 'boolean') {
          standard[section.key] = parsed.standardSections[section.key]
        }
      }
    }

    const custom: CustomSadhanaSection[] = []
    if (Array.isArray(parsed.customSections)) {
      for (const item of parsed.customSections) {
        if (item && typeof item.id === 'string' && typeof item.title === 'string') {
          custom.push({
            id: item.id,
            title: item.title,
            description: item.description,
            fieldType: item.fieldType ?? 'number',
            unit: item.unit,
            enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
            createdAt: item.createdAt ?? new Date().toISOString(),
          })
        }
      }
    }

    return {
      standardSections: standard,
      customSections: custom,
    }
  } catch {
    return { ...DEFAULT_SADHANA_SECTIONS_CONFIG }
  }
}

export function getSadhanaSectionsConfigSync(profileId: string = 'default'): SadhanaSectionsConfig {
  const cached = memoryCache.get(profileId)
  if (cached) return cached

  const adapter = getEffectiveAdapter()
  if (adapter) {
    try {
      const raw = adapter.getItem(getStorageKey(profileId))
      if (typeof raw === 'string') {
        const config = parseSadhanaSectionsConfig(raw)
        memoryCache.set(profileId, config)
        return config
      }
    } catch {
      // Ignore
    }
  }

  const fresh = { ...DEFAULT_SADHANA_SECTIONS_CONFIG }
  memoryCache.set(profileId, fresh)
  return fresh
}

export async function getSadhanaSectionsConfigAsync(
  profileId: string = 'default',
): Promise<SadhanaSectionsConfig> {
  const cached = memoryCache.get(profileId)
  if (cached) return cached

  const adapter = getEffectiveAdapter()
  if (adapter) {
    try {
      const raw = await adapter.getItem(getStorageKey(profileId))
      if (typeof raw === 'string') {
        const config = parseSadhanaSectionsConfig(raw)
        memoryCache.set(profileId, config)
        return config
      }
    } catch {
      // Ignore
    }
  }

  return getSadhanaSectionsConfigSync(profileId)
}

export function saveSadhanaSectionsConfig(
  profileId: string = 'default',
  config: SadhanaSectionsConfig,
): void {
  memoryCache.set(profileId, config)

  const adapter = getEffectiveAdapter()
  if (adapter) {
    try {
      void Promise.resolve(
        adapter.setItem(getStorageKey(profileId), JSON.stringify(config)),
      ).catch((err) => console.warn('Could not save sadhana sections config:', err))
    } catch (err) {
      console.warn('Could not serialize sadhana sections config:', err)
    }
  }
}

const VALUES_STORAGE_KEY_PREFIX = 'sadhana-connect:custom-section-values:'

function getValuesStorageKey(profileId: string, date: string): string {
  return `${VALUES_STORAGE_KEY_PREFIX}${profileId}:${date}`
}

const memoryValuesCache = new Map<string, Record<string, any>>()

export function getCustomSectionValuesSync(
  profileId: string = 'default',
  date: string,
): Record<string, any> {
  const cacheKey = `${profileId}:${date}`
  const cached = memoryValuesCache.get(cacheKey)
  if (cached) return cached

  const adapter = getEffectiveAdapter()
  if (adapter) {
    try {
      const raw = adapter.getItem(getValuesStorageKey(profileId, date))
      if (typeof raw === 'string') {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          memoryValuesCache.set(cacheKey, parsed)
          return parsed
        }
      }
    } catch {
      // Ignore
    }
  }

  const empty = {}
  memoryValuesCache.set(cacheKey, empty)
  return empty
}

export async function getCustomSectionValuesAsync(
  profileId: string = 'default',
  date: string,
): Promise<Record<string, any>> {
  const cacheKey = `${profileId}:${date}`
  const cached = memoryValuesCache.get(cacheKey)
  if (cached) return cached

  const adapter = getEffectiveAdapter()
  if (adapter) {
    try {
      const raw = await adapter.getItem(getValuesStorageKey(profileId, date))
      if (typeof raw === 'string') {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          memoryValuesCache.set(cacheKey, parsed)
          return parsed
        }
      }
    } catch {
      // Ignore
    }
  }

  return getCustomSectionValuesSync(profileId, date)
}

export function saveCustomSectionValues(
  profileId: string = 'default',
  date: string,
  values: Record<string, any>,
): void {
  const cacheKey = `${profileId}:${date}`
  memoryValuesCache.set(cacheKey, values)

  const adapter = getEffectiveAdapter()
  if (adapter) {
    try {
      void Promise.resolve(
        adapter.setItem(getValuesStorageKey(profileId, date), JSON.stringify(values)),
      ).catch((err) => console.warn('Could not save custom section values:', err))
    } catch (err) {
      console.warn('Could not serialize custom section values:', err)
    }
  }
}

