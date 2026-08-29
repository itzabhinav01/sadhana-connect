import { zodResolver } from '@hookform/resolvers/zod'
import { BookOpen, Briefcase, Moon, PenLine, Repeat } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  emptyFormValues,
  formValuesToUpsertParams,
  reportToFormValues,
} from '@sadhana-connect/sadhana'
import {
  type SadhanaReportFormInput,
  sadhanaReportSchema,
} from '@sadhana-connect/sadhana'
import { useUpsertSadhanaReport } from '@sadhana-connect/sadhana'
import type { SadhanaReport } from '@sadhana-connect/domain/entities/sadhana-report'
import { getLocalDateIso } from '@sadhana-connect/shared'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/presentation/components/ui/accordion'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/presentation/components/ui/form'
import { Input } from '@/presentation/components/ui/input'

interface SadhanaReportFormProps {
  date: string
  existingReport: SadhanaReport | null
  onDateChange: (date: string) => void
  // Set only when arriving from the Japa Counter's "Use in Sadhana"
  // action (Phase 10) — an explicitly devotee-chosen initial value for
  // Total Rounds.
  prefillRounds?: number
}

type SectionKey = 'chanting' | 'study' | 'rest' | 'day' | 'notes'

// Same five content groups this form has always had (unchanged) — only
// their presentation (always-visible sections -> a collapsible
// Accordion) changes here, mirroring the pattern already shipped on
// mobile.
const FIELD_SECTION: Record<keyof SadhanaReportFormInput, SectionKey | undefined> = {
  reportDate: undefined,
  roundsBefore430: 'chanting',
  roundsTill7am: 'chanting',
  lastRoundTime: 'chanting',
  totalRounds: 'chanting',
  readingMinutes: 'study',
  bookName: 'study',
  hearingMinutes: 'study',
  speakerName: 'study',
  sleepTime: 'rest',
  wakeTime: 'rest',
  dayRestMinutes: 'rest',
  totalRestMinutes: 'rest',
  officeGoingTime: 'day',
  officeReturnTime: 'day',
  notes: 'notes',
  signatureText: 'notes',
}

function isPositive(value: string): boolean {
  return Number(value) > 0
}

// "Contains existing data" per section — numeric fields count as having
// data only when > 0 (reportToFormValues always stringifies a 0 as
// "0", so a bare non-empty check would mark every numeric field as
// populated on every existing report). Time/text fields count as having
// data when non-empty, since they're '' exactly when unset.
function computeInitialOpenSections(
  isEditingMode: boolean,
  base: SadhanaReportFormInput,
): SectionKey[] {
  if (!isEditingMode) {
    return ['chanting']
  }
  const open: SectionKey[] = []
  if (
    isPositive(base.roundsBefore430) ||
    isPositive(base.roundsTill7am) ||
    isPositive(base.totalRounds) ||
    base.lastRoundTime !== ''
  ) {
    open.push('chanting')
  }
  if (isPositive(base.readingMinutes) || base.bookName !== '' || isPositive(base.hearingMinutes) || base.speakerName !== '') {
    open.push('study')
  }
  if (
    base.sleepTime !== '' ||
    base.wakeTime !== '' ||
    isPositive(base.dayRestMinutes) ||
    isPositive(base.totalRestMinutes)
  ) {
    open.push('rest')
  }
  if (base.officeGoingTime !== '' || base.officeReturnTime !== '') {
    open.push('day')
  }
  if (base.notes !== '' || base.signatureText !== '') {
    open.push('notes')
  }
  return open
}

// Keyed by `date` at the call site (see SadhanaFormPage), so a full
// remount — and therefore fresh local state below — happens on every
// date switch instead of stale state leaking across dates.
export function SadhanaReportForm({
  date,
  existingReport,
  onDateChange,
  prefillRounds,
}: SadhanaReportFormProps) {
  const upsertReport = useUpsertSadhanaReport()
  const [isEditingMode, setIsEditingMode] = useState(Boolean(existingReport))

  const defaultValues = useMemo(() => {
    const base = existingReport
      ? reportToFormValues(existingReport)
      : emptyFormValues(date)
    return prefillRounds !== undefined
      ? { ...base, totalRounds: String(prefillRounds) }
      : base
    // eslint-disable-next-line react-hooks/exhaustive-deps -- computed once per mount (this component remounts on date change, see the comment above), not meant to react to existingReport/prefillRounds changing in place.
  }, [])

  const [openSections, setOpenSections] = useState<SectionKey[]>(() =>
    computeInitialOpenSections(isEditingMode, defaultValues),
  )

  const form = useForm<SadhanaReportFormInput>({
    resolver: zodResolver(sadhanaReportSchema),
    defaultValues,
  })

  const onSubmit = form.handleSubmit(
    (values) => {
      upsertReport.mutate(formValuesToUpsertParams(values), {
        onSuccess: () => setIsEditingMode(true),
      })
    },
    (errors) => {
      // A field inside a collapsed section (e.g. a typo in Book Name)
      // can fail validation with nothing on screen to show it — open
      // every section that has an invalid field so its inline error
      // becomes visible.
      const invalidFields = Object.keys(errors) as (keyof SadhanaReportFormInput)[]
      const sectionsToOpen = new Set(invalidFields.map((field) => FIELD_SECTION[field]))
      setOpenSections((prev) => {
        const next = new Set(prev)
        for (const section of sectionsToOpen) {
          if (section) next.add(section)
        }
        return Array.from(next)
      })
    },
  )

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
        {upsertReport.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Something went wrong saving your report. Please try again.
            </AlertDescription>
          </Alert>
        ) : null}

        {upsertReport.isSuccess ? (
          <Alert>
            <AlertDescription>Report saved.</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="reportDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  max={getLocalDateIso()}
                  {...field}
                  onChange={(event) => {
                    field.onChange(event)
                    onDateChange(event.target.value)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={(value) => setOpenSections(value as SectionKey[])}
          className="rounded-lg border px-4"
        >
          <AccordionItem value="chanting">
            <AccordionTrigger>
              <span className="flex items-center gap-2 text-foreground">
                <Repeat className="size-4 text-primary" aria-hidden="true" />
                Chanting
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="roundsBefore430"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rounds before 4:30 AM</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roundsTill7am"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rounds till 7 AM</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastRoundTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Round Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalRounds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Rounds</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        Enter the complete number of rounds chanted today — this
                        may include rounds chanted after 7 AM that aren&apos;t
                        reflected in the fields above.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="study">
            <AccordionTrigger>
              <span className="flex items-center gap-2 text-foreground">
                <BookOpen className="size-4 text-primary" aria-hidden="true" />
                Study
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="readingMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reading Minutes</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bookName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Book Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hearingMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hearing Minutes</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="speakerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Speaker Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="rest">
            <AccordionTrigger>
              <span className="flex items-center gap-2 text-foreground">
                <Moon className="size-4 text-primary" aria-hidden="true" />
                Rest
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sleepTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sleep Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wakeTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wake Up</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dayRestMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day Rest (minutes)</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalRestMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Rest (minutes)</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="day">
            <AccordionTrigger>
              <span className="flex items-center gap-2 text-foreground">
                <Briefcase className="size-4 text-primary" aria-hidden="true" />
                Day
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="officeGoingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Going</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="officeReturnTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Return</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="notes">
            <AccordionTrigger>
              <span className="flex items-center gap-2 text-foreground">
                <PenLine className="size-4 text-primary" aria-hidden="true" />
                Notes &amp; Signature
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="signatureText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signature</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        Type your name to confirm this report is accurate.
                        Optional.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button
          type="submit"
          disabled={upsertReport.isPending}
          className="sm:self-start"
        >
          {isEditingMode
            ? upsertReport.isPending
              ? 'Updating…'
              : 'Update Sadhana'
            : upsertReport.isPending
              ? 'Saving…'
              : 'Save Sadhana'}
        </Button>
      </form>
    </Form>
  )
}
