import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { type SignUpInput, signUpSchema } from '@/application/auth/schemas'
import { useSignUp } from '@/application/auth/use-sign-up'
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

export function RegisterPage() {
  const navigate = useNavigate()
  const signUp = useSignUp()
  const [signUpIncomplete, setSignUpIncomplete] = useState(false)

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = form.handleSubmit((values) => {
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
            navigate('/', { replace: true })
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
    <AuthCard
      title="Create your account"
      description="Register to start recording your daily sadhana."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {signUp.isError || signUpIncomplete ? (
            <Alert variant="destructive">
              <AlertDescription>
                {signUpIncomplete
                  ? "We couldn't complete your registration. If you already have an account, try signing in instead."
                  : 'Something went wrong creating your account. Please try again.'}
              </AlertDescription>
            </Alert>
          ) : null}

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    autoComplete="tel"
                    placeholder="+919876543210"
                    {...field}
                  />
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
                <FormLabel>Confirm password</FormLabel>
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

          <Button type="submit" disabled={signUp.isPending}>
            {signUp.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </AuthCard>
  )
}
