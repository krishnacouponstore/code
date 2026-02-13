"use server"

import { getServerGraphQLClient } from "@/lib/graphql-client-server"
import { GET_USER_TOPUPS, GET_TOPUP_BY_TRANSACTION_ID, type Topup } from "@/lib/graphql/topups"

/**
 * Get recent topups for a user
 */
export async function getRecentTopups(userId: string, limit = 10): Promise<Topup[]> {
  try {
    const client = getServerGraphQLClient()
    const data: any = await client.request(GET_USER_TOPUPS, { userId, limit })
    return data.topups || []
  } catch (error: any) {
    console.error("Error fetching topups:", error)
    return []
  }
}

/**
 * Check payment status for an order
 */
export async function checkPaymentStatus(
  orderId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/imb/check-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
      cache: "no-store",
    })

    const data = await response.json()

    // The API returns { success, data: { status, amount, utr, message } }
    // Extract status from nested data to match our return type
    return {
      success: data.success,
      status: data.data?.status || data.status,
      error: data.error,
    }
  } catch (error: any) {
    console.error("Error checking payment status:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get topup details by transaction ID
 */
export async function getTopupByTransactionId(
  transactionId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const client = getServerGraphQLClient()
    const result: any = await client.request(GET_TOPUP_BY_TRANSACTION_ID, { transactionId })

    if (!result.topups || result.topups.length === 0) {
      return { success: false, error: "Transaction not found" }
    }

    return { success: true, data: result.topups[0] }
  } catch (error: any) {
    console.error("Error fetching topup:", error)
    return { success: false, error: error.message }
  }
}
