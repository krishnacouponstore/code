"use server"

import { getAdminGraphQLClient } from "@/lib/graphql-client-server"
import {
  CREATE_SLOT,
  UPDATE_SLOT,
  DELETE_SLOT,
  TOGGLE_SLOT_PUBLISH,
  ADD_PRICING_TIERS,
  DELETE_PRICING_TIERS,
  UPLOAD_CODES_BULK,
  UPDATE_SLOT_STOCK,
  GET_ALL_SLOTS,
  GET_SLOT_SALES,
} from "@/lib/graphql/slots"
import { verifyAdminAccess } from "@/lib/auth-helper"
import { UnauthorizedError } from "@/lib/errors"

type PricingTier = {
  min_quantity: number
  max_quantity: number | null
  unit_price: number
  label?: string
}

type CreateSlotInput = {
  name: string
  description: string
  image_url?: string
  is_published: boolean
  pricing_tiers: PricingTier[]
  codes_to_upload?: string[]
}

type UpdateSlotInput = {
  id: string
  name: string
  description: string
  image_url?: string
  is_published: boolean
  pricing_tiers: PricingTier[]
}

export async function createSlot(input: CreateSlotInput) {
  const { isAdmin } = await verifyAdminAccess()
  if (!isAdmin) {
    throw new UnauthorizedError()
  }

  const client = getAdminGraphQLClient()

  try {
    // Step 1: Create the slot
    const slotResult: any = await client.request(CREATE_SLOT, {
      name: input.name,
      description: input.description,
      image_url: input.image_url || null,
      is_published: input.is_published,
    })

    const slotId = slotResult.insert_slots_one.id

    // Step 2: Add pricing tiers
    if (input.pricing_tiers.length > 0) {
      const tiers = input.pricing_tiers.map((tier) => ({
        slot_id: slotId,
        min_quantity: tier.min_quantity,
        max_quantity: tier.max_quantity,
        unit_price: tier.unit_price,
        label: tier.label || null,
      }))

      await client.request(ADD_PRICING_TIERS, { tiers })
    }

    // Step 3: Upload codes if provided
    let codesUploaded = 0
    if (input.codes_to_upload && input.codes_to_upload.length > 0) {
      const codes = input.codes_to_upload.map((code) => ({
        slot_id: slotId,
        code: code,
      }))

      const codesResult: any = await client.request(UPLOAD_CODES_BULK, { codes })
      codesUploaded = codesResult.insert_coupons.affected_rows

      // Update slot stock
      await client.request(UPDATE_SLOT_STOCK, {
        id: slotId,
        available_stock: codesUploaded,
        total_uploaded: codesUploaded,
      })
    }

    return {
      success: true,
      slot: slotResult.insert_slots_one,
      codesUploaded,
    }
  } catch (error: any) {
    console.error("Error creating slot:", error)
    return {
      success: false,
      error: error.message || "Failed to create slot",
    }
  }
}

export async function updateSlot(input: UpdateSlotInput) {
  const { isAdmin } = await verifyAdminAccess()
  if (!isAdmin) {
    throw new UnauthorizedError()
  }

  const client = getAdminGraphQLClient()

  try {
    // Step 1: Update the slot
    const slotResult: any = await client.request(UPDATE_SLOT, {
      id: input.id,
      name: input.name,
      description: input.description,
      image_url: input.image_url || null,
      is_published: input.is_published,
    })

    // Step 2: Replace pricing tiers (delete existing, add new)
    await client.request(DELETE_PRICING_TIERS, { slot_id: input.id })

    if (input.pricing_tiers.length > 0) {
      const tiers = input.pricing_tiers.map((tier) => ({
        slot_id: input.id,
        min_quantity: tier.min_quantity,
        max_quantity: tier.max_quantity,
        unit_price: tier.unit_price,
        label: tier.label || null,
      }))

      await client.request(ADD_PRICING_TIERS, { tiers })
    }

    return {
      success: true,
      slot: slotResult.update_slots_by_pk,
    }
  } catch (error: any) {
    console.error("Error updating slot:", error)
    return {
      success: false,
      error: error.message || "Failed to update slot",
    }
  }
}

export async function deleteSlot(id: string) {
  const { isAdmin } = await verifyAdminAccess()
  if (!isAdmin) {
    throw new UnauthorizedError()
  }

  const client = getAdminGraphQLClient()

  try {
    const result: any = await client.request(DELETE_SLOT, { id })

    return {
      success: true,
      deletedSlot: result.delete_slots_by_pk,
    }
  } catch (error: any) {
    console.error("Error deleting slot:", error)
    return {
      success: false,
      error: error.message || "Failed to delete slot",
    }
  }
}

export async function toggleSlotPublish(id: string, is_published: boolean) {
  const { isAdmin } = await verifyAdminAccess()
  if (!isAdmin) {
    throw new UnauthorizedError()
  }

  const client = getAdminGraphQLClient()

  try {
    const result: any = await client.request(TOGGLE_SLOT_PUBLISH, {
      id,
      is_published,
    })

    return {
      success: true,
      slot: result.update_slots_by_pk,
    }
  } catch (error: any) {
    console.error("Error toggling slot publish:", error)
    return {
      success: false,
      error: error.message || "Failed to update slot",
    }
  }
}

export async function uploadCodesToSlot(slotId: string, codes: string[]) {
  const { isAdmin } = await verifyAdminAccess()
  if (!isAdmin) {
    throw new UnauthorizedError()
  }

  const client = getAdminGraphQLClient()

  try {
    const checkExistingQuery = `
      query CheckExistingCodes($codes: [String!]!) {
        coupons(where: { code: { _in: $codes } }) {
          code
          slot_id
          slot {
            name
          }
        }
      }
    `
    const existingResult: any = await client.request(checkExistingQuery, { codes })

    const existingCodesDetails = existingResult.coupons.map((c: any) => ({
      code: c.code,
      slotId: c.slot_id,
      slotName: c.slot?.name || "Unknown Slot",
    }))
    const existingCodesList = existingCodesDetails.map((c: any) => c.code)
    const newCodes = codes.filter((code) => !existingCodesList.includes(code))

    // All codes are duplicates - return details
    if (newCodes.length === 0) {
      return {
        success: true,
        uploadedCount: 0,
        duplicateCount: existingCodesList.length,
        existingCodesDetails,
        newCodes: [],
      }
    }

    // Upload only new codes
    const codesData = newCodes.map((code) => ({
      slot_id: slotId,
      code: code,
    }))

    const result: any = await client.request(UPLOAD_CODES_BULK, { codes: codesData })
    const uploadedCount = result.insert_coupons.affected_rows

    // Get current slot data to calculate new totals
    const slotQuery = `
      query GetSlot($id: uuid!) {
        slots_by_pk(id: $id) {
          available_stock
          total_uploaded
        }
      }
    `
    const slotData: any = await client.request(slotQuery, { id: slotId })
    const currentSlot = slotData.slots_by_pk

    // Update slot stock
    const newAvailableStock = currentSlot.available_stock + uploadedCount
    const newTotalUploaded = currentSlot.total_uploaded + uploadedCount

    await client.request(UPDATE_SLOT_STOCK, {
      id: slotId,
      available_stock: newAvailableStock,
      total_uploaded: newTotalUploaded,
    })

    return {
      success: true,
      uploadedCount,
      duplicateCount: existingCodesList.length,
      existingCodesDetails,
      newCodes,
    }
  } catch (error: any) {
    console.error("uploadCodesToSlot error:", error)

    return {
      success: false,
      error: error.message || "Failed to upload codes",
    }
  }
}

export async function checkCodesExistence(codes: string[]) {
  const { isAdmin } = await verifyAdminAccess()
  if (!isAdmin) {
    throw new UnauthorizedError()
  }

  const client = getAdminGraphQLClient()

  try {
    const checkExistingQuery = `
      query CheckExistingCodes($codes: [String!]!) {
        coupons(where: { code: { _in: $codes } }) {
          code
          slot_id
          slot {
            name
          }
        }
      }
    `
    const existingResult: any = await client.request(checkExistingQuery, { codes })

    const existingCodesDetails = existingResult.coupons.map((c: any) => ({
      code: c.code,
      slotId: c.slot_id,
      slotName: c.slot?.name || "Unknown Slot",
    }))
    const existingCodesList = existingCodesDetails.map((c: any) => c.code)
    const newCodes = codes.filter((code) => !existingCodesList.includes(code))

    return {
      success: true,
      existingCodesDetails,
      newCodes,
    }
  } catch (error: any) {
    console.error("checkCodesExistence error:", error)
    return {
      success: false,
      error: error.message || "Failed to check codes",
      existingCodesDetails: [],
      newCodes: codes,
    }
  }
}

export async function getAllSlots() {
  const { isAdmin } = await verifyAdminAccess()
  if (!isAdmin) {
    throw new UnauthorizedError()
  }

  try {
    const client = getAdminGraphQLClient()
    const result: any = await client.request(GET_ALL_SLOTS)

    return {
      success: true,
      slots: result.slots,
    }
  } catch (error: any) {
    console.error("getAllSlots error:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch slots",
      slots: [],
    }
  }
}

export async function getSlotSales(slotId: string) {
  const { isAdmin } = await verifyAdminAccess()
  if (!isAdmin) {
    throw new UnauthorizedError()
  }

  const client = getAdminGraphQLClient()

  try {
    const result: any = await client.request(GET_SLOT_SALES, { slot_id: slotId })
    return {
      success: true,
      sales: result.coupons,
      totalSold: result.coupons_aggregate.aggregate.count,
    }
  } catch (error: any) {
    console.error("Error fetching slot sales:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch slot sales",
      sales: [],
      totalSold: 0,
    }
  }
}

export async function getSlotCoupons(
  slotId: string,
  options: {
    limit: number
    offset: number
    search?: string
    filterStatus?: "all" | "sold" | "unsold"
  },
) {
  const { isAdmin } = await verifyAdminAccess()
  if (!isAdmin) {
    throw new UnauthorizedError()
  }

  const client = getAdminGraphQLClient()

  try {
    // Build the where clause based on filter
    let is_sold_filter = null
    if (options.filterStatus === "sold") {
      is_sold_filter = true
    } else if (options.filterStatus === "unsold") {
      is_sold_filter = false
    }

    const searchPattern = options.search ? `%${options.search}%` : "%"

    // Use inline query to handle optional is_sold filter
    const query = `
      query GetSlotCouponsFiltered(
        $slot_id: uuid!
        $limit: Int!
        $offset: Int!
        $search: String!
        ${is_sold_filter !== null ? "$is_sold: Boolean!" : ""}
      ) {
        coupons(
          where: {
            slot_id: { _eq: $slot_id }
            code: { _ilike: $search }
            ${is_sold_filter !== null ? "is_sold: { _eq: $is_sold }" : ""}
          }
          order_by: { created_at: desc }
          limit: $limit
          offset: $offset
        ) {
          id
          code
          is_sold
          sold_at
          created_at
          user_profile {
            user {
              email
              displayName
            }
          }
        }
        coupons_aggregate(
          where: {
            slot_id: { _eq: $slot_id }
            code: { _ilike: $search }
            ${is_sold_filter !== null ? "is_sold: { _eq: $is_sold }" : ""}
          }
        ) {
          aggregate {
            count
          }
        }
      }
    `

    const variables: any = {
      slot_id: slotId,
      limit: options.limit,
      offset: options.offset,
      search: searchPattern,
    }

    if (is_sold_filter !== null) {
      variables.is_sold = is_sold_filter
    }

    const result: any = await client.request(query, variables)

    return {
      success: true,
      coupons: result.coupons,
      totalCount: result.coupons_aggregate.aggregate.count,
    }
  } catch (error: any) {
    console.error("Error fetching slot coupons:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch coupons",
      coupons: [],
      totalCount: 0,
    }
  }
}

export async function deleteCoupon(couponId: string) {
  const { isAdmin } = await verifyAdminAccess()
  if (!isAdmin) {
    throw new UnauthorizedError()
  }

  const client = getAdminGraphQLClient()

  try {
    const result: any = await client.request(
      `
      mutation DeleteCoupon($id: uuid!) {
        delete_coupons_by_pk(id: $id) {
          id
          code
          slot_id
          is_sold
        }
      }
    `,
      { id: couponId },
    )

    const deletedCoupon = result.delete_coupons_by_pk

    if (!deletedCoupon) {
      return {
        success: false,
        error: "Coupon not found",
      }
    }

    // Update slot stock if coupon was not sold
    if (!deletedCoupon.is_sold) {
      const slotQuery = `
        query GetSlot($id: uuid!) {
          slots_by_pk(id: $id) {
            available_stock
            total_uploaded
          }
        }
      `
      const slotData: any = await client.request(slotQuery, { id: deletedCoupon.slot_id })
      const currentSlot = slotData.slots_by_pk

      if (currentSlot) {
        await client.request(UPDATE_SLOT_STOCK, {
          id: deletedCoupon.slot_id,
          available_stock: Math.max(0, currentSlot.available_stock - 1),
          total_uploaded: Math.max(0, currentSlot.total_uploaded - 1),
        })
      }
    }

    return {
      success: true,
      deletedCoupon,
    }
  } catch (error: any) {
    console.error("Error deleting coupon:", error)
    return {
      success: false,
      error: error.message || "Failed to delete coupon",
    }
  }
}
