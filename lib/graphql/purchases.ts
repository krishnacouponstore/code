import { gql } from "graphql-request"

// Fetch user's purchase stats
export const GET_PURCHASE_STATS = gql`
  query GetPurchaseStats($userId: uuid!) {
    user_profiles_by_pk(id: $userId) {
      total_spent
      total_purchased
    }
    purchases_aggregate(where: { 
      user_id: { _eq: $userId }
      status: { _eq: "completed" }
    }) {
      aggregate {
        count
      }
    }
  }
`

// Fetch all purchases with filters
export const GET_USER_PURCHASES = gql`
  query GetUserPurchases(
    $userId: uuid!
    $searchQuery: String
    $dateFilter: timestamptz
    $orderBy: [purchases_order_by!]!
  ) {
    purchases(
      where: {
        user_id: { _eq: $userId }
        status: { _eq: "completed" }
        _and: [
          { 
            _or: [
              { order_number: { _ilike: $searchQuery } }
              { slot: { name: { _ilike: $searchQuery } } }
            ]
          }
          { created_at: { _gte: $dateFilter } }
        ]
      }
      order_by: $orderBy
    ) {
      id
      order_number
      quantity
      unit_price
      total_price
      status
      created_at
      slot {
        id
        name
        description
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

// Fetch purchase codes for viewing
export const GET_PURCHASE_CODES = gql`
  query GetPurchaseCodes($purchaseId: uuid!) {
    purchases_by_pk(id: $purchaseId) {
      id
      order_number
      quantity
      total_price
      created_at
      slot {
        name
        description
      }
      coupons(order_by: { created_at: asc }) {
        id
        code
      }
    }
  }
`

// Types
export interface PurchaseStats {
  totalOrders: number
  totalCoupons: number
  totalSpent: number
}

export interface Purchase {
  id: string
  order_number: string
  quantity: number
  unit_price: number
  total_price: number
  status: string
  created_at: string
  slot: {
    id: string
    name: string
    description: string | null
    store: {
      id: string
      name: string
      slug: string
      logo_url: string | null
      theme_color: string
    } | null
  }
}

export interface PurchaseWithCodes {
  id: string
  order_number: string
  quantity: number
  total_price: number
  created_at: string
  slot: {
    name: string
    description: string | null
  }
  coupons: Array<{
    id: string
    code: string
  }>
}
