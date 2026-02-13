/**
 * IMB Payment Gateway Utilities
 * Helper functions for IMB payment integration
 */

/**
 * Generate unique order ID for IMB transactions
 * Format: COUPX{timestamp}{4-digit random}
 * Example: COUPX17076543291234
 */
export function generateIMBOrderId(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `COUPX${timestamp}${random}`
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(method: string | null): string {
  if (!method) return "N/A"
  
  const methodMap: Record<string, string> = {
    UPI: "📱 UPI",
    IMPS: "💳 IMPS",
    NEFT: "🏦 NEFT",
    RTGS: "🏦 RTGS",
    Card: "💳 Card",
    NetBanking: "🏦 Net Banking",
    admin_credit: "✨ Admin Credit",
    admin_debit: "📉 Admin Debit",
  }
  
  return methodMap[method] || method
}

/**
 * Validate Indian phone number
 * Accepts: 10 digits, with or without country code
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove spaces, dashes, and country code
  const cleaned = phone.replace(/[\s\-+]/g, "")
  
  // Check if it's 10 digits (without country code)
  if (/^[6-9]\d{9}$/.test(cleaned)) return true
  
  // Check if it's with country code (91 prefix)
  if (/^91[6-9]\d{9}$/.test(cleaned)) return true
  
  return false
}

/**
 * Format phone number to standard format (10 digits without country code)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-+]/g, "")
  
  // Remove country code if present
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return cleaned.substring(2)
  }
  
  return cleaned
}

/**
 * Validate amount for payment
 */
export function validateAmount(amount: number, min = 1): {
  valid: boolean
  error?: string
} {
  if (amount < min) {
    return { valid: false, error: `Minimum amount is ₹${min}` }
  }
  
  if (amount <= 0 || !Number.isFinite(amount)) {
    return { valid: false, error: "Invalid amount" }
  }
  
  return { valid: true }
}

/**
 * Map IMB status to our internal status
 */
export function mapIMBStatus(imbStatus: string): "pending" | "success" | "failed" {
  const statusMap: Record<string, "pending" | "success" | "failed"> = {
    COMPLETED: "success",
    SUCCESS: "success",
    Initiated: "pending",
    PENDING: "pending",
    FAILED: "failed",
    Fail: "failed",
    Reversed: "failed",
  }
  
  return statusMap[imbStatus] || "failed"
}

/**
 * Get payment method from IMB response
 */
export function getPaymentMethodFromIMB(paymentMode: string | number | null): string {
  if (!paymentMode) return "UPI"
  
  // IMB uses numeric codes for payment modes
  const modeMap: Record<string, string> = {
    "5": "IMPS",
    "4": "NEFT",
    "13": "RTGS",
    IMPS: "IMPS",
    NEFT: "NEFT",
    RTGS: "RTGS",
    UPI: "UPI",
  }
  
  return modeMap[String(paymentMode)] || "UPI"
}
