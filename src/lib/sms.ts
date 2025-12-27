/**
 * Creates an SMS deep link that opens the native messaging app
 * Works on both iOS and Android
 */
export function createSMSLink(phoneNumber: string, message?: string): string {
  // Remove all non-numeric characters except +
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '')

  if (!cleanPhone) {
    return ''
  }

  // Encode the message for URL
  const encodedMessage = message ? encodeURIComponent(message) : ''

  // iOS uses &body=, Android uses ?body=
  // Using & works on both platforms
  const separator = encodedMessage ? '&body=' : ''

  return `sms:${cleanPhone}${separator}${encodedMessage}`
}

/**
 * Opens the native SMS app with pre-filled content
 */
export function openSMS(phoneNumber: string, message?: string): void {
  const link = createSMSLink(phoneNumber, message)
  if (link) {
    window.location.href = link
  }
}
