"use server"

import { getAdminGraphQLClient } from "@/lib/graphql-client"
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
  const client = getAdminGraphQLClient()

  try {
    const codesData = codes.map((code) => ({
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
    await client.request(UPDATE_SLOT_STOCK, {
      id: slotId,
      available_stock: currentSlot.available_stock + uploadedCount,
      total_uploaded: currentSlot.total_uploaded + uploadedCount,
    })

    return {
      success: true,
      uploadedCount,
    }
  } catch (error: any) {
    console.error("Error uploading codes:", error)

    if (error.message?.includes("unique")) {
      return {
        success: false,
        error: "Some codes already exist in the database",
      }
    }

    return {
      success: false,
      error: error.message || "Failed to upload codes",
    }
  }
}

export async function getAllSlots() {
  const client = getAdminGraphQLClient()

  try {
    const result: any = await client.request(GET_ALL_SLOTS)
    return {
      success: true,
      slots: result.slots,
    }
  } catch (error: any) {
    console.error("Error fetching slots:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch slots",
      slots: [],
    }
  }
}

export async function getSlotSales(slotId: string) {
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
