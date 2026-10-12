import { zodResolver } from '@hookform/resolvers/zod'
import {
  type CustomSadhanaSection,
  type SadhanaReportFormInput,
  emptyFormValues,
  formValuesToUpsertParams,
  reportToFormValues,
  sadhanaReportSchema,
  useCustomSectionValues,
  useSadhanaReport,
  useSadhanaSectionsConfig,
  useUpsertSadhanaReport,
} from '@sadhana-connect/sadhana'
import { getLocalDateIso } from '@sadhana-connect/shared'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { fontSize, radius } from '../../../src/shared/theme'


import { useTheme } from '../../../src/application/theme/use-theme'
import { Accordion, useSectionAccent } from '../../../src/presentation/components/Accordion'
import { Button } from '../../../src/presentation/components/Button'
import { DateTimeField } from '../../../src/presentation/components/DateTimeField'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { NumberField } from '../../../src/presentation/components/NumberField'
import { SadhanaDateStrip } from '../../../src/presentation/components/SadhanaDateStrip'
import { SadhanaReportComments } from '../../../src/presentation/components/SadhanaReportComments'
import { StickyFooterBar } from '../../../src/presentation/components/StickyFooterBar'
import { TextField } from '../../../src/presentation/components/TextField'
import { spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

type SectionKey = 'chanting' | 'reading' | 'hearing' | 'study' | 'rest' | 'schedule' | 'details'
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
  studyHours: 'study',
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
      study: false,
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
    study: isPositive(base.studyHours),
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
  const params = useLocalSearchParams<{
    date?: string
    prefillRounds?: string
    openComments?: string
  }>()
  const paramDate = params.date ?? getLocalDateIso()
  const [selectedDate, setSelectedDate] = useState(paramDate)
  const [syncedParamDate, setSyncedParamDate] = useState(paramDate)

  if (paramDate !== syncedParamDate) {
    setSyncedParamDate(paramDate)
    setSelectedDate(paramDate)
  }

  const prefillRounds = parsePrefillRoundsParam(params.prefillRounds)
  const existingReport = useSadhanaReport(selectedDate)

  if (existingReport.isPending) {
    return <LoadingScreen />
  }

  return (
    <SadhanaFormBody
      key={`${selectedDate}-${existingReport.data?.id ?? 'new'}-${prefillRounds ?? ''}-${params.openComments ?? ''}`}
      date={selectedDate}
      existingReport={existingReport.data ?? null}
      prefillRounds={prefillRounds}
      initialOpenComments={params.openComments === '1'}
      onDateChange={setSelectedDate}
    />
  )
}

function SadhanaFormBody({
  date,
  existingReport,
  prefillRounds,
  initialOpenComments = false,
  onDateChange,
}: {
  date: string
  existingReport: ReturnType<typeof useSadhanaReport>['data']
  // Set only when arriving from the Japa Counter's "Use in Sadhana"
  // action — an explicitly devotee-chosen initial value for Total
  // Rounds, matching web's SadhanaReportForm.
  prefillRounds?: number
  initialOpenComments?: boolean
  onDateChange: (nextDate: string) => void
}) {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const chantingAccent = useSectionAccent('chanting')
  const readingAccent = useSectionAccent('reading')
  const hearingAccent = useSectionAccent('hearing')
  const studyAccent = useSectionAccent('study')
  const restAccent = useSectionAccent('rest')
  const scheduleAccent = useSectionAccent('schedule')
  const upsertReport = useUpsertSadhanaReport()
  const isEditingMode = Boolean(existingReport)

  const { config: sectionsConfig } = useSadhanaSectionsConfig()
  const { values: customValues, setFieldValue: setCustomFieldValue } = useCustomSectionValues(date)
  const [customExpanded, setCustomExpanded] = useState(false)
  const activeCustomSections = useMemo(
    () => sectionsConfig.customSections.filter((s) => s.enabled),
    [sectionsConfig.customSections],
  )

  const rawBase = existingReport ? reportToFormValues(existingReport) : emptyFormValues(date)
  const base = {
    ...rawBase,
    notes: (rawBase.notes || '').replace(/(?:\r?\n)?\[Additional\]:.*$/s, '').trim(),
  }
  const defaultValues = prefillRounds !== undefined ? { ...base, totalRounds: String(prefillRounds) } : base

  const { control, handleSubmit } = useForm<SadhanaReportFormInput>({
    resolver: zodResolver(sadhanaReportSchema),
    defaultValues,
  })

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

  const [expanded, setExpanded] = useState<ExpandedState>(() =>
    computeInitialExpanded(isEditingMode, defaultValues),
  )
  const [commentsExpanded, setCommentsExpanded] = useState(initialOpenComments)
  const toggleSection = (key: SectionKey) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))

  const totalRounds = useWatch({ control, name: 'totalRounds' })
  const readingMinutes = useWatch({ control, name: 'readingMinutes' })
  const hearingMinutes = useWatch({ control, name: 'hearingMinutes' })
  const studyHours = useWatch({ control, name: 'studyHours' })
  const dayRestMinutes = useWatch({ control, name: 'dayRestMinutes' })
  const totalRestMinutes = useWatch({ control, name: 'totalRestMinutes' })
  const officeGoingTime = useWatch({ control, name: 'officeGoingTime' })
  const officeReturnTime = useWatch({ control, name: 'officeReturnTime' })

  const chantingSummary = isPositive(totalRounds ?? '') ? `${totalRounds} rounds` : 'Not logged'
  const readingSummary = isPositive(readingMinutes ?? '') ? `${readingMinutes} min` : 'Not logged'
  const hearingSummary = isPositive(hearingMinutes ?? '') ? `${hearingMinutes} min` : 'Not logged'
  const studySummary = isPositive(studyHours ?? '') ? `${studyHours} hr` : 'Not logged'
  const restSummary = isPositive(totalRestMinutes ?? '')
    ? `${totalRestMinutes} hr total rest`
    : isPositive(dayRestMinutes ?? '')
      ? `${dayRestMinutes} min day rest`
      : 'Not logged'
  const scheduleSummary =
    (officeGoingTime ?? '') !== '' || (officeReturnTime ?? '') !== '' ? 'Office hours set' : 'Not logged'

  const onSubmit = handleSubmit(
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
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        {upsertReport.isError ? (
          <ErrorBanner message="Something went wrong saving your sadhana. Please try again." />
        ) : null}

        <SadhanaDateStrip
          selectedDate={date}
          hasExistingReport={isEditingMode}
          onSelectDate={onDateChange}
        />

        <DateTimeField
          control={control}
          name="reportDate"
          label="Date"
          mode="date"
          onValueChange={onDateChange}
        />

        {sectionsConfig.standardSections.chanting !== false ? (
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
        ) : null}

        {sectionsConfig.standardSections.reading !== false ? (
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
        ) : null}

        {sectionsConfig.standardSections.hearing !== false ? (
          <Accordion
            title="Hearing"
            accent={hearingAccent}
            expanded={expanded.hearing}
            onToggle={() => toggleSection('hearing')}
            summary={hearingSummary}
          >
            <NumberField
              control={control}
              name="hearingMinutes"
              label="Hearing Minutes"
              quickAmounts={[10, 15, 30, 60]}
            />
            <TextField control={control} name="speakerName" label="Speaker Name" />
          </Accordion>
        ) : null}

        {sectionsConfig.standardSections.study !== false ? (
          <Accordion
            title="Study"
            accent={studyAccent}
            expanded={expanded.study}
            onToggle={() => toggleSection('study')}
            summary={studySummary}
          >
            <NumberField
              control={control}
              name="studyHours"
              label="Study (hours)"
              allowDecimal
              quickAmounts={[1, 2, 3, 4]}
            />
          </Accordion>
        ) : null}

        {sectionsConfig.standardSections.rest !== false ? (
          <Accordion
            title="Rest & Sleep"
            accent={restAccent}
            expanded={expanded.rest}
            onToggle={() => toggleSection('rest')}
            summary={restSummary}
          >
            <DateTimeField control={control} name="sleepTime" label="Sleep Time" mode="time" clearable />
            <DateTimeField control={control} name="wakeTime" label="Wake Up" mode="time" clearable />
            <NumberField
              control={control}
              name="dayRestMinutes"
              label="Day Rest (minutes)"
              quickAmounts={[15, 30, 60]}
            />
            <NumberField
              control={control}
              name="totalRestMinutes"
              label="Total Rest (hours)"
              allowDecimal
              quickAmounts={[5, 6, 7, 8]}
            />
          </Accordion>
        ) : null}

        {sectionsConfig.standardSections.schedule !== false ? (
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
        ) : null}

        {activeCustomSections.length > 0 ? (
          <Accordion
            title="Additional Practices"
            expanded={customExpanded}
            onToggle={() => setCustomExpanded((prev) => !prev)}
            summary={`${activeCustomSections.length} practice${activeCustomSections.length > 1 ? 's' : ''}`}
          >
            {activeCustomSections.map((sec) => (
              <CustomSectionFieldRow
                key={sec.id}
                section={sec}
                value={customValues[sec.id]}
                onChange={(val) => void setCustomFieldValue(sec.id, val)}
              />
            ))}
          </Accordion>
        ) : null}

        {sectionsConfig.standardSections.details !== false ? (
          <Accordion
            title="Details"
            expanded={expanded.details}
            onToggle={() => toggleSection('details')}
          >
            <TextField control={control} name="notes" label="Notes" />
            <TextField control={control} name="signatureText" label="Signature" />
          </Accordion>
        ) : null}

        {existingReport ? (
          <Accordion
            title="Mentor Comments"
            expanded={commentsExpanded}
            onToggle={() => setCommentsExpanded((prev) => !prev)}
            summary="Tap to view mentor feedback"
          >
            <SadhanaReportComments sadhanaReportId={existingReport.id} />
          </Accordion>
        ) : null}

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
      flexGrow: 1,
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.background,
    },
  })
}

function CustomSectionFieldRow({
  section,
  value,
  onChange,
}: {
  section: CustomSadhanaSection
  value: any
  onChange: (val: any) => void
}) {
  const { colors } = useTheme()
  const label = `${section.title}${section.unit ? ` (${section.unit})` : ''}`

  if (section.fieldType === 'boolean') {
    const isChecked = Boolean(value)
    return (
      <View style={customFieldStyles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={[customFieldStyles.label, { color: colors.foreground }]}>{section.title}</Text>
          {section.description ? (
            <Text style={[customFieldStyles.desc, { color: colors.muted }]}>{section.description}</Text>
          ) : null}
        </View>
        <Switch
          value={isChecked}
          onValueChange={onChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.card}
          accessibilityLabel={section.title}
        />
      </View>
    )
  }

  return (
    <View style={customFieldStyles.fieldCol}>
      <Text style={[customFieldStyles.label, { color: colors.foreground }]}>{label}</Text>
      {section.description ? (
        <Text style={[customFieldStyles.desc, { color: colors.muted }]}>{section.description}</Text>
      ) : null}
      <TextInput
        style={[
          customFieldStyles.input,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
        value={value !== undefined && value !== null ? String(value) : ''}
        onChangeText={onChange}
        keyboardType={
          section.fieldType === 'number'
            ? 'number-pad'
            : section.fieldType === 'decimal'
              ? 'decimal-pad'
              : 'default'
        }
        placeholder={section.unit ? `e.g. 15 ${section.unit}` : 'Enter value'}
        placeholderTextColor={colors.muted}
      />
    </View>
  )
}

const customFieldStyles = StyleSheet.create({
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  fieldCol: {
    gap: 4,
    paddingVertical: 6,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  desc: {
    fontSize: fontSize.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.sm,
  },
})

