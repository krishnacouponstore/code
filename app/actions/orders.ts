"use server"

import { gql } from "graphql-request"
import { getServerGraphQLClient } from "@/lib/graphql-client-server"

export type AdminOrder = {
  id: string
  order_id: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  slot_name: string
  quantity: number
  unit_price: number
  total_price: number
  status: "completed" | "failed" | "refunded"
  created_at: string
  codes: string[]
}

export type OrderStats = {
  total_orders: number
  revenue_today: number
  orders_today: number
  total_codes_sold: number
  average_order_value: number
}

// Get all orders with pagination and filters
export async function getAllOrders(params: {
  limit?: number
  offset?: number
  search?: string
  status?: string
  slotId?: string
  dateRange?: "today" | "7days" | "30days" | "all"
  sortBy?: "newest" | "oldest" | "amount_high" | "amount_low"
}): Promise<{ orders: AdminOrder[]; total: number }> {
  const { limit = 25, offset = 0, search, status, slotId, dateRange = "all", sortBy = "newest" } = params

  try {
    const client = getServerGraphQLClient()

    // Build where clause
    const whereConditions: string[] = []

    if (search) {
      whereConditions.push(`{_or: [
        {order_number: {_ilike: "%${search}%"}},
        {user_profile: {user: {email: {_ilike: "%${search}%"}}}},
        {slot: {name: {_ilike: "%${search}%"}}}
      ]}`)
    }

    if (status && status !== "all") {
      whereConditions.push(`{status: {_eq: "${status}"}}`)
    }

    if (slotId && slotId !== "all") {
      whereConditions.push(`{slot_id: {_eq: "${slotId}"}}`)
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date()
      let startDate: Date

      switch (dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "7days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }

      whereConditions.push(`{created_at: {_gte: "${startDate.toISOString()}"}}`)
    }

    const whereClause = whereConditions.length > 0 ? `where: {_and: [${whereConditions.join(", ")}]}` : ""

    // Build order by clause
    let orderByClause: string
    switch (sortBy) {
      case "oldest":
        orderByClause = "order_by: {created_at: asc}"
        break
      case "amount_high":
        orderByClause = "order_by: {total_price: desc}"
        break
      case "amount_low":
        orderByClause = "order_by: {total_price: asc}"
        break
      default:
        orderByClause = "order_by: {created_at: desc}"
    }

    const query = gql`
      query GetAllOrders {
        purchases(
          limit: ${limit}
          offset: ${offset}
          ${orderByClause}
          ${whereClause}
        ) {
          id
          order_number
          quantity
          unit_price
          total_price
          status
          created_at
          user_profile {
            id
            user {
              email
              displayName
              phoneNumber
            }
          }
          slot {
            id
            name
          }
          coupons {
            code
          }
        }
        purchases_aggregate${whereClause ? `(${whereClause})` : ""} {
          aggregate {
            count
          }
        }
      }
    `

    const result: any = await client.request(query)

    const orders: AdminOrder[] = (result.purchases || []).map((p: any) => ({
      id: p.id,
      order_id: p.order_number || `#ORD${p.id.slice(0, 6).toUpperCase()}`,
      user: {
        id: p.user_profile?.id || "",
        name: p.user_profile?.user?.displayName || "Unknown",
        email: p.user_profile?.user?.email || "Unknown",
        phone: p.user_profile?.user?.phoneNumber || null,
      },
      slot_name: p.slot?.name || "Unknown",
      quantity: p.quantity,
      unit_price: Number(p.unit_price),
      total_price: Number(p.total_price),
      status: p.status || "completed",
      created_at: p.created_at,
      codes: (p.coupons || []).map((c: any) => c.code),
    }))

    return {
      orders,
      total: result.purchases_aggregate?.aggregate?.count || 0,
    }
  } catch (error) {
    console.error("Error fetching orders:", error)
    return { orders: [], total: 0 }
  }
}

// Get order stats
export async function getOrderStats(): Promise<OrderStats> {
  try {
    const client = getServerGraphQLClient()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const query = gql`
      query GetOrderStats($todayStart: timestamptz!) {
        # Total orders
        total_orders: purchases_aggregate {
          aggregate {
            count
          }
        }
        
        # Orders today
        orders_today: purchases_aggregate(where: { created_at: { _gte: $todayStart } }) {
          aggregate {
            count
          }
        }
        
        # Revenue today
        revenue_today: purchases_aggregate(
          where: { 
            created_at: { _gte: $todayStart }
            status: { _eq: "completed" }
          }
        ) {
          aggregate {
            sum {
              total_price
            }
          }
        }
        
        # Total codes sold
        total_codes_sold: purchases_aggregate(where: { status: { _eq: "completed" } }) {
          aggregate {
            sum {
              quantity
            }
          }
        }
        
        # Average order value
        avg_order_value: purchases_aggregate(where: { status: { _eq: "completed" } }) {
          aggregate {
            avg {
              total_price
            }
          }
        }
      }
    `

    const result: any = await client.request(query, {
      todayStart: todayStart.toISOString(),
    })

    return {
      total_orders: result.total_orders?.aggregate?.count || 0,
      orders_today: result.orders_today?.aggregate?.count || 0,
      revenue_today: Number(result.revenue_today?.aggregate?.sum?.total_price || 0),
      total_codes_sold: result.total_codes_sold?.aggregate?.sum?.quantity || 0,
      average_order_value: Number(result.avg_order_value?.aggregate?.avg?.total_price || 0),
    }
  } catch (error) {
    console.error("Error fetching order stats:", error)
    return {
      total_orders: 0,
      orders_today: 0,
      revenue_today: 0,
      total_codes_sold: 0,
      average_order_value: 0,
    }
  }
}

// Get unique slots for filter dropdown
export async function getOrderSlots(): Promise<{ id: string; name: string }[]> {
  try {
    const client = getServerGraphQLClient()

    const query = gql`
      query GetOrderSlots {
        slots(order_by: { name: asc }) {
          id
          name
        }
      }
    `

    const result: any = await client.request(query)
    return result.slots || []
  } catch (error) {
    console.error("Error fetching slots:", error)
    return []
  }
}

// Get single order with codes
export async function getOrderById(orderId: string): Promise<AdminOrder | null> {
  try {
    const client = getServerGraphQLClient()

    const query = gql`
      query GetOrderById($orderId: uuid!) {
        purchases_by_pk(id: $orderId) {
          id
          order_number
          quantity
          unit_price
          total_price
          status
          created_at
          user_profile {
            id
            user {
              email
              displayName
              phoneNumber
            }
          }
          slot {
            id
            name
          }
          coupons {
            code
          }
        }
      }
    `

    const result: any = await client.request(query, { orderId })
    const p = result.purchases_by_pk

    if (!p) return null

    return {
      id: p.id,
      order_id: p.order_number || `#ORD${p.id.slice(0, 6).toUpperCase()}`,
      user: {
        id: p.user_profile?.id || "",
        name: p.user_profile?.user?.displayName || "Unknown",
        email: p.user_profile?.user?.email || "Unknown",
        phone: p.user_profile?.user?.phoneNumber || null,
      },
      slot_name: p.slot?.name || "Unknown",
      quantity: p.quantity,
      unit_price: Number(p.unit_price),
      total_price: Number(p.total_price),
      status: p.status || "completed",
      created_at: p.created_at,
      codes: (p.coupons || []).map((c: any) => c.code),
    }
  } catch (error) {
    console.error("Error fetching order:", error)
    return null
  }
}

// Export orders to CSV
export async function exportOrders(params: {
  search?: string
  status?: string
  slotId?: string
  dateRange?: "today" | "7days" | "30days" | "all"
}): Promise<AdminOrder[]> {
  // Fetch all matching orders without pagination
  const result = await getAllOrders({
    ...params,
    limit: 10000,
    offset: 0,
  })
  return result.orders
}
