import {
  MENTOR_HAS_ACTIVE_DEVOTEES_MESSAGE,
  MentorHasActiveDevoteesError,
  useAdminAssignments,
  useAdminUserDetail,
  useChangeUserRole,
  useDeactivateAssignment,
  useMentorDevoteeCount,
  useSetUserActive,
} from '@sadhana-connect/admin'
import type { AppRole } from '@sadhana-connect/domain'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { Button } from '../../../../src/presentation/components/Button'
import { Card } from '../../../../src/presentation/components/Card'
import { ErrorBanner } from '../../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../../src/presentation/components/LoadingScreen'
import { colors, fontSize, spacing } from '../../../../src/shared/theme'

const SELECTABLE_ROLES: AppRole[] = ['devotee', 'mentor', 'super_admin']
const ROLE_LABEL: Record<AppRole, string> = {
  devotee: 'Devotee',
  mentor: 'Mentor',
  super_admin: 'Super Admin',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

function MentorInfoPanel({ mentorId }: { mentorId: string }) {
  const countQuery = useMentorDevoteeCount(mentorId)
  return (
    <Card title="Assigned devotees">
      <Text style={styles.mutedLine}>
        {countQuery.isPending ? 'Loading…' : (countQuery.data ?? 0)}
      </Text>
    </Card>
  )
}

function DevoteeInfoPanel({ devoteeId }: { devoteeId: string }) {
  const assignmentsQuery = useAdminAssignments({ devoteeId })
  const activeAssignments = assignmentsQuery.data?.filter((a) => a.isActive) ?? []
  const deactivate = useDeactivateAssignment()

  return (
    <Card title="Current mentors">
      {assignmentsQuery.isPending ? (
        <Text style={styles.mutedLine}>Loading…</Text>
      ) : activeAssignments.length === 0 ? (
        <Text style={styles.mutedLine}>No mentor assigned</Text>
      ) : (
        activeAssignments.map((assignment) => (
          <View key={assignment.id} style={styles.mentorRow}>
            <Text style={styles.mutedLine}>{assignment.mentorName}</Text>
            <Button
              title="Remove"
              variant="outline"
              isPending={deactivate.isPending}
              onPress={() => deactivate.mutate(assignment.id)}
            />
          </View>
        ))
      )}
    </Card>
  )
}

function RoleControl({ user }: { user: { id: string; role: AppRole } }) {
  const [selectedRole, setSelectedRole] = useState<AppRole>(
    user.role === 'mentor' ? 'mentor' : 'devotee',
  )
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)
  const mentorDevoteeCount = useMentorDevoteeCount(user.role === 'mentor' ? user.id : null)
  const changeRole = useChangeUserRole()

  const wouldLeaveMentorRole = user.role === 'mentor' && selectedRole !== 'mentor'
  const hasActiveDevotees = (mentorDevoteeCount.data ?? 0) > 0
  const demoteBlocked = wouldLeaveMentorRole && hasActiveDevotees
  const noChange = selectedRole === user.role

  const handleSubmit = () => {
    setBlockedMessage(null)
    changeRole.mutate(
      { userId: user.id, currentRole: user.role, newRole: selectedRole },
      {
        onError: (error) => {
          if (error instanceof MentorHasActiveDevoteesError) {
            setBlockedMessage(error.message)
          }
        },
      },
    )
  }

  return (
    <Card title="Role">
      <View style={styles.filterRow}>
        {SELECTABLE_ROLES.map((role) => (
          <Button
            key={role}
            title={ROLE_LABEL[role]}
            variant={selectedRole === role ? 'primary' : 'outline'}
            onPress={() => {
              setBlockedMessage(null)
              setSelectedRole(role)
            }}
          />
        ))}
      </View>
      <Button
        title="Save role"
        pendingTitle="Saving…"
        isPending={changeRole.isPending}
        disabled={noChange || demoteBlocked}
        onPress={handleSubmit}
      />
      {demoteBlocked ? (
        <Text style={styles.errorText}>{MENTOR_HAS_ACTIVE_DEVOTEES_MESSAGE}</Text>
      ) : null}
      {blockedMessage ? <Text style={styles.errorText}>{blockedMessage}</Text> : null}
      {changeRole.isError && !blockedMessage ? (
        <Text style={styles.errorText}>Something went wrong changing this role.</Text>
      ) : null}
    </Card>
  )
}

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const userId = id ?? ''
  const userQuery = useAdminUserDetail(userId)
  const setActive = useSetUserActive()

  if (userQuery.isPending) {
    return <LoadingScreen />
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message="This user isn't available." />
      </View>
    )
  }

  const user = userQuery.data

  return (
    <>
      <Stack.Screen options={{ title: user.fullName }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.heading} accessibilityRole="header">
            {user.fullName}
          </Text>
          <Text style={user.isActive ? styles.badgeActive : styles.badgeDisabled}>
            {user.isActive ? 'Active' : 'Disabled'}
          </Text>
          <Text style={styles.mutedLine}>Joined {formatDate(user.createdAt)}</Text>
        </View>

        <Card title="Phone number">
          <Text style={styles.mutedLine}>{user.phoneNumber ?? 'Not provided'}</Text>
        </Card>

        {user.role === 'mentor' ? <MentorInfoPanel mentorId={user.id} /> : null}
        {user.role === 'devotee' ? <DevoteeInfoPanel devoteeId={user.id} /> : null}

        {user.role !== 'super_admin' ? <RoleControl user={user} /> : null}

        <Card title="Account status">
          <Button
            title={user.isActive ? 'Disable account' : 'Re-enable account'}
            variant="outline"
            isPending={setActive.isPending}
            onPress={() => setActive.mutate({ userId: user.id, isActive: !user.isActive })}
          />
        </Card>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeActive: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  badgeDisabled: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.muted,
  },
  mentorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
})
