// Mock credentials for testing:
// Regular User: rohan@gmail.com / rohan123
// Admin User: rohanphogatt@gmail.com / rohan16

export const mockCredentials = {
  user: {
    email: "rohan@gmail.com",
    password: "rohan123",
  },
  admin: {
    email: "rohanphogatt@gmail.com",
    password: "rohan16",
  },
}

export const mockUser = {
  name: "Rohan Kumar",
  email: "rohan@gmail.com",
  wallet_balance: 2450.0,
  total_purchased: 245,
  total_spent: 12340.0,
  is_admin: false,
}

export const mockAdmin = {
  name: "Rohan Phogat",
  email: "rohanphogatt@gmail.com",
  wallet_balance: 0,
  total_purchased: 0,
  total_spent: 0,
  is_admin: true,
}

export const mockPurchases = [
  {
    id: "ORD001",
    slot_name: "Flipkart Grocery Coupon",
    quantity: 50,
    amount: 500.0,
    date: "2024-12-01",
    status: "completed",
  },
  {
    id: "ORD002",
    slot_name: "Amazon Voucher",
    quantity: 25,
    amount: 375.0,
    date: "2024-11-30",
    status: "completed",
  },
  {
    id: "ORD003",
    slot_name: "Flipkart Grocery Coupon",
    quantity: 100,
    amount: 800.0,
    date: "2024-11-29",
    status: "completed",
  },
  {
    id: "ORD004",
    slot_name: "Swiggy Discount Code",
    quantity: 30,
    amount: 450.0,
    date: "2024-11-28",
    status: "completed",
  },
  {
    id: "ORD005",
    slot_name: "Zomato Promo Code",
    quantity: 20,
    amount: 300.0,
    date: "2024-11-27",
    status: "completed",
  },
]

export const mockSlots = [
  {
    id: "1",
    name: "Flipkart Grocery Coupon",
    description: "Valid for grocery orders. Maximum discount ₹100 per code.",
    available_stock: 500,
    starting_price: 12.0,
    image_url: null,
    is_published: true,
  },
  {
    id: "2",
    name: "Amazon Voucher",
    description: "Use on any Amazon purchase. No minimum order value.",
    available_stock: 300,
    starting_price: 15.0,
    image_url: null,
    is_published: true,
  },
  {
    id: "3",
    name: "Swiggy Discount Code",
    description: "Get discounts on food delivery orders.",
    available_stock: 45,
    starting_price: 10.0,
    image_url: null,
    is_published: true,
  },
  {
    id: "4",
    name: "Zomato Promo Code",
    description: "Save on your next meal order.",
    available_stock: 0,
    starting_price: 10.0,
    image_url: null,
    is_published: true,
  },
  {
    id: "5",
    name: "BigBasket Coupon",
    description: "Grocery shopping made affordable.",
    available_stock: 250,
    starting_price: 8.0,
    image_url: null,
    is_published: true,
  },
  {
    id: "6",
    name: "Myntra Fashion Voucher",
    description: "Fashion and lifestyle discounts.",
    available_stock: 150,
    starting_price: 20.0,
    image_url: null,
    is_published: true,
  },
]

export type User = typeof mockUser
export type Admin = typeof mockAdmin
export type Purchase = (typeof mockPurchases)[0]

export type PricingTier = {
  min_quantity: number
  max_quantity: number | null
  unit_price: number
  label: string
  is_best_deal?: boolean
}

export type Slot = (typeof mockSlots)[0]

export type SlotDetail = Slot & {
  pricing_tiers: PricingTier[]
}

export const mockSlotDetails: Record<string, SlotDetail> = {
  "1": {
    ...mockSlots[0],
    pricing_tiers: [
      { min_quantity: 1, max_quantity: 49, unit_price: 12.0, label: "Perfect for small orders" },
      { min_quantity: 50, max_quantity: 99, unit_price: 10.0, label: "Save ₹2 per code" },
      {
        min_quantity: 100,
        max_quantity: null,
        unit_price: 8.0,
        label: "Best value - Save ₹4 per code",
        is_best_deal: true,
      },
    ],
  },
  "2": {
    ...mockSlots[1],
    pricing_tiers: [
      { min_quantity: 1, max_quantity: 24, unit_price: 15.0, label: "Standard pricing" },
      { min_quantity: 25, max_quantity: 74, unit_price: 12.0, label: "Save ₹3 per code" },
      {
        min_quantity: 75,
        max_quantity: null,
        unit_price: 10.0,
        label: "Best value - Save ₹5 per code",
        is_best_deal: true,
      },
    ],
  },
  "3": {
    ...mockSlots[2],
    pricing_tiers: [
      { min_quantity: 1, max_quantity: 19, unit_price: 10.0, label: "Standard pricing" },
      { min_quantity: 20, max_quantity: 44, unit_price: 8.0, label: "Save ₹2 per code" },
      {
        min_quantity: 45,
        max_quantity: null,
        unit_price: 6.0,
        label: "Best value - Limited stock!",
        is_best_deal: true,
      },
    ],
  },
  "4": {
    ...mockSlots[3],
    pricing_tiers: [
      { min_quantity: 1, max_quantity: 29, unit_price: 10.0, label: "Standard pricing" },
      { min_quantity: 30, max_quantity: 59, unit_price: 8.0, label: "Save ₹2 per code" },
      {
        min_quantity: 60,
        max_quantity: null,
        unit_price: 6.0,
        label: "Best value - Save ₹4 per code",
        is_best_deal: true,
      },
    ],
  },
  "5": {
    ...mockSlots[4],
    pricing_tiers: [
      { min_quantity: 1, max_quantity: 49, unit_price: 8.0, label: "Already great value" },
      { min_quantity: 50, max_quantity: 149, unit_price: 6.0, label: "Save ₹2 per code" },
      {
        min_quantity: 150,
        max_quantity: null,
        unit_price: 5.0,
        label: "Best value - Save ₹3 per code",
        is_best_deal: true,
      },
    ],
  },
  "6": {
    ...mockSlots[5],
    pricing_tiers: [
      { min_quantity: 1, max_quantity: 24, unit_price: 20.0, label: "Standard pricing" },
      { min_quantity: 25, max_quantity: 74, unit_price: 16.0, label: "Save ₹4 per code" },
      {
        min_quantity: 75,
        max_quantity: null,
        unit_price: 12.0,
        label: "Best value - Save ₹8 per code",
        is_best_deal: true,
      },
    ],
  },
}

export type PurchaseHistoryItem = {
  id: string
  order_id: string
  slot_name: string
  quantity: number
  amount: number
  unit_price: number
  status: "completed" | "failed" | "pending"
  date: string
  codes: string[]
}

export const mockPurchaseHistory: PurchaseHistoryItem[] = [
  {
    id: "1",
    order_id: "#ORD001",
    slot_name: "Flipkart Grocery Coupon",
    quantity: 50,
    amount: 500.0,
    unit_price: 10.0,
    status: "completed",
    date: "2024-12-01T22:30:00",
    codes: Array.from({ length: 50 }, (_, i) => `FKG${String(i + 1).padStart(14, "0")}`),
  },
  {
    id: "2",
    order_id: "#ORD002",
    slot_name: "Amazon Voucher",
    quantity: 25,
    amount: 375.0,
    unit_price: 15.0,
    status: "completed",
    date: "2024-11-30T18:15:00",
    codes: Array.from({ length: 25 }, (_, i) => `AMZ${String(i + 1).padStart(14, "0")}`),
  },
  {
    id: "3",
    order_id: "#ORD003",
    slot_name: "Flipkart Grocery Coupon",
    quantity: 100,
    amount: 800.0,
    unit_price: 8.0,
    status: "completed",
    date: "2024-11-29T14:20:00",
    codes: Array.from({ length: 100 }, (_, i) => `FKG${String(i + 51).padStart(14, "0")}`),
  },
  {
    id: "4",
    order_id: "#ORD004",
    slot_name: "Swiggy Discount Code",
    quantity: 30,
    amount: 450.0,
    unit_price: 15.0,
    status: "completed",
    date: "2024-11-28T12:45:00",
    codes: Array.from({ length: 30 }, (_, i) => `SWG${String(i + 1).padStart(14, "0")}`),
  },
  {
    id: "5",
    order_id: "#ORD005",
    slot_name: "Zomato Promo Code",
    quantity: 20,
    amount: 300.0,
    unit_price: 15.0,
    status: "completed",
    date: "2024-11-27T16:10:00",
    codes: Array.from({ length: 20 }, (_, i) => `ZMT${String(i + 1).padStart(14, "0")}`),
  },
  {
    id: "6",
    order_id: "#ORD006",
    slot_name: "BigBasket Coupon",
    quantity: 75,
    amount: 450.0,
    unit_price: 6.0,
    status: "completed",
    date: "2024-11-25T09:30:00",
    codes: Array.from({ length: 75 }, (_, i) => `BGB${String(i + 1).padStart(14, "0")}`),
  },
  {
    id: "7",
    order_id: "#ORD007",
    slot_name: "Myntra Fashion Voucher",
    quantity: 40,
    amount: 640.0,
    unit_price: 16.0,
    status: "completed",
    date: "2024-11-20T11:00:00",
    codes: Array.from({ length: 40 }, (_, i) => `MYN${String(i + 1).padStart(14, "0")}`),
  },
  {
    id: "8",
    order_id: "#ORD008",
    slot_name: "Amazon Voucher",
    quantity: 50,
    amount: 500.0,
    unit_price: 10.0,
    status: "completed",
    date: "2024-11-15T15:45:00",
    codes: Array.from({ length: 50 }, (_, i) => `AMZ${String(i + 26).padStart(14, "0")}`),
  },
  {
    id: "9",
    order_id: "#ORD009",
    slot_name: "Flipkart Grocery Coupon",
    quantity: 150,
    amount: 1200.0,
    unit_price: 8.0,
    status: "completed",
    date: "2024-11-10T20:20:00",
    codes: Array.from({ length: 150 }, (_, i) => `FKG${String(i + 151).padStart(14, "0")}`),
  },
  {
    id: "10",
    order_id: "#ORD010",
    slot_name: "Swiggy Discount Code",
    quantity: 45,
    amount: 270.0,
    unit_price: 6.0,
    status: "completed",
    date: "2024-11-05T13:10:00",
    codes: Array.from({ length: 45 }, (_, i) => `SWG${String(i + 31).padStart(14, "0")}`),
  },
  {
    id: "11",
    order_id: "#ORD011",
    slot_name: "BigBasket Coupon",
    quantity: 200,
    amount: 1000.0,
    unit_price: 5.0,
    status: "completed",
    date: "2024-10-28T17:30:00",
    codes: Array.from({ length: 200 }, (_, i) => `BGB${String(i + 76).padStart(14, "0")}`),
  },
  {
    id: "12",
    order_id: "#ORD012",
    slot_name: "Myntra Fashion Voucher",
    quantity: 100,
    amount: 1200.0,
    unit_price: 12.0,
    status: "completed",
    date: "2024-10-20T10:00:00",
    codes: Array.from({ length: 100 }, (_, i) => `MYN${String(i + 41).padStart(14, "0")}`),
  },
]

export const mockPurchaseStats = {
  total_orders: 12,
  total_coupons: 540,
  total_spent: 12340.0,
}

export const mockUserProfile = {
  id: "user-uuid",
  full_name: "Rohan Kumar",
  email: "rohan@gmail.com",
  phone: "+91 98765 43210",
  wallet_balance: 2450.0,
  total_purchased: 245,
  total_spent: 12340.0,
  total_orders: 12,
  created_at: "2024-11-15T10:30:00",
  is_admin: false,
}

export type UserProfile = typeof mockUserProfile
