import { useMemo, useState } from 'react'
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import {
  type BookReadingStatus,
  type BookWithProgress,
  useDevoteeBookProgress,
  useUpdateBookProgress,
} from '@sadhana-connect/books'
import { useTheme } from '../../application/theme/use-theme'
import { fontFamily, fontSize, radius, spacing, type ThemeColors } from '../../shared/theme'
import { Card } from './Card'
import { Chip } from './Chip'
import { Icon } from './Icon'

interface PrabhupadaBooksTrackerSectionProps {
  profileId?: string | null
  editable?: boolean
  title?: string
}

type FilterTab = 'all' | 'completed' | 'reading' | 'not_started'

export function PrabhupadaBooksTrackerSection({
  profileId,
  editable = false,
  title = 'Prabhupada Books Reading',
}: PrabhupadaBooksTrackerSectionProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const { data, isLoading } = useDevoteeBookProgress(profileId)
  const updateMutation = useUpdateBookProgress()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')

  const books = data?.booksWithProgress ?? []
  const summary = data?.summary ?? {
    total: 36,
    completed: 0,
    reading: 0,
    notStarted: 36,
    completionPercentage: 0,
  }

  const filteredBooks = useMemo(() => {
    return books.filter((book: BookWithProgress) => {
      const matchesSearch = book.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim())
      const matchesTab = filterTab === 'all' ? true : book.status === filterTab
      return matchesSearch && matchesTab
    })
  }, [books, searchQuery, filterTab])

  const handleOpenUrl = async (url: string | null) => {
    if (!url) return
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        Alert.alert('Unable to open link', url)
      }
    } catch {
      Alert.alert('Error', 'Could not open book URL.')
    }
  }

  const handleStatusChange = (bookId: number, newStatus: BookReadingStatus) => {
    if (!editable) return
    updateMutation.mutate({ bookId, status: newStatus })
  }

  return (
    <Card
      title={title}
      action={
        <Text style={styles.percentageText}>{summary.completionPercentage}%</Text>
      }
    >
      <View style={styles.container}>
        {/* Progress bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${summary.completionPercentage}%` },
            ]}
          />
        </View>

        {/* Stats Summary Row */}
        <View style={styles.statsRow}>
          <Chip label={`${summary.completed} Done`} tone="success" />
          <Chip label={`${summary.reading} Reading`} tone="warning" />
          <Chip label={`${summary.notStarted} To Read`} tone="neutral" />
        </View>

        {/* Search Bar (when editable) */}
        {editable ? (
          <View style={styles.searchRow}>
            <Icon name="search-outline" size={16} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search books by title..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 ? (
              <Pressable
                onPress={() => setSearchQuery('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Icon name="close-outline" size={16} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Filter Pills */}
        <View style={styles.filterTabsRow}>
          <Pressable
            onPress={() => setFilterTab('all')}
            style={[
              styles.filterTab,
              filterTab === 'all' && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filterTab === 'all' && styles.filterTabTextActive,
              ]}
            >
              All ({books.length || 36})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterTab('completed')}
            style={[
              styles.filterTab,
              filterTab === 'completed' && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filterTab === 'completed' && styles.filterTabTextActive,
              ]}
            >
              Done ({summary.completed})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterTab('reading')}
            style={[
              styles.filterTab,
              filterTab === 'reading' && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filterTab === 'reading' && styles.filterTabTextActive,
              ]}
            >
              Reading ({summary.reading})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterTab('not_started')}
            style={[
              styles.filterTab,
              filterTab === 'not_started' && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filterTab === 'not_started' && styles.filterTabTextActive,
              ]}
            >
              To Read ({summary.notStarted})
            </Text>
          </Pressable>
        </View>

        {/* Books List */}
        {isLoading ? (
          <Text style={styles.emptyText}>Loading Prabhupada books...</Text>
        ) : filteredBooks.length === 0 ? (
          <Text style={styles.emptyText}>No books matching filter.</Text>
        ) : (
          <View style={styles.bookList}>
            {filteredBooks.map((book: BookWithProgress) => (
              <View key={book.id} style={styles.bookCard}>
                <View style={styles.bookHeaderRow}>
                  <View style={styles.sequenceBadge}>
                    <Text style={styles.sequenceText}>#{book.sequenceNumber}</Text>
                  </View>
                  <View style={styles.bookTitleContainer}>
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    {book.readingUrl ? (
                      <Pressable
                        onPress={() => void handleOpenUrl(book.readingUrl)}
                        style={styles.readLinkButton}
                        accessibilityRole="link"
                      >
                        <Text style={styles.readLinkText}>Read Online</Text>
                        <Icon name="open-outline" size={13} color={colors.primary} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                {/* Status action */}
                {editable ? (
                  <View style={styles.statusButtonsGroup}>
                    <Pressable
                      onPress={() => handleStatusChange(book.id, 'not_started')}
                      style={[
                        styles.statusBtn,
                        book.status === 'not_started' && styles.statusBtnActiveNeutral,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          book.status === 'not_started' && styles.statusBtnTextActive,
                        ]}
                      >
                        To Read
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleStatusChange(book.id, 'reading')}
                      style={[
                        styles.statusBtn,
                        book.status === 'reading' && styles.statusBtnActiveWarning,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          book.status === 'reading' && styles.statusBtnTextActive,
                        ]}
                      >
                        Reading
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleStatusChange(book.id, 'completed')}
                      style={[
                        styles.statusBtn,
                        book.status === 'completed' && styles.statusBtnActiveSuccess,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          book.status === 'completed' && styles.statusBtnTextActive,
                        ]}
                      >
                        Done
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.readOnlyBadgeContainer}>
                    {book.status === 'completed' ? (
                      <Chip label="Completed" tone="success" />
                    ) : book.status === 'reading' ? (
                      <Chip label="Reading" tone="warning" />
                    ) : (
                      <Chip label="To Read" tone="neutral" />
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </Card>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    percentageText: {
      fontSize: fontSize.lg,
      fontWeight: '800',
      fontFamily: fontFamily.bold,
      color: colors.primary,
    },
    progressBarTrack: {
      height: 6,
      borderRadius: radius.full,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      backgroundColor: colors.background,
    },
    searchInput: {
      flex: 1,
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
      paddingVertical: 2,
    },
    filterTabsRow: {
      flexDirection: 'row',
      gap: 4,
      flexWrap: 'wrap',
    },
    filterTab: {
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterTabText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.medium,
      color: colors.muted,
    },
    filterTabTextActive: {
      color: '#ffffff',
      fontWeight: '700',
      fontFamily: fontFamily.bold,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: colors.muted,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    bookList: {
      gap: spacing.xs,
      marginTop: 2,
    },
    bookCard: {
      padding: spacing.sm,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
      gap: spacing.xs,
    },
    bookHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
    },
    sequenceBadge: {
      minWidth: 26,
      height: 22,
      borderRadius: radius.sm,
      backgroundColor: colors.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    sequenceText: {
      fontSize: 11,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.primary,
    },
    bookTitleContainer: {
      flex: 1,
      gap: 2,
    },
    bookTitle: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
      lineHeight: 18,
    },
    readLinkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: 2,
    },
    readLinkText: {
      fontSize: 11,
      fontWeight: '600',
      fontFamily: fontFamily.medium,
      color: colors.primary,
    },
    statusButtonsGroup: {
      flexDirection: 'row',
      borderRadius: radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.background,
      overflow: 'hidden',
      marginTop: 2,
    },
    statusBtn: {
      flex: 1,
      paddingVertical: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusBtnActiveNeutral: {
      backgroundColor: colors.border,
    },
    statusBtnActiveWarning: {
      backgroundColor: '#f59e0b',
    },
    statusBtnActiveSuccess: {
      backgroundColor: '#10b981',
    },
    statusBtnText: {
      fontSize: 11,
      fontFamily: fontFamily.medium,
      color: colors.muted,
    },
    statusBtnTextActive: {
      color: '#ffffff',
      fontWeight: '700',
      fontFamily: fontFamily.bold,
    },
    readOnlyBadgeContainer: {
      alignSelf: 'flex-start',
      marginTop: 2,
    },
  })
}
