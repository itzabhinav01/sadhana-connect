import { zodResolver } from '@hookform/resolvers/zod'
import {
  phoneNumberField,
  resetPasswordSchema,
  useAuth,
  useProfile,
  useUpdatePassword,
  type ResetPasswordInput,
} from '@sadhana-connect/auth'
import {
  RECENT_REPORTS_LOOKBACK_LIMIT,
  setConfiguredWhatsAppRecipient,
  useRecentSadhanaReports,
  useSadhanaStreak,
} from '@sadhana-connect/sadhana'
import { Stack, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { z } from 'zod'

import { useTheme } from '../../src/application/theme/use-theme'
import { useSignOut } from '../../src/application/auth/use-sign-out'
import { useUpdateProfile } from '../../src/application/profile/use-update-profile'
import { AppUpdateSection } from '../../src/presentation/components/AppUpdateSection'
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
  whatsappShareNumber: z
    .string()
    .trim()
    .refine(
      (val) => val === '' || /^\+?[1-9]\d{6,14}$/.test(val.replace(/[\s-]/g, '')),
      'Enter a valid WhatsApp phone number with country code (e.g. +919876543210)',
    ),
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
  const updatePassword = useUpdatePassword()
  const signOut = useSignOut()
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [whatsappInput, setWhatsappInput] = useState('')
  const [whatsappSaved, setWhatsappSaved] = useState(false)
  const [whatsappError, setWhatsappError] = useState<string | null>(null)

  const { control, handleSubmit, reset } = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      whatsappShareNumber: '',
    },
  })

  const passwordForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        fullName: profileQuery.data.fullName ?? '',
        phoneNumber: profileQuery.data.phoneNumber ?? '',
        whatsappShareNumber: profileQuery.data.whatsappShareNumber ?? '',
      })
      setWhatsappInput(profileQuery.data.whatsappShareNumber ?? '')
      setConfiguredWhatsAppRecipient(profileQuery.data.whatsappShareNumber)
    }
  }, [profileQuery.data, reset])

  const onSubmit = handleSubmit((values) => {
    const cleanedWhatsapp = values.whatsappShareNumber.replace(/[\s-]/g, '').trim()
    const payload: {
      fullName: string
      phoneNumber: string | null
      whatsappShareNumber?: string | null
    } = {
      fullName: values.fullName,
      phoneNumber: values.phoneNumber || null,
    }
    if (cleanedWhatsapp || profileQuery.data?.whatsappShareNumber) {
      payload.whatsappShareNumber = cleanedWhatsapp || null
    }

    updateProfile.mutate(payload, {
      onSuccess: () => {
        setConfiguredWhatsAppRecipient(cleanedWhatsapp || null)
        setIsEditing(false)
      },
    })
  })

  const handleSaveWhatsAppNumber = () => {
    setWhatsappSaved(false)
    setWhatsappError(null)
    const cleaned = whatsappInput.replace(/[\s-]/g, '').trim()
    if (cleaned !== '' && !/^\+?[1-9]\d{6,14}$/.test(cleaned)) {
      setWhatsappError('Enter a valid WhatsApp number with country code (e.g. +919876543210).')
      return
    }
    if (!profileQuery.data) return
    updateProfile.mutate(
      {
        fullName: profileQuery.data.fullName,
        phoneNumber: profileQuery.data.phoneNumber,
        whatsappShareNumber: cleaned || null,
      },
      {
        onSuccess: () => {
          setConfiguredWhatsAppRecipient(cleaned || null)
          setWhatsappSaved(true)
        },
      },
    )
  }

  const onPasswordSubmit = passwordForm.handleSubmit((values) => {
    updatePassword.mutate(values.password, {
      onSuccess: () => {
        setIsChangingPassword(false)
        setPasswordSuccess(true)
        passwordForm.reset({ password: '', confirmPassword: '' })
      },
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
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
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
            <Text style={styles.label}>WhatsApp Number for Sadhana Sharing</Text>
            <Text style={styles.value}>
              {profile.whatsappShareNumber || 'Not set (opens WhatsApp contact picker)'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Designation</Text>
            <Text style={styles.value}>{ROLE_LABELS[profile.role] ?? profile.role}</Text>
          </View>

          {passwordSuccess ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>Password updated successfully! ✅</Text>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <Button
              title="Edit Profile"
              variant="outline"
              onPress={() => {
                reset({
                  fullName: profile.fullName ?? '',
                  phoneNumber: profile.phoneNumber ?? '',
                  whatsappShareNumber: profile.whatsappShareNumber ?? '',
                })
                setIsEditing(true)
              }}
            />
            <Button
              title="Change Password"
              variant="outline"
              onPress={() => {
                setPasswordSuccess(false)
                setIsChangingPassword(true)
              }}
            />
          </View>
        </Card>

        {/* WhatsApp Sadhana Sharing Card */}
        <Card title="WhatsApp Sadhana Sharing">
          <Text style={styles.helperText}>
            Set the WhatsApp number (such as your mentor&apos;s number) to share your daily Sadhana chart with. Leave blank to choose any contact in WhatsApp.
          </Text>
          <TextInput
            style={styles.whatsappInput}
            placeholder="e.g. +919876543210"
            placeholderTextColor={colors.placeholder ?? colors.muted}
            value={whatsappInput}
            onChangeText={(text) => {
              setWhatsappInput(text)
              setWhatsappSaved(false)
              setWhatsappError(null)
            }}
            keyboardType="phone-pad"
            accessibilityLabel="Recipient WhatsApp Number"
          />
          {whatsappError ? <Text style={styles.errorInline}>{whatsappError}</Text> : null}
          {whatsappSaved ? (
            <Text style={styles.successText}>WhatsApp sharing number saved! ✅</Text>
          ) : null}
          <Button
            title="Save WhatsApp Number"
            size="sm"
            pendingTitle="Saving…"
            isPending={updateProfile.isPending}
            onPress={handleSaveWhatsAppNumber}
          />
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
        <Button
          title="Settings & Reminders"
          variant="outline"
          accessibilityLabel="Settings"
          onPress={() => router.push('/devotee/settings')}
        />

        <AppUpdateSection />

        <Card title="Account Session">
          <Text style={styles.helperText}>
            Sign out of your Sadhana Connect account on this device.
          </Text>
          <Button
            title="Sign Out"
            pendingTitle="Signing out…"
            isPending={signOut.isPending}
            variant="destructive"
            onPress={handleSignOut}
          />
        </Card>

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

              <TextField
                control={control}
                name="whatsappShareNumber"
                label="WhatsApp Number for Sadhana Sharing"
                placeholder="Mentor / Group WhatsApp number"
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

        {/* Change Password Modal */}
        <Modal
          visible={isChangingPassword}
          transparent
          animationType="slide"
          onRequestClose={() => setIsChangingPassword(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Set New Password</Text>

              <TextField
                control={passwordForm.control}
                name="password"
                label="New Password"
                placeholder="At least 8 characters"
                secureTextEntry
              />

              <TextField
                control={passwordForm.control}
                name="confirmPassword"
                label="Confirm New Password"
                placeholder="Re-enter new password"
                secureTextEntry
              />

              {updatePassword.isError ? (
                <ErrorBanner
                  message={
                    updatePassword.error instanceof Error
                      ? updatePassword.error.message
                      : 'Something went wrong updating your password.'
                  }
                />
              ) : null}

              <View style={styles.modalActions}>
                <Button
                  title="Update Password"
                  pendingTitle="Updating…"
                  isPending={updatePassword.isPending}
                  onPress={onPasswordSubmit}
                />
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsChangingPassword(false)}
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
      flexGrow: 1,
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
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
      flexWrap: 'wrap',
    },
    helperText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    whatsappInput: {
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
    errorInline: {
      fontSize: fontSize.xs,
      color: colors.destructive,
      fontFamily: fontFamily.medium,
    },
    successBox: {
      backgroundColor: colors.successBackground,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginTop: spacing.xs,
    },
    successText: {
      fontSize: fontSize.sm,
      color: colors.success,
      fontFamily: fontFamily.medium,
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
