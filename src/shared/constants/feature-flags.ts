// Email-based password recovery requires a verified Resend sending domain.
// The pilot's Resend account is sandboxed (can only deliver to its own
// verified address), so this stays false until a domain is verified.
export const PASSWORD_RESET_EMAIL_ENABLED = false
