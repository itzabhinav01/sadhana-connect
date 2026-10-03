import {
  MENTOR_DEVOTEE_FILTERS,
  filterMentorDevotees,
  useMentorDevotees,
  type MentorDevoteeFilter,
  type MentorDevoteeSummary,
} from '@sadhana-connect/mentor'
import { useProfile } from '@sadhana-connect/auth'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'
import {
  AI_PROVIDERS,
  AI_PROVIDER_LABELS,
  buildAiProviderUrl,
  buildSadhanaAiPrompt,
  getLastNDaysRange,
  type AiProvider,
} from '@sadhana-connect/sadhana'
import * as Clipboard from 'expo-clipboard'
import { useNavigation, useRouter } from 'expo-router'
import { useLayoutEffect, useMemo, useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { useSignOut } from '../../../src/application/auth/use-sign-out'
import { AppUpdateSection } from '../../../src/presentation/components/AppUpdateSection'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { HeaderThemeToggle } from '../../../src/presentation/components/HeaderThemeToggle'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

const FILTER_LABELS: Record<MentorDevoteeFilter, string> = {
  all: 'All',
  submitted: 'Submitted Yesterday',
  pending: 'Pending Yesterday',
  submitted_today: 'Submitted Today',
  needs_attention: 'Needs Attention',
}

const AI_RANGE_PRESETS = [
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
] as const

function formatDisplayDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

function DevoteeSummaryRow({ summary }: { summary: MentorDevoteeSummary }) {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable
      onPress={() => router.push(`/mentor/devotee/${summary.devoteeId}`)}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`View ${summary.fullName}`}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.rowName}>{summary.fullName}</Text>
        <Text style={summary.hasSubmittedYesterday ? styles.badgeSubmitted : styles.badgePending}>
          {summary.hasSubmittedYesterday ? 'Yesterday Logged' : 'Yesterday Pending'}
        </Text>
      </View>
      <Text style={styles.rowMuted}>
        {summary.yesterdayTotalRounds !== null
          ? `${summary.yesterdayTotalRounds} rounds yesterday`
          : 'No report for yesterday'}
        {summary.hasSubmittedToday ? ` • Today: ${summary.todayTotalRounds} rounds` : ''}
      </Text>
      <Text style={styles.rowMuted}>
        Last report:{' '}
        {summary.lastReportDate ? formatDisplayDate(summary.lastReportDate) : 'No reports yet'}
      </Text>
    </Pressable>
  )
}

export default function MentorDashboardScreen() {
  const signOut = useSignOut()
  const router = useRouter()
  const navigation = useNavigation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [filter, setFilter] = useState<MentorDevoteeFilter>('all')
  const [search, setSearch] = useState('')
  const [aiExpanded, setAiExpanded] = useState(false)
  const [aiDays, setAiDays] = useState<number>(7)
  const [selectedDevoteeIds, setSelectedDevoteeIds] = useState<string[] | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null)

  const devoteesQuery = useMentorDevotees()

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    })
  }

  const profile = useProfile()
  const userName = profile.data?.fullName

  // The Devotees tab is the one screen that also shows Profile & Sign Out in its
  // header (every other tab just gets the ThemeToggle set at the Tabs
  // navigator level) — set via navigation.setOptions rather than a
  // <Stack.Screen> override, which only applies inside an actual Stack
  // navigator and is a no-op here now that this route is hosted by a
  // Tabs layout.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <Button
            title="Profile"
            onPress={() => router.push('/profile')}
            variant="outline"
          />
          <HeaderThemeToggle />
          <Button
            title="Sign Out"
            pendingTitle="…"
            isPending={signOut.isPending}
            onPress={handleSignOut}
            variant="outline"
          />
        </View>
      ),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleSignOut is recreated every render but is stable in effect; re-running per signOut.isPending is what actually needs to trigger the re-render of the header button.
  }, [navigation, styles, signOut.isPending, router])

  if (devoteesQuery.isPending) {
    return <LoadingScreen />
  }

  const summaries = devoteesQuery.data ?? []
  const statusFiltered = filterMentorDevotees(summaries, filter)
  const searchTerm = search.trim().toLowerCase()
  const visibleSummaries = searchTerm
    ? statusFiltered.filter((summary) => summary.fullName.toLowerCase().includes(searchTerm))
    : statusFiltered

  const totalAssigned = summaries.length
  const submittedYesterday = summaries.filter((summary) => summary.hasSubmittedYesterday).length
  const pendingYesterday = totalAssigned - submittedYesterday

  const effectiveSelectedIds = selectedDevoteeIds ?? summaries.map((s) => s.devoteeId)

  const toggleDevoteeSelection = (devoteeId: string) => {
    setAiStatusMessage(null)
    setSelectedDevoteeIds((prev) => {
      const current = prev ?? summaries.map((s) => s.devoteeId)
      return current.includes(devoteeId)
        ? current.filter((id) => id !== devoteeId)
        : [...current, devoteeId]
    })
  }

  async function buildMentorPrompt(): Promise<string | null> {
    const chosenSummaries = summaries.filter((s) => effectiveSelectedIds.includes(s.devoteeId))
    if (chosenSummaries.length === 0) {
      setAiStatusMessage('Select at least one devotee to analyze.')
      return null
    }
    setAiBusy(true)
    setAiStatusMessage(null)
    try {
      const range = getLastNDaysRange(aiDays)
      const devotees = await Promise.all(
        chosenSummaries.map(async (s) => ({
          devoteeName: s.fullName,
          reports: await supabaseSadhanaReportRepository.listFullReportsInRange(
            s.devoteeId,
            range.fromDate,
            range.toDate,
          ),
        })),
      )
      return buildSadhanaAiPrompt({
        fromDate: range.fromDate,
        toDate: range.toDate,
        devotees,
      })
    } catch {
      setAiStatusMessage('Could not load Sadhana reports for AI analysis.')
      return null
    } finally {
      setAiBusy(false)
    }
  }

  async function handleLaunchMentorAi(provider: AiProvider) {
    const prompt = await buildMentorPrompt()
    if (!prompt) return
    try {
      await Clipboard.setStringAsync(prompt)
    } catch {
      // Ignore clipboard failure if opening URL succeeds
    }
    setAiStatusMessage(`Prompt copied & opening ${AI_PROVIDER_LABELS[provider]}…`)
    try {
      await Linking.openURL(buildAiProviderUrl(provider, prompt))
    } catch {
      setAiStatusMessage('Prompt copied to clipboard! Paste it into your AI app.')
    }
  }

  async function handleCopyMentorAiPrompt() {
    const prompt = await buildMentorPrompt()
    if (!prompt) return
    try {
      await Clipboard.setStringAsync(prompt)
      setAiStatusMessage('AI analysis prompt copied to clipboard!')
    } catch {
      setAiStatusMessage('Could not copy prompt to clipboard.')
    }
  }

  return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            Hare Krishna{userName ? `, ${userName}` : ''} (Mentor) 🙏
          </Text>
          <Text style={styles.headerTitle}>Your devotees at a glance</Text>
        </View>

        {devoteesQuery.isError ? (
          <ErrorBanner message="Something went wrong loading your devotees. Please try again." />
        ) : null}

        {devoteesQuery.isSuccess && summaries.length === 0 ? (
          <Text style={styles.rowMuted}>No devotees are currently assigned to you.</Text>
        ) : null}

        {devoteesQuery.isSuccess && summaries.length > 0 ? (
          <>
            <Card title="Overview">
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{totalAssigned}</Text>
                  <Text style={styles.statLabel}>Total Assigned</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{submittedYesterday}</Text>
                  <Text style={styles.statLabel}>Submitted Yesterday</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{pendingYesterday}</Text>
                  <Text style={styles.statLabel}>Pending Yesterday</Text>
                </View>
              </View>
            </Card>

            <Card title="AI Sadhana Analysis (Mentor Mode)">
              <Text style={styles.rowMuted}>
                Analyze one or multiple devotees&apos; Sadhana logs with ChatGPT, Gemini, or Claude.
              </Text>
              <Button
                title={
                  aiExpanded
                    ? 'Hide AI Analysis Options'
                    : `Configure AI Analysis (${effectiveSelectedIds.length}/${summaries.length} devotees)`
                }
                variant="outline"
                onPress={() => setAiExpanded((prev) => !prev)}
              />
              {aiExpanded ? (
                <View style={styles.aiContainer}>
                  <Text style={styles.aiSectionLabel}>1. Select Date Range</Text>
                  <View style={styles.filterRow}>
                    {AI_RANGE_PRESETS.map((preset) => (
                      <Button
                        key={preset.days}
                        title={preset.label}
                        variant={aiDays === preset.days ? 'primary' : 'outline'}
                        onPress={() => setAiDays(preset.days)}
                      />
                    ))}
                  </View>

                  <View style={styles.aiDevoteeHeader}>
                    <Text style={styles.aiSectionLabel}>
                      2. Select Devotees ({effectiveSelectedIds.length} selected)
                    </Text>
                    <View style={styles.aiQuickSelectRow}>
                      <Pressable
                        onPress={() => setSelectedDevoteeIds(summaries.map((s) => s.devoteeId))}
                        accessibilityRole="button"
                      >
                        <Text style={styles.aiQuickActionText}>Select All</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setSelectedDevoteeIds([])}
                        accessibilityRole="button"
                      >
                        <Text style={styles.aiQuickActionText}>Clear</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.devoteeChipWrap}>
                    {summaries.map((summary) => {
                      const isSelected = effectiveSelectedIds.includes(summary.devoteeId)
                      return (
                        <Pressable
                          key={summary.devoteeId}
                          onPress={() => toggleDevoteeSelection(summary.devoteeId)}
                          style={[
                            styles.devoteeChip,
                            isSelected ? styles.devoteeChipSelected : null,
                          ]}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isSelected }}
                        >
                          <Text
                            style={[
                              styles.devoteeChipText,
                              isSelected ? styles.devoteeChipTextSelected : null,
                            ]}
                          >
                            {isSelected ? '✓ ' : ''}
                            {summary.fullName}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>

                  <Text style={styles.aiSectionLabel}>3. Open in AI Assistant</Text>
                  <View style={styles.filterRow}>
                    {AI_PROVIDERS.map((provider) => (
                      <Button
                        key={provider}
                        title={AI_PROVIDER_LABELS[provider]}
                        variant="primary"
                        disabled={aiBusy || effectiveSelectedIds.length === 0}
                        onPress={() => void handleLaunchMentorAi(provider)}
                      />
                    ))}
                    <Button
                      title="Copy Prompt"
                      variant="outline"
                      disabled={aiBusy || effectiveSelectedIds.length === 0}
                      onPress={() => void handleCopyMentorAiPrompt()}
                    />
                  </View>

                  {aiStatusMessage ? (
                    <Text style={styles.aiStatusText}>{aiStatusMessage}</Text>
                  ) : null}
                </View>
              ) : null}
            </Card>

            <View style={styles.filterRow}>
              {MENTOR_DEVOTEE_FILTERS.map((option) => (
                <Button
                  key={option}
                  title={FILTER_LABELS[option]}
                  variant={filter === option ? 'primary' : 'outline'}
                  onPress={() => setFilter(option)}
                />
              ))}
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search by name"
              placeholderTextColor={colors.placeholder ?? colors.muted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              accessibilityLabel="Search devotees by name"
            />

            {visibleSummaries.length === 0 ? (
              <Text style={styles.rowMuted}>No devotees match this filter.</Text>
            ) : (
              visibleSummaries.map((summary) => (
                <DevoteeSummaryRow key={summary.devoteeId} summary={summary} />
              ))
            )}
          </>
        ) : null}

        <Button
          title="Announcements"
          variant="outline"
          onPress={() => router.push('/mentor/announcements')}
        />

        <AppUpdateSection />
      </ScrollView>
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
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    header: {
      gap: 2,
      paddingBottom: spacing.xs,
    },
    eyebrow: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.primary,
    },
    headerTitle: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    stat: {
      flex: 1,
      alignItems: 'center',
    },
    statLabel: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      textAlign: 'center',
    },
    statValue: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    aiContainer: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    aiSectionLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    aiDevoteeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    aiQuickSelectRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    aiQuickActionText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.primary,
    },
    devoteeChipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    devoteeChip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
    },
    devoteeChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    devoteeChipText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.medium,
      color: colors.foreground,
    },
    devoteeChipTextSelected: {
      color: colors.primary,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
    },
    aiStatusText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.medium,
      color: colors.primary,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
    },
    row: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: 2,
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    rowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowName: {
      fontSize: fontSize.base,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    rowMuted: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    badgeSubmitted: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.success,
    },
    badgePending: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.warning,
    },
  })
}
