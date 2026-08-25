import { Link } from 'expo-router'
import { StyleSheet } from 'react-native'

import { AuthCard } from '../../src/presentation/components/AuthCard'
import { colors } from '../../src/shared/theme'

// PASSWORD_RESET_EMAIL_ENABLED is false project-wide (Resend sandbox
// limitation — see web's src/shared/constants/feature-flags.ts). This
// screen mirrors web's disabled-flag state exactly: a static notice, no
// form. Deferred to whenever that flag is turned on (sub-phase 23.3 plan).
export default function ForgotPasswordScreen() {
  return (
    <AuthCard
      title="Forgot your password?"
      description="Password recovery by email will be available soon. Please contact your administrator if you forget your password."
    >
      <Link href="/login" style={styles.link}>
        Back to sign in
      </Link>
    </AuthCard>
  )
}

const styles = StyleSheet.create({
  link: {
    color: colors.link,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
})
