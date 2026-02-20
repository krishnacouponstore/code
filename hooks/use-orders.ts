"use client"

import { useQuery } from "@tanstack/react-query"
import { getAllOrders, type AdminOrder } from "@/app/actions/orders"

export type OrderFilters = {
  page: number
  limit: number
  status?: "completed" | "failed" | "refunded"
  slotId?: string
  platform?: string
  dateRange?: {
    from?: string
    to?: string
  }
  sortBy?: "newest" | "oldest" | "amount_high" | "amount_low"
  search?: string
}

export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: async () => {
      const result = await getAllOrders({
        limit: filters.limit,
        offset: (filters.page - 1) * filters.limit,
        search: filters.search,
        status: filters.status,
        slotId: filters.slotId,
        platform: filters.platform,
        sortBy: filters.sortBy,
      })
      return result
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

export type { AdminOrder }
