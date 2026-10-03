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
    expect(prompt).toContain('OUTPUT STRUCTURE FOR INDIVIDUAL MODE')
    expect(prompt).toContain('=== Person 1: Govinda Das (Days Reported: 1/3) ===')
    expect(prompt).toContain('Pre-Calculated Summary (use these exact figures; do not recalculate):')
    expect(prompt).toContain('Total Morning (<7 AM): 16/16 (100%)')
    expect(prompt).toContain('2026-10-01: Chanting: 16 rounds')
    expect(prompt).toContain('2026-10-02: No Logged Activity')
    expect(prompt).toContain('2026-10-03: No Logged Activity')
  })

  it('includes Mentor Mode structure, WhatsApp follow-up drafts, and group tags when analyzing a group', () => {
    const prompt = buildSadhanaAiPrompt({
      fromDate: '2026-10-01',
      toDate: '2026-10-02',
      selectedGroupName: 'BACE Youth',
      devotees: [
        {
          devoteeName: 'Govinda Das',
          groupNames: ['BACE Youth', 'Core Team'],
          reports: [makeReport({ reportDate: '2026-10-01' })],
        },
        {
          devoteeName: 'Madhava Das',
          groupNames: ['BACE Youth'],
          reports: [],
        },
      ],
    })

    expect(prompt).toContain('Selected Youth Group Filter: BACE Youth')
    expect(prompt).toContain('OUTPUT STRUCTURE FOR MENTOR MODE')
    expect(prompt).toContain('Ready-to-Send WhatsApp Follow-Up Message Drafts')
    expect(prompt).toContain(
      '=== Person 1: Govinda Das (Days Reported: 1/2) [Groups: BACE Youth, Core Team] ===',
    )
    expect(prompt).toContain('=== Person 2: Madhava Das (Days Reported: 0/2) [Groups: BACE Youth] ===')
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
