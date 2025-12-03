"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SlotCard } from "@/components/coupons/slot-card"
import { PurchaseModal } from "@/components/coupons/purchase-modal"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockSlots, mockSlotDetails, mockUser, type SlotDetail } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { Search, PackageX } from "lucide-react"

type SortOption = "stock-high" | "stock-low" | "price-high" | "price-low" | "name-asc" | "name-desc"

export default function CouponsPage() {
  const { user, isAuthenticated, isLoading, isLoggingOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("stock-high")
  const [selectedSlot, setSelectedSlot] = useState<SlotDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (isLoggingOut) return

    if (!isLoading && !isAuthenticated) {
      router.push(`/signup?redirect=${encodeURIComponent(pathname)}`)
    }
    if (!isLoading && user?.is_admin) {
      router.push("/admin/dashboard")
    }
  }, [isAuthenticated, isLoading, router, pathname, isLoggingOut, user])

  const filteredAndSortedSlots = useMemo(() => {
    let slots = mockSlots.filter((slot) => slot.is_published)

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      slots = slots.filter(
        (slot) => slot.name.toLowerCase().includes(query) || slot.description.toLowerCase().includes(query),
      )
    }

    // Sort slots
    slots.sort((a, b) => {
      switch (sortBy) {
        case "stock-high":
          return b.available_stock - a.available_stock
        case "stock-low":
          return a.available_stock - b.available_stock
        case "price-high":
          return b.starting_price - a.starting_price
        case "price-low":
          return a.starting_price - b.starting_price
        case "name-asc":
          return a.name.localeCompare(b.name)
        case "name-desc":
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })

    return slots
  }, [searchQuery, sortBy])

  const handleCheckPricing = (slotId: string) => {
    const slotDetail = mockSlotDetails[slotId]
    if (slotDetail) {
      setSelectedSlot(slotDetail)
      setIsModalOpen(true)
    }
  }

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const currentUser = user.is_admin ? user : mockUser

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        walletBalance={currentUser.wallet_balance}
        userName={currentUser.name}
        userEmail={currentUser.email}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Available Coupons</h1>
            <p className="text-muted-foreground mt-1">Browse and purchase coupon codes instantly</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search coupons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64 bg-secondary border-[hsl(200,15%,20%)] rounded-full"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-full sm:w-48 bg-secondary border-[hsl(200,15%,20%)] rounded-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-card border-[hsl(200,15%,20%)]">
                <SelectItem value="stock-high">Stock: High to Low</SelectItem>
                <SelectItem value="stock-low">Stock: Low to High</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Slots Grid or Empty State */}
        {filteredAndSortedSlots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedSlots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} onCheckPricing={() => handleCheckPricing(slot.id)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
              <PackageX className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No coupons available right now</h2>
            <p className="text-muted-foreground max-w-md">
              {searchQuery
                ? `No coupons found matching "${searchQuery}". Try a different search term.`
                : "Check back later for new deals"}
            </p>
          </div>
        )}
      </main>

      <PurchaseModal slot={selectedSlot} open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
