import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useDevoteeBookProgress } from '@sadhana-connect/books'
import { useTheme } from '../../application/theme/use-theme'
import { fontFamily, fontSize, radius, spacing, type ThemeColors } from '../../shared/theme'
import { Card } from './Card'
import { Chip } from './Chip'
import { Icon } from './Icon'

interface PrabhupadaBooksDashboardCardProps {
  profileId?: string | null
}

export function PrabhupadaBooksDashboardCard({
  profileId,
}: PrabhupadaBooksDashboardCardProps = {}) {
  const { colors } = useTheme()
  const router = useRouter()
  const styles = useMemo(() => createStyles(colors), [colors])

  const { data } = useDevoteeBookProgress(profileId)
  const summary = data?.summary ?? {
    total: 36,
    completed: 0,
    reading: 0,
    notStarted: 36,
    completionPercentage: 0,
  }

  return (
    <Card
      title="Prabhupada Books"
      action={
        <Text style={styles.percentageText}>{summary.completionPercentage}%</Text>
      }
    >
      <View style={styles.container}>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${summary.completionPercentage}%` },
            ]}
          />
        </View>

        <View style={styles.statsRow}>
          <Chip label={`${summary.completed} Done`} tone="success" />
          <Chip label={`${summary.reading} Reading`} tone="warning" />
          <Chip label={`${summary.notStarted} To Read`} tone="neutral" />
        </View>

        <Pressable
          style={styles.manageButton}
          onPress={() => router.push('/devotee/profile')}
          accessibilityRole="button"
        >
          <Text style={styles.manageButtonText}>Update Reading Progress</Text>
          <Icon name="chevron-forward-outline" size={16} color={colors.primary} />
        </Pressable>
      </View>
    </Card>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      gap: spacing.xs,
    },
    percentageText: {
      fontSize: fontSize.base,
      fontWeight: '800',
      fontFamily: fontFamily.bold,
      color: colors.primary,
    },
    progressBarTrack: {
      height: 6,
      borderRadius: radius.full,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginVertical: 2,
    },
    manageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.primary + '10',
      borderRadius: radius.md,
      marginTop: 2,
    },
    manageButtonText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.primary,
    },
  })
}
