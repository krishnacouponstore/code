import { gql } from "graphql-request"

// Fetch published slots with pricing for user view
export const GET_AVAILABLE_COUPONS = gql`
  query GetAvailableCoupons {
    slots(
      where: {
        is_published: { _eq: true }
        available_stock: { _gt: 0 }
      }
      order_by: { created_at: desc }
    ) {
      id
      name
      description
      image_url
      available_stock
      created_at
      pricing_tiers: slot_pricing_tiers(order_by: { min_quantity: asc }, limit: 1) {
        unit_price
      }
    }
  }
`

// Fetch slot details with all pricing tiers for purchase modal
export const GET_SLOT_PRICING = gql`
  query GetSlotPricing($slotId: uuid!) {
    slots_by_pk(id: $slotId) {
      id
      name
      description
      available_stock
      image_url
      pricing_tiers: slot_pricing_tiers(order_by: { min_quantity: asc }) {
        id
        min_quantity
        max_quantity
        unit_price
      }
    }
  }
`

// Fetch user wallet balance
export const GET_USER_WALLET = gql`
  query GetUserWallet($userId: uuid!) {
    user_profiles_by_pk(id: $userId) {
      wallet_balance
      is_blocked
    }
  }
`

export const GET_AVAILABLE_COUPON_IDS = gql`
  query GetAvailableCouponIds($slotId: uuid!, $limit: Int!) {
    coupons(
      where: {
        slot_id: { _eq: $slotId }
        is_sold: { _eq: false }
      }
      limit: $limit
    ) {
      id
      code
    }
  }
`

// Create purchase record
export const CREATE_PURCHASE = gql`
  mutation CreatePurchase(
    $userId: uuid!
    $slotId: uuid!
    $quantity: Int!
    $unitPrice: numeric!
    $totalPrice: numeric!
    $orderNumber: String!
  ) {
    insert_purchases_one(object: {
      user_id: $userId
      slot_id: $slotId
      quantity: $quantity
      unit_price: $unitPrice
      total_price: $totalPrice
      order_number: $orderNumber
      status: "completed"
    }) {
      id
      order_number
    }
  }
`

export const ALLOCATE_CODES_BY_IDS = gql`
  mutation AllocateCodesByIds(
    $couponIds: [uuid!]!
    $userId: uuid!
    $purchaseId: uuid!
  ) {
    update_coupons(
      where: {
        id: { _in: $couponIds }
      }
      _set: {
        is_sold: true
        sold_to: $userId
        purchase_id: $purchaseId
        sold_at: "now()"
      }
    ) {
      affected_rows
      returning {
        id
        code
      }
    }
  }
`

// Update user wallet and stats after purchase
export const UPDATE_USER_AFTER_PURCHASE = gql`
  mutation UpdateUserAfterPurchase(
    $userId: uuid!
    $walletDeduction: numeric!
    $spentAmount: numeric!
    $quantity: Int!
  ) {
    update_user_profiles_by_pk(
      pk_columns: { id: $userId }
      _inc: {
        wallet_balance: $walletDeduction
        total_spent: $spentAmount
        total_purchased: $quantity
      }
    ) {
      wallet_balance
    }
  }
`

// Update slot stats after purchase
export const UPDATE_SLOT_AFTER_PURCHASE = gql`
  mutation UpdateSlotAfterPurchase($slotId: uuid!, $soldQuantity: Int!, $stockDeduction: Int!) {
    update_slots_by_pk(
      pk_columns: { id: $slotId }
      _inc: {
        available_stock: $stockDeduction
        total_sold: $soldQuantity
      }
    ) {
      available_stock
    }
  }
`

// Types
export interface AvailableCoupon {
  id: string
  name: string
  description: string | null
  image_url: string | null
  available_stock: number
  created_at: string
  pricing_tiers: Array<{
    unit_price: number
  }>
}

export interface SlotPricing {
  id: string
  name: string
  description: string | null
  available_stock: number
  image_url: string | null
  pricing_tiers: Array<{
    id: string
    min_quantity: number
    max_quantity: number | null
    unit_price: number
  }>
}

export interface UserWallet {
  wallet_balance: number
  is_blocked: boolean
}

export interface PurchasedCode {
  id: string
  code: string
}
