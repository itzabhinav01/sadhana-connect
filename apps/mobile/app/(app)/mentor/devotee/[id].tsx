import {
  useDevoteeAssignedSince,
  useDevoteeProfile,
  useDevoteeTodayReport,
} from '@sadhana-connect/mentor'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useLayoutEffect, useMemo } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../../src/application/theme/use-theme'
import { Card } from '../../../../src/presentation/components/Card'
import {
  DevoteeSadhanaHistorySection,
  ReadOnlyReportRow,
} from '../../../../src/presentation/components/DevoteeSadhanaHistorySection'
import { ErrorBanner } from '../../../../src/presentation/components/ErrorBanner'
import { Icon } from '../../../../src/presentation/components/Icon'
import { LoadingScreen } from '../../../../src/presentation/components/LoadingScreen'
import { ReminderForm } from '../../../../src/presentation/components/ReminderForm'
import { fontFamily, fontSize, radius, spacing } from '../../../../src/shared/theme'
import type { ThemeColors } from '../../../../src/shared/theme'

function formatDisplayDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

export default function MentorDevoteeDetailScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { id } = useLocalSearchParams<{ id: string }>()
  const devoteeId = id ?? ''
  const navigation = useNavigation()

  const profileQuery = useDevoteeProfile(devoteeId)
  const todayReportQuery = useDevoteeTodayReport(devoteeId)
  const assignedSinceQuery = useDevoteeAssignedSince(devoteeId)

  // This route is a hidden (href: null) screen inside the mentor Tabs
  // layout, not a Stack screen, so <Stack.Screen> can't set its title —
  // navigation.setOptions is the navigator-agnostic equivalent.
  useLayoutEffect(() => {
    if (profileQuery.data) {
      navigation.setOptions({ title: profileQuery.data.fullName })
    }
  }, [navigation, profileQuery.data])

  if (profileQuery.isPending) {
    return <LoadingScreen />
  }

  if (profileQuery.isError) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message="Something went wrong loading this devotee. Please try again." />
      </View>
    )
  }

  if (profileQuery.data === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.rowMuted}>This devotee isn&apos;t available.</Text>
      </View>
    )
  }

  const profile = profileQuery.data

  const handleOpenWhatsApp = () => {
    if (!profile.phoneNumber) return
    const cleanNumber = profile.phoneNumber.replace(/[^0-9]/g, '')
    Linking.openURL(`https://wa.me/${cleanNumber}`)
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.heading} accessibilityRole="header">
            {profile.fullName}
          </Text>
          {assignedSinceQuery.data ? (
            <Text style={styles.rowMuted}>
              Assigned since {formatDisplayDate(assignedSinceQuery.data.slice(0, 10))}
            </Text>
          ) : null}
          <Text style={styles.rowMuted}>Phone: {profile.phoneNumber ?? 'Not provided'}</Text>
        </View>

        {profile.phoneNumber ? (
          <Pressable
            style={styles.whatsappButton}
            onPress={handleOpenWhatsApp}
            accessibilityRole="button"
            accessibilityLabel={`Chat with ${profile.fullName} on WhatsApp`}
          >
            <Icon name="logo-whatsapp" size={20} color="#ffffff" />
            <Text style={styles.whatsappButtonText}>Chat on WhatsApp</Text>
          </Pressable>
        ) : null}
      </View>

      <Card title="Today's Sadhana">
        {todayReportQuery.isPending ? <Text style={styles.rowMuted}>Loading…</Text> : null}
        {todayReportQuery.isError ? (
          <ErrorBanner message="Something went wrong loading today's report." />
        ) : null}
        {todayReportQuery.isSuccess && todayReportQuery.data === null ? (
          <Text style={styles.rowMuted}>Not submitted yet today.</Text>
        ) : null}
        {todayReportQuery.isSuccess && todayReportQuery.data ? (
          <ReadOnlyReportRow report={todayReportQuery.data} showComments />
        ) : null}
      </Card>

      <DevoteeSadhanaHistorySection
        devoteeId={devoteeId}
        devoteeName={profile.fullName}
        showComments
      />

      <ReminderForm devoteeId={devoteeId} />
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
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    header: {
      gap: spacing.sm,
    },
    headerInfo: {
      gap: 2,
    },
    heading: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    rowMuted: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    whatsappButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: '#25D366',
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      marginTop: spacing.xs,
    },
    whatsappButtonText: {
      color: '#ffffff',
      fontSize: fontSize.sm,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
    },
  })
}
