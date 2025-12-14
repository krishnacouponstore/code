"use client"

import { useQuery } from "@tanstack/react-query"
import { getTransactions, getRevenueStats, type Transaction } from "@/app/actions/transactions"

export type RevenueFilters = {
  dateRange?: {
    from?: string
    to?: string
  }
  timeRange?: "today" | "7days" | "30days" | "all"
}

export function useRecentTransactions(filters: RevenueFilters) {
  return useQuery({
    queryKey: ["recent-transactions", filters],
    queryFn: async () => {
      // Determine which date range to use
      let dateRange = filters.timeRange || "all"

      // If custom date range is provided, use "all" and filter on server
      if (filters.dateRange?.from || filters.dateRange?.to) {
        dateRange = "all"
      }

      const result = await getTransactions({
        page: 0,
        pageSize: 10,
        dateRange,
      })
      return result.transactions
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useRevenueStats(filters: RevenueFilters) {
  return useQuery({
    queryKey: ["revenue-stats", filters],
    queryFn: async () => {
      const dateRange = filters.timeRange || "all"
      return await getRevenueStats(dateRange)
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

export type { Transaction }
