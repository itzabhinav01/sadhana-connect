import { zodResolver } from '@hookform/resolvers/zod'
import { phoneNumberField, useAuth, useProfile } from '@sadhana-connect/auth'
import { RECENT_REPORTS_LOOKBACK_LIMIT, useRecentSadhanaReports, useSadhanaStreak } from '@sadhana-connect/sadhana'
import { Stack, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'

import { useTheme } from '../../src/application/theme/use-theme'
import { useSignOut } from '../../src/application/auth/use-sign-out'
import { useUpdateProfile } from '../../src/application/profile/use-update-profile'
import { Button } from '../../src/presentation/components/Button'
import { Card } from '../../src/presentation/components/Card'
import { Chip } from '../../src/presentation/components/Chip'
import { ErrorBanner } from '../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../src/presentation/components/LoadingScreen'
import { TextField } from '../../src/presentation/components/TextField'
import { fontFamily, fontSize, radius, spacing } from '../../src/shared/theme'
import type { ThemeColors } from '../../src/shared/theme'

const profileEditSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phoneNumber: phoneNumberField,
})
type ProfileEditValues = z.infer<typeof profileEditSchema>

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
  const { session } = useAuth()
  const profileQuery = useProfile()
  const streak = useSadhanaStreak()
  const recentReports = useRecentSadhanaReports()
  const updateProfile = useUpdateProfile()
  const signOut = useSignOut()
  const [isEditing, setIsEditing] = useState(false)

  const { control, handleSubmit, reset } = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
    },
  })

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        fullName: profileQuery.data.fullName ?? '',
        phoneNumber: profileQuery.data.phoneNumber ?? '',
      })
    }
  }, [profileQuery.data, reset])

  const onSubmit = handleSubmit((values) => {
    updateProfile.mutate(
      {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber || null,
      },
      {
        onSuccess: () => setIsEditing(false),
      },
    )
  })

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    })
  }

  if (profileQuery.isPending) {
    return <LoadingScreen />
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message="Something went wrong loading your profile. Please try again." />
      </View>
    )
  }

  const profile = profileQuery.data
  const userEmail = session?.email ?? 'Not available'

  return (
    <>
      <Stack.Screen options={{ title: 'Profile', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Avatar & Identity */}
        <View style={styles.identityHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(profile.fullName)}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name}>{profile.fullName}</Text>
            <Chip label={ROLE_LABELS[profile.role] ?? profile.role} tone="accent" />
          </View>
        </View>

        {/* Profile Information Card */}
        <Card title="Account Details">
          <View style={styles.detailRow}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{profile.fullName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.value} selectable>{userEmail}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Phone Number</Text>
            <Text style={styles.value}>{profile.phoneNumber ?? 'Not provided'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Designation</Text>
            <Text style={styles.value}>{ROLE_LABELS[profile.role] ?? profile.role}</Text>
          </View>

          <View style={styles.buttonRow}>
            <Button
              title="Edit Profile"
              variant="primary"
              onPress={() => {
                reset({
                  fullName: profile.fullName ?? '',
                  phoneNumber: profile.phoneNumber ?? '',
                })
                setIsEditing(true)
              }}
            />
          </View>
        </Card>

        {/* Devotee Sadhana Snapshot */}
        {profile.role === 'devotee' ? (
          <Card title="Sadhana Activity">
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
        ) : null}

        {/* Settings & Preferences */}
        {profile.role === 'devotee' ? (
          <Button
            title="Settings & Reminders"
            variant="outline"
            accessibilityLabel="Settings"
            onPress={() => router.push('/devotee/settings')}
          />
        ) : null}

        <Button
          title="Sign Out"
          pendingTitle="Signing out…"
          isPending={signOut.isPending}
          variant="destructive"
          onPress={handleSignOut}
        />

        {/* Edit Profile Modal */}
        <Modal visible={isEditing} transparent animationType="slide" onRequestClose={() => setIsEditing(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <TextField
                control={control}
                name="fullName"
                label="Full Name"
                placeholder="Enter your name"
                autoCapitalize="words"
              />

              <TextField
                control={control}
                name="phoneNumber"
                label="Phone Number"
                placeholder="+919876543210"
                keyboardType="phone-pad"
              />

              {updateProfile.isError ? (
                <ErrorBanner message="Something went wrong saving your profile. Please try again." />
              ) : null}

              <View style={styles.modalActions}>
                <Button
                  title="Save Changes"
                  pendingTitle="Saving…"
                  isPending={updateProfile.isPending}
                  onPress={onSubmit}
                />
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsEditing(false)}
                />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
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
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.primaryForeground,
    },
    identityText: {
      flex: 1,
      gap: spacing.xs,
    },
    name: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.foreground,
    },
    detailRow: {
      paddingVertical: spacing.xs,
      gap: 2,
    },
    label: {
      fontSize: fontSize.xs,
      color: colors.muted,
      fontFamily: fontFamily.medium,
    },
    value: {
      fontSize: fontSize.md,
      color: colors.foreground,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.xs,
    },
    buttonRow: {
      marginTop: spacing.sm,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: spacing.xs,
    },
    stat: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    statValue: {
      fontSize: fontSize.xl,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.primary,
    },
    statLabel: {
      fontSize: fontSize.xs,
      color: colors.muted,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.foreground,
    },
    modalActions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
  })
}
