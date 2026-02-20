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
  platform?: string
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
      const hasCustomRange = !!(filters.dateRange?.from || filters.dateRange?.to)
      return await getTransactions({
        page: filters.page || 0,
        pageSize: filters.pageSize || 50,
        search: filters.search,
        status: filters.status,
        method: filters.method,
        platform: filters.platform,
        sortBy: filters.sortBy,
        dateRange: hasCustomRange ? "all" : mapTimeRange(filters.timeRange),
        dateFrom: filters.dateRange?.from,
        dateTo: filters.dateRange?.to,
      })
    },
    staleTime: 30 * 1000,
  })
}

export function useRevenueStats(filters: RevenueFilters) {
  return useQuery({
    queryKey: ["revenue-stats", filters],
    queryFn: async () => {
      if (filters.dateRange?.from || filters.dateRange?.to) {
        return await getRevenueStats("all", filters.dateRange?.from, filters.dateRange?.to)
      }
      const dateRange = mapTimeRange(filters.timeRange)
      return await getRevenueStats(dateRange)
    },
    staleTime: 30 * 1000,
  })
}

export type { Transaction }
