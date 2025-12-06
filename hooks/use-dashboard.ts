"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getDashboardTopStats,
  getDashboardMiddleStats,
  getRecentOrders,
  getSlotPerformance,
  getLowStockAlerts,
  type DashboardTopStats,
  type DashboardMiddleStats,
  type RecentOrder,
  type SlotPerformance,
  type LowStockAlert,
  type DateRange,
} from "@/app/actions/dashboard"

export function useDashboardTopStats(dateRange: DateRange = "today") {
  return useQuery<DashboardTopStats>({
    queryKey: ["dashboard-top-stats", dateRange],
    queryFn: () => getDashboardTopStats(dateRange),
    refetchInterval: 30000,
    staleTime: 10000,
  })
}

export function useDashboardMiddleStats(dateRange: DateRange = "today") {
  return useQuery<DashboardMiddleStats>({
    queryKey: ["dashboard-middle-stats", dateRange],
    queryFn: () => getDashboardMiddleStats(dateRange),
    refetchInterval: 30000,
    staleTime: 10000,
  })
}

export function useRecentOrders() {
  return useQuery<RecentOrder[]>({
    queryKey: ["dashboard-recent-orders"],
    queryFn: () => getRecentOrders(),
    refetchInterval: 15000,
    staleTime: 5000,
  })
}

export function useSlotPerformance(dateRange: DateRange = "today") {
  return useQuery<SlotPerformance[]>({
    queryKey: ["dashboard-slot-performance", dateRange],
    queryFn: () => getSlotPerformance(dateRange),
    refetchInterval: 30000,
    staleTime: 10000,
  })
}

export function useLowStockAlerts() {
  return useQuery<LowStockAlert[]>({
    queryKey: ["dashboard-low-stock-alerts"],
    queryFn: () => getLowStockAlerts(),
    refetchInterval: 60000,
    staleTime: 30000,
  })
}
