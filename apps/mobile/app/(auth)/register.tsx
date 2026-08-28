import { zodResolver } from '@hookform/resolvers/zod'
import { type SignUpInput, signUpSchema, useSignUp } from '@sadhana-connect/auth'
import { Link, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { StyleSheet, Text } from 'react-native'

import { useTheme } from '../../src/application/theme/use-theme'
import { AuthCard } from '../../src/presentation/components/AuthCard'
import { Button } from '../../src/presentation/components/Button'
import { ErrorBanner } from '../../src/presentation/components/ErrorBanner'
import { TextField } from '../../src/presentation/components/TextField'
import { fontSize, spacing } from '../../src/shared/theme'
import type { ThemeColors } from '../../src/shared/theme'

export default function RegisterScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const signUp = useSignUp()
  const [signUpIncomplete, setSignUpIncomplete] = useState(false)

  const { control, handleSubmit } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit((values) => {
    setSignUpIncomplete(false)

    signUp.mutate(
      {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
      },
      {
        onSuccess: ({ session }) => {
          if (session) {
            router.replace('/')
            return
          }

          // Email confirmation is disabled project-wide, so a successful
          // signUp() should always return a session. A null session here
          // means Supabase silently no-op'd the request (e.g. the email is
          // already registered) without revealing that to the client.
          setSignUpIncomplete(true)
        },
      },
    )
  })

  return (
    <AuthCard title="Create your account" description="Register to start recording your daily sadhana.">
      {signUp.isError || signUpIncomplete ? (
        <ErrorBanner
          message={
            signUpIncomplete
              ? "We couldn't complete your registration. If you already have an account, try signing in instead."
              : 'Something went wrong creating your account. Please try again.'
          }
        />
      ) : null}

      <TextField control={control} name="fullName" label="Full name" autoComplete="name" />
      <TextField
        control={control}
        name="email"
        label="Email"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextField
        control={control}
        name="phoneNumber"
        label="Phone number"
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="+919876543210"
      />
      <TextField
        control={control}
        name="password"
        label="Password"
        secureTextEntry
        autoComplete="new-password"
      />
      <TextField
        control={control}
        name="confirmPassword"
        label="Confirm password"
        secureTextEntry
        autoComplete="new-password"
      />

      <Button
        title="Create account"
        pendingTitle="Creating account…"
        isPending={signUp.isPending}
        onPress={onSubmit}
      />

      <Text style={styles.footerText}>
        Already have an account? <Link href="/login" style={styles.link}>Sign in</Link>
      </Text>
    </AuthCard>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    footerText: {
      marginTop: spacing.sm,
      fontSize: fontSize.sm,
      color: colors.muted,
      textAlign: 'center',
    },
    link: {
      color: colors.link,
      textDecorationLine: 'underline',
    },
  })
}
