import { zodResolver } from '@hookform/resolvers/zod'
import { type SignInInput, signInSchema, useSignIn } from '@sadhana-connect/auth'
import { Link, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../src/application/theme/use-theme'
import { AuthCard } from '../../src/presentation/components/AuthCard'
import { Button } from '../../src/presentation/components/Button'
import { ErrorBanner } from '../../src/presentation/components/ErrorBanner'
import { TextField } from '../../src/presentation/components/TextField'
import { fontSize, spacing } from '../../src/shared/theme'
import type { ThemeColors } from '../../src/shared/theme'

// Feature-flagged off project-wide (see web's src/shared/constants/feature-flags.ts)
// until a verified Resend sending domain is available. Mirrored here rather
// than shared since this constant isn't part of the extracted auth package.
const PASSWORD_RESET_EMAIL_ENABLED = false

function getLoginErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'email_not_confirmed') {
    return 'Please confirm your email address before signing in.'
  }
  return 'Invalid email or password.'
}

export default function LoginScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const signIn = useSignIn()

  const { control, handleSubmit } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit((values) => {
    signIn.mutate(values, {
      onSuccess: () => router.replace('/'),
    })
  })

  return (
    <AuthCard title="Sign in" description="Welcome back to Sadhana Connect.">
      {signIn.isError ? <ErrorBanner message={getLoginErrorMessage(signIn.error)} /> : null}

      <TextField
        control={control}
        name="email"
        label="Email"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextField
        control={control}
        name="password"
        label="Password"
        secureTextEntry
        autoComplete="current-password"
      />

      <Button
        title="Sign in"
        pendingTitle="Signing in…"
        isPending={signIn.isPending}
        onPress={onSubmit}
      />

      <View style={styles.footer}>
        {PASSWORD_RESET_EMAIL_ENABLED ? (
          <Link href="/forgot-password" style={styles.link}>
            Forgot your password?
          </Link>
        ) : (
          <Text style={styles.mutedText}>
            Password recovery by email will be available soon. Please contact your administrator
            if you forget your password.
          </Text>
        )}
        <Text style={styles.mutedText}>
          Don&apos;t have an account? <Link href="/register" style={styles.link}>Register</Link>
        </Text>
      </View>
    </AuthCard>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    footer: {
      marginTop: spacing.sm,
      gap: spacing.xs,
      alignItems: 'center',
    },
    mutedText: {
      fontSize: fontSize.sm,
      color: colors.muted,
      textAlign: 'center',
    },
    link: {
      color: colors.link,
      fontSize: fontSize.sm,
      textDecorationLine: 'underline',
    },
  })
}
