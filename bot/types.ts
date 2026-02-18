import { Context } from "telegraf"

export interface UserSession {
  userId?: string
  email?: string
  isAuthenticated: boolean
  pendingUserId?: string
  awaitingInput: "email" | "password" | "quantity" | "edit_name" | "edit_email" | "change_password_old" | "change_password_new" | null
  tempEmail?: string
  // Shopping cart state
  selectedStoreId?: string
  selectedCouponId?: string
  selectedCouponName?: string
  selectedCouponPricingTiers?: any[]
  purchaseQuantity?: number
  calculatedPrice?: number
  // Add balance state
  pendingBalanceAmount?: number
  pendingBalanceTimer?: NodeJS.Timeout
  // Password change state
  tempNewPassword?: string
  // Account creation temp state
  tempExistingUserId?: string
  tempExistingEmail?: string
  tempNewUserId?: string
  tempNewEmail?: string
  tempSecondaryUserId?: string
  tempSecondaryEmail?: string
}

export interface BotContext extends Context {
  session?: UserSession
}

export interface User {
  id: string
  email: string
  name: string
  wallet_balance: number
  total_spent?: number
  telegram_id?: string
}

export interface Store {
  id: string
  name: string
  description?: string
  status: string
  slots_aggregate?: {
    aggregate: {
      count: number
    }
  }
}

export interface Coupon {
  id: string
  name: string
  description?: string
  price: number
  quantity: number
  store_id?: string
}

export interface Purchase {
  id: string
  total_price: number
  quantity: number
  status: string
  created_at: string
  order_number?: string
  coupon_codes?: string[]
  slot: {
    id: string
    name: string
    store?: {
      name: string
    }
  }
}
