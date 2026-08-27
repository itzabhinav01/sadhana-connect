import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useAdminTempleGroups } from '@sadhana-connect/admin'
import {
  useCreateAdminAnnouncement,
  ANNOUNCEMENT_EXPIRATION_PRESETS,
  ANNOUNCEMENT_EXPIRATION_PRESET_LABELS,
  announcementSchema,
  resolveExpirationError,
  resolveExpiresAt,
  type AnnouncementExpirationPreset,
  type AnnouncementFormValues,
} from '@sadhana-connect/announcements'
import type { AnnouncementScope } from '@sadhana-connect/domain'
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

// Unlike the mentor form, a Super Admin genuinely chooses scope — RLS
// (private.can_publish_announcement's is_super_admin() branch) allows any
// scope, so this is the one form in the app that offers the choice.
export function AdminAnnouncementForm() {
  const createAnnouncement = useCreateAdminAnnouncement()
  const templeGroupsQuery = useAdminTempleGroups()
  const [publishNow, setPublishNow] = useState(true)
  const [scope, setScope] = useState<AnnouncementScope>('all')
  const [templeGroupId, setTempleGroupId] = useState('')
  const [scopeError, setScopeError] = useState<string | null>(null)
  const [expirationPreset, setExpirationPreset] = useState<AnnouncementExpirationPreset>('never')
  const [customExpiresAt, setCustomExpiresAt] = useState('')
  const [expirationError, setExpirationError] = useState<string | null>(null)

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '' },
  })

  function onSubmit(values: AnnouncementFormValues) {
    if (scope === 'temple_group' && !templeGroupId) {
      setScopeError('Select a temple group for this scope.')
      return
    }
    setScopeError(null)
    const expirationErr = resolveExpirationError(expirationPreset, customExpiresAt || null)
    if (expirationErr) {
      setExpirationError(expirationErr)
      return
    }
    setExpirationError(null)
    createAnnouncement.mutate(
      {
        title: values.title,
        content: values.content,
        scope,
        templeGroupId: scope === 'temple_group' ? templeGroupId : null,
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
            <label htmlFor="admin-announcement-title" className="text-sm font-medium text-foreground">
              Title
            </label>
            <Input
              id="admin-announcement-title"
              aria-invalid={form.formState.errors.title ? true : undefined}
              {...form.register('title')}
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="admin-announcement-content" className="text-sm font-medium text-foreground">
              Content
            </label>
            <Textarea
              id="admin-announcement-content"
              rows={4}
              aria-invalid={form.formState.errors.content ? true : undefined}
              {...form.register('content')}
            />
            {form.formState.errors.content ? (
              <p className="text-xs text-destructive">{form.formState.errors.content.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="admin-announcement-scope" className="text-sm font-medium text-foreground">
              Audience
            </label>
            <Select value={scope} onValueChange={(value) => setScope(value as AnnouncementScope)}>
              <SelectTrigger id="admin-announcement-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="mentors">Mentors only</SelectItem>
                <SelectItem value="devotees">Devotees only</SelectItem>
                <SelectItem value="temple_group">A specific temple group</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === 'temple_group' ? (
            <div className="flex flex-col gap-1">
              <label htmlFor="admin-announcement-temple-group" className="text-sm font-medium text-foreground">
                Temple group
              </label>
              <Select value={templeGroupId || undefined} onValueChange={setTempleGroupId}>
                <SelectTrigger id="admin-announcement-temple-group">
                  <SelectValue placeholder="Select a temple group…" />
                </SelectTrigger>
                <SelectContent>
                  {templeGroupsQuery.data?.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {scopeError ? <p className="text-xs text-destructive">{scopeError}</p> : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-1">
            <label htmlFor="admin-announcement-expiration" className="text-sm font-medium text-foreground">
              Expiration
            </label>
            <Select
              value={expirationPreset}
              onValueChange={(value) =>
                setExpirationPreset(value as AnnouncementExpirationPreset)
              }
            >
              <SelectTrigger id="admin-announcement-expiration">
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
            Publish immediately (uncheck to save as a draft)
          </label>

          <Button type="submit" disabled={createAnnouncement.isPending} className="self-start">
            {createAnnouncement.isPending ? 'Posting…' : 'Post Announcement'}
          </Button>
          {createAnnouncement.isError ? (
            <p className="text-xs text-destructive">Something went wrong posting this announcement.</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}
