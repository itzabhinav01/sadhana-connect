import { zodResolver } from '@hookform/resolvers/zod'
import { useAdminTempleGroups } from '@sadhana-connect/admin'
import {
  announcementSchema,
  resolveExpirationError,
  resolveExpiresAt,
  toExpirationFormValue,
  useAnnouncements,
  useCreateAdminAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
  type AnnouncementExpirationPreset,
  type AnnouncementFormValues,
} from '@sadhana-connect/announcements'
import type { Announcement, AnnouncementScope } from '@sadhana-connect/domain'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { ExpirationPicker } from '../../../src/presentation/components/ExpirationPicker'
import { TextField } from '../../../src/presentation/components/TextField'
import { fontSize, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

function formatDisplayDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

const SCOPE_OPTIONS: { label: string; value: AnnouncementScope }[] = [
  { label: 'Everyone', value: 'all' },
  { label: 'Mentors only', value: 'mentors' },
  { label: 'Devotees only', value: 'devotees' },
  { label: 'Temple group', value: 'temple_group' },
]

const SCOPE_LABEL: Record<AnnouncementScope, string> = {
  all: 'Everyone',
  mentors: 'Mentors',
  devotees: 'Devotees',
  temple_group: 'Temple group',
}

// Unlike the mentor form, a Super Admin genuinely chooses scope — RLS
// (private.can_publish_announcement's is_super_admin() branch) allows
// any scope, so this is the one form on mobile that offers the choice.
function AdminAnnouncementForm() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const createAnnouncement = useCreateAdminAnnouncement()
  const templeGroupsQuery = useAdminTempleGroups()
  const [publishNow, setPublishNow] = useState(true)
  const [scope, setScope] = useState<AnnouncementScope>('all')
  const [templeGroupId, setTempleGroupId] = useState('')
  const [scopeError, setScopeError] = useState<string | null>(null)
  const [expirationPreset, setExpirationPreset] = useState<AnnouncementExpirationPreset>('never')
  const [customExpiresAt, setCustomExpiresAt] = useState('')
  const [expirationError, setExpirationError] = useState<string | null>(null)

  const { control, handleSubmit, reset } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '' },
  })

  const onSubmit = handleSubmit((values) => {
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
          reset()
          setExpirationPreset('never')
          setCustomExpiresAt('')
          setPublishNow(true)
          setScope('all')
          setTempleGroupId('')
        },
      },
    )
  })

  return (
    <Card title="New Announcement">
      <TextField control={control} name="title" label="Title" />

      <Controller
        control={control}
        name="content"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Content</Text>
            <TextInput
              style={styles.textArea}
              value={value}
              onChangeText={onChange}
              multiline
              accessibilityLabel="Content"
            />
            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
          </View>
        )}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Audience</Text>
        <View style={styles.optionRow}>
          {SCOPE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              title={option.label}
              variant={scope === option.value ? 'primary' : 'outline'}
              onPress={() => setScope(option.value)}
            />
          ))}
        </View>
      </View>

      {scope === 'temple_group' ? (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Temple group</Text>
          <View style={styles.optionRow}>
            {templeGroupsQuery.data?.map((group) => (
              <Button
                key={group.id}
                title={group.name}
                variant={templeGroupId === group.id ? 'primary' : 'outline'}
                onPress={() => setTempleGroupId(group.id)}
              />
            ))}
          </View>
          {scopeError ? <Text style={styles.errorText}>{scopeError}</Text> : null}
        </View>
      ) : null}

      <ExpirationPicker
        preset={expirationPreset}
        customDateIso={customExpiresAt || null}
        onPresetChange={setExpirationPreset}
        onCustomDateChange={setCustomExpiresAt}
        error={expirationError}
      />

      <View style={styles.actionsRow}>
        <Button
          title="Publish now"
          variant={publishNow ? 'primary' : 'outline'}
          onPress={() => setPublishNow(true)}
        />
        <Button
          title="Save as draft"
          variant={!publishNow ? 'primary' : 'outline'}
          onPress={() => setPublishNow(false)}
        />
      </View>

      <Button
        title="Post Announcement"
        pendingTitle="Posting…"
        isPending={createAnnouncement.isPending}
        onPress={onSubmit}
      />
      {createAnnouncement.isError ? (
        <ErrorBanner message="Something went wrong posting this announcement." />
      ) : null}
    </Card>
  )
}

// Every row gets Edit/Publish/Pin/Delete regardless of author —
// announcements_update/_delete RLS already allows a super admin to act
// on any row, so there is no "own row" restriction to mirror here,
// unlike the mentor announcements screen.
function AdminAnnouncementItem({ announcement }: { announcement: Announcement }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [isEditing, setIsEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [draftTitle, setDraftTitle] = useState(announcement.title)
  const [draftContent, setDraftContent] = useState(announcement.content)
  const initialExpiration = toExpirationFormValue(announcement.expiresAt)
  const [expirationPreset, setExpirationPreset] = useState<AnnouncementExpirationPreset>(
    initialExpiration.preset,
  )
  const [customExpiresAt, setCustomExpiresAt] = useState(initialExpiration.customDateIso ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)

  const updateAnnouncement = useUpdateAnnouncement()
  const deleteAnnouncement = useDeleteAnnouncement()

  const handleSave = () => {
    const result = announcementSchema.safeParse({ title: draftTitle, content: draftContent })
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? 'Invalid announcement.')
      return
    }
    const expirationErr = resolveExpirationError(expirationPreset, customExpiresAt || null)
    if (expirationErr) {
      setValidationError(expirationErr)
      return
    }
    setValidationError(null)
    updateAnnouncement.mutate(
      {
        id: announcement.id,
        title: result.data.title,
        content: result.data.content,
        isPublished: announcement.isPublished,
        expiresAt: resolveExpiresAt(expirationPreset, customExpiresAt || null),
        isPinned: announcement.isPinned,
      },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setDraftTitle(announcement.title)
    setDraftContent(announcement.content)
    setExpirationPreset(initialExpiration.preset)
    setCustomExpiresAt(initialExpiration.customDateIso ?? '')
    setValidationError(null)
  }

  const handleTogglePublish = () => {
    updateAnnouncement.mutate({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      isPublished: !announcement.isPublished,
      expiresAt: announcement.expiresAt,
      isPinned: announcement.isPinned,
    })
  }

  const handleTogglePin = () => {
    updateAnnouncement.mutate({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      isPublished: announcement.isPublished,
      expiresAt: announcement.expiresAt,
      isPinned: !announcement.isPinned,
    })
  }

  return (
    <View style={styles.item}>
      <View style={styles.itemHeaderRow}>
        <Text style={styles.itemTitle}>
          {isEditing ? 'Editing Announcement' : announcement.title}
        </Text>
        <Text style={styles.badge}>{SCOPE_LABEL[announcement.scope]}</Text>
        {announcement.isPinned ? <Text style={styles.badge}>Pinned</Text> : null}
        {!announcement.isPublished ? <Text style={styles.badge}>Draft</Text> : null}
        <Text style={styles.badge}>
          {announcement.expiresAt
            ? `Expires ${formatDisplayDate(announcement.expiresAt)}`
            : 'Permanent'}
        </Text>
      </View>

      {isEditing ? (
        <View style={styles.editBlock}>
          <TextInput
            style={styles.input}
            value={draftTitle}
            onChangeText={setDraftTitle}
            accessibilityLabel="Edit title"
          />
          <TextInput
            style={styles.textArea}
            value={draftContent}
            onChangeText={setDraftContent}
            multiline
            accessibilityLabel="Edit content"
          />
          <ExpirationPicker
            preset={expirationPreset}
            customDateIso={customExpiresAt || null}
            onPresetChange={setExpirationPreset}
            onCustomDateChange={setCustomExpiresAt}
          />
          {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}
          <View style={styles.actionsRow}>
            <Button title="Save" isPending={updateAnnouncement.isPending} onPress={handleSave} />
            <Button title="Cancel" variant="outline" onPress={handleCancelEdit} />
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.itemContent}>{announcement.content}</Text>
          <Text style={styles.itemMuted}>
            {announcement.publishedAt
              ? `Published ${formatDisplayDate(announcement.publishedAt)}`
              : `Created ${formatDisplayDate(announcement.createdAt)}`}
          </Text>
        </>
      )}

      {!isEditing ? (
        <View style={styles.actionsRow}>
          <Button title="Edit" variant="outline" onPress={() => setIsEditing(true)} />
          <Button
            title={announcement.isPublished ? 'Unpublish' : 'Publish'}
            variant="outline"
            isPending={updateAnnouncement.isPending}
            onPress={handleTogglePublish}
          />
          <Button
            title={announcement.isPinned ? 'Unpin' : 'Pin'}
            variant="outline"
            isPending={updateAnnouncement.isPending}
            onPress={handleTogglePin}
          />
          {confirmingDelete ? (
            <>
              <Text style={styles.itemMuted}>
                Deleting removes this announcement for devotees. This cannot be undone.
              </Text>
              <Button
                title="Confirm delete"
                variant="outline"
                isPending={deleteAnnouncement.isPending}
                onPress={() => deleteAnnouncement.mutate(announcement.id)}
              />
              <Button title="Cancel" variant="outline" onPress={() => setConfirmingDelete(false)} />
            </>
          ) : (
            <Button title="Delete" variant="outline" onPress={() => setConfirmingDelete(true)} />
          )}
        </View>
      ) : null}
    </View>
  )
}

export default function AdminAnnouncementsScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const announcementsQuery = useAnnouncements()

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AdminAnnouncementForm />

      {announcementsQuery.isPending ? <Text style={styles.mutedLine}>Loading…</Text> : null}
      {announcementsQuery.isError ? (
        <ErrorBanner message="Something went wrong loading announcements." />
      ) : null}
      {announcementsQuery.isSuccess && announcementsQuery.data.length === 0 ? (
        <Text style={styles.mutedLine}>No announcements yet.</Text>
      ) : null}
      {announcementsQuery.isSuccess
        ? announcementsQuery.data.map((announcement) => (
            <AdminAnnouncementItem key={announcement.id} announcement={announcement} />
          ))
        : null}
    </ScrollView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.background,
    },
    mutedLine: {
      fontSize: fontSize.sm,
      color: colors.muted,
    },
    fieldGroup: {
      gap: spacing.xs,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.foreground,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      color: colors.foreground,
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      color: colors.foreground,
      minHeight: 96,
      textAlignVertical: 'top',
    },
    errorText: {
      fontSize: fontSize.sm,
      color: colors.destructive,
    },
    optionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
    item: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.sm,
    },
    itemHeaderRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
    itemTitle: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: colors.foreground,
    },
    badge: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.muted,
      backgroundColor: colors.mutedBackground,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    itemContent: {
      fontSize: fontSize.base,
      color: colors.foreground,
    },
    itemMuted: {
      fontSize: fontSize.sm,
      color: colors.muted,
    },
    editBlock: {
      gap: spacing.sm,
    },
  })
}
