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
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { ScrollView, StyleSheet } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Button } from '../../../src/presentation/components/Button'
import { DateTimeField } from '../../../src/presentation/components/DateTimeField'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { NumberField } from '../../../src/presentation/components/NumberField'
import { TextField } from '../../../src/presentation/components/TextField'
import { spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

function parsePrefillRoundsParam(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
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
  const upsertReport = useUpsertSadhanaReport()
  const isEditingMode = Boolean(existingReport)

  const { control, handleSubmit } = useForm<SadhanaReportFormInput>({
    resolver: zodResolver(sadhanaReportSchema),
    defaultValues: (() => {
      const base = existingReport ? reportToFormValues(existingReport) : emptyFormValues(date)
      return prefillRounds !== undefined ? { ...base, totalRounds: String(prefillRounds) } : base
    })(),
  })

  const onSubmit = handleSubmit((values) => {
    upsertReport.mutate(formValuesToUpsertParams(values), {
      onSuccess: () => router.back(),
    })
  })

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {upsertReport.isError ? (
        <ErrorBanner message="Something went wrong saving your sadhana. Please try again." />
      ) : null}

      <DateTimeField control={control} name="reportDate" label="Date" mode="date" />
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
      <NumberField
        control={control}
        name="readingMinutes"
        label="Reading Minutes"
        quickAmounts={[10, 15, 30, 60]}
      />
      <TextField control={control} name="bookName" label="Book Name" />
      <TextField control={control} name="hearingMinutes" label="Hearing Minutes" keyboardType="numeric" />
      <TextField control={control} name="speakerName" label="Speaker Name" />
      <DateTimeField control={control} name="sleepTime" label="Sleep Time" mode="time" clearable />
      <DateTimeField control={control} name="wakeTime" label="Wake Up" mode="time" clearable />
      <TextField control={control} name="dayRestMinutes" label="Day Rest (minutes)" keyboardType="numeric" />
      <TextField control={control} name="totalRestMinutes" label="Total Rest (minutes)" keyboardType="numeric" />
      <DateTimeField control={control} name="officeGoingTime" label="Office Going" mode="time" clearable />
      <DateTimeField control={control} name="officeReturnTime" label="Office Return" mode="time" clearable />
      <TextField control={control} name="notes" label="Notes" />
      <TextField control={control} name="signatureText" label="Signature" />

      <Button
        title={isEditingMode ? 'Update Sadhana' : 'Save Sadhana'}
        pendingTitle={isEditingMode ? 'Updating…' : 'Saving…'}
        isPending={upsertReport.isPending}
        onPress={onSubmit}
      />
    </ScrollView>
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
