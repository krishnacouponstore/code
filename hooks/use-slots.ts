"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAdminGraphQLClient } from "@/lib/graphql-client"
import { GET_ALL_SLOTS, GET_SLOT_SALES } from "@/lib/graphql/slots"
import { createSlot, updateSlot, deleteSlot, toggleSlotPublish, uploadCodesToSlot } from "@/app/actions/slots"

export type PricingTier = {
  id?: string
  min_quantity: number
  max_quantity: number | null
  unit_price: number
  label?: string
}

export type Slot = {
  id: string
  name: string
  description: string
  is_published: boolean
  available_stock: number
  total_uploaded: number
  total_sold: number
  image_url: string | null
  created_at: string
  updated_at: string
  pricing_tiers: PricingTier[]
  coupons_aggregate?: {
    aggregate: {
      count: number
    }
  }
}

export function useSlots() {
  return useQuery({
    queryKey: ["admin-slots"],
    queryFn: async () => {
      const client = getAdminGraphQLClient()
      const result: any = await client.request(GET_ALL_SLOTS)
      return result.slots as Slot[]
    },
  })
}

export function useCreateSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] })
    },
  })
}

export function useUpdateSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] })
    },
  })
}

export function useDeleteSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] })
    },
  })
}

export function useToggleSlotPublish() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, is_published }: { id: string; is_published: boolean }) => toggleSlotPublish(id, is_published),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] })
    },
  })
}

export function useUploadCodes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ slotId, codes }: { slotId: string; codes: string[] }) => uploadCodesToSlot(slotId, codes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] })
    },
  })
}

export function useSlotSales(slotId: string | null) {
  return useQuery({
    queryKey: ["slot-sales", slotId],
    queryFn: async () => {
      if (!slotId) return null
      const client = getAdminGraphQLClient()
      const result: any = await client.request(GET_SLOT_SALES, { slot_id: slotId })
      return {
        sales: result.coupons,
        totalSold: result.coupons_aggregate.aggregate.count,
      }
    },
    enabled: !!slotId,
  })
}
