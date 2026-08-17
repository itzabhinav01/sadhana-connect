import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import {
  type ResetPasswordInput,
  resetPasswordSchema,
} from '@/application/auth/schemas'
import { usePasswordRecovery } from '@/application/auth/use-password-recovery'
import { useUpdatePassword } from '@/application/auth/use-update-password'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/presentation/components/ui/form'
import { Input } from '@/presentation/components/ui/input'
import { AuthCard } from '@/presentation/pages/auth/AuthCard'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isRecoveryReady } = usePasswordRecovery()
  const updatePassword = useUpdatePassword()

  const linkError = searchParams.get('error_description')

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    updatePassword.mutate(values.password, {
      onSuccess: () => navigate('/login', { replace: true }),
    })
  })

  if (linkError) {
    return (
      <AuthCard
        title="Reset link invalid"
        description="This password reset link is no longer valid."
      >
        <Alert variant="destructive">
          <AlertDescription>{linkError.replace(/\+/g, ' ')}</AlertDescription>
        </Alert>
        <div className="mt-4 text-center text-sm">
          <Link to="/forgot-password" className="underline underline-offset-4">
            Request a new link
          </Link>
        </div>
      </AuthCard>
    )
  }

  if (!isRecoveryReady) {
    return (
      <AuthCard
        title="Verifying link"
        description="One moment while we verify your reset link."
      >
        <p className="text-sm text-muted-foreground">
          If this takes more than a few seconds, the link may have expired.
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Set a new password"
      description="Choose a new password for your account."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {updatePassword.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Something went wrong. Please request a new reset link.
              </AlertDescription>
            </Alert>
          ) : null}

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={updatePassword.isPending}>
            {updatePassword.isPending ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}
