import { describe, expect, it } from 'vitest'

import { buildAiProviderUrl, buildSadhanaAiPrompt } from './sadhana-ai-analysis'
import type { SadhanaReport } from '@sadhana-connect/domain'

function makeReport(overrides: Partial<SadhanaReport> = {}): SadhanaReport {
  return {
    id: 'r1',
    profileId: 'u1',
    reportDate: '2026-10-01',
    roundsBefore430: 8,
    roundsTill7am: 8,
    lastRoundTime: '06:45',
    totalRounds: 16,
    readingMinutes: 30,
    bookName: 'Bhagavad-gītā',
    hearingMinutes: 45,
    speakerName: 'HG Prabhu',
    sleepTime: '21:30',
    wakeTime: '04:00',
    dayRestMinutes: 20,
    totalRestMinutes: 6,
    officeGoingTime: null,
    officeReturnTime: null,
    notes: 'Focused chanting',
    signatureText: 'Govinda Das',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('buildSadhanaAiPrompt', () => {
  it('includes the required rules, date range, and marks missing dates as No Logged Activity', () => {
    const prompt = buildSadhanaAiPrompt({
      fromDate: '2026-10-01',
      toDate: '2026-10-03',
      people: [
        {
          name: 'Govinda Das',
          reports: [makeReport({ reportDate: '2026-10-01' })],
        },
      ],
    })

    expect(prompt).toContain(
      'Analyze the following Sadhna performance data. If there is ONE person, use INDIVIDUAL MODE; if MULTIPLE people, use MENTOR MODE. Do not repeat the raw data. For 2026-10-01 to 2026-10-03',
    )
    expect(prompt).toContain('Missing/"No Logged Activity" = not reported, NOT Sadhna not performed.')
    expect(prompt).toContain('=== Person 1: Govinda Das (Days Reported: 1/3) ===')
    expect(prompt).toContain('2026-10-01: Chanting: 16 rounds')
    expect(prompt).toContain('2026-10-02: No Logged Activity')
    expect(prompt).toContain('2026-10-03: No Logged Activity')
  })

  it('builds valid AI provider URLs for chatgpt, claude, and gemini', () => {
    expect(buildAiProviderUrl('chatgpt', 'hello world')).toBe(
      'https://chatgpt.com/?q=hello%20world',
    )
    expect(buildAiProviderUrl('claude', 'hello world')).toBe(
      'https://claude.ai/new?q=hello%20world',
    )
    expect(buildAiProviderUrl('gemini', 'hello world')).toBe('https://gemini.google.com/app')
  })
})
