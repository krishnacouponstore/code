"use server"

import { GraphQLClient } from "graphql-request"
import {
  CREATE_PURCHASE,
  GET_AVAILABLE_COUPON_IDS,
  ALLOCATE_CODES_BY_IDS,
  UPDATE_USER_AFTER_PURCHASE,
  UPDATE_SLOT_AFTER_PURCHASE,
  GET_USER_WALLET,
  GET_SLOT_PRICING,
  type PurchasedCode,
} from "@/lib/graphql/coupons"

function getAdminClient() {
  const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "tiujfdwdudfhfoqnzhxl"
  const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION || "ap-south-1"
  const adminSecret = process.env.NHOST_ADMIN_SECRET

  if (!adminSecret) {
    throw new Error("Server configuration error: NHOST_ADMIN_SECRET is not set")
  }

  const endpoint = `https://${NHOST_SUBDOMAIN}.hasura.${NHOST_REGION}.nhost.run/v1/graphql`

  return new GraphQLClient(endpoint, {
    headers: {
      "x-hasura-admin-secret": adminSecret,
    },
  })
}

interface PurchaseInput {
  userId: string
  slotId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  platform?: string
}

interface PurchaseResult {
  success: boolean
  error?: string
  data?: {
    purchaseId: string
    orderNumber: string
    codes: PurchasedCode[]
    newWalletBalance: number
  }
}

function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `ORD${year}${month}${day}${random}`
}

export async function processPurchase(input: PurchaseInput): Promise<PurchaseResult> {
  const { userId, slotId, quantity, unitPrice, totalPrice, platform = "website" } = input

  try {
    const client = getAdminClient()

    // Step 1: Verify user wallet and not blocked
    const walletResult: any = await client.request(GET_USER_WALLET, { userId })
    const userProfile = walletResult.user_profiles_by_pk

    if (!userProfile) {
      return { success: false, error: "User profile not found" }
    }

    if (userProfile.is_blocked) {
      return { success: false, error: "Your account is blocked. Contact support." }
    }

    if (userProfile.wallet_balance < totalPrice) {
      return { success: false, error: "Insufficient wallet balance" }
    }

    // Step 2: Verify slot stock
    const slotResult: any = await client.request(GET_SLOT_PRICING, { slotId })
    const slot = slotResult.slots_by_pk

    if (!slot) {
      return { success: false, error: "Coupon slot not found" }
    }

    if (slot.available_stock < quantity) {
      return { success: false, error: `Only ${slot.available_stock} codes available` }
    }

    // Step 3: Fetch available coupons
    const availableCouponsResult: any = await client.request(GET_AVAILABLE_COUPON_IDS, {
      slotId,
      limit: quantity,
    })

    const availableCoupons = availableCouponsResult.coupons
    if (!availableCoupons || availableCoupons.length < quantity) {
      return { success: false, error: `Only ${availableCoupons?.length || 0} codes available` }
    }

    const couponIds = availableCoupons.map((c: any) => c.id)

    // Step 4: Create purchase record
    const orderNumber = generateOrderNumber()
    const purchaseResult: any = await client.request(CREATE_PURCHASE, {
      userId,
      slotId,
      quantity,
      unitPrice,
      totalPrice,
      orderNumber,
      platform,
    })
    const purchaseId = purchaseResult.insert_purchases_one.id

    // Step 5: Allocate codes
    const codesResult: any = await client.request(ALLOCATE_CODES_BY_IDS, {
      couponIds,
      userId,
      purchaseId,
    })

    if (codesResult.update_coupons.affected_rows !== quantity) {
      return { success: false, error: "Failed to allocate all codes. Please try again." }
    }

    // Step 6: Update user wallet and stats
    const userUpdateResult: any = await client.request(UPDATE_USER_AFTER_PURCHASE, {
      userId,
      walletDeduction: -totalPrice,
      spentAmount: totalPrice,
      quantity,
    })

    // Step 7: Update slot stock
    await client.request(UPDATE_SLOT_AFTER_PURCHASE, {
      slotId,
      soldQuantity: quantity,
      stockDeduction: -quantity,
    })

    return {
      success: true,
      data: {
        purchaseId,
        orderNumber,
        codes: codesResult.update_coupons.returning,
        newWalletBalance: userUpdateResult.update_user_profiles_by_pk.wallet_balance,
      },
    }
  } catch (error: any) {
    console.error("[v0] Purchase error:", error.message)
    return {
      success: false,
      error: error.message || "Purchase failed. Please try again.",
    }
  }
}
