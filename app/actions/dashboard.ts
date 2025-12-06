"use server"

import { getServerGraphQLClient } from "@/lib/graphql-client-server"
import { gql } from "graphql-request"

export interface DashboardTopStats {
  revenueToday: number
  ordersToday: number
  revenueChange: number
  totalRevenue: number
  totalUsers: number
  blockedUsers: number
  newUsersThisWeek: number
  totalStock: number
  totalSlots: number
}

export interface DashboardMiddleStats {
  ordersToday: number
  couponsSoldToday: number
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

export async function getDashboardTopStats(): Promise<DashboardTopStats> {
  try {
    const client = getServerGraphQLClient()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartISO = todayStart.toISOString()

    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const yesterdayStartISO = yesterdayStart.toISOString()

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoISO = weekAgo.toISOString()

    const query = gql`
      query GetDashboardTopStats($todayStart: timestamptz!, $yesterdayStart: timestamptz!, $weekAgo: timestamptz!) {
        # Revenue Today
        revenue_today: purchases_aggregate(
          where: { created_at: { _gte: $todayStart } }
        ) {
          aggregate {
            sum { total_price }
            count
          }
        }
        
        # Revenue Yesterday (for comparison)
        revenue_yesterday: purchases_aggregate(
          where: { 
            created_at: { _gte: $yesterdayStart, _lt: $todayStart }
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
        
        # New Users This Week
        new_users_week: user_profiles_aggregate(
          where: { created_at: { _gte: $weekAgo } }
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
      todayStart: todayStartISO,
      yesterdayStart: yesterdayStartISO,
      weekAgo: weekAgoISO,
    })

    const revenueToday = data?.revenue_today?.aggregate?.sum?.total_price || 0
    const revenueYesterday = data?.revenue_yesterday?.aggregate?.sum?.total_price || 0

    // Calculate percentage change
    let revenueChange = 0
    if (revenueYesterday > 0) {
      revenueChange = Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100)
    } else if (revenueToday > 0) {
      revenueChange = 100
    }

    return {
      revenueToday,
      ordersToday: data?.revenue_today?.aggregate?.count || 0,
      revenueChange,
      totalRevenue: data?.total_revenue?.aggregate?.sum?.total_price || 0,
      totalUsers: data?.total_users?.aggregate?.count || 0,
      blockedUsers: data?.blocked_users?.aggregate?.count || 0,
      newUsersThisWeek: data?.new_users_week?.aggregate?.count || 0,
      totalStock: data?.total_stock?.aggregate?.count || 0,
      totalSlots: data?.total_slots?.aggregate?.count || 0,
    }
  } catch (error) {
    console.error("Error fetching dashboard top stats:", error)
    return {
      revenueToday: 0,
      ordersToday: 0,
      revenueChange: 0,
      totalRevenue: 0,
      totalUsers: 0,
      blockedUsers: 0,
      newUsersThisWeek: 0,
      totalStock: 0,
      totalSlots: 0,
    }
  }
}

export async function getDashboardMiddleStats(): Promise<DashboardMiddleStats> {
  try {
    const client = getServerGraphQLClient()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartISO = todayStart.toISOString()

    const query = gql`
      query GetDashboardMiddleStats($todayStart: timestamptz!) {
        # Orders Today
        orders_today: purchases_aggregate(
          where: { created_at: { _gte: $todayStart } }
        ) {
          aggregate { count }
        }
        
        # Coupons Sold Today (sum of quantities)
        coupons_sold_today: purchases_aggregate(
          where: { created_at: { _gte: $todayStart } }
        ) {
          aggregate {
            sum { quantity }
          }
        }
        
        # Average Order Value
        avg_order_value: purchases_aggregate {
          aggregate {
            avg { total_price }
          }
        }
      }
    `

    const data: any = await client.request(query, { todayStart: todayStartISO })

    return {
      ordersToday: data?.orders_today?.aggregate?.count || 0,
      couponsSoldToday: data?.coupons_sold_today?.aggregate?.sum?.quantity || 0,
      avgOrderValue: data?.avg_order_value?.aggregate?.avg?.total_price || 0,
    }
  } catch (error) {
    console.error("Error fetching dashboard middle stats:", error)
    return {
      ordersToday: 0,
      couponsSoldToday: 0,
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

export async function getSlotPerformance(): Promise<SlotPerformance[]> {
  try {
    const client = getServerGraphQLClient()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartISO = todayStart.toISOString()

    const query = gql`
      query GetSlotPerformance($todayStart: timestamptz!) {
        slots(
          where: { is_published: { _eq: true } }
          order_by: { total_sold: desc_nulls_last }
          limit: 4
        ) {
          id
          name
          available_stock
          total_uploaded
          
          # Revenue today
          purchases_aggregate(
            where: { created_at: { _gte: $todayStart } }
          ) {
            aggregate {
              sum { total_price }
              sum { quantity }
            }
          }
        }
      }
    `

    const data: any = await client.request(query, { todayStart: todayStartISO })

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
