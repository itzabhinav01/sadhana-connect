// Default recipient for "Share to WhatsApp" when a user has not yet
// configured a custom WhatsApp Share Number in their Profile. Kept empty
// so no personal phone number is hardcoded in the public repository; when
// empty, wa.me/?text=... opens WhatsApp's native contact picker.
export const WHATSAPP_RECIPIENT_NUMBER = ''

let configuredRecipientNumber: string | null = null
let recipientPromptEnabled = false

export function setConfiguredWhatsAppRecipient(phoneNumber?: string | null): void {
  if (phoneNumber !== undefined) {
    recipientPromptEnabled = true
  }
  configuredRecipientNumber = phoneNumber?.trim() ? phoneNumber.trim() : null
}

export function getConfiguredWhatsAppRecipient(): string | null {
  return configuredRecipientNumber
}

export function shouldPromptForWhatsAppRecipient(
  explicitProfileNumber?: string | null,
): boolean {
  if (explicitProfileNumber && explicitProfileNumber.trim().length > 0) {
    return false
  }
  if (configuredRecipientNumber && configuredRecipientNumber.trim().length > 0) {
    return false
  }
  return (
    explicitProfileNumber === null ||
    explicitProfileNumber === '' ||
    recipientPromptEnabled
  )
}

export function normalizeWhatsAppNumber(phoneNumber?: string | null): string {
  return (phoneNumber ?? '').replace(/\D/g, '')
}
