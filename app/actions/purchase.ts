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

  console.log("[v0] getAdminClient - NHOST_SUBDOMAIN:", NHOST_SUBDOMAIN)
  console.log("[v0] getAdminClient - NHOST_REGION:", NHOST_REGION)
  console.log("[v0] getAdminClient - adminSecret exists:", !!adminSecret)

  if (!adminSecret) {
    throw new Error("Server configuration error: NHOST_ADMIN_SECRET is not set")
  }

  const endpoint = `https://${NHOST_SUBDOMAIN}.hasura.${NHOST_REGION}.nhost.run/v1/graphql`
  console.log("[v0] getAdminClient - endpoint:", endpoint)

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
  const { userId, slotId, quantity, unitPrice, totalPrice } = input

  console.log("[v0] processPurchase started with input:", JSON.stringify(input))

  try {
    console.log("[v0] Creating admin client...")
    const client = getAdminClient()
    console.log("[v0] Admin client created successfully")

    // Step 1: Verify user wallet and not blocked
    console.log("[v0] Step 1: Fetching user wallet...")
    const walletResult: any = await client.request(GET_USER_WALLET, { userId })
    console.log("[v0] Step 1 complete: User wallet fetched")
    const userProfile = walletResult.user_profiles_by_pk

    if (!userProfile) {
      console.log("[v0] Error: User profile not found")
      return { success: false, error: "User profile not found" }
    }

    if (userProfile.is_blocked) {
      console.log("[v0] Error: User is blocked")
      return { success: false, error: "Your account is blocked. Contact support." }
    }

    if (userProfile.wallet_balance < totalPrice) {
      console.log("[v0] Error: Insufficient balance")
      return { success: false, error: "Insufficient wallet balance" }
    }

    // Step 2: Verify slot stock
    console.log("[v0] Step 2: Fetching slot pricing...")
    const slotResult: any = await client.request(GET_SLOT_PRICING, { slotId })
    console.log("[v0] Step 2 complete: Slot pricing fetched")
    const slot = slotResult.slots_by_pk

    if (!slot) {
      console.log("[v0] Error: Slot not found")
      return { success: false, error: "Coupon slot not found" }
    }

    if (slot.available_stock < quantity) {
      console.log("[v0] Error: Insufficient stock")
      return { success: false, error: `Only ${slot.available_stock} codes available` }
    }

    // Step 3: Fetch available coupons
    console.log("[v0] Step 3: Fetching available coupon IDs...")
    const availableCouponsResult: any = await client.request(GET_AVAILABLE_COUPON_IDS, {
      slotId,
      limit: quantity,
    })
    console.log("[v0] Step 3 complete: Available coupons fetched")

    const availableCoupons = availableCouponsResult.coupons
    if (!availableCoupons || availableCoupons.length < quantity) {
      console.log("[v0] Error: Not enough available coupons")
      return { success: false, error: `Only ${availableCoupons?.length || 0} codes available` }
    }

    const couponIds = availableCoupons.map((c: any) => c.id)
    console.log("[v0] Coupon IDs to allocate:", couponIds.length)

    // Step 4: Create purchase record
    console.log("[v0] Step 4: Creating purchase record...")
    const orderNumber = generateOrderNumber()
    const purchaseResult: any = await client.request(CREATE_PURCHASE, {
      userId,
      slotId,
      quantity,
      unitPrice,
      totalPrice,
      orderNumber,
    })
    console.log("[v0] Step 4 complete: Purchase record created")
    const purchaseId = purchaseResult.insert_purchases_one.id

    // Step 5: Allocate codes
    console.log("[v0] Step 5: Allocating codes...")
    const codesResult: any = await client.request(ALLOCATE_CODES_BY_IDS, {
      couponIds,
      userId,
      purchaseId,
    })
    console.log("[v0] Step 5 complete: Codes allocated, affected rows:", codesResult.update_coupons.affected_rows)

    if (codesResult.update_coupons.affected_rows !== quantity) {
      console.log("[v0] Error: Failed to allocate all codes")
      return { success: false, error: "Failed to allocate all codes. Please try again." }
    }

    // Step 6: Update user wallet and stats
    console.log("[v0] Step 6: Updating user wallet...")
    const userUpdateResult: any = await client.request(UPDATE_USER_AFTER_PURCHASE, {
      userId,
      walletDeduction: -totalPrice,
      spentAmount: totalPrice,
      quantity,
    })
    console.log("[v0] Step 6 complete: User wallet updated")

    // Step 7: Update slot stock
    console.log("[v0] Step 7: Updating slot stock...")
    await client.request(UPDATE_SLOT_AFTER_PURCHASE, {
      slotId,
      soldQuantity: quantity,
      stockDeduction: -quantity,
    })
    console.log("[v0] Step 7 complete: Slot stock updated")

    console.log("[v0] Purchase completed successfully!")
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
    console.error("[v0] Full error:", JSON.stringify(error, null, 2))
    return {
      success: false,
      error: error.message || "Purchase failed. Please try again.",
    }
  }
}
