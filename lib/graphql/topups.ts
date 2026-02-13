import { gql } from "graphql-request"

/**
 * GraphQL queries and mutations for wallet topups
 * Compatible with both manual and IMB payment gateway
 */

// Get recent topups for a user
export const GET_USER_TOPUPS = gql`
  query GetUserTopups($userId: uuid!, $limit: Int = 10) {
    topups(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      transaction_id
      amount
      payment_method
      status
      created_at
      verified_at
      razorpay_order_id
      razorpay_payment_id
      razorpay_signature
    }
  }
`

// Get topup statistics for a user
export const GET_TOPUP_STATS = gql`
  query GetTopupStats($userId: uuid!) {
    topups_aggregate(
      where: { 
        user_id: { _eq: $userId }
        status: { _eq: "success" }
      }
    ) {
      aggregate {
        sum {
          amount
        }
        count
      }
    }
  }
`

// Create a new topup record (for IMB payment initiation)
export const CREATE_TOPUP = gql`
  mutation CreateTopup(
    $userId: uuid!
    $amount: numeric!
    $transactionId: String!
  ) {
    insert_topups_one(
      object: {
        user_id: $userId
        amount: $amount
        transaction_id: $transactionId
        status: "pending"
      }
    ) {
      id
      transaction_id
      created_at
    }
  }
`

// Update topup status after IMB callback
export const UPDATE_TOPUP_STATUS = gql`
  mutation UpdateTopupStatus(
    $transactionId: String!
    $status: String!
    $imbOrderId: String
    $imbUtr: String
    $imbTxnId: String
    $paymentMethod: String
  ) {
    update_topups(
      where: { transaction_id: { _eq: $transactionId } }
      _set: {
        status: $status
        razorpay_order_id: $imbOrderId
        razorpay_payment_id: $imbUtr
        razorpay_signature: $imbTxnId
        payment_method: $paymentMethod
        verified_at: "now()"
      }
    ) {
      affected_rows
      returning {
        id
        amount
        user_id
      }
    }
  }
`

// Update user wallet balance after successful payment
export const UPDATE_USER_WALLET = gql`
  mutation UpdateUserWallet($userId: uuid!, $amount: numeric!) {
    update_user_profiles_by_pk(
      pk_columns: { id: $userId }
      _inc: { wallet_balance: $amount }
    ) {
      id
      wallet_balance
    }
  }
`

// Get topup by transaction ID
export const GET_TOPUP_BY_TRANSACTION_ID = gql`
  query GetTopupByTransactionId($transactionId: String!) {
    topups(where: { transaction_id: { _eq: $transactionId } }) {
      id
      user_id
      amount
      status
      transaction_id
      razorpay_order_id
      razorpay_payment_id
      payment_method
      created_at
      verified_at
    }
  }
`

// Admin: Get all topups with filters
export const GET_ALL_TOPUPS_ADMIN = gql`
  query GetAllTopupsAdmin(
    $limit: Int!
    $offset: Int!
    $where: topups_bool_exp
    $orderBy: [topups_order_by!]
  ) {
    topups(
      limit: $limit
      offset: $offset
      where: $where
      order_by: $orderBy
    ) {
      id
      transaction_id
      amount
      payment_method
      razorpay_order_id
      razorpay_payment_id
      razorpay_signature
      status
      verified_at
      created_at
      user_profile {
        id
        user {
          email
          displayName
        }
      }
    }
    topups_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`

// Types
export interface Topup {
  id: string
  transaction_id: string | null
  amount: number
  payment_method: string | null
  status: "pending" | "success" | "failed"
  created_at: string
  verified_at: string | null
  razorpay_order_id: string | null // IMB Order ID
  razorpay_payment_id: string | null // IMB UTR
  razorpay_signature: string | null // IMB Transaction ID
}

export interface TopupStats {
  totalAmount: number
  totalCount: number
}
