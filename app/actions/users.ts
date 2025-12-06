"use server"

import { gql, GraphQLClient } from "graphql-request"

const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "tiujfdwdudfhfoqnzhxl"
const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION || "ap-south-1"
const GRAPHQL_ENDPOINT = `https://${NHOST_SUBDOMAIN}.hasura.${NHOST_REGION}.nhost.run/v1/graphql`

function getAdminClient() {
  const adminSecret = process.env.NHOST_ADMIN_SECRET
  if (!adminSecret) {
    throw new Error("NHOST_ADMIN_SECRET is not set")
  }
  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: { "x-hasura-admin-secret": adminSecret },
  })
}

// Get all users with their auth data
export async function getAllUsers() {
  try {
    const client = getAdminClient()

    const query = gql`
      query GetAllUsers {
        user_profiles(order_by: { created_at: desc }) {
          id
          wallet_balance
          is_blocked
          total_spent
          total_purchased
          created_at
          updated_at
          user {
            email
            displayName
            phoneNumber
            defaultRole
          }
          purchases_aggregate {
            aggregate {
              count
            }
          }
        }
      }
    `

    const data: any = await client.request(query)

    const allUsers = data.user_profiles.map((profile: any) => ({
      id: profile.id,
      email: profile.user?.email || "",
      full_name: profile.user?.displayName || profile.user?.email?.split("@")[0] || "Unknown",
      phone: profile.user?.phoneNumber || null,
      wallet_balance: Number.parseFloat(profile.wallet_balance) || 0,
      is_blocked: profile.is_blocked || false,
      is_admin: profile.user?.defaultRole === "admin",
      total_spent: Number.parseFloat(profile.total_spent) || 0,
      total_purchased: profile.total_purchased || 0,
      total_orders: profile.purchases_aggregate?.aggregate?.count || 0,
      created_at: profile.created_at,
    }))

    // Filter out admin users - admins should not appear in the user management list
    const nonAdminUsers = allUsers.filter((user: any) => !user.is_admin)

    return {
      success: true,
      users: nonAdminUsers,
    }
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return { success: false, users: [], error: error.message }
  }
}

// Get user stats
export async function getUserStats() {
  try {
    const client = getAdminClient()

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const query = gql`
      query GetUserStats($weekAgo: timestamptz!, $monthAgo: timestamptz!) {
        total: user_profiles_aggregate {
          aggregate { count }
        }
        active: user_profiles_aggregate(where: { is_blocked: { _eq: false } }) {
          aggregate { count }
        }
        blocked: user_profiles_aggregate(where: { is_blocked: { _eq: true } }) {
          aggregate { count }
        }
        newThisWeek: user_profiles_aggregate(where: { created_at: { _gte: $weekAgo } }) {
          aggregate { count }
        }
        newThisMonth: user_profiles_aggregate(where: { created_at: { _gte: $monthAgo } }) {
          aggregate { count }
        }
      }
    `

    const data: any = await client.request(query, { weekAgo, monthAgo })

    return {
      success: true,
      stats: {
        total_users: data.total?.aggregate?.count || 0,
        active_users: data.active?.aggregate?.count || 0,
        blocked_users: data.blocked?.aggregate?.count || 0,
        new_this_week: data.newThisWeek?.aggregate?.count || 0,
        new_this_month: data.newThisMonth?.aggregate?.count || 0,
      },
    }
  } catch (error: any) {
    console.error("Error fetching user stats:", error)
    return {
      success: false,
      stats: { total_users: 0, active_users: 0, blocked_users: 0, new_this_week: 0, new_this_month: 0 },
      error: error.message,
    }
  }
}

function generateAdminTransactionId(): string {
  // Generate random 8-character alphanumeric string
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let randomPart = ""
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `ADMIN${randomPart}`
}

// Adjust user balance
export async function adjustUserBalance(userId: string, amount: number, type: "add" | "deduct") {
  try {
    const client = getAdminClient()

    // First get current balance
    const getBalanceQuery = gql`
      query GetUserBalance($userId: uuid!) {
        user_profiles_by_pk(id: $userId) {
          wallet_balance
        }
      }
    `

    const balanceData: any = await client.request(getBalanceQuery, { userId })
    const currentBalance = Number.parseFloat(balanceData.user_profiles_by_pk?.wallet_balance) || 0

    const newBalance = type === "add" ? currentBalance + amount : Math.max(0, currentBalance - amount)

    const signedAmount = type === "add" ? amount : -amount

    // Update balance
    const updateQuery = gql`
      mutation UpdateUserBalance($userId: uuid!, $newBalance: numeric!) {
        update_user_profiles_by_pk(
          pk_columns: { id: $userId }
          _set: { wallet_balance: $newBalance }
        ) {
          id
          wallet_balance
        }
      }
    `

    await client.request(updateQuery, { userId, newBalance })

    const transactionId = generateAdminTransactionId()

    const logQuery = gql`
      mutation LogAdminAdjustment(
        $userId: uuid!
        $amount: numeric!
        $transactionId: String!
        $paymentMethod: String!
      ) {
        insert_topups_one(object: {
          user_id: $userId
          amount: $amount
          transaction_id: $transactionId
          payment_method: $paymentMethod
          razorpay_order_id: null
          razorpay_payment_id: null
          status: "success"
          verified_at: "now()"
        }) {
          id
          transaction_id
        }
      }
    `

    await client.request(logQuery, {
      userId,
      amount: signedAmount,
      transactionId,
      paymentMethod: type === "add" ? "admin_credit" : "admin_debit",
    })

    return {
      success: true,
      newBalance,
      transactionId,
      signedAmount,
    }
  } catch (error: any) {
    console.error("Error adjusting balance:", error)
    return { success: false, error: error.message }
  }
}

// Block user
export async function blockUser(userId: string) {
  try {
    const client = getAdminClient()

    const query = gql`
      mutation BlockUser($userId: uuid!) {
        update_user_profiles_by_pk(
          pk_columns: { id: $userId }
          _set: { is_blocked: true }
        ) {
          id
          is_blocked
        }
      }
    `

    await client.request(query, { userId })
    return { success: true }
  } catch (error: any) {
    console.error("Error blocking user:", error)
    return { success: false, error: error.message }
  }
}

// Unblock user
export async function unblockUser(userId: string) {
  try {
    const client = getAdminClient()

    const query = gql`
      mutation UnblockUser($userId: uuid!) {
        update_user_profiles_by_pk(
          pk_columns: { id: $userId }
          _set: { is_blocked: false }
        ) {
          id
          is_blocked
        }
      }
    `

    await client.request(query, { userId })
    return { success: true }
  } catch (error: any) {
    console.error("Error unblocking user:", error)
    return { success: false, error: error.message }
  }
}

// Delete user
export async function deleteUser(userId: string) {
  try {
    const client = getAdminClient()

    // Delete user's purchases first (due to FK constraints)
    const deletePurchasesQuery = gql`
      mutation DeleteUserPurchases($userId: uuid!) {
        delete_purchases(where: { user_id: { _eq: $userId } }) {
          affected_rows
        }
      }
    `
    await client.request(deletePurchasesQuery, { userId })

    // Delete user's topups
    const deleteTopupsQuery = gql`
      mutation DeleteUserTopups($userId: uuid!) {
        delete_topups(where: { user_id: { _eq: $userId } }) {
          affected_rows
        }
      }
    `
    await client.request(deleteTopupsQuery, { userId })

    // Delete user profile
    const deleteProfileQuery = gql`
      mutation DeleteUserProfile($userId: uuid!) {
        delete_user_profiles_by_pk(id: $userId) {
          id
        }
      }
    `
    await client.request(deleteProfileQuery, { userId })

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return { success: false, error: error.message }
  }
}

// Send password reset email via Nhost Auth API
export async function sendPasswordResetEmail(email: string) {
  try {
    const NHOST_AUTH_URL = `https://${NHOST_SUBDOMAIN}.auth.${NHOST_REGION}.nhost.run/v1`

    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
      : "https://code-crate-india.vercel.app/reset-password"

    const response = await fetch(`${NHOST_AUTH_URL}/user/password/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        options: {
          redirectTo,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Password reset error:", errorData)

      // Handle specific errors
      if (errorData.error === "user-not-found") {
        // For security, still return success (don't reveal if email exists)
        return { success: true }
      }

      if (errorData.error === "redirectTo-not-allowed") {
        throw new Error(
          "Redirect URL not configured. Please add the reset password URL to Nhost Allowed Redirect URLs.",
        )
      }

      throw new Error(errorData.message || "Failed to send password reset email")
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error sending password reset email:", error)
    return { success: false, error: error.message }
  }
}

// Get user purchase history
export async function getUserPurchaseHistory(userId: string) {
  try {
    const client = getAdminClient()

    const query = gql`
      query GetUserPurchaseHistory($userId: uuid!) {
        purchases(
          where: { user_id: { _eq: $userId } }
          order_by: { created_at: desc }
        ) {
          id
          order_number
          quantity
          unit_price
          total_price
          created_at
          slot {
            name
          }
          coupons {
            code
          }
        }
      }
    `

    const data: any = await client.request(query, { userId })

    const purchases = data.purchases.map((purchase: any) => ({
      id: purchase.id,
      order_id: purchase.order_number,
      slot_name: purchase.slot?.name || "Unknown",
      quantity: purchase.quantity,
      amount: Number.parseFloat(purchase.total_price) || 0,
      date: purchase.created_at,
      codes: purchase.coupons?.map((c: any) => c.code) || [],
    }))

    return { success: true, purchases }
  } catch (error: any) {
    console.error("Error fetching user purchase history:", error)
    return { success: false, purchases: [], error: error.message }
  }
}
