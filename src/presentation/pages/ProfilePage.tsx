import { zodResolver } from '@hookform/resolvers/zod'
import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { phoneNumberField, resetPasswordSchema, useAuth, useProfile, useUpdatePassword, type ResetPasswordInput } from '@sadhana-connect/auth'
import { RECENT_REPORTS_LOOKBACK_LIMIT, useRecentSadhanaReports, useSadhanaStreak } from '@sadhana-connect/sadhana'
import type { AppRole } from '@sadhana-connect/domain/entities/profile'
import { useSignOut } from '@/application/auth/use-sign-out'
import { useUpdateProfile } from '@/application/profile/use-update-profile'
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

const profileEditSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phoneNumber: phoneNumberField,
})
type ProfileEditValues = z.infer<typeof profileEditSchema>

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

export function ProfilePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const profileQuery = useProfile()
  const updateProfile = useUpdateProfile()
  const updatePassword = useUpdatePassword()
  const signOut = useSignOut()
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const form = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: { fullName: '', phoneNumber: '' },
  })

  const passwordForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({
        fullName: profileQuery.data.fullName ?? '',
        phoneNumber: profileQuery.data.phoneNumber ?? '',
      })
    }
  }, [profileQuery.data, form])

  const onSubmit = form.handleSubmit((values) => {
    updateProfile.mutate(
      {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber || null,
      },
      {
        onSuccess: () => setIsEditing(false),
      },
    )
  })

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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                <h2>Account Details</h2>
              </CardTitle>
              {!isEditing ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Full Name</span>
                    <p className="text-sm font-medium text-foreground">{profileQuery.data.fullName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Email Address</span>
                    <p className="text-sm font-medium text-foreground">{session?.email ?? 'Not available'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Phone Number</span>
                    <p className="text-sm font-medium text-foreground">
                      {profileQuery.data.phoneNumber ?? 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Designation</span>
                    <p className="text-sm font-medium text-foreground">{ROLE_LABELS[profileQuery.data.role]}</p>
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
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
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+919876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {updateProfile.isError ? (
                      <Alert variant="destructive">
                        <AlertDescription>
                          Something went wrong saving your profile. Please try again.
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={updateProfile.isPending}>
                        {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          form.reset({
                            fullName: profileQuery.data?.fullName ?? '',
                            phoneNumber: profileQuery.data?.phoneNumber ?? '',
                          })
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                <h2>Security & Password</h2>
              </CardTitle>
              {!isChangingPassword ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPasswordSuccess(false)
                    setIsChangingPassword(true)
                  }}
                >
                  Change Password
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {passwordSuccess ? (
                <Alert className="mb-4 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <AlertDescription>Password updated successfully! ✅</AlertDescription>
                </Alert>
              ) : null}

              {!isChangingPassword ? (
                <p className="text-sm text-muted-foreground">
                  Update your login password to keep your account secure.
                </p>
              ) : (
                <Form {...passwordForm}>
                  <form onSubmit={onPasswordSubmit} className="flex flex-col gap-4 max-w-md" noValidate>
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="At least 8 characters"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Re-enter new password"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {updatePassword.isError ? (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {updatePassword.error instanceof Error
                            ? updatePassword.error.message
                            : 'Something went wrong updating your password.'}
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={updatePassword.isPending}>
                        {updatePassword.isPending ? 'Updating…' : 'Update Password'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false)
                          passwordForm.reset({ password: '', confirmPassword: '' })
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
