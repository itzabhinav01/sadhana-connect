import {
  STANDARD_SECTIONS,
  type CustomSectionFieldType,
  type StandardSectionKey,
  useSadhanaSectionsConfig,
} from '@sadhana-connect/sadhana'
import { useMemo, useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontFamily, fontSize, radius, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'
import { Button } from './Button'
import { Card } from './Card'

const FIELD_TYPE_OPTIONS: { label: string; value: CustomSectionFieldType; desc: string }[] = [
  { label: 'Number', value: 'number', desc: 'Whole number (e.g. 15 mins, 4 rounds)' },
  { label: 'Decimal', value: 'decimal', desc: 'Decimal hours (e.g. 1.5 hrs)' },
  { label: 'Yes / No', value: 'boolean', desc: 'Checkbox / Completed flag' },
  { label: 'Time', value: 'time', desc: 'Time of day (e.g. 05:00 AM)' },
  { label: 'Text', value: 'text', desc: 'Free text notes' },
]

export function SadhanaSheetSectionsConfigSection({
  profileId,
}: {
  profileId?: string | null
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const {
    config,
    toggleStandardSection,
    toggleCustomSection,
    addCustomSection,
    deleteCustomSection,
    resetToDefault,
  } = useSadhanaSectionsConfig(profileId)

  const [modalVisible, setModalVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fieldType, setFieldType] = useState<CustomSectionFieldType>('number')
  const [unit, setUnit] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenAddModal = () => {
    setTitle('')
    setDescription('')
    setFieldType('number')
    setUnit('')
    setModalVisible(true)
  }

  const handleSaveCustomSection = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a section title (e.g. Deity Worship).')
      return
    }
    setIsSubmitting(true)
    try {
      await addCustomSection({
        title: title.trim(),
        description: description.trim() || undefined,
        fieldType,
        unit: unit.trim() || undefined,
      })
      setModalVisible(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCustomSection = (id: string, sectionTitle: string) => {
    Alert.alert(
      'Delete Section',
      `Are you sure you want to delete "${sectionTitle}"? Standard sections can only be hidden, but custom sections are permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void deleteCustomSection(id),
        },
      ],
    )
  }

  const handleReset = () => {
    Alert.alert(
      'Reset Sections',
      'This will show all 7 standard sections in your sadhana sheet. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => void resetToDefault(),
        },
      ],
    )
  }

  return (
    <Card
      title="Sadhana Sheet Customization"
      action={
        <Button
          title="Reset"
          size="sm"
          variant="outline"
          onPress={handleReset}
          accessibilityLabel="Reset sections to default"
        />
      }
    >
      <Text style={styles.introText}>
        Customize which sections appear on your daily sadhana filling sheet.
        Standard sections can be hidden (e.g. Office Schedule for students) but never permanently deleted.
      </Text>

      {/* Standard Sections */}
      <View style={styles.groupContainer}>
        <Text style={styles.sectionHeading}>Standard Sections</Text>
        <Text style={styles.subtext}>
          These are the foundational sadhana sections. Toggle off to hide from your filling form.
        </Text>

        <View style={styles.itemsList}>
          {STANDARD_SECTIONS.map((sec) => {
            const isEnabled = config.standardSections[sec.key] !== false
            return (
              <View key={sec.key} style={styles.rowItem}>
                <View style={styles.rowTextCol}>
                  <View style={styles.rowTitleWrap}>
                    <Text style={styles.itemTitle}>{sec.title}</Text>
                    {!isEnabled ? (
                      <View style={styles.hiddenBadge}>
                        <Text style={styles.hiddenBadgeText}>Hidden from sheet</Text>
                      </View>
                    ) : (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Visible</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemDesc}>{sec.description}</Text>
                </View>

                <Switch
                  value={isEnabled}
                  onValueChange={(val) => void toggleStandardSection(sec.key as StandardSectionKey, val)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                  accessibilityLabel={`Toggle visibility of ${sec.title}`}
                />
              </View>
            )
          })}
        </View>
      </View>

      {/* Custom Sections */}
      <View style={[styles.groupContainer, { marginTop: spacing.md }]}>
        <View style={styles.customHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionHeading}>Additional Custom Sections</Text>
            <Text style={styles.subtext}>
              Add custom sadhana practices specific to your service or ashram routine.
            </Text>
          </View>
          <Button
            title="+ Add Section"
            size="sm"
            variant="primary"
            onPress={handleOpenAddModal}
          />
        </View>

        {config.customSections.length === 0 ? (
          <View style={styles.emptyCustomBox}>
            <Text style={styles.emptyCustomText}>
              No custom sections added yet. Tap "+ Add Section" to add Deity Worship, Seva, or Sloka study.
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {config.customSections.map((sec) => (
              <View key={sec.id} style={styles.rowItem}>
                <View style={styles.rowTextCol}>
                  <View style={styles.rowTitleWrap}>
                    <Text style={styles.itemTitle}>{sec.title}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {sec.fieldType.toUpperCase()}{sec.unit ? ` (${sec.unit})` : ''}
                      </Text>
                    </View>
                    {!sec.enabled ? (
                      <View style={styles.hiddenBadge}>
                        <Text style={styles.hiddenBadgeText}>Hidden</Text>
                      </View>
                    ) : null}
                  </View>
                  {sec.description ? (
                    <Text style={styles.itemDesc}>{sec.description}</Text>
                  ) : null}
                </View>

                <View style={styles.customActionsCol}>
                  <Switch
                    value={sec.enabled}
                    onValueChange={(val) => void toggleCustomSection(sec.id, val)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.card}
                    accessibilityLabel={`Toggle visibility of ${sec.title}`}
                  />
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteCustomSection(sec.id, sec.title)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${sec.title}`}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Add Custom Section Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalTitle}>Add Custom Sadhana Section</Text>
              <Text style={styles.modalSubtitle}>
                Create a practice or tracking item tailored to your daily schedule.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Section Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Deity Worship, Mangala Aarti, Sloka Reading"
                  placeholderTextColor={colors.muted}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Field Type</Text>
                <View style={styles.fieldTypeSelector}>
                  {FIELD_TYPE_OPTIONS.map((opt) => {
                    const isSelected = fieldType === opt.value
                    return (
                      <Pressable
                        key={opt.value}
                        style={[
                          styles.typeChip,
                          isSelected && styles.typeChipSelected,
                        ]}
                        onPress={() => setFieldType(opt.value)}
                      >
                        <Text
                          style={[
                            styles.typeChipText,
                            isSelected && styles.typeChipTextSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
                <Text style={styles.fieldTypeDesc}>
                  {FIELD_TYPE_OPTIONS.find((o) => o.value === fieldType)?.desc}
                </Text>
              </View>

              {(fieldType === 'number' || fieldType === 'decimal') && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Unit (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. mins, hrs, rounds, pages"
                    placeholderTextColor={colors.muted}
                    value={unit}
                    onChangeText={setUnit}
                  />
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Description (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Brief note on what to log"
                  placeholderTextColor={colors.muted}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.modalButtonRow}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setModalVisible(false)}
                />
                <Button
                  title="Save Section"
                  variant="primary"
                  isPending={isSubmitting}
                  onPress={() => void handleSaveCustomSection()}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Card>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    introText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      lineHeight: 18,
    },
    groupContainer: {
      gap: spacing.xs,
    },
    sectionHeading: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.foreground,
    },
    subtext: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      marginBottom: spacing.xs,
    },
    itemsList: {
      gap: spacing.xs,
    },
    rowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.sm,
      backgroundColor: colors.background,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    rowTextCol: {
      flex: 1,
      gap: 2,
    },
    rowTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    itemTitle: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.foreground,
    },
    itemDesc: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    activeBadge: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.full,
    },
    activeBadgeText: {
      fontSize: 10,
      fontFamily: fontFamily.medium,
      color: colors.primary,
    },
    hiddenBadge: {
      backgroundColor: colors.border,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.full,
    },
    hiddenBadgeText: {
      fontSize: 10,
      fontFamily: fontFamily.medium,
      color: colors.muted,
    },
    typeBadge: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.full,
    },
    typeBadgeText: {
      fontSize: 10,
      fontFamily: fontFamily.semiBold,
      color: colors.primary,
    },
    customHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    customActionsCol: {
      alignItems: 'flex-end',
      gap: 4,
    },
    deleteButton: {
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    deleteButtonText: {
      fontSize: 11,
      fontFamily: fontFamily.medium,
      color: colors.destructive,
    },
    emptyCustomBox: {
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    emptyCustomText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 18,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '90%',
      padding: spacing.md,
    },
    modalScroll: {
      gap: spacing.md,
      paddingBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.foreground,
    },
    modalSubtitle: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      marginTop: -spacing.xs,
    },
    fieldGroup: {
      gap: spacing.xs,
    },
    fieldLabel: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.medium,
      color: colors.foreground,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
      backgroundColor: colors.background,
    },
    fieldTypeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    typeChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    typeChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    typeChipText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.medium,
      color: colors.foreground,
    },
    typeChipTextSelected: {
      color: colors.primary,
      fontFamily: fontFamily.bold,
    },
    fieldTypeDesc: {
      fontSize: 11,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      marginTop: 2,
    },
    modalButtonRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
  })
}
