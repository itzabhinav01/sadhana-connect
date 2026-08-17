import { z } from 'zod'

import { getLocalDateIso } from '@/shared/utils/date'

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
  totalRestMinutes: nonNegativeIntField('Total rest minutes'),
  officeGoingTime: optionalTimeField,
  officeReturnTime: optionalTimeField,
  notes: optionalTextField,
  signatureText: z.string().trim().min(1, 'Signature is required'),
})

export type SadhanaReportFormInput = z.infer<typeof sadhanaReportSchema>
