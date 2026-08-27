import { describe, expect, it } from 'vitest'

import type { SadhanaReport } from '@sadhana-connect/domain'

import {
  buildWhatsAppShareUrl,
  formatSadhanaReportForWhatsApp,
} from './format-sadhana-report-for-whatsapp'
import { WHATSAPP_RECIPIENT_NUMBER } from './whatsapp-recipient'

function makeReport(overrides: Partial<SadhanaReport> = {}): SadhanaReport {
  return {
    id: 'report-1',
    profileId: 'user-1',
    reportDate: '2026-01-05',
    roundsBefore430: 4,
    roundsTill7am: 8,
    lastRoundTime: '06:45',
    totalRounds: 16,
    readingMinutes: 15,
    bookName: 'Bhagavad-gītā As It Is',
    hearingMinutes: 30,
    speakerName: 'HG Example Prabhu',
    sleepTime: '22:00',
    wakeTime: '04:00',
    dayRestMinutes: 20,
    totalRestMinutes: 7,
    officeGoingTime: '09:30',
    officeReturnTime: '18:00',
    notes: null,
    signatureText: 'Test Devotee Dasa',
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z',
    ...overrides,
  }
}

describe('formatSadhanaReportForWhatsApp', () => {
  it('renders the exact full message for a fully populated report', () => {
    const message = formatSadhanaReportForWhatsApp(makeReport())

    expect(message).toBe(
      [
        'Hare Krishna prabhuji',
        'Dandvat pranam🙇‍♂️ 🙏',
        '*My Sadhna chart Dated for*',
        'Date: 05-01-2026',
        'Chant B4 4:30 Am :- 4 Rounds',
        'Till 7:00 am :- 8 Rounds',
        'Last Round :- 6:45 AM',
        'Total Round :- 16 Rounds',
        'Read :- 15 min',
        'Book Name :- Bhagavad-gītā As It Is',
        'Hearing :- 30 Mins',
        'Speaker Name :- HG Example Prabhu',
        'Slept at(last night) :- 10:00 PM',
        'Wake up :- 4:00 AM',
        'Day Rest :- 20 mins',
        'Total Rest :- 7 hr',
        'Office going :- 9:30 AM',
        'Reaching back :- 6:00 PM',
        'Ys',
        'Test Devotee Dasa',
      ].join('\n\n'),
    )
  })

  it('converts reportDate from YYYY-MM-DD to DD-MM-YYYY', () => {
    const message = formatSadhanaReportForWhatsApp(
      makeReport({ reportDate: '2026-12-31' }),
    )

    expect(message).toContain('Date: 31-12-2026')
  })

  it('renders an em dash for every unset nullable field, without omitting any line', () => {
    const message = formatSadhanaReportForWhatsApp(
      makeReport({
        lastRoundTime: null,
        bookName: null,
        speakerName: null,
        sleepTime: null,
        wakeTime: null,
        officeGoingTime: null,
        officeReturnTime: null,
      }),
    )

    const lines = message.split('\n\n')
    expect(lines).toHaveLength(20)
    expect(lines).toContain('Last Round :- —')
    expect(lines).toContain('Book Name :- —')
    expect(lines).toContain('Speaker Name :- —')
    expect(lines).toContain('Slept at(last night) :- —')
    expect(lines).toContain('Wake up :- —')
    expect(lines).toContain('Office going :- —')
    expect(lines).toContain('Reaching back :- —')
  })

  it('separates every line with a blank line (double newline), matching the CLAUDE.md template', () => {
    const message = formatSadhanaReportForWhatsApp(makeReport())

    expect(message).not.toMatch(/[^\n]\n[^\n]/) // no lone single-newline anywhere
    expect(message.split('\n\n')).toHaveLength(20)
  })

  it('preserves the exact greeting emoji sequence', () => {
    const message = formatSadhanaReportForWhatsApp(makeReport())

    expect(message).toContain('Dandvat pranam🙇‍♂️ 🙏')
  })

  it('preserves special characters in free-text fields verbatim, unescaped', () => {
    const message = formatSadhanaReportForWhatsApp(
      makeReport({
        bookName: `Śrīmad-Bhāgavatam & "Nectar of Devotion"`,
        signatureText: `O'Brien dāsa`,
      }),
    )

    expect(message).toContain(`Book Name :- Śrīmad-Bhāgavatam & "Nectar of Devotion"`)
    expect(message.endsWith(`O'Brien dāsa`)).toBe(true)
  })

  it('uses signatureText, verbatim, as the final <Name> line', () => {
    const message = formatSadhanaReportForWhatsApp(
      makeReport({ signatureText: 'Umang Dasa' }),
    )

    const lines = message.split('\n\n')
    expect(lines[lines.length - 1]).toBe('Umang Dasa')
  })

  it('never derives the signature from anything other than report.signatureText', () => {
    // Distinct from any other identity-like field on the report (there is
    // no profile name available to this pure function at all — it only
    // ever receives a SadhanaReport).
    const message = formatSadhanaReportForWhatsApp(
      makeReport({ signatureText: 'Signature Value' }),
    )

    expect(message.endsWith('Signature Value')).toBe(true)
  })
})

describe('formatSadhanaReportForWhatsApp — 12-hour time formatting', () => {
  it('formats a morning time', () => {
    const message = formatSadhanaReportForWhatsApp(
      makeReport({ lastRoundTime: '10:30:00' }),
    )

    expect(message).toContain('Last Round :- 10:30 AM')
  })

  it('formats an afternoon time', () => {
    const message = formatSadhanaReportForWhatsApp(
      makeReport({ lastRoundTime: '14:05:00' }),
    )

    expect(message).toContain('Last Round :- 2:05 PM')
  })

  it('formats midnight (00:xx) as 12:xx AM', () => {
    const message = formatSadhanaReportForWhatsApp(
      makeReport({ sleepTime: '00:15:00' }),
    )

    expect(message).toContain('Slept at(last night) :- 12:15 AM')
  })

  it('formats noon (12:xx) as 12:xx PM', () => {
    const message = formatSadhanaReportForWhatsApp(
      makeReport({ wakeTime: '12:00:00' }),
    )

    expect(message).toContain('Wake up :- 12:00 PM')
  })

  it('converts a single-digit hour without a leading zero', () => {
    const message = formatSadhanaReportForWhatsApp(
      makeReport({ officeGoingTime: '09:05:00' }),
    )

    expect(message).toContain('Office going :- 9:05 AM')
  })

  it('removes seconds from HH:mm:ss values', () => {
    const message = formatSadhanaReportForWhatsApp(
      makeReport({ officeReturnTime: '18:45:30' }),
    )

    const lines = message.split('\n\n')
    // Exact line match — if seconds leaked through, this would instead
    // read '6:45:30 PM' or similar and fail to match exactly.
    expect(lines).toContain('Reaching back :- 6:45 PM')
  })

  it('still renders an em dash, not a formatted time, for a null time field', () => {
    const message = formatSadhanaReportForWhatsApp(
      makeReport({
        lastRoundTime: null,
        sleepTime: null,
        wakeTime: null,
        officeGoingTime: null,
        officeReturnTime: null,
      }),
    )

    const lines = message.split('\n\n')
    expect(lines).toContain('Last Round :- —')
    expect(lines).toContain('Slept at(last night) :- —')
    expect(lines).toContain('Wake up :- —')
    expect(lines).toContain('Office going :- —')
    expect(lines).toContain('Reaching back :- —')
  })

  it('applies 12-hour formatting to all five time fields simultaneously', () => {
    const message = formatSadhanaReportForWhatsApp(
      makeReport({
        lastRoundTime: '06:45:00',
        sleepTime: '22:00:00',
        wakeTime: '04:00:00',
        officeGoingTime: '09:30:00',
        officeReturnTime: '18:00:00',
      }),
    )

    const lines = message.split('\n\n')
    expect(lines).toContain('Last Round :- 6:45 AM')
    expect(lines).toContain('Slept at(last night) :- 10:00 PM')
    expect(lines).toContain('Wake up :- 4:00 AM')
    expect(lines).toContain('Office going :- 9:30 AM')
    expect(lines).toContain('Reaching back :- 6:00 PM')
  })

  it('renders the exact final WhatsApp message with 12-hour times, seconds stripped', () => {
    const message = formatSadhanaReportForWhatsApp(
      makeReport({
        reportDate: '2026-03-01',
        lastRoundTime: '06:45:00',
        sleepTime: '22:00:00',
        wakeTime: '04:00:00',
        officeGoingTime: '09:30:00',
        officeReturnTime: '18:00:00',
      }),
    )

    expect(message).toBe(
      [
        'Hare Krishna prabhuji',
        'Dandvat pranam🙇‍♂️ 🙏',
        '*My Sadhna chart Dated for*',
        'Date: 01-03-2026',
        'Chant B4 4:30 Am :- 4 Rounds',
        'Till 7:00 am :- 8 Rounds',
        'Last Round :- 6:45 AM',
        'Total Round :- 16 Rounds',
        'Read :- 15 min',
        'Book Name :- Bhagavad-gītā As It Is',
        'Hearing :- 30 Mins',
        'Speaker Name :- HG Example Prabhu',
        'Slept at(last night) :- 10:00 PM',
        'Wake up :- 4:00 AM',
        'Day Rest :- 20 mins',
        'Total Rest :- 7 hr',
        'Office going :- 9:30 AM',
        'Reaching back :- 6:00 PM',
        'Ys',
        'Test Devotee Dasa',
      ].join('\n\n'),
    )
  })
})

describe('buildWhatsAppShareUrl', () => {
  it('builds the exact wa.me URL with the fixed recipient number', () => {
    const url = buildWhatsAppShareUrl(makeReport())

    expect(url.startsWith(`https://wa.me/${WHATSAPP_RECIPIENT_NUMBER}?text=`)).toBe(true)
    expect(WHATSAPP_RECIPIENT_NUMBER).toBe('919354671988')
  })

  it('URL-encodes the message exactly as encodeURIComponent would', () => {
    const report = makeReport()
    const url = buildWhatsAppShareUrl(report)
    const message = formatSadhanaReportForWhatsApp(report)

    expect(url).toBe(
      `https://wa.me/${WHATSAPP_RECIPIENT_NUMBER}?text=${encodeURIComponent(message)}`,
    )
  })

  it('percent-encodes line breaks, spaces, and emoji so the URL contains no raw newlines', () => {
    const url = buildWhatsAppShareUrl(makeReport())

    expect(url).not.toContain('\n')
    expect(url).toContain('%0A%0A') // encoded blank-line separator
    expect(url).not.toContain(' ')
  })

  it('round-trips back to the exact original message when decoded', () => {
    const report = makeReport()
    const url = buildWhatsAppShareUrl(report)
    const encoded = url.slice(`https://wa.me/${WHATSAPP_RECIPIENT_NUMBER}?text=`.length)

    expect(decodeURIComponent(encoded)).toBe(formatSadhanaReportForWhatsApp(report))
  })
})
