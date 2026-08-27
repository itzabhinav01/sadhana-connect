import {
  MentorCapReachedError,
  useAdminAssignments,
  useAdminUsers,
  useAssignMentor,
  useDeactivateAssignment,
} from '@sadhana-connect/admin'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { colors, fontSize, spacing } from '../../../src/shared/theme'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

interface UserSearchPickerProps {
  role: 'devotee' | 'mentor'
  label: string
  selectedId: string | null
  selectedName: string | null
  onSelect: (id: string | null, name: string | null) => void
}

function UserSearchPicker({ role, label, selectedId, selectedName, onSelect }: UserSearchPickerProps) {
  const [search, setSearch] = useState('')
  const usersQuery = useAdminUsers({ role, status: 'active', search })
  const results = usersQuery.data?.pages.flatMap((page) => page.users) ?? []

  if (selectedId && selectedName) {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.selectedRow}>
          <Text style={styles.mutedLine}>{selectedName}</Text>
          <Button title="Change" variant="outline" onPress={() => onSelect(null, null)} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={`Search ${label.toLowerCase()} by name…`}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        accessibilityLabel={`Search ${label.toLowerCase()}`}
      />
      {results.map((user) => (
        <Pressable
          key={user.id}
          onPress={() => onSelect(user.id, user.fullName)}
          style={styles.resultRow}
          accessibilityRole="button"
          accessibilityLabel={`Select ${user.fullName}`}
        >
          <Text style={styles.mutedLine}>{user.fullName}</Text>
        </Pressable>
      ))}
    </View>
  )
}

export default function AdminAssignmentsScreen() {
  const [devoteeId, setDevoteeId] = useState<string | null>(null)
  const [devoteeName, setDevoteeName] = useState<string | null>(null)
  const [mentorId, setMentorId] = useState<string | null>(null)
  const [mentorName, setMentorName] = useState<string | null>(null)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  const assign = useAssignMentor()
  const assignmentsQuery = useAdminAssignments()
  const deactivate = useDeactivateAssignment()

  const handleAssign = () => {
    if (!devoteeId || !mentorId) return
    setBlockedMessage(null)
    assign.mutate(
      { devoteeId, mentorId },
      {
        onSuccess: () => {
          setDevoteeId(null)
          setDevoteeName(null)
          setMentorId(null)
          setMentorName(null)
        },
        onError: (error) => {
          if (error instanceof MentorCapReachedError) {
            setBlockedMessage(error.message)
          }
        },
      },
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card title="Assign a Mentor">
        <UserSearchPicker
          role="devotee"
          label="Devotee"
          selectedId={devoteeId}
          selectedName={devoteeName}
          onSelect={(id, name) => {
            setDevoteeId(id)
            setDevoteeName(name)
          }}
        />
        <UserSearchPicker
          role="mentor"
          label="Mentor"
          selectedId={mentorId}
          selectedName={mentorName}
          onSelect={(id, name) => {
            setMentorId(id)
            setMentorName(name)
          }}
        />
        <Button
          title="Assign"
          pendingTitle="Saving…"
          isPending={assign.isPending}
          disabled={!devoteeId || !mentorId}
          onPress={handleAssign}
        />
        {blockedMessage ? <Text style={styles.errorText}>{blockedMessage}</Text> : null}
        {assign.isError && !blockedMessage ? (
          <ErrorBanner message="Something went wrong saving this assignment." />
        ) : null}
        {assign.isSuccess ? <Text style={styles.successText}>Assignment saved.</Text> : null}
      </Card>

      {assignmentsQuery.isPending ? <Text style={styles.mutedLine}>Loading…</Text> : null}
      {assignmentsQuery.isError ? (
        <ErrorBanner message="Something went wrong loading assignments." />
      ) : null}
      {assignmentsQuery.data && assignmentsQuery.data.length === 0 ? (
        <Text style={styles.mutedLine}>No assignments yet.</Text>
      ) : null}

      {assignmentsQuery.data?.map((assignment) => (
        <View key={assignment.id} style={styles.assignmentRow}>
          <Text style={styles.rowName}>
            {assignment.mentorName} mentors {assignment.devoteeName}
          </Text>
          <Text style={styles.mutedLine}>
            Assigned {formatDate(assignment.assignedAt)}
            {assignment.unassignedAt ? ` · Ended ${formatDate(assignment.unassignedAt)}` : ''}
          </Text>
          {assignment.isActive ? (
            <Button
              title="Deactivate"
              variant="outline"
              isPending={deactivate.isPending}
              onPress={() => deactivate.mutate(assignment.id)}
            />
          ) : (
            <Text style={styles.mutedLine}>Inactive</Text>
          )}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
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
  resultRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mutedLine: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.destructive,
  },
  successText: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  assignmentRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  rowName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.foreground,
  },
})
