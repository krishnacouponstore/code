"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getAllOrders,
  getOrderStats,
  getOrderSlots,
  getOrderById,
  type AdminOrder,
  type OrderStats,
} from "@/app/actions/orders"

export type { AdminOrder, OrderStats }

// Hook for fetching orders with pagination and filters
export function useAdminOrders(params: {
  page: number
  pageSize: number
  search?: string
  status?: string
  slotId?: string
  dateRange?: "today" | "7days" | "30days" | "all"
  sortBy?: "newest" | "oldest" | "amount_high" | "amount_low"
}) {
  const { page, pageSize, search, status, slotId, dateRange, sortBy } = params

  return useQuery({
    queryKey: ["admin-orders", page, pageSize, search, status, slotId, dateRange, sortBy],
    queryFn: () =>
      getAllOrders({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        search,
        status,
        slotId,
        dateRange,
        sortBy,
      }),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Hook for fetching order stats
export function useOrderStats() {
  return useQuery({
    queryKey: ["order-stats"],
    queryFn: () => getOrderStats(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  })
}

// Hook for fetching slots for filter dropdown
export function useOrderSlots() {
  return useQuery({
    queryKey: ["order-slots"],
    queryFn: () => getOrderSlots(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for fetching a single order
export function useOrderById(orderId: string | null) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => (orderId ? getOrderById(orderId) : null),
    enabled: !!orderId,
    staleTime: 30 * 1000,
  })
}
