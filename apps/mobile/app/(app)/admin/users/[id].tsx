import {
  MENTOR_HAS_ACTIVE_DEVOTEES_MESSAGE,
  MentorHasActiveDevoteesError,
  useAdminAssignments,
  useAdminTempleGroups,
  useAdminUserDetail,
  useChangeUserRole,
  useDeactivateAssignment,
  useGenerateRecoveryLink,
  useMentorDevoteeCount,
  useSetUserActive,
  useSetUserTempleGroup,
} from '@sadhana-connect/admin'
import type { AppRole } from '@sadhana-connect/domain'
import * as Clipboard from 'expo-clipboard'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useMutation } from '@tanstack/react-query'
import { supabaseAdminAccountActionsRepository } from '@sadhana-connect/infra-supabase'
import { useTheme } from '../../../../src/application/theme/use-theme'
import { Button } from '../../../../src/presentation/components/Button'
import { Card } from '../../../../src/presentation/components/Card'
import { DevoteeSadhanaHistorySection } from '../../../../src/presentation/components/DevoteeSadhanaHistorySection'
import { ErrorBanner } from '../../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../../src/presentation/components/LoadingScreen'
import { fontFamily, fontSize, radius, spacing } from '../../../../src/shared/theme'
import type { ThemeColors } from '../../../../src/shared/theme'

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
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const countQuery = useMentorDevoteeCount(mentorId)
  return (
    <Card title="Assigned devotees">
      <Text style={styles.mutedLine}>
        {countQuery.isPending ? 'Loading…' : (countQuery.data ?? 0)}
      </Text>
    </Card>
  )
}

function DevoteeInfoPanel({
  devoteeId,
  devoteeName,
}: {
  devoteeId: string
  devoteeName?: string
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const assignmentsQuery = useAdminAssignments({ devoteeId })
  const activeAssignments = assignmentsQuery.data?.filter((a) => a.isActive) ?? []
  const deactivate = useDeactivateAssignment()

  return (
    <>
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
                variant="destructive"
                isPending={deactivate.isPending}
                onPress={() => deactivate.mutate(assignment.id)}
              />
            </View>
          ))
        )}
      </Card>

      <DevoteeSadhanaHistorySection devoteeId={devoteeId} devoteeName={devoteeName} />
    </>
  )
}

// Unblocks the announcement flow, which was otherwise unreachable: a
// mentor can only ever publish with scope: 'temple_group' using their
// own temple_group_id (can_publish_announcement), and a devotee only
// sees temple_group announcements matching their own — so this screen
// was the missing piece letting a super admin actually set it.
function TempleGroupPanel({
  user,
}: {
  user: { id: string; templeGroupId: string | null }
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const templeGroupsQuery = useAdminTempleGroups()
  const setTempleGroup = useSetUserTempleGroup()

  return (
    <Card title="Temple group">
      {templeGroupsQuery.isPending ? <Text style={styles.mutedLine}>Loading…</Text> : null}
      {templeGroupsQuery.isError ? (
        <Text style={styles.errorText}>Something went wrong loading temple groups.</Text>
      ) : null}
      {templeGroupsQuery.isSuccess && templeGroupsQuery.data.length === 0 ? (
        <Text style={styles.mutedLine}>No temple groups exist yet. Create one first.</Text>
      ) : null}
      {templeGroupsQuery.data && templeGroupsQuery.data.length > 0 ? (
        <View style={styles.filterRow}>
          <Button
            title="None"
            variant={user.templeGroupId === null ? 'primary' : 'outline'}
            isPending={setTempleGroup.isPending}
            onPress={() => setTempleGroup.mutate({ userId: user.id, templeGroupId: null })}
          />
          {templeGroupsQuery.data.map((group) => (
            <Button
              key={group.id}
              title={group.name}
              variant={user.templeGroupId === group.id ? 'primary' : 'outline'}
              isPending={setTempleGroup.isPending}
              onPress={() =>
                setTempleGroup.mutate({ userId: user.id, templeGroupId: group.id })
              }
            />
          ))}
        </View>
      ) : null}
      {setTempleGroup.isError ? (
        <Text style={styles.errorText}>Something went wrong updating the temple group.</Text>
      ) : null}
    </Card>
  )
}

function RoleControl({ user }: { user: { id: string; role: AppRole } }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
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

// The link lives only in this component's local state, for exactly as
// long as the modal is open. Closing the modal (handleClose) discards it —
// never written to TanStack Query's cache or AsyncStorage. Mirrors web's
// AdminUserPasswordReset.
function PasswordResetPanel({ userId }: { userId: string }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const generateLink = useGenerateRecoveryLink()
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleClose = () => {
    setLink(null)
    setCopied(false)
    generateLink.reset()
  }

  const handleCopy = async () => {
    if (!link) return
    await Clipboard.setStringAsync(link)
    setCopied(true)
  }

  return (
    <Card title="Password reset">
      <Button
        title="Generate recovery link"
        pendingTitle="Generating…"
        isPending={generateLink.isPending}
        variant="outline"
        onPress={() => generateLink.mutate(userId, { onSuccess: setLink })}
      />
      {generateLink.isError ? (
        <Text style={styles.errorText}>
          {generateLink.error?.message ?? 'Could not generate a recovery link.'}
        </Text>
      ) : null}

      <Modal visible={link !== null} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>One-time recovery link</Text>
            <Text style={styles.errorText}>
              This link logs in as this user. Share it only through a secure private channel — do
              not screenshot or post it publicly. It is shown once and will not be saved anywhere.
            </Text>
            <Text style={styles.modalLink} selectable>
              {link}
            </Text>
            <View style={styles.actionsRow}>
              <Button title={copied ? 'Copied' : 'Copy link'} onPress={handleCopy} />
              <Button title="Close" variant="outline" onPress={handleClose} />
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  )
}

function EmailPanel({ userId }: { userId: string }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [email, setEmail] = useState<string | null>(null)
  const revealEmail = useMutation({
    mutationFn: (id: string) => supabaseAdminAccountActionsRepository.getUserEmail(id),
  })

  return (
    <Card title="Email">
      {email ? (
        <Text style={styles.mutedLine} selectable>
          {email}
        </Text>
      ) : (
        <Button
          title="Reveal email"
          pendingTitle="Loading…"
          isPending={revealEmail.isPending}
          variant="outline"
          onPress={() =>
            revealEmail.mutate(userId, {
              onSuccess: (data) => setEmail(data),
            })
          }
        />
      )}
      {revealEmail.isError && !email ? (
        <Text style={styles.errorText}>Could not load email.</Text>
      ) : null}
    </Card>
  )
}

export default function AdminUserDetailScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
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

        <EmailPanel userId={user.id} />

        <Card title="Phone number">
          <Text style={styles.mutedLine}>{user.phoneNumber ?? 'Not provided'}</Text>
        </Card>

        {user.role !== 'super_admin' ? <TempleGroupPanel user={user} /> : null}

        {user.role === 'mentor' ? <MentorInfoPanel mentorId={user.id} /> : null}
        {user.role === 'devotee' ? (
          <DevoteeInfoPanel devoteeId={user.id} devoteeName={user.fullName} />
        ) : null}

        {user.role !== 'super_admin' ? <RoleControl user={user} /> : null}

        <Card title="Account status">
          <Button
            title={user.isActive ? 'Disable account' : 'Re-enable account'}
            variant={user.isActive ? 'destructive' : 'outline'}
            isPending={setActive.isPending}
            onPress={() => setActive.mutate({ userId: user.id, isActive: !user.isActive })}
          />
        </Card>

        <PasswordResetPanel userId={user.id} />
      </ScrollView>
    </>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.semiBold,
      color: colors.primary,
    },
    badgeDisabled: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.muted,
    },
    mentorRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
    modalOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: spacing.md,
    },
    modalCard: {
      width: '100%',
      maxWidth: 420,
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    modalTitle: {
      fontSize: fontSize.base,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    modalLink: {
      fontSize: fontSize.sm,
      color: colors.foreground,
      backgroundColor: colors.mutedBackground,
      borderRadius: 8,
      padding: spacing.sm,
    },
  })
}
