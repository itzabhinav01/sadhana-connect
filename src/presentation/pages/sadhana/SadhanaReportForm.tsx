import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  emptyFormValues,
  formValuesToUpsertParams,
  reportToFormValues,
} from '@/application/sadhana/sadhana-form-mapping'
import {
  type SadhanaReportFormInput,
  sadhanaReportSchema,
} from '@/application/sadhana/sadhana-report-schema'
import { useUpsertSadhanaReport } from '@/application/sadhana/use-upsert-sadhana-report'
import type { SadhanaReport } from '@/domain/entities/sadhana-report'
import { getLocalDateIso } from '@/shared/utils/date'
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
  // action (Phase 10) — an explicitly devotee-chosen value, distinct
  // from the before/till auto-suggestion below.
  prefillRounds?: number
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

  // Total Rounds is only auto-suggested while editing a fresh (never
  // submitted) report and the devotee hasn't typed into it themselves —
  // it must never silently overwrite a value that was already saved,
  // that the devotee deliberately chose, or that arrived via
  // prefillRounds (equally an explicit choice, made on the Japa Counter
  // page instead of this form). This is a convenience default, never an
  // enforced relationship (approved product decision, Phase 6).
  const [totalRoundsTouched, setTotalRoundsTouched] = useState(
    Boolean(existingReport) || prefillRounds !== undefined,
  )

  const form = useForm<SadhanaReportFormInput>({
    resolver: zodResolver(sadhanaReportSchema),
    defaultValues: (() => {
      const base = existingReport
        ? reportToFormValues(existingReport)
        : emptyFormValues(date)
      return prefillRounds !== undefined
        ? { ...base, totalRounds: String(prefillRounds) }
        : base
    })(),
  })

  useEffect(() => {
    if (totalRoundsTouched) return

    const subscription = form.watch((values, { name }) => {
      if (name !== 'roundsBefore430' && name !== 'roundsTill7am') return

      const before = Number(values.roundsBefore430) || 0
      const till = Number(values.roundsTill7am) || 0
      form.setValue('totalRounds', String(before + till), {
        shouldDirty: false,
        shouldValidate: false,
      })
    })

    return () => subscription.unsubscribe()
  }, [form, totalRoundsTouched])

  const onSubmit = form.handleSubmit((values) => {
    upsertReport.mutate(formValuesToUpsertParams(values), {
      onSuccess: () => setIsEditingMode(true),
    })
  })

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

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">Chanting</h2>
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
                    <Input
                      inputMode="numeric"
                      {...field}
                      onChange={(event) => {
                        setTotalRoundsTouched(true)
                        field.onChange(event)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">Study</h2>
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
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">Rest</h2>
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
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">Day</h2>
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
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">
            Notes &amp; Signature
          </h2>

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
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

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
