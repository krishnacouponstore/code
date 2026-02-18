const IMB_API_TOKEN = process.env.IMB_API_TOKEN
const IMB_BASE_URL = process.env.IMB_BASE_URL || "https://secure-stage.imb.org.in"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export class PaymentService {
  /**
   * Create IMB payment order
   */
  async createPaymentOrder(
    userId: string,
    amount: number,
    customerMobile: string,
    customerEmail: string
  ): Promise<{
    success: boolean
    data?: { orderId: string; paymentUrl: string }
    error?: string
  }> {
    try {
      const response = await fetch(`${SITE_URL}/api/imb/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount,
          customerMobile,
          customerEmail,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        return { success: false, error: data.error || "Failed to create payment order" }
      }

      return {
        success: true,
        data: {
          orderId: data.data.orderId,
          paymentUrl: data.data.paymentUrl,
        },
      }
    } catch (error: any) {
      console.error("Error creating payment order:", error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Check payment status via IMB
   */
  async checkPaymentStatus(orderId: string): Promise<{
    success: boolean
    status?: "pending" | "success" | "failed"
    utr?: string
    error?: string
  }> {
    try {
      const response = await fetch(`${SITE_URL}/api/imb/check-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })

      const data = await response.json()

      if (!data.success) {
        return { success: false, error: data.error || "Failed to check payment status" }
      }

      return {
        success: true,
        status: data.data?.status,
        utr: data.data?.utr,
      }
    } catch (error: any) {
      console.error("Error checking payment status:", error)
      return { success: false, error: error.message }
    }
  }
}
