import {
  MentorCapReachedError,
  useAdminAssignments,
  useAdminUsers,
  useAssignMentor,
  useDeactivateAssignment,
} from '@sadhana-connect/admin'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

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
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [search, setSearch] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const usersQuery = useAdminUsers({ role, status: 'active', search })
  const results = usersQuery.data?.pages.flatMap((page) => page.users) ?? []

  if (selectedId && selectedName) {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.selectedRow}>
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedRoleText}>{role.toUpperCase()}</Text>
          </View>
          <Text style={styles.selectedNameText}>{selectedName}</Text>
          <Button title="Change" size="sm" variant="outline" onPress={() => onSelect(null, null)} />
        </View>
      </View>
    )
  }

  // Only display search suggestions when user is focused or typing, capped to top 6 to prevent layout explosions
  const hasInput = search.trim().length > 0
  const displayedResults = results.slice(0, 6)

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={`Type to search ${label.toLowerCase()}…`}
        placeholderTextColor={colors.placeholder ?? colors.muted}
        value={search}
        onChangeText={setSearch}
        onFocus={() => setIsFocused(true)}
        autoCapitalize="none"
        accessibilityLabel={`Search ${label.toLowerCase()}`}
      />
      {isFocused && (
        <View style={styles.suggestionsContainer}>
          {usersQuery.isPending && (
            <Text style={styles.suggestionMuted}>Searching {label.toLowerCase()}s…</Text>
          )}
          {!usersQuery.isPending && displayedResults.length === 0 && (
            <Text style={styles.suggestionMuted}>
              {hasInput ? `No ${label.toLowerCase()} found matching "${search}"` : `No active ${label.toLowerCase()}s`}
            </Text>
          )}
          {displayedResults.map((user) => (
            <Pressable
              key={user.id}
              onPress={() => {
                onSelect(user.id, user.fullName)
                setIsFocused(false)
                setSearch('')
              }}
              style={({ pressed }) => [
                styles.resultRow,
                pressed && { backgroundColor: colors.mutedBackground },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Select ${user.fullName}`}
            >
              <Text style={styles.resultText}>{user.fullName}</Text>
            </Pressable>
          ))}
          {results.length > 6 && (
            <Text style={styles.suggestionMuted}>
              +{results.length - 6} more matching. Type to narrow down.
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

export default function AdminAssignmentsScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [isCreatorOpen, setIsCreatorOpen] = useState(false)
  const [devoteeId, setDevoteeId] = useState<string | null>(null)
  const [devoteeName, setDevoteeName] = useState<string | null>(null)
  const [mentorId, setMentorId] = useState<string | null>(null)
  const [mentorName, setMentorName] = useState<string | null>(null)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)
  const [assignmentSearch, setAssignmentSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

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
          setIsCreatorOpen(false)
        },
        onError: (error) => {
          if (error instanceof MentorCapReachedError) {
            setBlockedMessage(error.message)
          }
        },
      },
    )
  }

  const allAssignments = assignmentsQuery.data ?? []
  const searchTerm = assignmentSearch.trim().toLowerCase()
  const visibleAssignments = allAssignments.filter((assignment) => {
    if (statusFilter === 'active' && !assignment.isActive) return false
    if (statusFilter === 'inactive' && assignment.isActive) return false
    if (!searchTerm) return true
    return (
      assignment.mentorName.toLowerCase().includes(searchTerm) ||
      assignment.devoteeName.toLowerCase().includes(searchTerm)
    )
  })

  const activeCount = allAssignments.filter((a) => a.isActive).length

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Card
        title="Mentor Assignments"
        action={
          <Button
            title={isCreatorOpen ? 'Cancel' : '+ New Assignment'}
            size="sm"
            variant={isCreatorOpen ? 'ghost' : 'primary'}
            onPress={() => setIsCreatorOpen(!isCreatorOpen)}
          />
        }
      >
        {!isCreatorOpen ? (
          <View style={{ gap: spacing.sm, marginTop: 4 }}>
            <Text style={styles.mutedLine}>
              {activeCount} active mentoring {activeCount === 1 ? 'relationship' : 'relationships'}. Assign devotees to mentors to guide their daily sadhana.
            </Text>
            <Button
              title="+ New Assignment"
              size="sm"
              variant="primary"
              onPress={() => setIsCreatorOpen(true)}
            />
          </View>
        ) : (
          <View style={styles.creatorForm}>
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
              title="Assign Devotee to Mentor"
              pendingTitle="Saving Assignment…"
              isPending={assign.isPending}
              disabled={!devoteeId || !mentorId}
              onPress={handleAssign}
            />
            {blockedMessage ? <Text style={styles.errorText}>{blockedMessage}</Text> : null}
            {assign.isError && !blockedMessage ? (
              <ErrorBanner message="Something went wrong saving this assignment." />
            ) : null}
            {assign.isSuccess ? <Text style={styles.successText}>Assignment saved.</Text> : null}
          </View>
        )}
      </Card>

      {assignmentsQuery.isPending ? <Text style={styles.mutedLine}>Loading assignments…</Text> : null}
      {assignmentsQuery.isError ? (
        <ErrorBanner message="Something went wrong loading assignments." />
      ) : null}
      {assignmentsQuery.data && assignmentsQuery.data.length === 0 ? (
        <Text style={styles.mutedLine}>No assignments yet.</Text>
      ) : null}

      {allAssignments.length > 0 ? (
        <View style={styles.filterSection}>
          <TextInput
            style={styles.input}
            placeholder="Search by mentor or devotee name…"
            placeholderTextColor={colors.placeholder ?? colors.muted}
            value={assignmentSearch}
            onChangeText={setAssignmentSearch}
            autoCapitalize="none"
            accessibilityLabel="Search assignments"
          />
          <View style={styles.filterRow}>
            {(['all', 'active', 'inactive'] as const).map((option) => (
              <Button
                key={option}
                size="sm"
                title={
                  option === 'all'
                    ? `All (${allAssignments.length})`
                    : option === 'active'
                      ? `Active (${activeCount})`
                      : `Inactive (${allAssignments.length - activeCount})`
                }
                variant={statusFilter === option ? 'primary' : 'outline'}
                onPress={() => setStatusFilter(option)}
              />
            ))}
          </View>
          {visibleAssignments.length === 0 ? (
            <Text style={styles.mutedLine}>No assignments match this filter.</Text>
          ) : null}
        </View>
      ) : null}

      {visibleAssignments.map((assignment) => (
        <View key={assignment.id} style={styles.assignmentRow}>
          <View style={styles.assignmentHeaderRow}>
            <View style={styles.assignmentNames}>
              <Text style={styles.rowMentor}>{assignment.mentorName}</Text>
              <Text style={styles.rowSubtext}>guides {assignment.devoteeName}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                assignment.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  assignment.isActive ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive,
                ]}
              >
                {assignment.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View style={styles.assignmentFooterRow}>
            <Text style={styles.dateLine}>
              Assigned {formatDate(assignment.assignedAt)}
              {assignment.unassignedAt ? ` · Ended ${formatDate(assignment.unassignedAt)}` : ''}
            </Text>
            {assignment.isActive ? (
              <Button
                title="Deactivate"
                size="sm"
                variant="outline"
                isPending={deactivate.isPending}
                onPress={() => deactivate.mutate(assignment.id)}
              />
            ) : null}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      flexGrow: 1,
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.background,
    },
    creatorForm: {
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    filterSection: {
      gap: spacing.sm,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
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
      color: colors.foreground,
      backgroundColor: colors.card,
    },
    suggestionsContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.card,
      marginTop: 2,
      overflow: 'hidden',
    },
    suggestionMuted: {
      fontSize: fontSize.xs,
      color: colors.muted,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      fontFamily: fontFamily.regular,
    },
    resultRow: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    resultText: {
      fontSize: fontSize.sm,
      color: colors.foreground,
      fontFamily: fontFamily.medium,
    },
    selectedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.card,
      gap: spacing.sm,
    },
    selectedBadge: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 2,
      borderRadius: 4,
    },
    selectedRoleText: {
      fontSize: 10,
      fontFamily: fontFamily.semiBold,
      color: colors.primary,
      fontWeight: '600',
    },
    selectedNameText: {
      flex: 1,
      fontSize: fontSize.sm,
      fontFamily: fontFamily.medium,
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
    successText: {
      fontSize: fontSize.sm,
      color: colors.primary,
    },
    assignmentRow: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    assignmentHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    assignmentNames: {
      flex: 1,
      gap: 2,
    },
    rowMentor: {
      fontSize: fontSize.base,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    rowSubtext: {
      fontSize: fontSize.sm,
      color: colors.muted,
      fontFamily: fontFamily.regular,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 999,
    },
    statusBadgeActive: {
      backgroundColor: colors.primarySoft,
    },
    statusBadgeInactive: {
      backgroundColor: colors.mutedBackground,
    },
    statusBadgeText: {
      fontSize: 11,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
    },
    statusBadgeTextActive: {
      color: colors.primary,
    },
    statusBadgeTextInactive: {
      color: colors.muted,
    },
    assignmentFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 2,
      paddingTop: spacing.xs + 2,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    dateLine: {
      fontSize: fontSize.xs,
      color: colors.muted,
      fontFamily: fontFamily.regular,
    },
  })
}
