import { z } from 'zod'

import { getLocalDateIso } from '@sadhana-connect/shared'

// Every numeric column this field maps to (rounds_before_4_30am,
// rounds_till_7am, total_rounds, reading_minutes, hearing_minutes,
// day_rest_minutes, total_rest_minutes) is a Postgres `smallint`
// (0001_initial_schema) — 32767 is that type's actual maximum, not an
// invented product limit. Without this, a value like "999999999999"
// passes the digits-only check below and only fails at the database
// with a raw "smallint out of range" error instead of a friendly one.
const SMALLINT_MAX = 32767

// Numeric fields are optional on the form (blank = not tracked that day)
// but must be a non-negative whole number when provided. Kept as plain
// strings here, like every other field — converted to numbers only when
// building the repository params, matching this codebase's existing
// schema style (see application/auth/schemas.ts).
function nonNegativeIntField(label: string) {
  return z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), {
      message: `${label} must be a whole number`,
    })
    .refine((value) => value === '' || Number(value) <= SMALLINT_MAX, {
      message: `${label} must be ${SMALLINT_MAX} or fewer`,
    })
}

const optionalTimeField = z.string().trim()
const optionalTextField = z.string().trim()

// rounds_before_4_30am, rounds_till_7am, and total_rounds are validated
// independently — no cross-field check relates them (approved product
// decision, Phase 6). Same for day_rest_minutes vs total_rest_minutes.
export const sadhanaReportSchema = z.object({
  reportDate: z
    .string()
    .min(1, 'Date is required')
    .refine((value) => value <= getLocalDateIso(), {
      message: 'Date cannot be in the future',
    }),
  roundsBefore430: nonNegativeIntField('Rounds before 4:30 AM'),
  roundsTill7am: nonNegativeIntField('Rounds till 7 AM'),
  lastRoundTime: optionalTimeField,
  totalRounds: nonNegativeIntField('Total Rounds'),
  readingMinutes: nonNegativeIntField('Reading minutes'),
  bookName: optionalTextField,
  hearingMinutes: nonNegativeIntField('Hearing minutes'),
  speakerName: optionalTextField,
  sleepTime: optionalTimeField,
  wakeTime: optionalTimeField,
  dayRestMinutes: nonNegativeIntField('Day rest minutes'),
  totalRestMinutes: nonNegativeIntField('Total rest hours'),
  officeGoingTime: optionalTimeField,
  officeReturnTime: optionalTimeField,
  notes: optionalTextField,
  signatureText: optionalTextField,
})

export type SadhanaReportFormInput = z.infer<typeof sadhanaReportSchema>
