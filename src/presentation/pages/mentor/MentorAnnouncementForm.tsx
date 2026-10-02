import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  ANNOUNCEMENT_EXPIRATION_PRESETS,
  ANNOUNCEMENT_EXPIRATION_PRESET_LABELS,
  announcementSchema,
  resolveExpirationError,
  resolveExpiresAt,
  useCreateMentorAnnouncement,
  type AnnouncementExpirationPreset,
  type AnnouncementFormValues,
} from '@sadhana-connect/announcements'
import type { TempleGroup } from '@sadhana-connect/domain'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Textarea } from '@/presentation/components/ui/textarea'

interface MentorAnnouncementFormProps {
  templeGroups?: TempleGroup[]
}

// Mentors may only ever author scope: 'temple_group' announcements matching
// one of their own assigned temple groups. When a mentor belongs to multiple
// temple groups, they can pick which of their groups to post to.
export function MentorAnnouncementForm({ templeGroups = [] }: MentorAnnouncementFormProps) {
  const createAnnouncement = useCreateMentorAnnouncement()
  const hasMultipleGroups = templeGroups.length > 1
  const [selectedTempleGroupId, setSelectedTempleGroupId] = useState<string>('')
  const effectiveTempleGroupId = selectedTempleGroupId || templeGroups[0]?.id || ''
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
        ...(hasMultipleGroups && effectiveTempleGroupId
          ? { templeGroupId: effectiveTempleGroupId }
          : {}),
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
          {hasMultipleGroups ? (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="announcement-temple-group"
                className="text-sm font-medium text-foreground"
              >
                Temple Group
              </label>
              <Select
                value={effectiveTempleGroupId}
                onValueChange={setSelectedTempleGroupId}
              >
                <SelectTrigger id="announcement-temple-group">
                  <SelectValue placeholder="Select temple group…" />
                </SelectTrigger>
                <SelectContent>
                  {templeGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

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
              value={expirationPreset}
              onValueChange={(value) =>
                setExpirationPreset(value as AnnouncementExpirationPreset)
              }
            >
              <SelectTrigger id="announcement-expiration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANNOUNCEMENT_EXPIRATION_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {ANNOUNCEMENT_EXPIRATION_PRESET_LABELS[preset]}
                  </SelectItem>
                ))}
              </SelectContent>
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
