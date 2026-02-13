"use client"

import { useQuery } from "@tanstack/react-query"
import { getTransactions, getRevenueStats, type Transaction } from "@/app/actions/transactions"

export type RevenueFilters = {
  dateRange?: {
    from?: string
    to?: string
  }
  timeRange?: "today" | "week" | "month" | "year" | "7days" | "30days" | "all"
  page?: number
  pageSize?: number
  search?: string
  status?: string
  method?: string
  sortBy?: string
}

function mapTimeRange(timeRange?: string): string {
  const map: Record<string, string> = {
    today: "today",
    week: "7days",
    month: "30days",
    year: "all",
  }
  return map[timeRange || ""] || timeRange || "all"
}

export function useRecentTransactions(filters: RevenueFilters) {
  return useQuery({
    queryKey: ["recent-transactions", filters],
    queryFn: async () => {
      let dateRange = mapTimeRange(filters.timeRange)

      if (filters.dateRange?.from || filters.dateRange?.to) {
        dateRange = "all"
      }

      return await getTransactions({
        page: filters.page || 0,
        pageSize: filters.pageSize || 50,
        search: filters.search,
        status: filters.status,
        method: filters.method,
        sortBy: filters.sortBy,
        dateRange,
      })
    },
    staleTime: 30 * 1000,
  })
}

export function useRevenueStats(filters: RevenueFilters) {
  return useQuery({
    queryKey: ["revenue-stats", filters],
    queryFn: async () => {
      const dateRange = mapTimeRange(filters.timeRange)
      return await getRevenueStats(dateRange)
    },
    staleTime: 30 * 1000,
  })
}

export type { Transaction }
