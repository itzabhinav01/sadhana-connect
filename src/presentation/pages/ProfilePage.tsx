import { zodResolver } from '@hookform/resolvers/zod'
import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { phoneNumberField } from '@sadhana-connect/auth'
import { useAuth, useProfile } from '@sadhana-connect/auth'
import { RECENT_REPORTS_LOOKBACK_LIMIT, useRecentSadhanaReports, useSadhanaStreak } from '@sadhana-connect/sadhana'
import type { AppRole } from '@sadhana-connect/domain/entities/profile'
import { useSignOut } from '@/application/auth/use-sign-out'
import { useUpdatePhoneNumber } from '@/application/profile/use-update-phone-number'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'
import { Avatar, AvatarFallback } from '@/presentation/components/ui/avatar'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/presentation/components/ui/form'
import { Input } from '@/presentation/components/ui/input'

const phoneNumberFormSchema = z.object({ phoneNumber: phoneNumberField })
type PhoneNumberFormValues = z.infer<typeof phoneNumberFormSchema>

const ROLE_LABELS: Record<AppRole, string> = {
  devotee: 'Devotee',
  mentor: 'Mentor',
  super_admin: 'Super Admin',
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || '?'
}

// A devotee's own current-streak / recent-report-count stats — the same
// two numbers already shown on the Dashboard, just reused here for
// identity context. Not rendered for mentor/admin, who have no sadhana
// reports of their own.
function DevoteeStats() {
  const streak = useSadhanaStreak()
  const recentReports = useRecentSadhanaReports()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>This Week</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-around">
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold tabular-nums text-foreground">
            {streak.data ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">Day streak</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold tabular-nums text-foreground">
            {recentReports.data?.length ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">
            Reports in last {RECENT_REPORTS_LOOKBACK_LIMIT} days
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// Minimal, phone-number-only editor for the account's actual settable
// fields (Phase 20C) — general profile editing (full name, etc.) remains
// the still-unbuilt future phase this section was originally a
// placeholder for.
export function ProfilePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const profileQuery = useProfile()
  const updatePhoneNumber = useUpdatePhoneNumber()
  const signOut = useSignOut()
  const [isEditing, setIsEditing] = useState(false)

  const form = useForm<PhoneNumberFormValues>({
    resolver: zodResolver(phoneNumberFormSchema),
    defaultValues: { phoneNumber: '' },
  })

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({ phoneNumber: profileQuery.data.phoneNumber ?? '' })
    }
  }, [profileQuery.data, form])

  const onSubmit = form.handleSubmit((values) => {
    updatePhoneNumber.mutate(values.phoneNumber, {
      onSuccess: () => setIsEditing(false),
    })
  })

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {profileQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {profileQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading your profile. Please try again.
        </p>
      ) : null}

      {profileQuery.data ? (
        <>
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="text-lg">
                {getInitials(profileQuery.data.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-foreground">
                {profileQuery.data.fullName}
              </h1>
              <span className="inline-flex w-fit items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                {ROLE_LABELS[profileQuery.data.role]}
              </span>
            </div>
          </div>

          {profileQuery.data.role === 'devotee' ? <DevoteeStats /> : null}

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Phone number</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                    {profileQuery.data.phoneNumber ?? 'Not provided'}
                  </p>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                    {profileQuery.data.phoneNumber ? 'Edit' : 'Add'}
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Phone number</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+919876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {updatePhoneNumber.isError ? (
                      <Alert variant="destructive">
                        <AlertDescription>
                          Something went wrong saving your phone number. Please try again.
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={updatePhoneNumber.isPending}>
                        {updatePhoneNumber.isPending ? 'Saving…' : 'Save'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          form.reset({ phoneNumber: profileQuery.data?.phoneNumber ?? '' })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {session?.email ? (
            <p className="text-sm text-muted-foreground">Signed in as {session.email}</p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="sm:self-start"
            onClick={handleSignOut}
            disabled={signOut.isPending}
          >
            <LogOut className="size-4" aria-hidden="true" />
            {signOut.isPending ? 'Signing out…' : 'Sign out'}
          </Button>
        </>
      ) : null}
    </div>
  )
}
