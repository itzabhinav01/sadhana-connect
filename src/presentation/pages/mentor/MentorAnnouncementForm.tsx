import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  ANNOUNCEMENT_EXPIRATION_PRESETS,
  ANNOUNCEMENT_EXPIRATION_PRESET_LABELS,
  resolveExpirationError,
  resolveExpiresAt,
  type AnnouncementExpirationPreset,
} from '@/application/announcements/announcement-expiration'
import {
  announcementSchema,
  type AnnouncementFormValues,
} from '@/application/announcements/announcement-schema'
import { useCreateMentorAnnouncement } from '@/application/announcements/use-create-announcement'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'
import { Select } from '@/presentation/components/ui/select'
import { Textarea } from '@/presentation/components/ui/textarea'

// No scope selector anywhere on this form, on purpose — mentors may only
// ever author scope: 'temple_group' announcements matching their own
// temple group (useCreateMentorAnnouncement hardcodes this), and RLS
// would reject anything else regardless. Offering a choice that could
// only fail would be worse UX, not more flexible.
export function MentorAnnouncementForm() {
  const createAnnouncement = useCreateMentorAnnouncement()
  const [publishNow, setPublishNow] = useState(true)
  const [expirationPreset, setExpirationPreset] = useState<AnnouncementExpirationPreset>('never')
  const [customExpiresAt, setCustomExpiresAt] = useState('')
  const [expirationError, setExpirationError] = useState<string | null>(null)
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '' },
  })

  function onSubmit(values: AnnouncementFormValues) {
    const error = resolveExpirationError(expirationPreset, customExpiresAt || null)
    if (error) {
      setExpirationError(error)
      return
    }
    setExpirationError(null)
    createAnnouncement.mutate(
      {
        title: values.title,
        content: values.content,
        isPublished: publishNow,
        expiresAt: resolveExpiresAt(expirationPreset, customExpiresAt || null),
      },
      {
        onSuccess: () => {
          form.reset()
          setExpirationPreset('never')
          setCustomExpiresAt('')
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>New Announcement</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="announcement-title" className="text-sm font-medium text-foreground">
              Title
            </label>
            <Input
              id="announcement-title"
              aria-invalid={form.formState.errors.title ? true : undefined}
              {...form.register('title')}
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="announcement-content" className="text-sm font-medium text-foreground">
              Content
            </label>
            <Textarea
              id="announcement-content"
              rows={4}
              aria-invalid={form.formState.errors.content ? true : undefined}
              {...form.register('content')}
            />
            {form.formState.errors.content ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.content.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="announcement-expiration" className="text-sm font-medium text-foreground">
              Expiration
            </label>
            <Select
              id="announcement-expiration"
              value={expirationPreset}
              onChange={(event) =>
                setExpirationPreset(event.target.value as AnnouncementExpirationPreset)
              }
            >
              {ANNOUNCEMENT_EXPIRATION_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {ANNOUNCEMENT_EXPIRATION_PRESET_LABELS[preset]}
                </option>
              ))}
            </Select>
            {expirationPreset === 'custom' ? (
              <Input
                type="date"
                aria-label="Expiration date"
                value={customExpiresAt.slice(0, 10)}
                onChange={(event) =>
                  setCustomExpiresAt(
                    event.target.value ? new Date(event.target.value).toISOString() : '',
                  )
                }
              />
            ) : null}
            {expirationError ? <p className="text-xs text-destructive">{expirationError}</p> : null}
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(event) => setPublishNow(event.target.checked)}
            />
            Publish immediately (uncheck to save as a draft only you can see)
          </label>

          <Button type="submit" disabled={createAnnouncement.isPending} className="self-start">
            {createAnnouncement.isPending ? 'Posting…' : 'Post Announcement'}
          </Button>
          {createAnnouncement.isError ? (
            <p className="text-xs text-destructive">
              Something went wrong posting this announcement.
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}
