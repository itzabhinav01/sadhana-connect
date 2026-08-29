import { zodResolver } from '@hookform/resolvers/zod'
import {
  announcementSchema,
  resolveExpirationError,
  resolveExpiresAt,
  toExpirationFormValue,
  useAnnouncements,
  useCreateMentorAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
  type AnnouncementExpirationPreset,
  type AnnouncementFormValues,
} from '@sadhana-connect/announcements'
import { useAuth, useProfile } from '@sadhana-connect/auth'
import type { Announcement } from '@sadhana-connect/domain'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { Chip } from '../../../src/presentation/components/Chip'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { ExpirationPicker } from '../../../src/presentation/components/ExpirationPicker'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { TextField } from '../../../src/presentation/components/TextField'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

function formatDisplayDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

function AnnouncementForm() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const createAnnouncement = useCreateMentorAnnouncement()
  const [publishNow, setPublishNow] = useState(true)
  const [expirationPreset, setExpirationPreset] = useState<AnnouncementExpirationPreset>('never')
  const [customExpiresAt, setCustomExpiresAt] = useState('')
  const [expirationError, setExpirationError] = useState<string | null>(null)

  const { control, handleSubmit, reset } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '' },
  })

  const onSubmit = handleSubmit((values) => {
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
          reset()
          setExpirationPreset('never')
          setCustomExpiresAt('')
          setPublishNow(true)
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

function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { session } = useAuth()
  const currentUserId = session?.userId ?? null
  const isOwn = announcement.authorId === currentUserId

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
        {announcement.isPinned ? <Chip label="Pinned" tone="accent" /> : null}
        {!announcement.isPublished ? <Chip label="Draft" tone="warning" /> : null}
        <Chip
          label={
            announcement.expiresAt ? `Expires ${formatDisplayDate(announcement.expiresAt)}` : 'Permanent'
          }
        />
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
            <Button title="Cancel" variant="text" onPress={handleCancelEdit} />
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

      {isOwn && !isEditing ? (
        <View style={styles.actionsRow}>
          <Button title="Edit" variant="outline" onPress={() => setIsEditing(true)} />
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
                variant="destructive"
                isPending={deleteAnnouncement.isPending}
                onPress={() => deleteAnnouncement.mutate(announcement.id)}
              />
              <Button title="Cancel" variant="text" onPress={() => setConfirmingDelete(false)} />
            </>
          ) : (
            <Button title="Delete" variant="outline" onPress={() => setConfirmingDelete(true)} />
          )}
        </View>
      ) : null}
    </View>
  )
}

export default function MentorAnnouncementsScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const profile = useProfile()
  const announcementsQuery = useAnnouncements()

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {profile.isSuccess && profile.data?.templeGroupId ? <AnnouncementForm /> : null}

      {profile.isSuccess && !profile.data?.templeGroupId ? (
        <Text style={styles.itemMuted}>
          You haven&apos;t been assigned to a temple group yet. Please contact your Super Admin.
        </Text>
      ) : null}

      {announcementsQuery.isPending ? <LoadingScreen /> : null}
      {announcementsQuery.isError ? (
        <ErrorBanner message="Something went wrong loading announcements." />
      ) : null}
      {announcementsQuery.isSuccess && announcementsQuery.data.length === 0 ? (
        <Text style={styles.itemMuted}>No announcements yet.</Text>
      ) : null}
      {announcementsQuery.isSuccess && announcementsQuery.data.length > 0
        ? announcementsQuery.data.map((announcement) => (
            <AnnouncementItem key={announcement.id} announcement={announcement} />
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
    fieldGroup: {
      gap: spacing.xs,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      fontFamily: fontFamily.medium,
      color: colors.foreground,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
      minHeight: 96,
      textAlignVertical: 'top',
    },
    errorText: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.destructive,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
    item: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
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
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    itemContent: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
    },
    itemMuted: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    editBlock: {
      gap: spacing.sm,
    },
  })
}
