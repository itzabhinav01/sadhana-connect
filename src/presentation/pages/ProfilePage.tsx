import { zodResolver } from '@hookform/resolvers/zod'
import { Contact, LogOut, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import {
  optionalPhoneNumberField,
  phoneNumberField,
  resetPasswordSchema,
  useAuth,
  useProfile,
  useUpdatePassword,
  normalizePhoneNumber,
  isValidPhoneNumber,
  type ResetPasswordInput,
} from '@sadhana-connect/auth'
import {
  RECENT_REPORTS_LOOKBACK_LIMIT,
  setConfiguredWhatsAppRecipient,
  useRecentSadhanaReports,
  useSadhanaStreak,
} from '@sadhana-connect/sadhana'
import type { AppRole } from '@sadhana-connect/domain/entities/profile'
import { useSignOut } from '@/application/auth/use-sign-out'
import { useUpdateProfile } from '@/application/profile/use-update-profile'
import {
  WebPhoneContactPickerSection,
  normalizePhoneNumberForWhatsApp,
  tryPickWebPhoneContact,
} from '@/presentation/components/shared/WhatsAppShareModal'
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
  whatsappShareNumber: optionalPhoneNumberField,
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
  const [whatsappInputOverride, setWhatsappInputOverride] = useState<string | null>(null)
  const [whatsappSaved, setWhatsappSaved] = useState(false)
  const [whatsappError, setWhatsappError] = useState<string | null>(null)
  const [showContactHelper, setShowContactHelper] = useState(false)
  const whatsappInput =
    whatsappInputOverride ?? (profileQuery.data?.whatsappShareNumber ?? '')
  const setWhatsappInput = (value: string) => setWhatsappInputOverride(value)

  const form = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: { fullName: '', phoneNumber: '', whatsappShareNumber: '' },
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
        whatsappShareNumber: profileQuery.data.whatsappShareNumber ?? '',
      })
      setConfiguredWhatsAppRecipient(profileQuery.data.whatsappShareNumber)
    }
  }, [profileQuery.data, form])

  const onSubmit = form.handleSubmit((values) => {
    const normalizedPhone = values.phoneNumber ? normalizePhoneNumber(values.phoneNumber) : null
    const normalizedWhatsapp = values.whatsappShareNumber?.trim()
      ? normalizePhoneNumber(values.whatsappShareNumber)
      : null
    const payload: {
      fullName: string
      phoneNumber: string | null
      whatsappShareNumber?: string | null
    } = {
      fullName: values.fullName,
      phoneNumber: normalizedPhone,
    }
    if (normalizedWhatsapp || profileQuery.data?.whatsappShareNumber) {
      payload.whatsappShareNumber = normalizedWhatsapp || null
    }

    updateProfile.mutate(payload, {
      onSuccess: () => {
        setConfiguredWhatsAppRecipient(normalizedWhatsapp)
        setIsEditing(false)
      },
    })
  })

  const handleSaveWhatsAppNumber = () => {
    setWhatsappSaved(false)
    setWhatsappError(null)
    const normalized = whatsappInput.trim() ? normalizePhoneNumber(whatsappInput) : ''
    if (normalized !== '' && !isValidPhoneNumber(normalized)) {
      setWhatsappError('Enter a valid phone number (e.g. 9876543210 or +919876543210).')
      return
    }
    if (!profileQuery.data) return
    updateProfile.mutate(
      {
        fullName: profileQuery.data.fullName,
        phoneNumber: profileQuery.data.phoneNumber,
        whatsappShareNumber: normalized || null,
      },
      {
        onSuccess: () => {
          setConfiguredWhatsAppRecipient(normalized || null)
          setWhatsappSaved(true)
        },
      },
    )
  }

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
                    <span className="text-xs text-muted-foreground">
                      WhatsApp Number for Sadhana Sharing
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      {profileQuery.data.whatsappShareNumber || 'Not set (opens WhatsApp contact picker)'}
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
                            <Input
                              type="tel"
                              placeholder="e.g. 9876543210 or +919876543210"
                              {...field}
                              onBlur={(e) => {
                                field.onBlur()
                                const val = e.target.value.trim()
                                if (val) {
                                  field.onChange(normalizePhoneNumber(val))
                                }
                              }}
                            />
                          </FormControl>
                          <p className="text-[11px] text-muted-foreground">
                            10-digit Indian numbers automatically get +91 added.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="whatsappShareNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp Number to Share Sadhana With</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="e.g. 9876543210 or +919876543210 (Mentor / Group number)"
                              {...field}
                              onBlur={(e) => {
                                field.onBlur()
                                const val = e.target.value.trim()
                                if (val) {
                                  field.onChange(normalizePhoneNumber(val))
                                }
                              }}
                            />
                          </FormControl>
                          <p className="text-[11px] text-muted-foreground">
                            10-digit Indian numbers automatically get +91 added.
                          </p>
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
                            whatsappShareNumber: profileQuery.data?.whatsappShareNumber ?? '',
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
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4 text-emerald-600" aria-hidden="true" />
                <CardTitle>
                  <h2>WhatsApp Sadhana Sharing</h2>
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Set the WhatsApp number (such as your mentor&apos;s number) where your daily Sadhana chart will be sent when you tap &ldquo;Share to WhatsApp&rdquo;. Leave blank to choose a contact in WhatsApp each time.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 max-w-md">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="whatsapp-share-number-input"
                  className="text-xs font-medium text-foreground"
                >
                  Recipient WhatsApp Number (with country code)
                </label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    id="whatsapp-share-number-input"
                    type="tel"
                    placeholder="e.g. 9876543210 or +919876543210"
                    value={whatsappInput}
                    onChange={(e) => {
                      setWhatsappInput(e.target.value)
                      setWhatsappSaved(false)
                      setWhatsappError(null)
                    }}
                    onBlur={(e) => {
                      const val = e.target.value.trim()
                      if (val) {
                        setWhatsappInput(normalizePhoneNumber(val))
                      }
                    }}
                    className="flex-1 min-w-[200px]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveWhatsAppNumber}
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? 'Saving…' : 'Save Number'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={async () => {
                      setWhatsappSaved(false)
                      setWhatsappError(null)
                      const picked = await tryPickWebPhoneContact()
                      if (picked) {
                        setWhatsappInput(picked.phone)
                        form.setValue('whatsappShareNumber', picked.phone)
                        return
                      }
                      setShowContactHelper((prev) => !prev)
                    }}
                  >
                    <Contact className="size-3.5" aria-hidden="true" />
                    {showContactHelper ? 'Hide Contacts Helper' : 'Add from Phone Contacts'}
                  </Button>
                </div>
              </div>
              {showContactHelper ? (
                <WebPhoneContactPickerSection
                  onSelectNumber={(phone) => {
                    const normalized = normalizePhoneNumberForWhatsApp(phone)
                    setWhatsappInput(normalized)
                    form.setValue('whatsappShareNumber', normalized)
                    setWhatsappSaved(false)
                    setWhatsappError(null)
                  }}
                  onClose={() => setShowContactHelper(false)}
                />
              ) : null}
              {whatsappError ? (
                <p className="text-xs text-destructive">{whatsappError}</p>
              ) : null}
              {whatsappSaved ? (
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  WhatsApp sharing number saved! ✅
                </p>
              ) : null}
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

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Account Session</h2>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Sign out of your account on this device.
              </p>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="destructive"
                className="sm:self-start"
                onClick={handleSignOut}
                disabled={signOut.isPending}
              >
                <LogOut className="size-4" aria-hidden="true" />
                {signOut.isPending ? 'Signing out…' : 'Sign out'}
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
