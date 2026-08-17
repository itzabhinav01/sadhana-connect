import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import {
  type ForgotPasswordInput,
  forgotPasswordSchema,
} from '@/application/auth/schemas'
import { useRequestPasswordReset } from '@/application/auth/use-request-password-reset'
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

export function ForgotPasswordPage() {
  const requestReset = useRequestPasswordReset()

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    requestReset.mutate(values.email)
  })

  if (requestReset.isSuccess) {
    return (
      <AuthCard
        title="Check your email"
        description="Password reset instructions are on the way."
      >
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, we&apos;ve sent a link to
          reset your password.
        </p>
        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="underline underline-offset-4">
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Forgot your password?"
      description="We'll email you a link to reset it."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {requestReset.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Something went wrong. Please try again.
              </AlertDescription>
            </Alert>
          ) : null}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={requestReset.isPending}>
            {requestReset.isPending ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        <Link to="/login" className="underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    </AuthCard>
  )
}
