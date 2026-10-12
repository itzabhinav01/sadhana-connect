import { zodResolver } from '@hookform/resolvers/zod'
import { BookOpen, Briefcase, GraduationCap, Headphones, Moon, PenLine, Repeat, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  emptyFormValues,
  formValuesToUpsertParams,
  reportToFormValues,
  useCustomSectionValues,
  useSadhanaSectionsConfig,
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
import { NumberFormField } from '@/presentation/components/NumberFormField'
import { SadhanaDateStrip } from '@/presentation/pages/sadhana/SadhanaDateStrip'
import { cn } from '@/shared/utils/cn'

// One accent per practice category — same palette, same scoping rule as
// apps/mobile/src/shared/theme.ts sectionAccents: color identifies which
// part of the form you're in, never used as decoration outside it.
const SECTION_STYLE: Record<
  SectionKey,
  { border: string; background: string; text: string }
> = {
  chanting: { border: 'border-l-chanting', background: 'bg-chanting-soft', text: 'text-chanting' },
  reading: { border: 'border-l-reading', background: 'bg-reading-soft', text: 'text-reading' },
  hearing: { border: 'border-l-hearing', background: 'bg-hearing-soft', text: 'text-hearing' },
  study: { border: 'border-l-study', background: 'bg-study-soft', text: 'text-study' },
  rest: { border: 'border-l-rest', background: 'bg-rest-soft', text: 'text-rest' },
  day: { border: 'border-l-schedule', background: 'bg-schedule-soft', text: 'text-schedule' },
  notes: { border: 'border-l-schedule', background: 'bg-muted/40', text: 'text-muted-foreground' },
  custom: { border: 'border-l-primary', background: 'bg-primary/5', text: 'text-primary' },
}


interface SadhanaReportFormProps {
  date: string
  existingReport: SadhanaReport | null
  onDateChange: (date: string) => void
  // Set only when arriving from the Japa Counter's "Use in Sadhana"
  // action (Phase 10) — an explicitly devotee-chosen initial value for
  // Total Rounds.
  prefillRounds?: number
}

type SectionKey = 'chanting' | 'reading' | 'hearing' | 'study' | 'rest' | 'day' | 'notes' | 'custom'

// Mirrors mobile's section structure: Chanting, Reading, Hearing, Study,
// Rest, Day, Notes & Signature — none of the sections are compulsory.
const FIELD_SECTION: Record<keyof SadhanaReportFormInput, SectionKey | undefined> = {
  reportDate: undefined,
  roundsBefore430: 'chanting',
  roundsTill7am: 'chanting',
  lastRoundTime: 'chanting',
  totalRounds: 'chanting',
  readingMinutes: 'reading',
  bookName: 'reading',
  hearingMinutes: 'hearing',
  speakerName: 'hearing',
  studyHours: 'study',
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
  if (isPositive(base.readingMinutes) || base.bookName !== '') {
    open.push('reading')
  }
  if (isPositive(base.hearingMinutes) || base.speakerName !== '') {
    open.push('hearing')
  }
  if (isPositive(base.studyHours)) {
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

  const { config: sectionsConfig } = useSadhanaSectionsConfig()
  const { values: customValues, setFieldValue: setCustomFieldValue } = useCustomSectionValues(date)
  const activeCustomSections = useMemo(
    () => sectionsConfig.customSections.filter((s) => s.enabled),
    [sectionsConfig.customSections],
  )

  const defaultValues = useMemo(() => {
    const rawBase = existingReport
      ? reportToFormValues(existingReport)
      : emptyFormValues(date)
    const base = {
      ...rawBase,
      notes: (rawBase.notes || '').replace(/(?:\r?\n)?\[Additional\]:.*$/s, '').trim(),
    }
    return prefillRounds !== undefined
      ? { ...base, totalRounds: String(prefillRounds) }
      : base
    // eslint-disable-next-line react-hooks/exhaustive-deps -- computed once per mount (this component remounts on date change, see the comment above), not meant to react to existingReport/prefillRounds changing in place.
  }, [])

  // Cross-device hydration: if local storage has no entry for this date yet
  // but existing report has [Additional]: in notes, populate the custom fields.
  useState(() => {
    if (existingReport?.notes && existingReport.notes.includes('[Additional]:')) {
      const match = existingReport.notes.match(/\[Additional\]:\s*(.*)$/s)
      if (match && match[1]) {
        const items = match[1].split(',').map((s) => s.trim())
        for (const item of items) {
          const [rawTitle, ...rest] = item.split(':')
          const titlePart = rawTitle.trim()
          const valPart = rest.join(':').trim()
          const matchedSec = activeCustomSections.find(
            (s) => s.title.toLowerCase() === titlePart.toLowerCase(),
          )
          if (
            matchedSec &&
            (customValues[matchedSec.id] === undefined || customValues[matchedSec.id] === '')
          ) {
            if (matchedSec.fieldType === 'boolean') {
              void setCustomFieldValue(matchedSec.id, valPart.toLowerCase() === 'yes')
            } else {
              const cleanVal = matchedSec.unit
                ? valPart.replace(new RegExp(`\\s*${matchedSec.unit}$`, 'i'), '').trim()
                : valPart
              void setCustomFieldValue(matchedSec.id, cleanVal)
            }
          }
        }
      }
    }
  })

  const [openSections, setOpenSections] = useState<SectionKey[]>(() =>
    computeInitialOpenSections(isEditingMode, defaultValues),
  )

  const form = useForm<SadhanaReportFormInput>({
    resolver: zodResolver(sadhanaReportSchema),
    defaultValues,
  })

  const roundsBefore430 = form.watch('roundsBefore430')
  const roundsTill7am = form.watch('roundsTill7am')
  const totalRounds = form.watch('totalRounds')
  const morningSum = (Number(roundsBefore430) || 0) + (Number(roundsTill7am) || 0)
  const [autoSumEnabled, setAutoSumEnabled] = useState(false)

  useEffect(() => {
    if (autoSumEnabled && morningSum > 0) {
      form.setValue('totalRounds', String(morningSum), { shouldDirty: true, shouldValidate: true })
    }
  }, [autoSumEnabled, morningSum, form])

  const onSubmit = form.handleSubmit(
    (values) => {
      let finalValues = { ...values }
      const filledCustomItems = activeCustomSections
        .filter((sec) => customValues[sec.id] !== undefined && customValues[sec.id] !== '' && customValues[sec.id] !== false)
        .map((sec) => `${sec.title}: ${sec.fieldType === 'boolean' ? 'Yes' : customValues[sec.id]}${sec.unit ? ` ${sec.unit}` : ''}`)

      const cleanNotes = (finalValues.notes || '')
        .replace(/(?:\r?\n)?\[Additional\]:.*$/s, '')
        .trim()

      if (filledCustomItems.length > 0) {
        const customBlock = `[Additional]: ${filledCustomItems.join(', ')}`
        finalValues.notes = cleanNotes ? `${cleanNotes}\n${customBlock}` : customBlock
      } else {
        finalValues.notes = cleanNotes
      }

      upsertReport.mutate(formValuesToUpsertParams(finalValues), {
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

        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
          <SadhanaDateStrip
            selectedDate={date}
            hasExistingReport={Boolean(existingReport)}
            onSelectDate={(nextDate) => {
              form.setValue('reportDate', nextDate)
              onDateChange(nextDate)
            }}
          />

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
        </div>

        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={(value) => setOpenSections(value as SectionKey[])}
          className="flex flex-col gap-3"
        >
          {sectionsConfig.standardSections.chanting !== false ? (
            <AccordionItem
              value="chanting"
              className={cn(
                'overflow-hidden rounded-xl border-b-0 border-l-4 px-4',
                SECTION_STYLE.chanting.border,
                SECTION_STYLE.chanting.background,
              )}
            >
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Repeat className={cn('size-4', SECTION_STYLE.chanting.text)} aria-hidden="true" />
                  <span className={cn('text-xs font-bold tracking-wide uppercase', SECTION_STYLE.chanting.text)}>
                    Chanting
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <NumberFormField
                    control={form.control}
                    name="roundsBefore430"
                    label="Rounds before 4:30 AM"
                    showStepper
                    quickAmounts={[
                      { label: '+1', mode: 'add', amount: 1 },
                      { label: '+2', mode: 'add', amount: 2 },
                      { label: '+4', mode: 'add', amount: 4 },
                    ]}
                  />

                  <NumberFormField
                    control={form.control}
                    name="roundsTill7am"
                    label="Rounds till 7 AM"
                    showStepper
                    quickAmounts={[
                      { label: '+1', mode: 'add', amount: 1 },
                      { label: '+4', mode: 'add', amount: 4 },
                      { label: '+8', mode: 'add', amount: 8 },
                    ]}
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

                  <div className="flex flex-col gap-2 sm:col-span-2">
                    {morningSum > 0 && String(morningSum) !== totalRounds ? (
                      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-xs">
                        <span className="font-medium text-foreground">
                          Morning rounds sum: <strong>{morningSum}</strong>
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => form.setValue('totalRounds', String(morningSum), { shouldDirty: true, shouldValidate: true })}
                        >
                          Set Total to {morningSum}
                        </Button>
                      </div>
                    ) : null}

                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoSumEnabled}
                        onChange={(e) => {
                          const next = e.target.checked
                          setAutoSumEnabled(next)
                          if (next && morningSum > 0) {
                            form.setValue('totalRounds', String(morningSum), { shouldDirty: true, shouldValidate: true })
                          }
                        }}
                        className="rounded border-input text-primary focus:ring-primary size-4"
                      />
                      <span>Sum automatically from components</span>
                    </label>
                  </div>

                  <NumberFormField
                    control={form.control}
                    name="totalRounds"
                    label="Total Rounds"
                    showStepper
                    quickAmounts={[
                      { label: '+1', mode: 'add', amount: 1 },
                      { label: '+4', mode: 'add', amount: 4 },
                      { label: '16 (Full)', mode: 'set', amount: 16 },
                    ]}
                    helpText="Enter the complete number of rounds chanted today — this may include rounds chanted after 7 AM that aren't reflected in the fields above."
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ) : null}

          {sectionsConfig.standardSections.reading !== false ? (
            <AccordionItem
              value="reading"
              className={cn(
                'overflow-hidden rounded-xl border-b-0 border-l-4 px-4',
                SECTION_STYLE.reading.border,
                SECTION_STYLE.reading.background,
              )}
            >
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <BookOpen className={cn('size-4', SECTION_STYLE.reading.text)} aria-hidden="true" />
                  <span className={cn('text-xs font-bold tracking-wide uppercase', SECTION_STYLE.reading.text)}>
                    Reading
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <NumberFormField
                    control={form.control}
                    name="readingMinutes"
                    label="Reading Minutes"
                    quickAmounts={[
                      { label: '+15m', mode: 'add', amount: 15 },
                      { label: '+30m', mode: 'add', amount: 30 },
                      { label: '+60m', mode: 'add', amount: 60 },
                    ]}
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
                </div>
              </AccordionContent>
            </AccordionItem>
          ) : null}

          {sectionsConfig.standardSections.hearing !== false ? (
            <AccordionItem
              value="hearing"
              className={cn(
                'overflow-hidden rounded-xl border-b-0 border-l-4 px-4',
                SECTION_STYLE.hearing.border,
                SECTION_STYLE.hearing.background,
              )}
            >
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Headphones className={cn('size-4', SECTION_STYLE.hearing.text)} aria-hidden="true" />
                  <span className={cn('text-xs font-bold tracking-wide uppercase', SECTION_STYLE.hearing.text)}>
                    Hearing
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <NumberFormField
                    control={form.control}
                    name="hearingMinutes"
                    label="Hearing Minutes"
                    quickAmounts={[
                      { label: '+15m', mode: 'add', amount: 15 },
                      { label: '+30m', mode: 'add', amount: 30 },
                      { label: '+60m', mode: 'add', amount: 60 },
                    ]}
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
          ) : null}


          {sectionsConfig.standardSections.study !== false ? (
            <AccordionItem
              value="study"
              className={cn(
                'overflow-hidden rounded-xl border-b-0 border-l-4 px-4',
                SECTION_STYLE.study.border,
                SECTION_STYLE.study.background,
              )}
            >
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <GraduationCap className={cn('size-4', SECTION_STYLE.study.text)} aria-hidden="true" />
                  <span className={cn('text-xs font-bold tracking-wide uppercase', SECTION_STYLE.study.text)}>
                    Study
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <NumberFormField
                    control={form.control}
                    name="studyHours"
                    label="Study (hours)"
                    allowDecimal
                    quickAmounts={[1, 2, 3, 4]}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ) : null}

          {sectionsConfig.standardSections.rest !== false ? (
            <AccordionItem
              value="rest"
              className={cn(
                'overflow-hidden rounded-xl border-b-0 border-l-4 px-4',
                SECTION_STYLE.rest.border,
                SECTION_STYLE.rest.background,
              )}
            >
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Moon className={cn('size-4', SECTION_STYLE.rest.text)} aria-hidden="true" />
                  <span className={cn('text-xs font-bold tracking-wide uppercase', SECTION_STYLE.rest.text)}>
                    Rest
                  </span>
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

                  <NumberFormField
                    control={form.control}
                    name="dayRestMinutes"
                    label="Day Rest (minutes)"
                    quickAmounts={[15, 30, 60]}
                  />

                  <NumberFormField
                    control={form.control}
                    name="totalRestMinutes"
                    label="Total Rest (hours)"
                    allowDecimal
                    quickAmounts={[5, 6, 7, 8]}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ) : null}

          {sectionsConfig.standardSections.schedule !== false ? (
            <AccordionItem
              value="day"
              className={cn(
                'overflow-hidden rounded-xl border-b-0 border-l-4 px-4',
                SECTION_STYLE.day.border,
                SECTION_STYLE.day.background,
              )}
            >
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Briefcase className={cn('size-4', SECTION_STYLE.day.text)} aria-hidden="true" />
                  <span className={cn('text-xs font-bold tracking-wide uppercase', SECTION_STYLE.day.text)}>
                    Day
                  </span>
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
          ) : null}

          {activeCustomSections.length > 0 ? (
            <AccordionItem
              value="custom"
              className="overflow-hidden rounded-xl border-b-0 border-l-4 border-l-primary bg-primary/5 px-4"
            >
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" aria-hidden="true" />
                  <span className="text-xs font-bold tracking-wide uppercase text-primary">
                    Additional Practices ({activeCustomSections.length})
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {activeCustomSections.map((sec) => (
                    <div
                      key={sec.id}
                      className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card p-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {sec.title}
                          {sec.unit ? ` (${sec.unit})` : ''}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                          {sec.fieldType}
                        </span>
                      </div>
                      {sec.description ? (
                        <span className="text-xs text-muted-foreground">
                          {sec.description}
                        </span>
                      ) : null}
                      {sec.fieldType === 'boolean' ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`custom-${sec.id}`}
                            className="size-4 rounded border-border text-primary focus:ring-primary"
                            checked={Boolean(customValues[sec.id])}
                            onChange={(e) =>
                              void setCustomFieldValue(sec.id, e.target.checked)
                            }
                          />
                          <label
                            htmlFor={`custom-${sec.id}`}
                            className="cursor-pointer text-xs text-foreground"
                          >
                            Completed / Attended
                          </label>
                        </div>
                      ) : (
                        <Input
                          type={
                            sec.fieldType === 'number' || sec.fieldType === 'decimal'
                              ? 'number'
                              : sec.fieldType === 'time'
                                ? 'time'
                                : 'text'
                          }
                          step={sec.fieldType === 'decimal' ? '0.1' : undefined}
                          placeholder={sec.unit ? `e.g. 15 ${sec.unit}` : 'Enter value'}
                          value={
                            customValues[sec.id] !== undefined
                              ? String(customValues[sec.id])
                              : ''
                          }
                          onChange={(e) =>
                            void setCustomFieldValue(sec.id, e.target.value)
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ) : null}

          {sectionsConfig.standardSections.details !== false ? (
            <AccordionItem
              value="notes"
              className={cn(
                'overflow-hidden rounded-xl border-b-0 border-l-4 px-4',
                SECTION_STYLE.notes.border,
                SECTION_STYLE.notes.background,
              )}
            >
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <PenLine className={cn('size-4', SECTION_STYLE.notes.text)} aria-hidden="true" />
                  <span className={cn('text-xs font-bold tracking-wide uppercase', SECTION_STYLE.notes.text)}>
                    Notes &amp; Signature
                  </span>
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
          ) : null}
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
