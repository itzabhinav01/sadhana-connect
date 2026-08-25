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
import { useForm } from 'react-hook-form'
import { ScrollView, StyleSheet, Text } from 'react-native'

import { Button } from '../../../src/presentation/components/Button'
import { DateTimeField } from '../../../src/presentation/components/DateTimeField'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { TextField } from '../../../src/presentation/components/TextField'
import { colors, fontSize, spacing } from '../../../src/shared/theme'

export default function SadhanaFormScreen() {
  const params = useLocalSearchParams<{ date?: string }>()
  const date = params.date ?? getLocalDateIso()
  const existingReport = useSadhanaReport(date)

  if (existingReport.isPending) {
    return <LoadingScreen />
  }

  return <SadhanaFormBody date={date} existingReport={existingReport.data ?? null} />
}

function SadhanaFormBody({
  date,
  existingReport,
}: {
  date: string
  existingReport: ReturnType<typeof useSadhanaReport>['data']
}) {
  const router = useRouter()
  const upsertReport = useUpsertSadhanaReport()
  const isEditingMode = Boolean(existingReport)

  const { control, handleSubmit } = useForm<SadhanaReportFormInput>({
    resolver: zodResolver(sadhanaReportSchema),
    defaultValues: existingReport ? reportToFormValues(existingReport) : emptyFormValues(date),
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
      <TextField control={control} name="roundsBefore430" label="Rounds before 4:30 AM" keyboardType="numeric" />
      <TextField control={control} name="roundsTill7am" label="Rounds till 7 AM" keyboardType="numeric" />
      <DateTimeField control={control} name="lastRoundTime" label="Last Round Time" mode="time" clearable />
      <TextField control={control} name="totalRounds" label="Total Rounds" keyboardType="numeric" />
      <Text style={styles.helperText}>
        Enter the complete number of rounds chanted today — this may include rounds chanted after 7
        AM that aren&apos;t reflected in the fields above.
      </Text>
      <TextField control={control} name="readingMinutes" label="Reading Minutes" keyboardType="numeric" />
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

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: -spacing.sm,
  },
})
