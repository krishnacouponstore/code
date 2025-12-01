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

export const adminStats = {
  today: {
    revenue: 12450.0,
    orders: 25,
    coupons_sold: 1250,
    revenue_change: 15,
  },
  total: {
    revenue: 245600.0,
    users: 156,
    blocked_users: 12,
    new_users_this_week: 8,
    available_stock: 12450,
    total_slots: 6,
  },
  average_order_value: 498.0,
}

export const adminRecentOrders = [
  {
    id: "ORD045",
    user_email: "rohan@example.com",
    slot_name: "Flipkart Grocery Coupon",
    quantity: 50,
    amount: 500.0,
    created_at: "2 mins ago",
    status: "completed",
  },
  {
    id: "ORD044",
    user_email: "user@example.com",
    slot_name: "Amazon Voucher",
    quantity: 25,
    amount: 375.0,
    created_at: "15 mins ago",
    status: "completed",
  },
  {
    id: "ORD043",
    user_email: "test@example.com",
    slot_name: "Swiggy Discount Code",
    quantity: 100,
    amount: 800.0,
    created_at: "1 hour ago",
    status: "completed",
  },
  {
    id: "ORD042",
    user_email: "buyer@example.com",
    slot_name: "BigBasket Coupon",
    quantity: 30,
    amount: 180.0,
    created_at: "2 hours ago",
    status: "completed",
  },
  {
    id: "ORD041",
    user_email: "customer@example.com",
    slot_name: "Myntra Fashion Voucher",
    quantity: 40,
    amount: 640.0,
    created_at: "3 hours ago",
    status: "completed",
  },
]

export const lowStockAlerts = [
  { slot_name: "Swiggy Discount Code", stock: 45, threshold: 50 },
  { slot_name: "Zomato Promo Code", stock: 0, threshold: 50 },
]

export const topSlots = [
  {
    id: "1",
    name: "Flipkart Grocery Coupon",
    available: 500,
    total: 1000,
    sold_today: 125,
    revenue_today: 1500.0,
  },
  {
    id: "2",
    name: "Amazon Voucher",
    available: 300,
    total: 500,
    sold_today: 75,
    revenue_today: 1125.0,
  },
  {
    id: "5",
    name: "BigBasket Coupon",
    available: 250,
    total: 400,
    sold_today: 60,
    revenue_today: 480.0,
  },
  {
    id: "6",
    name: "Myntra Fashion Voucher",
    available: 150,
    total: 200,
    sold_today: 40,
    revenue_today: 640.0,
  },
]

export type AdminStats = typeof adminStats
export type AdminRecentOrder = (typeof adminRecentOrders)[0]
export type LowStockAlert = (typeof lowStockAlerts)[0]
export type TopSlot = (typeof topSlots)[0]

export type AdminSlot = {
  id: string
  name: string
  description: string
  is_published: boolean
  available_stock: number
  total_uploaded: number
  total_sold: number
  image_url: string | null
  created_at: string
  pricing_tiers: {
    min_quantity: number
    max_quantity: number | null
    unit_price: number
    label?: string
  }[]
}

export const mockAdminSlots: AdminSlot[] = [
  {
    id: "1",
    name: "Flipkart Grocery Coupon",
    description: "Valid for grocery orders. Maximum discount ₹100 per code.",
    is_published: true,
    available_stock: 500,
    total_uploaded: 1000,
    total_sold: 500,
    image_url: null,
    created_at: "2024-11-15",
    pricing_tiers: [
      { min_quantity: 1, max_quantity: 49, unit_price: 12.0, label: "Perfect for small orders" },
      { min_quantity: 50, max_quantity: 99, unit_price: 10.0, label: "Save ₹2 per code" },
      { min_quantity: 100, max_quantity: null, unit_price: 8.0, label: "Best value" },
    ],
  },
  {
    id: "2",
    name: "Amazon Voucher",
    description: "Use on any Amazon purchase. No minimum order value.",
    is_published: true,
    available_stock: 300,
    total_uploaded: 500,
    total_sold: 200,
    image_url: null,
    created_at: "2024-11-20",
    pricing_tiers: [
      { min_quantity: 1, max_quantity: 49, unit_price: 15.0 },
      { min_quantity: 50, max_quantity: null, unit_price: 12.0 },
    ],
  },
  {
    id: "3",
    name: "Swiggy Discount Code",
    description: "Get discounts on food delivery orders.",
    is_published: true,
    available_stock: 45,
    total_uploaded: 200,
    total_sold: 155,
    image_url: null,
    created_at: "2024-11-25",
    pricing_tiers: [{ min_quantity: 1, max_quantity: null, unit_price: 10.0 }],
  },
  {
    id: "4",
    name: "Zomato Promo Code",
    description: "Save on your next meal order.",
    is_published: false,
    available_stock: 0,
    total_uploaded: 100,
    total_sold: 100,
    image_url: null,
    created_at: "2024-11-28",
    pricing_tiers: [
      { min_quantity: 1, max_quantity: 49, unit_price: 15.0 },
      { min_quantity: 50, max_quantity: null, unit_price: 10.0 },
    ],
  },
  {
    id: "5",
    name: "BigBasket Coupon",
    description: "Grocery shopping made affordable.",
    is_published: true,
    available_stock: 250,
    total_uploaded: 400,
    total_sold: 150,
    image_url: null,
    created_at: "2024-11-10",
    pricing_tiers: [
      { min_quantity: 1, max_quantity: 49, unit_price: 8.0 },
      { min_quantity: 50, max_quantity: 149, unit_price: 6.0 },
      { min_quantity: 150, max_quantity: null, unit_price: 5.0 },
    ],
  },
  {
    id: "6",
    name: "Myntra Fashion Voucher",
    description: "Fashion and lifestyle discounts.",
    is_published: false,
    available_stock: 150,
    total_uploaded: 200,
    total_sold: 50,
    image_url: null,
    created_at: "2024-11-05",
    pricing_tiers: [
      { min_quantity: 1, max_quantity: 24, unit_price: 20.0 },
      { min_quantity: 25, max_quantity: 74, unit_price: 16.0 },
      { min_quantity: 75, max_quantity: null, unit_price: 12.0 },
    ],
  },
]

export type AdminUser = {
  id: string
  full_name: string
  email: string
  phone: string | null
  wallet_balance: number
  total_spent: number
  total_purchased: number
  total_orders: number
  is_blocked: boolean
  is_admin: boolean
  created_at: string
}

export const mockAdminUsers: AdminUser[] = [
  {
    id: "user-1",
    full_name: "Rohan Kumar",
    email: "rohan@example.com",
    phone: "+91 98765 43210",
    wallet_balance: 2450.0,
    total_spent: 12340.0,
    total_purchased: 245,
    total_orders: 12,
    is_blocked: false,
    is_admin: false,
    created_at: "2024-11-15T10:30:00",
  },
  {
    id: "user-2",
    full_name: "Test User",
    email: "test@example.com",
    phone: "+91 99999 88888",
    wallet_balance: 500.0,
    total_spent: 8500.0,
    total_purchased: 150,
    total_orders: 8,
    is_blocked: false,
    is_admin: false,
    created_at: "2024-11-20T14:20:00",
  },
  {
    id: "user-3",
    full_name: "John Doe",
    email: "john@example.com",
    phone: null,
    wallet_balance: 0.0,
    total_spent: 0.0,
    total_purchased: 0,
    total_orders: 0,
    is_blocked: true,
    is_admin: false,
    created_at: "2024-11-25T09:15:00",
  },
  {
    id: "user-4",
    full_name: "Sarah Smith",
    email: "sarah@example.com",
    phone: "+91 88888 77777",
    wallet_balance: 15000.0,
    total_spent: 45600.0,
    total_purchased: 450,
    total_orders: 25,
    is_blocked: false,
    is_admin: false,
    created_at: "2024-10-10T11:00:00",
  },
  {
    id: "admin-1",
    full_name: "Admin User",
    email: "admin@codecrate.com",
    phone: "+91 77777 66666",
    wallet_balance: 0.0,
    total_spent: 0.0,
    total_purchased: 0,
    total_orders: 0,
    is_blocked: false,
    is_admin: true,
    created_at: "2024-11-01T08:00:00",
  },
  {
    id: "user-5",
    full_name: "Priya Sharma",
    email: "priya@example.com",
    phone: "+91 77665 54433",
    wallet_balance: 3200.0,
    total_spent: 18900.0,
    total_purchased: 320,
    total_orders: 18,
    is_blocked: false,
    is_admin: false,
    created_at: "2024-10-25T16:45:00",
  },
  {
    id: "user-6",
    full_name: "Amit Patel",
    email: "amit@example.com",
    phone: "+91 99887 76655",
    wallet_balance: 750.0,
    total_spent: 5600.0,
    total_purchased: 95,
    total_orders: 6,
    is_blocked: false,
    is_admin: false,
    created_at: "2024-11-05T11:20:00",
  },
  {
    id: "user-7",
    full_name: "Sneha Gupta",
    email: "sneha@example.com",
    phone: null,
    wallet_balance: 0.0,
    total_spent: 1200.0,
    total_purchased: 25,
    total_orders: 2,
    is_blocked: true,
    is_admin: false,
    created_at: "2024-11-18T09:00:00",
  },
]

// Mock orders data for admin orders page
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

export const mockAdminOrders: AdminOrder[] = [
  {
    id: "1",
    order_id: "#ORD045",
    user: { id: "user-1", name: "Rohan Kumar", email: "rohan@example.com", phone: "+91 98765 43210" },
    slot_name: "Flipkart Grocery Coupon",
    quantity: 50,
    unit_price: 10.0,
    total_price: 500.0,
    status: "completed",
    created_at: "2024-12-02T09:45:00",
    codes: Array.from({ length: 50 }, (_, i) => `FKG${String(i + 1).padStart(14, "0")}`),
  },
  {
    id: "2",
    order_id: "#ORD044",
    user: { id: "user-2", name: "Test User", email: "user@example.com", phone: "+91 99999 88888" },
    slot_name: "Amazon Voucher",
    quantity: 25,
    unit_price: 15.0,
    total_price: 375.0,
    status: "completed",
    created_at: "2024-12-02T09:32:00",
    codes: Array.from({ length: 25 }, (_, i) => `AMZ${String(i + 1).padStart(14, "0")}`),
  },
  {
    id: "3",
    order_id: "#ORD043",
    user: { id: "user-2", name: "Test User", email: "test@example.com", phone: "+91 99999 88888" },
    slot_name: "Swiggy Discount Code",
    quantity: 100,
    unit_price: 8.0,
    total_price: 800.0,
    status: "completed",
    created_at: "2024-12-01T22:10:00",
    codes: Array.from({ length: 100 }, (_, i) => `SWG${String(i + 1).padStart(14, "0")}`),
  },
  {
    id: "4",
    order_id: "#ORD042",
    user: { id: "user-4", name: "Sarah Smith", email: "sarah@example.com", phone: "+91 88888 77777" },
    slot_name: "BigBasket Coupon",
    quantity: 30,
    unit_price: 6.0,
    total_price: 180.0,
    status: "completed",
    created_at: "2024-12-01T16:45:00",
    codes: Array.from({ length: 30 }, (_, i) => `BGB${String(i + 1).padStart(14, "0")}`),
  },
  {
    id: "5",
    order_id: "#ORD041",
    user: { id: "user-6", name: "Amit Patel", email: "amit@example.com", phone: "+91 99887 76655" },
    slot_name: "Myntra Fashion Voucher",
    quantity: 40,
    unit_price: 16.0,
    total_price: 640.0,
    status: "completed",
    created_at: "2024-12-01T14:10:00",
    codes: Array.from({ length: 40 }, (_, i) => `MYN${String(i + 1).padStart(14, "0")}`),
  },
  {
    id: "6",
    order_id: "#ORD040",
    user: { id: "user-5", name: "Priya Sharma", email: "priya@example.com", phone: "+91 77665 54433" },
    slot_name: "Flipkart Grocery Coupon",
    quantity: 75,
    unit_price: 10.0,
    total_price: 750.0,
    status: "completed",
    created_at: "2024-11-30T11:20:00",
    codes: Array.from({ length: 75 }, (_, i) => `FKG${String(i + 51).padStart(14, "0")}`),
  },
  {
    id: "7",
    order_id: "#ORD039",
    user: { id: "user-1", name: "Rohan Kumar", email: "rohan@example.com", phone: "+91 98765 43210" },
    slot_name: "Amazon Voucher",
    quantity: 50,
    unit_price: 12.0,
    total_price: 600.0,
    status: "completed",
    created_at: "2024-11-29T18:30:00",
    codes: Array.from({ length: 50 }, (_, i) => `AMZ${String(i + 26).padStart(14, "0")}`),
  },
  {
    id: "8",
    order_id: "#ORD038",
    user: { id: "user-3", name: "John Doe", email: "john@example.com", phone: null },
    slot_name: "Zomato Promo Code",
    quantity: 20,
    unit_price: 10.0,
    total_price: 200.0,
    status: "refunded",
    created_at: "2024-11-28T09:15:00",
    codes: [],
  },
  {
    id: "9",
    order_id: "#ORD037",
    user: { id: "user-4", name: "Sarah Smith", email: "sarah@example.com", phone: "+91 88888 77777" },
    slot_name: "Flipkart Grocery Coupon",
    quantity: 200,
    unit_price: 8.0,
    total_price: 1600.0,
    status: "completed",
    created_at: "2024-11-27T15:00:00",
    codes: Array.from({ length: 200 }, (_, i) => `FKG${String(i + 126).padStart(14, "0")}`),
  },
  {
    id: "10",
    order_id: "#ORD036",
    user: { id: "user-6", name: "Amit Patel", email: "amit@example.com", phone: "+91 99887 76655" },
    slot_name: "Swiggy Discount Code",
    quantity: 45,
    unit_price: 8.0,
    total_price: 360.0,
    status: "completed",
    created_at: "2024-11-26T10:45:00",
    codes: Array.from({ length: 45 }, (_, i) => `SWG${String(i + 101).padStart(14, "0")}`),
  },
  {
    id: "11",
    order_id: "#ORD035",
    user: { id: "user-5", name: "Priya Sharma", email: "priya@example.com", phone: "+91 77665 54433" },
    slot_name: "BigBasket Coupon",
    quantity: 150,
    unit_price: 5.0,
    total_price: 750.0,
    status: "completed",
    created_at: "2024-11-25T13:20:00",
    codes: Array.from({ length: 150 }, (_, i) => `BGB${String(i + 31).padStart(14, "0")}`),
  },
  {
    id: "12",
    order_id: "#ORD034",
    user: { id: "user-7", name: "Sneha Gupta", email: "sneha@example.com", phone: null },
    slot_name: "Amazon Voucher",
    quantity: 10,
    unit_price: 15.0,
    total_price: 150.0,
    status: "failed",
    created_at: "2024-11-24T08:00:00",
    codes: [],
  },
]

export const mockOrderStats = {
  total_orders: 1245,
  revenue_today: 12450.0,
  orders_today: 25,
  total_codes_sold: 15340,
  average_order_value: 498.0,
}

export const revenueStats = {
  total_revenue: 245600.0,
  pending_amount: 1200.0,
  successful_transactions: 1340,
  refunded_failed: 8,
}

export const mockUserStats = {
  total_users: 156,
  active_users: 144,
  blocked_users: 12,
  new_this_month: 23,
  new_this_week: 8,
}

export type Transaction = {
  id: string
  user_name: string
  user_email: string
  amount: number
  method: "UPI" | "Card" | "NetBanking"
  razorpay_order_id: string
  razorpay_payment_id: string
  status: "pending" | "success" | "failed" | "refunded"
  created_at: string
  verified_at?: string
  refunded_at?: string
  refund_reason?: string
}

export const mockTransactions: Transaction[] = [
  {
    id: "TXN001",
    user_name: "Rohan Kumar",
    user_email: "rohan@example.com",
    amount: 500.0,
    method: "UPI",
    razorpay_order_id: "order_OxYZ123abc",
    razorpay_payment_id: "pay_AbC456xyz",
    status: "success",
    created_at: "2024-12-02T09:45:00",
    verified_at: "2024-12-02T09:47:00",
  },
  {
    id: "TXN002",
    user_name: "Test User",
    user_email: "test@example.com",
    amount: 200.0,
    method: "UPI",
    razorpay_order_id: "order_PqR789def",
    razorpay_payment_id: "",
    status: "pending",
    created_at: "2024-12-02T09:32:00",
  },
  {
    id: "TXN003",
    user_name: "John Doe",
    user_email: "john@example.com",
    amount: 100.0,
    method: "Card",
    razorpay_order_id: "order_StU012ghi",
    razorpay_payment_id: "pay_DeF789jkl",
    status: "refunded",
    created_at: "2024-12-01T22:10:00",
    verified_at: "2024-12-01T22:12:00",
    refunded_at: "2024-12-01T22:30:00",
    refund_reason: "User requested refund - duplicate payment",
  },
  {
    id: "TXN004",
    user_name: "Sarah Smith",
    user_email: "sarah@example.com",
    amount: 1000.0,
    method: "NetBanking",
    razorpay_order_id: "order_VwX345jkl",
    razorpay_payment_id: "pay_GhI012mno",
    status: "success",
    created_at: "2024-12-01T15:20:00",
    verified_at: "2024-12-01T15:22:00",
  },
  {
    id: "TXN005",
    user_name: "Priya Sharma",
    user_email: "priya@example.com",
    amount: 750.0,
    method: "UPI",
    razorpay_order_id: "order_YzA678mno",
    razorpay_payment_id: "pay_JkL345pqr",
    status: "success",
    created_at: "2024-12-01T11:00:00",
    verified_at: "2024-12-01T11:02:00",
  },
  {
    id: "TXN006",
    user_name: "Amit Patel",
    user_email: "amit@example.com",
    amount: 300.0,
    method: "Card",
    razorpay_order_id: "order_BcD901pqr",
    razorpay_payment_id: "",
    status: "failed",
    created_at: "2024-11-30T18:45:00",
  },
]

export const getMockUserPurchases = (userId: string): PurchaseHistoryItem[] => {
  // Return subset of mock purchase history based on user
  if (userId === "user-1") {
    return mockPurchaseHistory.slice(0, 5)
  } else if (userId === "user-4") {
    return mockPurchaseHistory
  }
  return mockPurchaseHistory.slice(0, 3)
}
