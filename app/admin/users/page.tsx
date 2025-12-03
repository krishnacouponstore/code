"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminHeader } from "@/components/admin/admin-header"
import { UserPurchaseHistoryModal } from "@/components/admin/user-purchase-history-modal"
import { AdjustBalanceModal } from "@/components/admin/adjust-balance-modal"
import { BlockUserDialog } from "@/components/admin/block-user-dialog"
import { UnblockUserDialog } from "@/components/admin/unblock-user-dialog"
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { mockAdminUsers, mockUserStats, getMockUserPurchases, type AdminUser } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Search,
  MoreVertical,
  History,
  Wallet,
  Ban,
  Trash2,
  Shield,
  Trophy,
  ArrowUpRight,
} from "lucide-react"

export default function UsersManagementPage() {
  const { user, isLoading: authLoading, isLoggingOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [users, setUsers] = useState<AdminUser[]>(mockAdminUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "spent" | "purchases">("newest")

  // Modal states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState(false)
  const [isAdjustBalanceOpen, setIsAdjustBalanceOpen] = useState(false)
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (isLoggingOut) return
    if (!authLoading && (!user || !user.is_admin)) {
      router.replace("/login")
    }
  }, [user, authLoading, router, isLoggingOut])

  // Calculate stats from actual users
  const stats = useMemo(() => {
    const activeUsers = users.filter((u) => !u.is_blocked).length
    const blockedUsers = users.filter((u) => u.is_blocked).length
    return {
      total: mockUserStats.total_users,
      active: mockUserStats.active_users,
      blocked: mockUserStats.blocked_users,
      newThisMonth: mockUserStats.new_this_month,
      newThisWeek: mockUserStats.new_this_week,
    }
  }, [users])

  // Find top buyer
  const topBuyerId = useMemo(() => {
    const sorted = [...users].sort((a, b) => b.total_purchased - a.total_purchased)
    return sorted[0]?.id
  }, [users])

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let result = [...users]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (u) =>
          u.full_name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.phone && u.phone.toLowerCase().includes(query)),
      )
    }

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((u) => !u.is_blocked)
    } else if (statusFilter === "blocked") {
      result = result.filter((u) => u.is_blocked)
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "spent":
        result.sort((a, b) => b.total_spent - a.total_spent)
        break
      case "purchases":
        result.sort((a, b) => b.total_purchased - a.total_purchased)
        break
    }

    return result
  }, [users, searchQuery, statusFilter, sortBy])

  if (authLoading || !user?.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const handleViewPurchaseHistory = (u: AdminUser) => {
    setSelectedUser(u)
    setIsPurchaseHistoryOpen(true)
  }

  const handleAdjustBalance = (u: AdminUser) => {
    setSelectedUser(u)
    setIsAdjustBalanceOpen(true)
  }

  const handleBlockUser = (u: AdminUser) => {
    setSelectedUser(u)
    setIsBlockDialogOpen(true)
  }

  const handleUnblockUser = (u: AdminUser) => {
    setSelectedUser(u)
    setIsUnblockDialogOpen(true)
  }

  const handleDeleteUser = (u: AdminUser) => {
    setSelectedUser(u)
    setIsDeleteDialogOpen(true)
  }

  const confirmBlock = () => {
    if (selectedUser) {
      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, is_blocked: true } : u)))
      toast({
        title: "User blocked",
        description: `${selectedUser.full_name} has been blocked.`,
      })
      setIsBlockDialogOpen(false)
    }
  }

  const confirmUnblock = () => {
    if (selectedUser) {
      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, is_blocked: false } : u)))
      toast({
        title: "User unblocked",
        description: `${selectedUser.full_name} can now login and make purchases.`,
      })
      setIsUnblockDialogOpen(false)
    }
  }

  const confirmDelete = () => {
    if (selectedUser) {
      setUsers(users.filter((u) => u.id !== selectedUser.id))
      toast({
        title: "User deleted",
        description: `${selectedUser.full_name} has been permanently deleted.`,
        variant: "destructive",
      })
    }
  }

  const confirmAdjustBalance = (userId: string, amount: number, type: "add" | "deduct", reason: string) => {
    setUsers(
      users.map((u) =>
        u.id === userId
          ? {
              ...u,
              wallet_balance: type === "add" ? u.wallet_balance + amount : Math.max(0, u.wallet_balance - amount),
            }
          : u,
      ),
    )
    toast({
      title: "Balance adjusted",
      description: `${type === "add" ? "Added" : "Deducted"} ${formatCurrency(amount)} ${
        type === "add" ? "to" : "from"
      } ${selectedUser?.full_name}'s wallet.`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Users Management</h1>
          <p className="text-muted-foreground mt-1">View and manage registered users</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
            <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />+{stats.newThisWeek} this week
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round((stats.active / stats.total) * 100)}% of total
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <UserX className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.blocked}</p>
                <p className="text-sm text-muted-foreground">Blocked</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round((stats.blocked / stats.total) * 100)}% of total
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.newThisMonth}</p>
                <p className="text-sm text-muted-foreground">New Users</p>
              </div>
            </div>
            <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              +15% from last month
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border text-foreground"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[140px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[160px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="spent">Spent High to Low</SelectItem>
                <SelectItem value="purchases">Most Purchases</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Users Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Users will appear here once they sign up"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground">Phone</TableHead>
                    <TableHead className="text-muted-foreground">Wallet</TableHead>
                    <TableHead className="text-muted-foreground">Total Spent</TableHead>
                    <TableHead className="text-muted-foreground">Purchases</TableHead>
                    <TableHead className="text-muted-foreground">Joined</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className="border-border hover:bg-secondary/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-foreground flex items-center gap-2">
                              {u.full_name}
                              {u.is_admin && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-yellow-500/10 text-yellow-500">
                                  <Shield className="h-3 w-3" />
                                  Admin
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {u.phone || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-foreground font-medium">{formatCurrency(u.wallet_balance)}</TableCell>
                      <TableCell className="text-foreground">{formatCurrency(u.total_spent)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{u.total_purchased}</span>
                          {u.id === topBuyerId && u.total_purchased > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-yellow-500/10 text-yellow-500">
                              <Trophy className="h-3 w-3" />
                              Top Buyer
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(u.created_at)}</TableCell>
                      <TableCell>
                        {u.is_blocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                            Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border w-48">
                            <DropdownMenuItem onClick={() => handleViewPurchaseHistory(u)} className="cursor-pointer">
                              <History className="mr-2 h-4 w-4" />
                              View Purchase History
                            </DropdownMenuItem>
                            {!u.is_admin && (
                              <>
                                <DropdownMenuItem onClick={() => handleAdjustBalance(u)} className="cursor-pointer">
                                  <Wallet className="mr-2 h-4 w-4" />
                                  Adjust Balance
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                {u.is_blocked ? (
                                  <DropdownMenuItem
                                    onClick={() => handleUnblockUser(u)}
                                    className="cursor-pointer text-green-500 focus:text-green-500"
                                  >
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Unblock User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleBlockUser(u)}
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Block User
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(u)}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredUsers.map((u) => (
                <div key={u.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        {u.full_name}
                        {u.is_admin && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-yellow-500/10 text-yellow-500">
                            <Shield className="h-3 w-3" />
                          </span>
                        )}
                        {u.id === topBuyerId && u.total_purchased > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-yellow-500/10 text-yellow-500">
                            <Trophy className="h-3 w-3" />
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.is_blocked ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                          Blocked
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          Active
                        </span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border w-48">
                          <DropdownMenuItem onClick={() => handleViewPurchaseHistory(u)} className="cursor-pointer">
                            <History className="mr-2 h-4 w-4" />
                            View History
                          </DropdownMenuItem>
                          {!u.is_admin && (
                            <>
                              <DropdownMenuItem onClick={() => handleAdjustBalance(u)} className="cursor-pointer">
                                <Wallet className="mr-2 h-4 w-4" />
                                Adjust Balance
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border" />
                              {u.is_blocked ? (
                                <DropdownMenuItem
                                  onClick={() => handleUnblockUser(u)}
                                  className="cursor-pointer text-green-500"
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Unblock
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleBlockUser(u)}
                                  className="cursor-pointer text-destructive"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Block
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(u)}
                                className="cursor-pointer text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Wallet</p>
                      <p className="text-foreground font-medium">{formatCurrency(u.wallet_balance)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Spent</p>
                      <p className="text-foreground">{formatCurrency(u.total_spent)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Purchases</p>
                      <p className="text-foreground">{u.total_purchased} coupons</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Joined</p>
                      <p className="text-foreground">{formatDate(u.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Info */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      <UserPurchaseHistoryModal
        open={isPurchaseHistoryOpen}
        onOpenChange={setIsPurchaseHistoryOpen}
        user={selectedUser}
        purchases={selectedUser ? getMockUserPurchases(selectedUser.id) : []}
      />

      <AdjustBalanceModal
        open={isAdjustBalanceOpen}
        onOpenChange={setIsAdjustBalanceOpen}
        user={selectedUser}
        onConfirm={confirmAdjustBalance}
      />

      <BlockUserDialog
        open={isBlockDialogOpen}
        onOpenChange={setIsBlockDialogOpen}
        user={selectedUser}
        onConfirm={confirmBlock}
      />

      <UnblockUserDialog
        open={isUnblockDialogOpen}
        onOpenChange={setIsUnblockDialogOpen}
        user={selectedUser}
        onConfirm={confirmUnblock}
      />

      <DeleteUserDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={selectedUser}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
