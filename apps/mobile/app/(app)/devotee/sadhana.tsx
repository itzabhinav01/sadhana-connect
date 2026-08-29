import { zodResolver } from '@hookform/resolvers/zod'
import {
  type SadhanaReportFormInput,
  emptyFormValues,
  formValuesToUpsertParams,
  reportToFormValues,
  sadhanaReportSchema,
  useSadhanaReport,
  useUpsertSadhanaReport,
} from '@sadhana-connect/sadhana'
import { getLocalDateIso } from '@sadhana-connect/shared'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { ScrollView, StyleSheet } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Accordion, useSectionAccent } from '../../../src/presentation/components/Accordion'
import { Button } from '../../../src/presentation/components/Button'
import { DateTimeField } from '../../../src/presentation/components/DateTimeField'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { NumberField } from '../../../src/presentation/components/NumberField'
import { StickyFooterBar } from '../../../src/presentation/components/StickyFooterBar'
import { TextField } from '../../../src/presentation/components/TextField'
import { spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

type SectionKey = 'chanting' | 'reading' | 'hearing' | 'rest' | 'schedule' | 'details'
type ExpandedState = Record<SectionKey, boolean>

function parsePrefillRoundsParam(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}

function isPositive(value: string): boolean {
  return Number(value) > 0
}

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
  sleepTime: 'rest',
  wakeTime: 'rest',
  dayRestMinutes: 'rest',
  totalRestMinutes: 'rest',
  officeGoingTime: 'schedule',
  officeReturnTime: 'schedule',
  notes: 'details',
  signatureText: 'details',
}

// "Contains existing data" per section — numeric fields count as having
// data only when > 0 (reportToFormValues always stringifies a 0 as
// "0", so a bare non-empty check would mark every numeric field as
// populated on every existing report). Time/text fields count as having
// data when non-empty, since they're '' exactly when unset.
function computeInitialExpanded(
  isEditingMode: boolean,
  base: SadhanaReportFormInput,
): ExpandedState {
  if (!isEditingMode) {
    return {
      chanting: true,
      reading: false,
      hearing: false,
      rest: false,
      schedule: false,
      details: false,
    }
  }
  return {
    chanting:
      isPositive(base.roundsBefore430) ||
      isPositive(base.roundsTill7am) ||
      isPositive(base.totalRounds) ||
      base.lastRoundTime !== '',
    reading: isPositive(base.readingMinutes) || base.bookName !== '',
    hearing: isPositive(base.hearingMinutes) || base.speakerName !== '',
    rest:
      base.sleepTime !== '' ||
      base.wakeTime !== '' ||
      isPositive(base.dayRestMinutes) ||
      isPositive(base.totalRestMinutes),
    schedule: base.officeGoingTime !== '' || base.officeReturnTime !== '',
    details: base.notes !== '',
  }
}

export default function SadhanaFormScreen() {
  const params = useLocalSearchParams<{ date?: string; prefillRounds?: string }>()
  const date = params.date ?? getLocalDateIso()
  const prefillRounds = parsePrefillRoundsParam(params.prefillRounds)
  const existingReport = useSadhanaReport(date)

  if (existingReport.isPending) {
    return <LoadingScreen />
  }

  return (
    <SadhanaFormBody date={date} existingReport={existingReport.data ?? null} prefillRounds={prefillRounds} />
  )
}

function SadhanaFormBody({
  date,
  existingReport,
  prefillRounds,
}: {
  date: string
  existingReport: ReturnType<typeof useSadhanaReport>['data']
  // Set only when arriving from the Japa Counter's "Use in Sadhana"
  // action — an explicitly devotee-chosen initial value for Total
  // Rounds, matching web's SadhanaReportForm.
  prefillRounds?: number
}) {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const chantingAccent = useSectionAccent('chanting')
  const readingAccent = useSectionAccent('reading')
  const hearingAccent = useSectionAccent('hearing')
  const restAccent = useSectionAccent('rest')
  const scheduleAccent = useSectionAccent('schedule')
  const upsertReport = useUpsertSadhanaReport()
  const isEditingMode = Boolean(existingReport)

  const base = existingReport ? reportToFormValues(existingReport) : emptyFormValues(date)
  const defaultValues = prefillRounds !== undefined ? { ...base, totalRounds: String(prefillRounds) } : base

  const { control, handleSubmit } = useForm<SadhanaReportFormInput>({
    resolver: zodResolver(sadhanaReportSchema),
    defaultValues,
  })

  const [expanded, setExpanded] = useState<ExpandedState>(() =>
    computeInitialExpanded(isEditingMode, defaultValues),
  )
  const toggleSection = (key: SectionKey) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))

  const totalRounds = useWatch({ control, name: 'totalRounds' })
  const readingMinutes = useWatch({ control, name: 'readingMinutes' })
  const hearingMinutes = useWatch({ control, name: 'hearingMinutes' })
  const dayRestMinutes = useWatch({ control, name: 'dayRestMinutes' })
  const totalRestMinutes = useWatch({ control, name: 'totalRestMinutes' })
  const officeGoingTime = useWatch({ control, name: 'officeGoingTime' })
  const officeReturnTime = useWatch({ control, name: 'officeReturnTime' })

  const chantingSummary = isPositive(totalRounds ?? '') ? `${totalRounds} rounds` : 'Not logged'
  const readingSummary = isPositive(readingMinutes ?? '') ? `${readingMinutes} min` : 'Not logged'
  const hearingSummary = isPositive(hearingMinutes ?? '') ? `${hearingMinutes} min` : 'Not logged'
  const restSummary = isPositive(totalRestMinutes ?? '')
    ? `${totalRestMinutes} hr total rest`
    : isPositive(dayRestMinutes ?? '')
      ? `${dayRestMinutes} min day rest`
      : 'Not logged'
  const scheduleSummary =
    (officeGoingTime ?? '') !== '' || (officeReturnTime ?? '') !== '' ? 'Office hours set' : 'Not logged'

  const onSubmit = handleSubmit(
    (values) => {
      upsertReport.mutate(formValuesToUpsertParams(values), {
        onSuccess: () => router.back(),
      })
    },
    (errors) => {
      // A field inside a collapsed section (e.g. Signature, in Details)
      // can fail validation with nothing on screen to show it — expand
      // every section that has an invalid field so its inline error
      // text becomes visible.
      const invalidFields = Object.keys(errors) as (keyof typeof FIELD_SECTION)[]
      const sectionsToExpand = new Set(invalidFields.map((field) => FIELD_SECTION[field]))
      setExpanded((prev) => {
        const next = { ...prev }
        for (const section of sectionsToExpand) {
          if (section) next[section] = true
        }
        return next
      })
    },
  )

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        {upsertReport.isError ? (
          <ErrorBanner message="Something went wrong saving your sadhana. Please try again." />
        ) : null}

        <DateTimeField control={control} name="reportDate" label="Date" mode="date" />

        <Accordion
          title="Chanting"
          accent={chantingAccent}
          expanded={expanded.chanting}
          onToggle={() => toggleSection('chanting')}
          summary={chantingSummary}
        >
          <NumberField
            control={control}
            name="roundsBefore430"
            label="Rounds before 4:30 AM"
            showStepper
            quickAmounts={[1, 2, 4]}
          />
          <NumberField
            control={control}
            name="roundsTill7am"
            label="Rounds till 7 AM"
            showStepper
            quickAmounts={[4, 8, 16]}
          />
          <DateTimeField control={control} name="lastRoundTime" label="Last Round Time" mode="time" clearable />
          <NumberField
            control={control}
            name="totalRounds"
            label="Total Rounds"
            showStepper
            quickAmounts={[8, 16, 25]}
          />
        </Accordion>

        <Accordion
          title="Reading"
          accent={readingAccent}
          expanded={expanded.reading}
          onToggle={() => toggleSection('reading')}
          summary={readingSummary}
        >
          <NumberField
            control={control}
            name="readingMinutes"
            label="Reading Minutes"
            quickAmounts={[10, 15, 30, 60]}
          />
          <TextField control={control} name="bookName" label="Book Name" />
        </Accordion>

        <Accordion
          title="Hearing"
          accent={hearingAccent}
          expanded={expanded.hearing}
          onToggle={() => toggleSection('hearing')}
          summary={hearingSummary}
        >
          <TextField control={control} name="hearingMinutes" label="Hearing Minutes" keyboardType="numeric" />
          <TextField control={control} name="speakerName" label="Speaker Name" />
        </Accordion>

        <Accordion
          title="Rest & Sleep"
          accent={restAccent}
          expanded={expanded.rest}
          onToggle={() => toggleSection('rest')}
          summary={restSummary}
        >
          <DateTimeField control={control} name="sleepTime" label="Sleep Time" mode="time" clearable />
          <DateTimeField control={control} name="wakeTime" label="Wake Up" mode="time" clearable />
          <TextField control={control} name="dayRestMinutes" label="Day Rest (minutes)" keyboardType="numeric" />
          <TextField control={control} name="totalRestMinutes" label="Total Rest (hours)" keyboardType="numeric" />
        </Accordion>

        <Accordion
          title="Schedule"
          accent={scheduleAccent}
          expanded={expanded.schedule}
          onToggle={() => toggleSection('schedule')}
          summary={scheduleSummary}
        >
          <DateTimeField control={control} name="officeGoingTime" label="Office Going" mode="time" clearable />
          <DateTimeField control={control} name="officeReturnTime" label="Office Return" mode="time" clearable />
        </Accordion>

        <Accordion
          title="Details"
          expanded={expanded.details}
          onToggle={() => toggleSection('details')}
        >
          <TextField control={control} name="notes" label="Notes" />
          <TextField control={control} name="signatureText" label="Signature" />
        </Accordion>
      </ScrollView>

      <StickyFooterBar>
        <Button
          title={isEditingMode ? 'Update Sadhana' : 'Save Sadhana'}
          pendingTitle={isEditingMode ? 'Updating…' : 'Saving…'}
          isPending={upsertReport.isPending}
          onPress={onSubmit}
        />
      </StickyFooterBar>
    </>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.background,
    },
  })
}
