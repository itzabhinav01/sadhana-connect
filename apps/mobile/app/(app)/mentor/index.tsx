import {
  MENTOR_DEVOTEE_FILTERS,
  extractMentorDevoteeGroups,
  filterMentorDevotees,
  filterMentorDevoteesByGroup,
  useMentorDevotees,
  type MentorDevoteeFilter,
  type MentorDevoteeSummary,
  type MentorGroupFilter,
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
  const groups = summary.templeGroups ?? []

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
      {groups.length > 0 ? (
        <View style={styles.groupBadgeRow}>
          {groups.map((group) => (
            <View key={group.id} style={styles.groupBadge}>
              <Text style={styles.groupBadgeText}>{group.name}</Text>
            </View>
          ))}
        </View>
      ) : null}
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
  const [groupFilter, setGroupFilter] = useState<MentorGroupFilter>('all')
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
            size="sm"
            onPress={() => router.push('/profile')}
            variant="outline"
          />
          <HeaderThemeToggle />
          <Button
            title="Sign Out"
            pendingTitle="…"
            size="sm"
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
  const groupOptions = extractMentorDevoteeGroups(summaries)
  const ungroupedCount = summaries.filter((s) => (s.templeGroups ?? []).length === 0).length
  const groupFilteredSummaries = filterMentorDevoteesByGroup(summaries, groupFilter)
  const activeGroupName =
    groupFilter === 'all'
      ? null
      : groupFilter === 'ungrouped'
        ? 'Ungrouped'
        : (groupOptions.find((g) => g.id === groupFilter)?.name ?? null)

  const statusFiltered = filterMentorDevotees(groupFilteredSummaries, filter)
  const searchTerm = search.trim().toLowerCase()
  const visibleSummaries = searchTerm
    ? statusFiltered.filter((summary) => summary.fullName.toLowerCase().includes(searchTerm))
    : statusFiltered

  const totalAssigned = groupFilteredSummaries.length
  const submittedYesterday = groupFilteredSummaries.filter(
    (summary) => summary.hasSubmittedYesterday,
  ).length
  const pendingYesterday = totalAssigned - submittedYesterday

  const effectiveSelectedIds = selectedDevoteeIds ?? groupFilteredSummaries.map((s) => s.devoteeId)

  const handleSelectGroupFilter = (nextGroup: MentorGroupFilter) => {
    setGroupFilter(nextGroup)
    const nextGroupDevotees = filterMentorDevoteesByGroup(summaries, nextGroup)
    setSelectedDevoteeIds(nextGroupDevotees.map((s) => s.devoteeId))
    setAiStatusMessage(null)
  }

  const toggleDevoteeSelection = (devoteeId: string) => {
    setAiStatusMessage(null)
    setSelectedDevoteeIds((prev) => {
      const current = prev ?? groupFilteredSummaries.map((s) => s.devoteeId)
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
          groupNames: (s.templeGroups ?? []).map((g) => g.name),
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
        selectedGroupName: activeGroupName,
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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
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
          {/* Compact 3-Stat Overview Strip */}
          <View style={styles.overviewCard}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalAssigned}</Text>
              <Text style={styles.statLabel}>Total Assigned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {submittedYesterday}
              </Text>
              <Text style={styles.statLabel}>Submitted Yesterday</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {pendingYesterday}
              </Text>
              <Text style={styles.statLabel}>Pending Yesterday</Text>
            </View>
          </View>

          {/* Compact Single-Row Collapsible AI Analysis Banner */}
          <View style={styles.aiBanner}>
            <View style={styles.aiBannerHeader}>
              <View style={styles.aiBannerTitleGroup}>
                <Text style={styles.aiBannerTitle}>AI Sadhana Analysis</Text>
                <Text style={styles.aiBannerSubtitle}>
                  {activeGroupName ? `${activeGroupName} · ` : ''}
                  {effectiveSelectedIds.length}/{summaries.length} devotees · ChatGPT, Gemini, Claude
                </Text>
              </View>
              <Button
                title={aiExpanded ? 'Close' : 'Analyze'}
                size="sm"
                variant={aiExpanded ? 'outline' : 'primary'}
                onPress={() => setAiExpanded((prev) => !prev)}
              />
            </View>

            {aiExpanded ? (
              <View style={styles.aiContainer}>
                <View style={styles.aiDivider} />
                <Text style={styles.aiSectionLabel}>1. Date Range</Text>
                <View style={styles.filterRow}>
                  {AI_RANGE_PRESETS.map((preset) => (
                    <Button
                      key={preset.days}
                      title={preset.label}
                      size="sm"
                      variant={aiDays === preset.days ? 'primary' : 'outline'}
                      onPress={() => setAiDays(preset.days)}
                    />
                  ))}
                </View>

                <View style={styles.aiDevoteeHeader}>
                  <Text style={styles.aiSectionLabel}>
                    2. Devotees ({effectiveSelectedIds.length} selected)
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

                {groupOptions.length > 0 ? (
                  <View style={styles.devoteeChipWrap}>
                    {groupOptions.map((group) => {
                      const groupDevoteeIds = filterMentorDevoteesByGroup(
                        summaries,
                        group.id,
                      ).map((s) => s.devoteeId)
                      const isGroupExactMatch =
                        effectiveSelectedIds.length === groupDevoteeIds.length &&
                        groupDevoteeIds.every((id) => effectiveSelectedIds.includes(id))
                      return (
                        <Pressable
                          key={group.id}
                          onPress={() => handleSelectGroupFilter(group.id)}
                          style={[
                            styles.devoteeChip,
                            isGroupExactMatch ? styles.devoteeChipSelected : null,
                          ]}
                          accessibilityRole="button"
                        >
                          <Text
                            style={[
                              styles.devoteeChipText,
                              isGroupExactMatch ? styles.devoteeChipTextSelected : null,
                            ]}
                          >
                            Group: {group.name} ({group.count})
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                ) : null}

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
                      size="sm"
                      variant="primary"
                      disabled={aiBusy || effectiveSelectedIds.length === 0}
                      onPress={() => void handleLaunchMentorAi(provider)}
                    />
                  ))}
                  <Button
                    title="Copy Prompt"
                    size="sm"
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
          </View>

          {/* Youth Groups — Clean Horizontal Scroll Strip */}
          {groupOptions.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalFilterStrip}
            >
              <Pressable
                onPress={() => handleSelectGroupFilter('all')}
                style={[
                  styles.devoteeChip,
                  groupFilter === 'all' ? styles.devoteeChipSelected : null,
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.devoteeChipText,
                    groupFilter === 'all' ? styles.devoteeChipTextSelected : null,
                  ]}
                >
                  All Groups ({summaries.length})
                </Text>
              </Pressable>
              {groupOptions.map((group) => {
                const isSelected = groupFilter === group.id
                return (
                  <Pressable
                    key={group.id}
                    onPress={() => handleSelectGroupFilter(group.id)}
                    style={[
                      styles.devoteeChip,
                      isSelected ? styles.devoteeChipSelected : null,
                    ]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.devoteeChipText,
                        isSelected ? styles.devoteeChipTextSelected : null,
                      ]}
                    >
                      {group.name} ({group.count})
                    </Text>
                  </Pressable>
                )
              })}
              {ungroupedCount > 0 ? (
                <Pressable
                  onPress={() => handleSelectGroupFilter('ungrouped')}
                  style={[
                    styles.devoteeChip,
                    groupFilter === 'ungrouped' ? styles.devoteeChipSelected : null,
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.devoteeChipText,
                      groupFilter === 'ungrouped' ? styles.devoteeChipTextSelected : null,
                    ]}
                  >
                    Ungrouped ({ungroupedCount})
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>
          ) : null}

          {/* Search Input */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search devotees by name…"
            placeholderTextColor={colors.placeholder ?? colors.muted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            accessibilityLabel="Search devotees by name"
          />

          {/* Single-Row Horizontal Scrollable Status Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalFilterStrip}
          >
            {MENTOR_DEVOTEE_FILTERS.map((option) => (
              <Button
                key={option}
                title={FILTER_LABELS[option]}
                size="sm"
                variant={filter === option ? 'primary' : 'outline'}
                onPress={() => setFilter(option)}
              />
            ))}
          </ScrollView>

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
        size="sm"
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
      gap: spacing.sm + 2,
      backgroundColor: colors.background,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    header: {
      gap: 1,
    },
    eyebrow: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.primary,
    },
    headerTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    overviewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: 'stretch',
      backgroundColor: colors.border,
    },
    stat: {
      flex: 1,
      alignItems: 'center',
      gap: 1,
    },
    statLabel: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      textAlign: 'center',
    },
    statValue: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    aiBanner: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    aiBannerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    aiBannerTitleGroup: {
      flex: 1,
      gap: 1,
    },
    aiBannerTitle: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    aiBannerSubtitle: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    aiDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    horizontalFilterStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: 2,
    },
    aiContainer: {
      gap: spacing.sm,
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
      backgroundColor: colors.card,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 4,
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
    },
    row: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      gap: 3,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    rowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.xs,
    },
    rowName: {
      fontSize: fontSize.base,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
      flexShrink: 1,
    },
    groupBadgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginVertical: 1,
    },
    groupBadge: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      borderWidth: 0.5,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    groupBadgeText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.medium,
      color: colors.primary,
    },
    rowMuted: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    badgeSubmitted: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.success,
    },
    badgePending: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.warning,
    },
  })
}
