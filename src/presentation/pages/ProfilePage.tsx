import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { phoneNumberField } from '@sadhana-connect/auth'
import { useProfile } from '@sadhana-connect/auth'
import { useUpdatePhoneNumber } from '@/application/profile/use-update-phone-number'
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

const phoneNumberFormSchema = z.object({ phoneNumber: phoneNumberField })
type PhoneNumberFormValues = z.infer<typeof phoneNumberFormSchema>

// Minimal, phone-number-only editor (Phase 20C) — general profile
// editing (full name, etc.) remains the still-unbuilt future phase this
// page was originally a placeholder for. This exists only so an
// existing account (registered before phone number was compulsory) has
// somewhere to add one, and so any devotee can update it later.
export function ProfilePage() {
  const profileQuery = useProfile()
  const updatePhoneNumber = useUpdatePhoneNumber()
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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Profile</h1>

      {profileQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {profileQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading your profile. Please try again.
        </p>
      ) : null}

      {profileQuery.data ? (
        <div className="flex flex-col gap-2 rounded-md border p-3">
          <span className="text-sm font-medium text-foreground">Phone number</span>

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
        </div>
      ) : null}
    </div>
  )
}
