import { useQuery } from "@tanstack/react-query"
import { getGraphQLClient } from "@/lib/graphql-client"
import { gql } from "graphql-request"
import { useUserProfile } from "./use-user-profile"

const GET_USER_STATS = gql`
  query GetUserStats($userId: uuid!) {
    purchases_aggregate(where: { user_id: { _eq: $userId } }) {
      aggregate {
        count
        sum {
          total_price
          quantity
        }
      }
    }
  }
`

const GET_RECENT_PURCHASES = gql`
  query GetRecentPurchases($userId: uuid!) {
    purchases(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: 5
    ) {
      id
      order_number
      quantity
      total_price
      created_at
      slot {
        name
        store {
          id
          name
          slug
          logo_url
          theme_color
        }
      }
    }
  }
`

export type UserStats = {
  count: number
  totalSpent: number
  totalQuantity: number
}

export type RecentPurchase = {
  id: string
  order_number: string
  quantity: number
  total_price: number
  created_at: string
  slot: {
    name: string
    store: {
      id: string
      name: string
      slug: string
      logo_url: string | null
      theme_color: string
    } | null
  }
}

export function useUserStats() {
  const { data: profile } = useUserProfile()

  return useQuery({
    queryKey: ["user-stats", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null
      const client = getGraphQLClient()
      const data: any = await client.request(GET_USER_STATS, { userId: profile.id })
      const aggregate = data.purchases_aggregate?.aggregate
      return {
        count: aggregate?.count || 0,
        totalSpent: aggregate?.sum?.total_price || 0,
        totalQuantity: aggregate?.sum?.quantity || 0,
      } as UserStats
    },
    enabled: !!profile?.id,
  })
}

export function useRecentPurchases() {
  const { data: profile } = useUserProfile()

  return useQuery({
    queryKey: ["recent-purchases", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const client = getGraphQLClient()
      const data: { purchases: RecentPurchase[] } = await client.request(GET_RECENT_PURCHASES, { userId: profile.id })
      return data.purchases || []
    },
    enabled: !!profile?.id,
  })
}
