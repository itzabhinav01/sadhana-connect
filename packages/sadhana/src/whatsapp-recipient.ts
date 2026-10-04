// Default recipient for "Share to WhatsApp" when a user has not yet
// configured a custom WhatsApp Share Number in their Profile. Kept empty
// so no personal phone number is hardcoded in the public repository; when
// empty, wa.me/?text=... opens WhatsApp's native contact picker.
export const WHATSAPP_RECIPIENT_NUMBER = ''

let configuredRecipientNumber: string | null = null

export function setConfiguredWhatsAppRecipient(phoneNumber?: string | null): void {
  configuredRecipientNumber = phoneNumber?.trim() ? phoneNumber.trim() : null
}

export function getConfiguredWhatsAppRecipient(): string | null {
  return configuredRecipientNumber
}

export function normalizeWhatsAppNumber(phoneNumber?: string | null): string {
  return (phoneNumber ?? '').replace(/\D/g, '')
}


