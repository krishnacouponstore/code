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
} from "@/app/actions/dashboard"

export function useDashboardTopStats() {
  return useQuery<DashboardTopStats>({
    queryKey: ["dashboard-top-stats"],
    queryFn: () => getDashboardTopStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  })
}

export function useDashboardMiddleStats() {
  return useQuery<DashboardMiddleStats>({
    queryKey: ["dashboard-middle-stats"],
    queryFn: () => getDashboardMiddleStats(),
    refetchInterval: 30000,
    staleTime: 10000,
  })
}

export function useRecentOrders() {
  return useQuery<RecentOrder[]>({
    queryKey: ["dashboard-recent-orders"],
    queryFn: () => getRecentOrders(),
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 5000,
  })
}

export function useSlotPerformance() {
  return useQuery<SlotPerformance[]>({
    queryKey: ["dashboard-slot-performance"],
    queryFn: () => getSlotPerformance(),
    refetchInterval: 30000,
    staleTime: 10000,
  })
}

export function useLowStockAlerts() {
  return useQuery<LowStockAlert[]>({
    queryKey: ["dashboard-low-stock-alerts"],
    queryFn: () => getLowStockAlerts(),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  })
}
