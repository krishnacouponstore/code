"use server"

import { getServerGraphQLClient } from "@/lib/graphql-client-server"
import { gql } from "graphql-request"

export interface Transaction {
  id: string
  transaction_id: string | null
  amount: number
  payment_method: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  platform: string | null
  status: "pending" | "success" | "failed" | "refunded"
  verified_at: string | null
  created_at: string
  refunded_at?: string | null
  refund_reason?: string | null
  user: {
    id: string
    name: string
    email: string
  }
}

export interface RevenueStats {
  totalRevenue: number
  pendingAmount: number
  successfulCount: number
  refundedFailedCount: number
  activeUsers: number
}

const GET_REVENUE_STATS = gql`
  query GetRevenueStats($startDate: timestamptz, $endDate: timestamptz) {
    total_revenue: purchases_aggregate(
      where: { created_at: { _gte: $startDate, _lte: $endDate } }
    ) {
      aggregate {
        sum {
          total_price
        }
      }
    }
    pending_transactions: topups_aggregate(
      where: { 
        status: { _eq: "pending" }
        created_at: { _gte: $startDate, _lte: $endDate }
      }
    ) {
      aggregate {
        sum {
          amount
        }
        count
      }
    }
    successful_transactions: topups_aggregate(
      where: { 
        status: { _eq: "success" }
        created_at: { _gte: $startDate, _lte: $endDate }
      }
    ) {
      aggregate {
        count
      }
    }
    failed_refunded: topups_aggregate(
      where: { 
        status: { _in: ["failed", "refunded"] }
        created_at: { _gte: $startDate, _lte: $endDate }
      }
    ) {
      aggregate {
        count
      }
    }
    active_users: topups_aggregate(
      where: {
        status: { _eq: "success" }
        created_at: { _gte: $startDate, _lte: $endDate }
      }
    ) {
      aggregate {
        count(columns: user_id, distinct: true)
      }
    }
  }
`

const GET_TRANSACTIONS = gql`
  query GetTransactions(
    $limit: Int!
    $offset: Int!
    $where: topups_bool_exp
    $orderBy: [topups_order_by!]
  ) {
    topups(
      limit: $limit
      offset: $offset
      where: $where
      order_by: $orderBy
    ) {
      id
      transaction_id
      amount
      payment_method
      razorpay_order_id
      razorpay_payment_id
      platform
      status
      verified_at
      created_at
      user_profile {
        id
        user {
          email
          displayName
        }
      }
    }
    topups_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`

const UPDATE_TRANSACTION_STATUS = gql`
  mutation UpdateTransactionStatus($id: uuid!, $status: String!, $verifiedAt: timestamptz) {
    update_topups_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, verified_at: $verifiedAt }
    ) {
      id
      status
      verified_at
    }
  }
`

const REFUND_TRANSACTION = gql`
  mutation RefundTransaction($id: uuid!, $userId: uuid!, $amount: numeric!) {
    update_topups_by_pk(
      pk_columns: { id: $id }
      _set: { status: "refunded", verified_at: "now()" }
    ) {
      id
      status
    }
    update_user_profiles_by_pk(
      pk_columns: { id: $userId }
      _inc: { wallet_balance: $amount }
    ) {
      id
      wallet_balance
    }
  }
`

export async function getRevenueStats(dateRange: string = "today", from?: string, to?: string): Promise<RevenueStats> {
  try {
    const client = getServerGraphQLClient()

    const now = new Date()
    let startDate: string
    let endDate: string

    if (from) {
      // Custom date range from picker
      startDate = new Date(from + "T00:00:00").toISOString()
    } else {
      switch (dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
          break
        case "7days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          break
        case "30days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          break
        case "all":
        default:
          startDate = new Date("2000-01-01").toISOString()
      }
    }

    if (to) {
      // End of the selected day
      endDate = new Date(to + "T23:59:59").toISOString()
    } else if (!from) {
      // For preset ranges: no upper bound
      endDate = new Date("2100-01-01").toISOString()
    } else {
      // from set but no to: end of same day
      endDate = new Date(from + "T23:59:59").toISOString()
    }

    const data = await client.request<any>(GET_REVENUE_STATS, {
      startDate,
      endDate,
    })

    return {
      totalRevenue: data.total_revenue?.aggregate?.sum?.total_price || 0,
      pendingAmount: data.pending_transactions?.aggregate?.sum?.amount || 0,
      successfulCount: data.successful_transactions?.aggregate?.count || 0,
      refundedFailedCount: data.failed_refunded?.aggregate?.count || 0,
      activeUsers: data.active_users?.aggregate?.count || 0,
    }
  } catch (error) {
    console.error("Error fetching revenue stats:", error)
    return {
      totalRevenue: 0,
      pendingAmount: 0,
      successfulCount: 0,
      refundedFailedCount: 0,
      activeUsers: 0,
    }
  }
}

export async function getTransactions(params: {
  page: number
  pageSize: number
  search?: string
  status?: string
  method?: string
  platform?: string
  sortBy?: string
  dateRange?: string
  dateFrom?: string
  dateTo?: string
}): Promise<{ transactions: Transaction[]; total: number }> {
  try {
    const client = getServerGraphQLClient()
    const { page, pageSize, search, status, method, platform, sortBy, dateRange, dateFrom, dateTo } = params

    // Build where clause
    const where: any = {}
    const conditions: any[] = []

    // Search filter
    if (search) {
      conditions.push({
        _or: [
          { transaction_id: { _ilike: `%${search}%` } },
          { razorpay_payment_id: { _ilike: `%${search}%` } },
          { razorpay_order_id: { _ilike: `%${search}%` } },
          { user_profile: { user: { email: { _ilike: `%${search}%` } } } },
          { user_profile: { user: { displayName: { _ilike: `%${search}%` } } } },
        ],
      })
    }

    // Status filter
    if (status && status !== "all") {
      conditions.push({ status: { _eq: status } })
    }

    // Method filter
    if (method && method !== "all") {
      const methodMap: Record<string, string[]> = {
        UPI: ["upi"],
        Card: ["card"],
        NetBanking: ["netbanking"],
        Admin: ["admin_credit", "admin_debit", "admin_adjustment"],
      }
      const methods = methodMap[method] || [method.toLowerCase()]
      conditions.push({ payment_method: { _in: methods } })
    }

    // Platform filter
    if (platform && platform !== "all") {
      conditions.push({ platform: { _eq: platform } })
    }

    // Date range filter
    if (dateFrom || dateTo) {
      // Custom date range from picker
      const dateCondition: any = {}
      if (dateFrom) dateCondition._gte = new Date(dateFrom + "T00:00:00").toISOString()
      if (dateTo) dateCondition._lte = new Date(dateTo + "T23:59:59").toISOString()
      conditions.push({ created_at: dateCondition })
    } else if (dateRange && dateRange !== "all") {
      const now = new Date()
      let startDate: Date
      switch (dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "7days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }
      conditions.push({ created_at: { _gte: startDate.toISOString() } })
    }

    if (conditions.length > 0) {
      where._and = conditions
    }

    // Build order by
    let orderBy: any[]
    switch (sortBy) {
      case "oldest":
        orderBy = [{ created_at: "asc" }]
        break
      case "amount_high":
        orderBy = [{ amount: "desc" }]
        break
      case "amount_low":
        orderBy = [{ amount: "asc" }]
        break
      default:
        orderBy = [{ created_at: "desc" }]
    }

    const data = await client.request<any>(GET_TRANSACTIONS, {
      limit: pageSize,
      offset: page * pageSize,
      where: Object.keys(where).length > 0 ? where : {},
      orderBy,
    })

    const transactions: Transaction[] = (data.topups || []).map((t: any) => ({
      id: t.id,
      transaction_id: t.transaction_id,
      amount: t.amount,
      payment_method: t.payment_method,
      razorpay_order_id: t.razorpay_order_id,
      razorpay_payment_id: t.razorpay_payment_id,
      platform: t.platform || null,
      status: t.status,
      verified_at: t.verified_at,
      created_at: t.created_at,
      user: {
        id: t.user_profile?.id || "",
        name: t.user_profile?.user?.displayName || "Unknown",
        email: t.user_profile?.user?.email || "",
      },
    }))

    return {
      transactions,
      total: data.topups_aggregate?.aggregate?.count || 0,
    }
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return { transactions: [], total: 0 }
  }
}

export async function updateTransactionStatus(
  id: string,
  newStatus: "success" | "failed",
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getServerGraphQLClient()
    await client.request(UPDATE_TRANSACTION_STATUS, {
      id,
      status: newStatus,
      verifiedAt: newStatus === "success" ? new Date().toISOString() : null,
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error updating transaction status:", error)
    return { success: false, error: error.message }
  }
}

export async function refundTransaction(
  id: string,
  userId: string,
  amount: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getServerGraphQLClient()
    // Refund adds the amount back to user's wallet (negative of the original positive amount)
    const refundAmount = Math.abs(amount)
    await client.request(REFUND_TRANSACTION, {
      id,
      userId,
      amount: refundAmount,
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error refunding transaction:", error)
    return { success: false, error: error.message }
  }
}
