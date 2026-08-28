import { zodResolver } from '@hookform/resolvers/zod'
import { phoneNumberField, useProfile } from '@sadhana-connect/auth'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'

import { useTheme } from '../../../src/application/theme/use-theme'
import type { Theme } from '../../../src/application/theme/theme-context'
import { useUpdatePhoneNumber } from '../../../src/application/profile/use-update-phone-number'
import { Button } from '../../../src/presentation/components/Button'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { TextField } from '../../../src/presentation/components/TextField'
import { fontSize, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

const phoneNumberFormSchema = z.object({ phoneNumber: phoneNumberField })
type PhoneNumberFormValues = z.infer<typeof phoneNumberFormSchema>

const THEME_OPTIONS: { label: string; value: Theme }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
]

export default function ProfileScreen() {
  const { colors, theme, setTheme } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const profileQuery = useProfile()
  const updatePhoneNumber = useUpdatePhoneNumber()
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
    <View style={styles.content}>
      <Text style={styles.label}>Phone number</Text>

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

      <View style={styles.form}>
        <Text style={styles.label}>Appearance</Text>
        <View style={styles.actions}>
          {THEME_OPTIONS.map((option) => (
            <Button
              key={option.value}
              title={option.label}
              variant={theme === option.value ? 'primary' : 'outline'}
              onPress={() => setTheme(option.value)}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.foreground,
    },
    viewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    value: {
      fontSize: fontSize.base,
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
