"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createSlot,
  updateSlot,
  deleteSlot,
  toggleSlotPublish,
  uploadCodesToSlot,
  getAllSlots,
  getSlotSales,
} from "@/app/actions/slots"

export type PricingTier = {
  id?: string
  min_quantity: number
  max_quantity: number | null
  unit_price: number
  label?: string
}

export type RedemptionStep = {
  id?: string
  step_number: number
  step_text: string
}

export type Slot = {
  id: string
  name: string
  description: string
  thumbnail?: string | null
  is_published: boolean
  available_stock: number
  total_uploaded: number
  total_sold: number
  expiry_date?: string | null
  created_at: string
  updated_at: string
  pricing_tiers: PricingTier[]
  redemption_steps?: RedemptionStep[]
  store?: {
    id: string
    name: string
    logo_url?: string
  }
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
      const result = await getAllSlots()
      if (!result.success) {
        throw new Error(result.error)
      }
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
      const result = await getSlotSales(slotId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return {
        sales: result.sales,
        totalSold: result.totalSold,
      }
    },
    enabled: !!slotId,
  })
}

export { useToggleSlotPublish as useTogglePublish }
