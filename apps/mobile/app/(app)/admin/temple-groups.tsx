import {
  templeGroupNameSchema,
  useAdminTempleGroups,
  useCreateTempleGroup,
  useDeleteTempleGroup,
  useRenameTempleGroup,
} from '@sadhana-connect/admin'
import type { TempleGroup } from '@sadhana-connect/domain'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

function TempleGroupRow({ group }: { group: TempleGroup }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const renameGroup = useRenameTempleGroup()
  const deleteGroup = useDeleteTempleGroup()
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(group.name)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const handleSave = () => {
    const result = templeGroupNameSchema.safeParse({ name: draftName })
    if (!result.success) {
      setRenameError(result.error.issues[0]?.message ?? 'Invalid name.')
      return
    }
    setRenameError(null)
    renameGroup.mutate(
      { id: group.id, name: result.data.name },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  return (
    <View style={styles.row}>
      {isEditing ? (
        <View style={styles.editBlock}>
          <TextInput
            style={styles.input}
            value={draftName}
            onChangeText={setDraftName}
            accessibilityLabel="Edit temple group name"
          />
          {renameError ? <Text style={styles.errorText}>{renameError}</Text> : null}
          <View style={styles.actionsRow}>
            <Button title="Save" isPending={renameGroup.isPending} onPress={handleSave} />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => {
                setIsEditing(false)
                setDraftName(group.name)
                setRenameError(null)
              }}
            />
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.rowName}>{group.name}</Text>
          <Text style={styles.mutedLine}>Created {formatDate(group.createdAt)}</Text>
        </>
      )}

      {!isEditing ? (
        <View style={styles.actionsRow}>
          <Button title="Rename" variant="outline" onPress={() => setIsEditing(true)} />
          {confirmingDelete ? (
            <>
              <Text style={styles.mutedLine}>Delete?</Text>
              <Button
                title="Confirm"
                variant="destructive"
                isPending={deleteGroup.isPending}
                onPress={() => deleteGroup.mutate(group.id)}
              />
              <Button title="Cancel" variant="text" onPress={() => setConfirmingDelete(false)} />
            </>
          ) : (
            <Button title="Delete" variant="destructive" onPress={() => setConfirmingDelete(true)} />
          )}
        </View>
      ) : null}

      {deleteGroup.isError ? (
        <ErrorBanner message="This group is still in use and can't be deleted." />
      ) : null}
    </View>
  )
}

export default function AdminTempleGroupsScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const groupsQuery = useAdminTempleGroups()
  const createGroup = useCreateTempleGroup()
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreate = () => {
    const result = templeGroupNameSchema.safeParse({ name: newName })
    if (!result.success) {
      setCreateError(result.error.issues[0]?.message ?? 'Invalid name.')
      return
    }
    setCreateError(null)
    createGroup.mutate(result.data.name, { onSuccess: () => setNewName('') })
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card title="New temple group">
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={setNewName}
          placeholder="Group name…"
          accessibilityLabel="Group name"
        />
        <Button
          title="Create"
          pendingTitle="Creating…"
          isPending={createGroup.isPending}
          onPress={handleCreate}
        />
        {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
        {createGroup.isError ? (
          <ErrorBanner message="Something went wrong creating this group." />
        ) : null}
      </Card>

      {groupsQuery.isPending ? <Text style={styles.mutedLine}>Loading…</Text> : null}
      {groupsQuery.isError ? (
        <ErrorBanner message="Something went wrong loading temple groups." />
      ) : null}
      {groupsQuery.isSuccess && groupsQuery.data.length === 0 ? (
        <Text style={styles.mutedLine}>No temple groups yet.</Text>
      ) : null}

      {groupsQuery.data?.map((group) => <TempleGroupRow key={group.id} group={group} />)}
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
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      color: colors.foreground,
    },
    mutedLine: {
      fontSize: fontSize.sm,
      color: colors.muted,
    },
    errorText: {
      fontSize: fontSize.sm,
      color: colors.destructive,
    },
    row: {
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
    rowName: {
      fontSize: fontSize.base,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    editBlock: {
      gap: spacing.xs,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
  })
}
