import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { type SignInInput, signInSchema } from '@/application/auth/schemas'
import { useSignIn } from '@/application/auth/use-sign-in'
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

function getLoginErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'email_not_confirmed'
  ) {
    return 'Please confirm your email address before signing in.'
  }

  return 'Invalid email or password.'
}

export function LoginPage() {
  const navigate = useNavigate()
  const signIn = useSignIn()

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    signIn.mutate(values, {
      onSuccess: () => navigate('/', { replace: true }),
    })
  })

  return (
    <AuthCard title="Sign in" description="Welcome back to Sadhana Connect.">
      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {signIn.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getLoginErrorMessage(signIn.error)}
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={signIn.isPending}>
            {signIn.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Form>

      <div className="mt-4 flex flex-col gap-1 text-center text-sm text-muted-foreground">
        <Link to="/forgot-password" className="underline underline-offset-4">
          Forgot your password?
        </Link>
        <span>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="underline underline-offset-4">
            Register
          </Link>
        </span>
      </div>
    </AuthCard>
  )
}
