import { useProfile } from '@sadhana-connect/auth'
import type { SadhanaReport } from '@sadhana-connect/domain'
import { getSupabaseClient } from '@sadhana-connect/infra-supabase'
import {
  buildWhatsAppShareUrl,
  setConfiguredWhatsAppRecipient,
} from '@sadhana-connect/sadhana'
import * as Clipboard from 'expo-clipboard'
import { useEffect, useMemo, useState } from 'react'
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { useUpdateProfile } from '../../application/profile/use-update-profile'
import { useTheme } from '../../application/theme/use-theme'
import { fontFamily, fontSize, radius, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'
import { Button } from './Button'
import { Icon } from './Icon'

import {
  isValidPhoneNumber,
  normalizePhoneNumber,
} from '@sadhana-connect/shared'

export const normalizePhoneNumberForWhatsApp = normalizePhoneNumber
export const isValidWhatsAppNumber = isValidPhoneNumber

export function extractPhoneFromText(text: string): string | null {
  if (!text) return null
  const match = text.match(/(?:\+?\d[\d\s\-()]{6,18}\d)/)
  if (!match) return null
  const normalized = normalizePhoneNumberForWhatsApp(match[0])
  return isValidWhatsAppNumber(normalized) ? normalized : null
}

interface NativeContactPhone {
  number?: string
  digits?: string
}

interface NativeContactResult {
  name?: string
  firstName?: string
  lastName?: string
  phoneNumbers?: NativeContactPhone[]
}

/**
 * Attempts to invoke the native OS contact picker if ExpoContacts is compiled
 * into the binary. Returns null when running on an OTA binary without ExpoContacts
 * so the caller can seamlessly fall back to the themed Contact Helper.
 */
export async function tryPickNativePhoneContact(): Promise<{
  name?: string
  phone: string
} | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const expoModulesCore = require('expo-modules-core') as {
      requireOptionalNativeModule?: (name: string) => {
        presentContactPickerAsync?: () => Promise<NativeContactResult | null>
      } | null
    }
    const nativeContacts = expoModulesCore.requireOptionalNativeModule?.('ExpoContacts')
    if (nativeContacts && typeof nativeContacts.presentContactPickerAsync === 'function') {
      const contact = await nativeContacts.presentContactPickerAsync()
      if (!contact) return null
      const rawPhone =
        contact.phoneNumbers?.[0]?.digits || contact.phoneNumbers?.[0]?.number || ''
      const normalized = normalizePhoneNumberForWhatsApp(rawPhone)
      if (normalized) {
        const displayName =
          contact.name ||
          [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
          undefined
        return { name: displayName, phone: normalized }
      }
    }
  } catch {
    // Fall through to themed contact helper modal
  }
  return null
}

interface DirectoryContact {
  id: string
  fullName: string
  role: string
  phoneNumber: string
}

interface PhoneContactPickerSectionProps {
  onSelectNumber: (phone: string, label?: string) => void
  onClose?: () => void
}

export function PhoneContactPickerSection({
  onSelectNumber,
  onClose,
}: PhoneContactPickerSectionProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [clipboardPhone, setClipboardPhone] = useState<string | null>(null)
  const [directoryContacts, setDirectoryContacts] = useState<DirectoryContact[]>([])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadHelpers() {
      try {
        const clip = await Clipboard.getStringAsync()
        const extracted = extractPhoneFromText(clip)
        if (active && extracted) {
          setClipboardPhone(extracted)
        }
      } catch {
        // Ignore clipboard errors
      }

      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, role, phone_number')
          .not('phone_number', 'is', null)
          .order('role', { ascending: false })
          .limit(12)

        if (active && Array.isArray(data)) {
          const items: DirectoryContact[] = data
            .filter(
              (row: { phone_number?: string | null }) =>
                typeof row.phone_number === 'string' && row.phone_number.trim().length >= 7,
            )
            .map(
              (row: {
                id: string
                full_name?: string | null
                role?: string | null
                phone_number: string
              }) => ({
                id: row.id,
                fullName: row.full_name || 'Devotee',
                role: row.role || 'devotee',
                phoneNumber: normalizePhoneNumberForWhatsApp(row.phone_number),
              }),
            )
          setDirectoryContacts(items)
        }
      } catch {
        // Ignore directory fetch errors
      }
    }
    void loadHelpers()
    return () => {
      active = false
    }
  }, [])

  const handleOpenSystemContacts = async () => {
    setStatusMessage(
      'Copy the phone number from your Contacts app, then tap "Paste Copied Number" below.',
    )
    try {
      const url =
        Platform.OS === 'ios' ? 'contacts://' : 'content://com.android.contacts/contacts'
      await Linking.openURL(url)
    } catch {
      setStatusMessage(
        'Open your Phone Contacts app, copy the number, and tap "Paste Copied Number".',
      )
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const clip = await Clipboard.getStringAsync()
      const extracted = extractPhoneFromText(clip)
      if (extracted) {
        setClipboardPhone(extracted)
        onSelectNumber(extracted, 'Copied contact')
        setStatusMessage(`Added ${extracted} from clipboard!`)
      } else {
        setStatusMessage(
          'No phone number found on clipboard. Copy a number from your Contacts app first.',
        )
      }
    } catch {
      setStatusMessage('Unable to read clipboard. Please type or paste the number directly.')
    }
  }

  return (
    <View style={styles.contactPickerBox}>
      <View style={styles.contactPickerHeader}>
        <View style={styles.contactPickerTitleRow}>
          <Icon name="people-outline" size={16} color={colors.primary} />
          <Text style={styles.contactPickerTitle}>Add from Phone / Temple Contacts</Text>
        </View>
        {onClose ? (
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close contact helper">
            <Icon name="close" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.contactActionButtons}>
        <Button
          title="Open Phone Contacts"
          size="sm"
          variant="outline"
          onPress={() => void handleOpenSystemContacts()}
        />
        <Button
          title="Paste Copied Number"
          size="sm"
          variant="secondary"
          onPress={() => void handlePasteFromClipboard()}
        />
      </View>

      {clipboardPhone ? (
        <Pressable
          style={styles.contactItem}
          onPress={() => onSelectNumber(clipboardPhone, 'Clipboard')}
          accessibilityRole="button"
          accessibilityLabel={`Use copied number ${clipboardPhone}`}
        >
          <View style={styles.contactItemLeft}>
            <Text style={styles.contactItemName}>Copied on Clipboard</Text>
            <Text style={styles.contactItemSub}>{clipboardPhone}</Text>
          </View>
          <Text style={styles.useBadge}>Tap to Use</Text>
        </Pressable>
      ) : null}

      {directoryContacts.length > 0 ? (
        <View style={styles.directoryList}>
          <Text style={styles.directoryHeading}>Suggested Mentors & Devotees</Text>
          <ScrollView style={styles.directoryScroll} nestedScrollEnabled>
            {directoryContacts.map((c) => (
              <Pressable
                key={c.id}
                style={styles.contactItem}
                onPress={() => onSelectNumber(c.phoneNumber, c.fullName)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${c.fullName} ${c.phoneNumber}`}
              >
                <View style={styles.contactItemLeft}>
                  <Text style={styles.contactItemName}>
                    {c.fullName}{' '}
                    {c.role === 'mentor' || c.role === 'super_admin' ? '· Mentor' : ''}
                  </Text>
                  <Text style={styles.contactItemSub}>{c.phoneNumber}</Text>
                </View>
                <Text style={styles.useBadge}>Select</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {statusMessage ? <Text style={styles.statusHint}>{statusMessage}</Text> : null}
    </View>
  )
}

interface WhatsAppShareModalProps {
  visible: boolean
  report: SadhanaReport | null
  onClose: () => void
}

export function WhatsAppShareModal({ visible, report, onClose }: WhatsAppShareModalProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const profileQuery = useProfile()
  const updateProfile = useUpdateProfile()

  const [phoneInput, setPhoneInput] = useState('')
  const [selectedContactName, setSelectedContactName] = useState<string | null>(null)
  const [showContactHelper, setShowContactHelper] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setPhoneInput(profileQuery.data?.whatsappShareNumber ?? '')
      setSelectedContactName(null)
      setShowContactHelper(false)
      setErrorMessage(null)
    }
  }, [visible, profileQuery.data?.whatsappShareNumber])

  if (!report) return null

  const handlePickFromContacts = async () => {
    setErrorMessage(null)
    const picked = await tryPickNativePhoneContact()
    if (picked) {
      setPhoneInput(picked.phone)
      setSelectedContactName(picked.name ?? null)
      return
    }
    setShowContactHelper((prev) => !prev)
  }

  const handleSaveAndShare = () => {
    setErrorMessage(null)
    const normalized = normalizePhoneNumberForWhatsApp(phoneInput)
    if (!normalized || !isValidWhatsAppNumber(normalized)) {
      setErrorMessage(
        'Please enter a valid WhatsApp number with country code (e.g. +919876543210).',
      )
      return
    }

    setConfiguredWhatsAppRecipient(normalized)

    if (profileQuery.data) {
      updateProfile.mutate(
        {
          fullName: profileQuery.data.fullName,
          phoneNumber: profileQuery.data.phoneNumber,
          whatsappShareNumber: normalized,
        },
        {
          onSettled: () => {
            onClose()
            void Linking.openURL(buildWhatsAppShareUrl(report, normalized))
          },
        },
      )
    } else {
      onClose()
      void Linking.openURL(buildWhatsAppShareUrl(report, normalized))
    }
  }

  const handleSkipAndOpenWhatsApp = () => {
    onClose()
    void Linking.openURL(buildWhatsAppShareUrl(report, ''))
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Icon name="logo-whatsapp" size={22} color={colors.primary} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>Share Sadhana on WhatsApp</Text>
              <Text style={styles.subtitle}>
                Add a WhatsApp number (such as your mentor&apos;s) to share your{' '}
                {report.reportDate} Sadhana report.
              </Text>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Recipient WhatsApp Number {selectedContactName ? `(${selectedContactName})` : ''}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210 or +919876543210"
              placeholderTextColor={colors.placeholder ?? colors.muted}
              value={phoneInput}
              onChangeText={(text) => {
                setPhoneInput(text)
                setErrorMessage(null)
              }}
              onBlur={() => {
                if (phoneInput.trim()) {
                  setPhoneInput(normalizePhoneNumber(phoneInput))
                }
              }}
              keyboardType="phone-pad"
              accessibilityLabel="WhatsApp Number to Share Sadhana"
            />
            <Text style={[styles.subtitle, { fontSize: 11, marginTop: -spacing.xs, marginBottom: spacing.xs }]}>
              10-digit Indian numbers automatically get +91 added.
            </Text>
            <Button
              title={
                showContactHelper
                  ? 'Hide Phone Contacts Helper'
                  : 'Add from Phone Contacts'
              }
              size="sm"
              variant="outline"
              onPress={() => void handlePickFromContacts()}
            />
          </View>

          {showContactHelper ? (
            <PhoneContactPickerSection
              onSelectNumber={(phone, label) => {
                setPhoneInput(phone)
                setSelectedContactName(label ?? null)
                setErrorMessage(null)
              }}
              onClose={() => setShowContactHelper(false)}
            />
          ) : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.footerActions}>
            <Button
              title="Save Number & Share on WhatsApp"
              pendingTitle="Saving & Opening…"
              isPending={updateProfile.isPending}
              onPress={handleSaveAndShare}
            />
            <Button
              title="Choose Contact in WhatsApp Instead"
              variant="secondary"
              size="sm"
              onPress={handleSkipAndOpenWhatsApp}
            />
            <Button
              title="Cancel"
              variant="text"
              size="sm"
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 10, 6, 0.65)',
      justifyContent: 'center',
      padding: spacing.md,
    },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      padding: spacing.lg,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: '90%',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm + 2,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextCol: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.foreground,
    },
    subtitle: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      lineHeight: 18,
    },
    inputSection: {
      gap: spacing.xs + 2,
    },
    inputLabel: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.foreground,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.md,
      fontFamily: fontFamily.medium,
      color: colors.foreground,
    },
    errorText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.medium,
      color: colors.destructive,
    },
    footerActions: {
      gap: spacing.xs + 2,
      marginTop: spacing.xs,
    },
    contactPickerBox: {
      backgroundColor: colors.surfaceSubtle,
      borderRadius: radius.lg,
      padding: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    contactPickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    contactPickerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    contactPickerTitle: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.foreground,
    },
    contactActionButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    directoryList: {
      gap: spacing.xs,
    },
    directoryHeading: {
      fontSize: 11,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.muted,
      textTransform: 'uppercase',
    },
    directoryScroll: {
      maxHeight: 140,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 4,
    },
    contactItemLeft: {
      flex: 1,
      gap: 1,
    },
    contactItemName: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.foreground,
    },
    contactItemSub: {
      fontSize: 11,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    useBadge: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.primary,
      paddingHorizontal: spacing.xs,
    },
    statusHint: {
      fontSize: 11,
      fontFamily: fontFamily.regular,
      color: colors.primary,
    },
  })
}
