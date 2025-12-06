"use server"

import { getServerGraphQLClient } from "@/lib/graphql-client-server"
import { gql } from "graphql-request"

export type DateRange = "today" | "7days" | "30days" | "all"

export interface DashboardTopStats {
  revenue: number
  orders: number
  revenueChange: number
  totalRevenue: number
  totalUsers: number
  blockedUsers: number
  newUsersInRange: number
  totalStock: number
  totalSlots: number
}

export interface DashboardMiddleStats {
  orders: number
  couponsSold: number
  avgOrderValue: number
}

export interface RecentOrder {
  id: string
  orderNumber: string
  userEmail: string
  slotName: string
  quantity: number
  amount: number
  createdAt: string
}

export interface SlotPerformance {
  id: string
  name: string
  available: number
  total: number
  soldToday: number
  revenueToday: number
}

export interface LowStockAlert {
  id: string
  slotName: string
  stock: number
}

function getDateRangeBoundaries(dateRange: DateRange) {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  let rangeStart: Date
  let previousRangeStart: Date

  switch (dateRange) {
    case "today":
      rangeStart = todayStart
      previousRangeStart = new Date(todayStart)
      previousRangeStart.setDate(previousRangeStart.getDate() - 1)
      break
    case "7days":
      rangeStart = new Date(todayStart)
      rangeStart.setDate(rangeStart.getDate() - 7)
      previousRangeStart = new Date(rangeStart)
      previousRangeStart.setDate(previousRangeStart.getDate() - 7)
      break
    case "30days":
      rangeStart = new Date(todayStart)
      rangeStart.setDate(rangeStart.getDate() - 30)
      previousRangeStart = new Date(rangeStart)
      previousRangeStart.setDate(previousRangeStart.getDate() - 30)
      break
    case "all":
    default:
      // For all time, use a very old date
      rangeStart = new Date("2000-01-01")
      previousRangeStart = new Date("2000-01-01")
      break
  }

  return {
    rangeStart: rangeStart.toISOString(),
    rangeEnd: now.toISOString(),
    previousRangeStart: previousRangeStart.toISOString(),
    previousRangeEnd: rangeStart.toISOString(),
    todayStart: todayStart.toISOString(),
  }
}

export async function getDashboardTopStats(dateRange: DateRange = "today"): Promise<DashboardTopStats> {
  try {
    const client = getServerGraphQLClient()
    const { rangeStart, previousRangeStart, previousRangeEnd, todayStart } = getDateRangeBoundaries(dateRange)

    const query = gql`
      query GetDashboardTopStats(
        $rangeStart: timestamptz!, 
        $previousRangeStart: timestamptz!, 
        $previousRangeEnd: timestamptz!
      ) {
        # Revenue in selected range
        revenue_range: purchases_aggregate(
          where: { created_at: { _gte: $rangeStart } }
        ) {
          aggregate {
            sum { total_price }
            count
          }
        }
        
        # Revenue in previous range (for comparison)
        revenue_previous: purchases_aggregate(
          where: { 
            created_at: { _gte: $previousRangeStart, _lt: $previousRangeEnd }
          }
        ) {
          aggregate {
            sum { total_price }
          }
        }
        
        # Total Revenue (All Time)
        total_revenue: purchases_aggregate {
          aggregate {
            sum { total_price }
          }
        }
        
        # Total Users (excluding admin)
        total_users: user_profiles_aggregate(
          where: { user: { defaultRole: { _neq: "admin" } } }
        ) {
          aggregate { count }
        }
        
        # Blocked Users
        blocked_users: user_profiles_aggregate(
          where: { is_blocked: { _eq: true } }
        ) {
          aggregate { count }
        }
        
        # New Users in selected range
        new_users_range: user_profiles_aggregate(
          where: { created_at: { _gte: $rangeStart } }
        ) {
          aggregate { count }
        }
        
        # Total Stock (All Available Coupons)
        total_stock: coupons_aggregate(
          where: { is_sold: { _eq: false } }
        ) {
          aggregate { count }
        }
        
        # Total Published Slots
        total_slots: slots_aggregate(
          where: { is_published: { _eq: true } }
        ) {
          aggregate { count }
        }
      }
    `

    const data: any = await client.request(query, {
      rangeStart,
      previousRangeStart,
      previousRangeEnd,
    })

    const revenueRange = data?.revenue_range?.aggregate?.sum?.total_price || 0
    const revenuePrevious = data?.revenue_previous?.aggregate?.sum?.total_price || 0

    // Calculate percentage change
    let revenueChange = 0
    if (revenuePrevious > 0) {
      revenueChange = Math.round(((revenueRange - revenuePrevious) / revenuePrevious) * 100)
    } else if (revenueRange > 0) {
      revenueChange = 100
    }

    return {
      revenue: revenueRange,
      orders: data?.revenue_range?.aggregate?.count || 0,
      revenueChange,
      totalRevenue: data?.total_revenue?.aggregate?.sum?.total_price || 0,
      totalUsers: data?.total_users?.aggregate?.count || 0,
      blockedUsers: data?.blocked_users?.aggregate?.count || 0,
      newUsersInRange: data?.new_users_range?.aggregate?.count || 0,
      totalStock: data?.total_stock?.aggregate?.count || 0,
      totalSlots: data?.total_slots?.aggregate?.count || 0,
    }
  } catch (error) {
    console.error("Error fetching dashboard top stats:", error)
    return {
      revenue: 0,
      orders: 0,
      revenueChange: 0,
      totalRevenue: 0,
      totalUsers: 0,
      blockedUsers: 0,
      newUsersInRange: 0,
      totalStock: 0,
      totalSlots: 0,
    }
  }
}

export async function getDashboardMiddleStats(dateRange: DateRange = "today"): Promise<DashboardMiddleStats> {
  try {
    const client = getServerGraphQLClient()
    const { rangeStart } = getDateRangeBoundaries(dateRange)

    const query = gql`
      query GetDashboardMiddleStats($rangeStart: timestamptz!) {
        # Orders in range
        orders_range: purchases_aggregate(
          where: { created_at: { _gte: $rangeStart } }
        ) {
          aggregate { count }
        }
        
        # Coupons Sold in range (sum of quantities)
        coupons_sold_range: purchases_aggregate(
          where: { created_at: { _gte: $rangeStart } }
        ) {
          aggregate {
            sum { quantity }
          }
        }
        
        # Average Order Value in range
        avg_order_value_range: purchases_aggregate(
          where: { created_at: { _gte: $rangeStart } }
        ) {
          aggregate {
            avg { total_price }
          }
        }
      }
    `

    const data: any = await client.request(query, { rangeStart })

    return {
      orders: data?.orders_range?.aggregate?.count || 0,
      couponsSold: data?.coupons_sold_range?.aggregate?.sum?.quantity || 0,
      avgOrderValue: data?.avg_order_value_range?.aggregate?.avg?.total_price || 0,
    }
  } catch (error) {
    console.error("Error fetching dashboard middle stats:", error)
    return {
      orders: 0,
      couponsSold: 0,
      avgOrderValue: 0,
    }
  }
}

export async function getRecentOrders(): Promise<RecentOrder[]> {
  try {
    const client = getServerGraphQLClient()

    const query = gql`
      query GetRecentOrders {
        purchases(
          order_by: { created_at: desc }
          limit: 5
        ) {
          id
          order_number
          quantity
          total_price
          created_at
          user_profile {
            user {
              email
            }
          }
          slot {
            name
          }
        }
      }
    `

    const data: any = await client.request(query)

    return (data?.purchases || []).map((order: any) => ({
      id: order.id,
      orderNumber: order.order_number || order.id.slice(0, 8),
      userEmail: order.user_profile?.user?.email || "Unknown",
      slotName: order.slot?.name || "Unknown",
      quantity: order.quantity,
      amount: order.total_price,
      createdAt: order.created_at,
    }))
  } catch (error) {
    console.error("Error fetching recent orders:", error)
    return []
  }
}

export async function getSlotPerformance(dateRange: DateRange = "today"): Promise<SlotPerformance[]> {
  try {
    const client = getServerGraphQLClient()
    const { rangeStart } = getDateRangeBoundaries(dateRange)

    const query = gql`
      query GetSlotPerformance($rangeStart: timestamptz!) {
        slots(
          where: { is_published: { _eq: true } }
          order_by: { total_sold: desc_nulls_last }
          limit: 4
        ) {
          id
          name
          available_stock
          total_uploaded
          
          # Revenue in selected range
          purchases_aggregate(
            where: { created_at: { _gte: $rangeStart } }
          ) {
            aggregate {
              sum { total_price }
              sum { quantity }
            }
          }
        }
      }
    `

    const data: any = await client.request(query, { rangeStart })

    return (data?.slots || []).map((slot: any) => ({
      id: slot.id,
      name: slot.name,
      available: slot.available_stock || 0,
      total: slot.total_uploaded || 0,
      soldToday: slot.purchases_aggregate?.aggregate?.sum?.quantity || 0,
      revenueToday: slot.purchases_aggregate?.aggregate?.sum?.total_price || 0,
    }))
  } catch (error) {
    console.error("Error fetching slot performance:", error)
    return []
  }
}

export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  try {
    const client = getServerGraphQLClient()

    const query = gql`
      query GetLowStockAlerts {
        # Low stock (< 50 coupons) or out of stock
        slots(
          where: {
            is_published: { _eq: true }
            available_stock: { _lt: 50 }
          }
          order_by: { available_stock: asc }
        ) {
          id
          name
          available_stock
        }
      }
    `

    const data: any = await client.request(query)

    return (data?.slots || []).map((slot: any) => ({
      id: slot.id,
      slotName: slot.name,
      stock: slot.available_stock || 0,
    }))
  } catch (error) {
    console.error("Error fetching low stock alerts:", error)
    return []
  }
}
