import { useQuery } from "@tanstack/react-query"
import { useUserId } from "@nhost/nextjs"
import { getGraphQLClient } from "@/lib/graphql-client"
import {
  GET_PURCHASE_STATS,
  GET_USER_PURCHASES,
  GET_PURCHASE_CODES,
  type PurchaseStats,
  type Purchase,
  type PurchaseWithCodes,
} from "@/lib/graphql/purchases"

export function usePurchaseStats() {
  const userId = useUserId()

  return useQuery<PurchaseStats>({
    queryKey: ["purchase-stats", userId],
    queryFn: async () => {
      const client = getGraphQLClient()
      const result: any = await client.request(GET_PURCHASE_STATS, { userId })

      return {
        totalOrders: result.purchases_aggregate?.aggregate?.count || 0,
        totalCoupons: result.user_profiles_by_pk?.total_purchased || 0,
        totalSpent: result.user_profiles_by_pk?.total_spent || 0,
      }
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}

interface UsePurchasesOptions {
  searchQuery?: string
  dateFilter?: string
  sortBy?: string
}

export function usePurchases({ searchQuery = "", dateFilter = "all", sortBy = "newest" }: UsePurchasesOptions = {}) {
  const userId = useUserId()

  return useQuery<Purchase[]>({
    queryKey: ["user-purchases", userId, searchQuery, dateFilter, sortBy],
    queryFn: async () => {
      const client = getGraphQLClient()

      let dateFilterValue: string
      const now = new Date()

      switch (dateFilter) {
        case "7days":
          dateFilterValue = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          break
        case "30days":
          dateFilterValue = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          break
        case "3months":
          dateFilterValue = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
          break
        default:
          // Use a very old date for "All Time" to include all records
          dateFilterValue = "1970-01-01T00:00:00.000Z"
      }

      // Build order by
      let orderBy: any[]
      switch (sortBy) {
        case "oldest":
          orderBy = [{ created_at: "asc" }]
          break
        case "amount":
          orderBy = [{ total_price: "desc" }]
          break
        default:
          orderBy = [{ created_at: "desc" }]
      }

      const result: any = await client.request(GET_USER_PURCHASES, {
        userId,
        searchQuery: searchQuery ? `%${searchQuery}%` : "%%",
        dateFilter: dateFilterValue,
        orderBy,
      })

      return result.purchases || []
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}

export function usePurchaseCodes(purchaseId: string | null) {
  return useQuery<PurchaseWithCodes | null>({
    queryKey: ["purchase-codes", purchaseId],
    queryFn: async () => {
      if (!purchaseId) return null

      const client = getGraphQLClient()
      const result: any = await client.request(GET_PURCHASE_CODES, { purchaseId })

      return result.purchases_by_pk || null
    },
    enabled: !!purchaseId,
    staleTime: 60 * 1000,
  })
}
