import { useAdminUsers } from '@sadhana-connect/admin'
import type { AdminUserFilters, AppRole } from '@sadhana-connect/domain'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '../../../../src/application/theme/use-theme'
import { Button } from '../../../../src/presentation/components/Button'
import { ErrorBanner } from '../../../../src/presentation/components/ErrorBanner'
import { fontSize, spacing } from '../../../../src/shared/theme'
import type { ThemeColors } from '../../../../src/shared/theme'

const ROLE_OPTIONS: { label: string; value: AppRole | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Devotee', value: 'devotee' },
  { label: 'Mentor', value: 'mentor' },
  { label: 'Super Admin', value: 'super_admin' },
]

const STATUS_OPTIONS: { label: string; value: 'active' | 'disabled' | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'active' },
  { label: 'Disabled', value: 'disabled' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

export default function AdminUsersScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [filters, setFilters] = useState<AdminUserFilters>({})
  const usersQuery = useAdminUsers(filters)

  const users = usersQuery.data?.pages.flatMap((page) => page.users) ?? []

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name"
        value={filters.search ?? ''}
        onChangeText={(text) => setFilters({ ...filters, search: text || undefined })}
        autoCapitalize="none"
        accessibilityLabel="Search users by name"
      />

      <View style={styles.filterRow}>
        {ROLE_OPTIONS.map((option) => (
          <Button
            key={option.label}
            title={option.label}
            variant={filters.role === option.value ? 'primary' : 'outline'}
            onPress={() => setFilters({ ...filters, role: option.value })}
          />
        ))}
      </View>
      <View style={styles.filterRow}>
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.label}
            title={option.label}
            variant={filters.status === option.value ? 'primary' : 'outline'}
            onPress={() => setFilters({ ...filters, status: option.value })}
          />
        ))}
      </View>

      {usersQuery.isPending ? <Text style={styles.mutedLine}>Loading…</Text> : null}
      {usersQuery.isError ? (
        <ErrorBanner message="Something went wrong loading users. Please try again." />
      ) : null}
      {usersQuery.isSuccess && users.length === 0 ? (
        <Text style={styles.mutedLine}>No users match these filters.</Text>
      ) : null}

      {users.map((user) => (
        <Pressable
          key={user.id}
          onPress={() => router.push(`/admin/users/${user.id}`)}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel={`View ${user.fullName}`}
        >
          <View style={styles.rowHeader}>
            <Text style={styles.rowName}>{user.fullName}</Text>
            <Text style={user.isActive ? styles.badgeActive : styles.badgeDisabled}>
              {user.isActive ? 'Active' : 'Disabled'}
            </Text>
          </View>
          <Text style={styles.mutedLine}>{user.role.replace('_', ' ')}</Text>
          <Text style={styles.mutedLine}>Joined {formatDate(user.createdAt)}</Text>
        </Pressable>
      ))}

      {usersQuery.hasNextPage ? (
        <Button
          title="Load more"
          pendingTitle="Loading…"
          isPending={usersQuery.isFetchingNextPage}
          variant="outline"
          onPress={() => usersQuery.fetchNextPage()}
        />
      ) : null}
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
    searchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      color: colors.foreground,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    mutedLine: {
      fontSize: fontSize.sm,
      color: colors.muted,
    },
    row: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: spacing.md,
      gap: 2,
    },
    rowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowName: {
      fontSize: fontSize.base,
      fontWeight: '600',
      color: colors.foreground,
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
  })
}
