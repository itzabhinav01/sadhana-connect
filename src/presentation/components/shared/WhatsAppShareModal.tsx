import { ClipboardPaste, Contact, MessageCircle, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useProfile } from '@sadhana-connect/auth'
import type { SadhanaReport } from '@sadhana-connect/domain/entities/sadhana-report'
import { getSupabaseClient } from '@sadhana-connect/infra-supabase'
import {
  buildWhatsAppShareUrl,
  setConfiguredWhatsAppRecipient,
} from '@sadhana-connect/sadhana'
import { useUpdateProfile } from '@/application/profile/use-update-profile'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'

export function normalizePhoneNumberForWhatsApp(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''

  if (!hasPlus && digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`
  }
  if (!hasPlus && digits.length === 11 && /^0[6-9]\d{9}$/.test(digits)) {
    return `+91${digits.slice(1)}`
  }
  if (!hasPlus && digits.length === 12 && /^91[6-9]\d{9}$/.test(digits)) {
    return `+${digits}`
  }
  return `+${digits}`
}

export function isValidWhatsAppNumber(value: string): boolean {
  const cleaned = value.replace(/[\s-]/g, '').trim()
  return /^\+?[1-9]\d{6,14}$/.test(cleaned)
}

export function extractPhoneFromText(text: string): string | null {
  if (!text) return null
  const match = text.match(/(?:\+?\d[\d\s\-()]{6,18}\d)/)
  if (!match) return null
  const normalized = normalizePhoneNumberForWhatsApp(match[0])
  return isValidWhatsAppNumber(normalized) ? normalized : null
}

interface WebNavigatorContacts {
  select: (
    properties: string[],
    options?: { multiple?: boolean },
  ) => Promise<Array<{ name?: string[]; tel?: string[] }>>
}

export async function tryPickWebPhoneContact(): Promise<{
  name?: string
  phone: string
} | null> {
  try {
    const nav = navigator as Navigator & { contacts?: WebNavigatorContacts }
    if (nav.contacts && typeof nav.contacts.select === 'function') {
      const results = await nav.contacts.select(['name', 'tel'], { multiple: false })
      const first = results?.[0]
      const rawTel = first?.tel?.[0] ?? ''
      const normalized = normalizePhoneNumberForWhatsApp(rawTel)
      if (normalized) {
        return {
          name: first?.name?.[0],
          phone: normalized,
        }
      }
    }
  } catch {
    // Fall back to contact helper UI
  }
  return null
}

interface DirectoryContact {
  id: string
  fullName: string
  role: string
  phoneNumber: string
}

interface WebPhoneContactPickerSectionProps {
  onSelectNumber: (phone: string, label?: string) => void
  onClose?: () => void
}

export function WebPhoneContactPickerSection({
  onSelectNumber,
  onClose,
}: WebPhoneContactPickerSectionProps) {
  const [directoryContacts, setDirectoryContacts] = useState<DirectoryContact[]>([])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadDirectory() {
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
        // Ignore directory errors in unit tests or offline
      }
    }
    void loadDirectory()
    return () => {
      active = false
    }
  }, [])

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const extracted = extractPhoneFromText(text)
      if (extracted) {
        onSelectNumber(extracted, 'Copied contact')
        setStatusMessage(`Added ${extracted} from clipboard!`)
      } else {
        setStatusMessage('No valid phone number found on clipboard. Copy a number first.')
      }
    } catch {
      setStatusMessage('Please paste the number directly into the field above.')
    }
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Users className="size-3.5 text-primary" aria-hidden="true" />
          <span>Phone &amp; Temple Contacts Helper</span>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close contacts helper"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void handlePasteFromClipboard()}
          className="h-8 text-xs gap-1.5"
        >
          <ClipboardPaste className="size-3.5" aria-hidden="true" />
          Paste Copied Phone Number
        </Button>
      </div>

      {directoryContacts.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Suggested Mentors &amp; Devotees
          </span>
          <div className="max-h-36 overflow-y-auto flex flex-col gap-1">
            {directoryContacts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectNumber(c.phoneNumber, c.fullName)}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-left text-xs hover:bg-accent transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    {c.fullName}{' '}
                    {c.role === 'mentor' || c.role === 'super_admin' ? '· Mentor' : ''}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{c.phoneNumber}</span>
                </div>
                <span className="text-xs font-semibold text-primary">Select</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {statusMessage ? (
        <p className="text-xs text-primary font-medium">{statusMessage}</p>
      ) : null}
    </div>
  )
}

interface WhatsAppShareModalProps {
  open: boolean
  report: SadhanaReport | null
  onClose: () => void
}

export function WhatsAppShareModal({ open, report, onClose }: WhatsAppShareModalProps) {
  const profileQuery = typeof useProfile === 'function' ? useProfile() : undefined
  const updateProfile = useUpdateProfile()
  const [phoneInput, setPhoneInput] = useState('')
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [showContactHelper, setShowContactHelper] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPhoneInput(profileQuery?.data?.whatsappShareNumber ?? '')
      setSelectedName(null)
      setShowContactHelper(false)
      setErrorMessage(null)
    }
  }, [open, profileQuery?.data?.whatsappShareNumber])

  if (!open || !report) return null

  const handlePickFromContacts = async () => {
    setErrorMessage(null)
    const picked = await tryPickWebPhoneContact()
    if (picked) {
      setPhoneInput(picked.phone)
      setSelectedName(picked.name ?? null)
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
    const shareUrl = buildWhatsAppShareUrl(report, normalized)

    if (profileQuery?.data) {
      updateProfile.mutate(
        {
          fullName: profileQuery.data.fullName,
          phoneNumber: profileQuery.data.phoneNumber,
          whatsappShareNumber: normalized,
        },
        {
          onSettled: () => {
            onClose()
            window.open(shareUrl, '_blank', 'noopener,noreferrer')
          },
        },
      )
    } else {
      onClose()
      window.open(shareUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleSkipAndOpenWhatsApp = () => {
    const shareUrl = buildWhatsAppShareUrl(report, '')
    onClose()
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-share-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <MessageCircle className="size-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 id="whatsapp-share-modal-title" className="text-base font-bold text-foreground">
                Share Sadhana on WhatsApp
              </h3>
              <p className="text-xs text-muted-foreground">
                Enter the WhatsApp number (such as your mentor&apos;s) or add from phone contacts to share your {report.reportDate} Sadhana report.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="modal-whatsapp-phone-input" className="text-xs font-semibold text-foreground">
            Recipient WhatsApp Number {selectedName ? `(${selectedName})` : ''}
          </label>
          <Input
            id="modal-whatsapp-phone-input"
            type="tel"
            placeholder="e.g. +919876543210"
            value={phoneInput}
            onChange={(e) => {
              setPhoneInput(e.target.value)
              setErrorMessage(null)
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void handlePickFromContacts()}
            className="self-start gap-1.5 text-xs"
          >
            <Contact className="size-3.5" aria-hidden="true" />
            {showContactHelper ? 'Hide Phone Contacts Helper' : 'Add from Phone Contacts'}
          </Button>
        </div>

        {showContactHelper ? (
          <WebPhoneContactPickerSection
            onSelectNumber={(phone, label) => {
              setPhoneInput(phone)
              setSelectedName(label ?? null)
              setErrorMessage(null)
            }}
            onClose={() => setShowContactHelper(false)}
          />
        ) : null}

        {errorMessage ? <p className="text-xs font-medium text-destructive">{errorMessage}</p> : null}

        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="button"
            onClick={handleSaveAndShare}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? 'Saving & Opening…' : 'Save Number & Share on WhatsApp'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSkipAndOpenWhatsApp}
          >
            Choose Contact in WhatsApp Instead
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
