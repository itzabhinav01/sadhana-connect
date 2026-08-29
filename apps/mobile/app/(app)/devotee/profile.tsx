import { zodResolver } from '@hookform/resolvers/zod'
import { phoneNumberField, useProfile } from '@sadhana-connect/auth'
import { RECENT_REPORTS_LOOKBACK_LIMIT, useRecentSadhanaReports, useSadhanaStreak } from '@sadhana-connect/sadhana'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'

import { useTheme } from '../../../src/application/theme/use-theme'
import { useSignOut } from '../../../src/application/auth/use-sign-out'
import { useUpdatePhoneNumber } from '../../../src/application/profile/use-update-phone-number'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { Chip } from '../../../src/presentation/components/Chip'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { TextField } from '../../../src/presentation/components/TextField'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

const phoneNumberFormSchema = z.object({ phoneNumber: phoneNumberField })
type PhoneNumberFormValues = z.infer<typeof phoneNumberFormSchema>

const ROLE_LABELS: Record<string, string> = {
  devotee: 'Devotee',
  mentor: 'Mentor',
  super_admin: 'Super Admin',
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function ProfileScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const profileQuery = useProfile()
  const streak = useSadhanaStreak()
  const recentReports = useRecentSadhanaReports()
  const updatePhoneNumber = useUpdatePhoneNumber()
  const signOut = useSignOut()
  const [isEditing, setIsEditing] = useState(false)

  const { control, handleSubmit, reset } = useForm<PhoneNumberFormValues>({
    resolver: zodResolver(phoneNumberFormSchema),
    defaultValues: { phoneNumber: '' },
  })

  useEffect(() => {
    if (profileQuery.data) {
      reset({ phoneNumber: profileQuery.data.phoneNumber ?? '' })
    }
  }, [profileQuery.data, reset])

  const onSubmit = handleSubmit((values) => {
    updatePhoneNumber.mutate(values.phoneNumber, {
      onSuccess: () => setIsEditing(false),
    })
  })

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    })
  }

  if (profileQuery.isPending) {
    return <LoadingScreen />
  }

  if (profileQuery.isError) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message="Something went wrong loading your profile. Please try again." />
      </View>
    )
  }

  if (!profileQuery.data) {
    return null
  }

  const phoneNumber = profileQuery.data.phoneNumber

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.identityHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(profileQuery.data.fullName)}</Text>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.name}>{profileQuery.data.fullName}</Text>
          <Chip label={ROLE_LABELS[profileQuery.data.role] ?? profileQuery.data.role} tone="accent" />
        </View>
      </View>

      <Card title="This Week">
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{streak.data ?? 0}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{recentReports.data?.length ?? 0}</Text>
            <Text style={styles.statLabel}>
              Reports in last {RECENT_REPORTS_LOOKBACK_LIMIT} days
            </Text>
          </View>
        </View>
      </Card>

      <Card title="Phone number">
        {!isEditing ? (
          <View style={styles.viewRow}>
            <Text style={styles.value}>{phoneNumber ?? 'Not provided'}</Text>
            <Button
              title={phoneNumber ? 'Edit' : 'Add'}
              variant="outline"
              onPress={() => setIsEditing(true)}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <TextField
              control={control}
              name="phoneNumber"
              label="Phone number"
              placeholder="+919876543210"
              keyboardType="phone-pad"
            />
            {updatePhoneNumber.isError ? (
              <ErrorBanner message="Something went wrong saving your phone number. Please try again." />
            ) : null}
            <View style={styles.actions}>
              <Button
                title="Save"
                pendingTitle="Saving…"
                isPending={updatePhoneNumber.isPending}
                onPress={onSubmit}
              />
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setIsEditing(false)
                  reset({ phoneNumber: phoneNumber ?? '' })
                }}
              />
            </View>
          </View>
        )}
      </Card>

      <Button
        title="Settings"
        variant="outline"
        accessibilityLabel="Settings"
        onPress={() => router.push('/devotee/settings')}
      />

      <Button
        title="Sign Out"
        pendingTitle="Signing out…"
        isPending={signOut.isPending}
        variant="destructive"
        onPress={handleSignOut}
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
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    identityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.primary,
    },
    identityText: {
      gap: spacing.xs,
    },
    name: {
      fontSize: fontSize.xl,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.foreground,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    stat: {
      alignItems: 'center',
      gap: 2,
    },
    statValue: {
      fontSize: fontSize.xxl,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.foreground,
    },
    statLabel: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      textAlign: 'center',
    },
    viewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    value: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    form: {
      gap: spacing.md,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
  })
}
