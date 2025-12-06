"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAllUsers,
  getUserStats,
  adjustUserBalance,
  blockUser,
  unblockUser,
  deleteUser,
  sendPasswordResetEmail,
} from "@/app/actions/users"

export interface AdminUser {
  id: string
  email: string
  full_name: string
  phone: string | null
  wallet_balance: number
  is_blocked: boolean
  is_admin: boolean
  total_spent: number
  total_purchased: number
  total_orders: number
  created_at: string
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const result = await getAllUsers()
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch users")
      }
      return result.users as AdminUser[]
    },
    staleTime: 30000,
  })
}

export function useAdminUserStats() {
  return useQuery({
    queryKey: ["admin-user-stats"],
    queryFn: async () => {
      const result = await getUserStats()
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch stats")
      }
      return result.stats
    },
    staleTime: 30000,
  })
}

export function useAdjustBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      amount,
      type,
      reason,
    }: { userId: string; amount: number; type: "add" | "deduct"; reason: string }) => {
      const result = await adjustUserBalance(userId, amount, type, reason)
      if (!result.success) {
        throw new Error(result.error || "Failed to adjust balance")
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-user-stats"] })
    },
  })
}

export function useBlockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await blockUser(userId)
      if (!result.success) {
        throw new Error(result.error || "Failed to block user")
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-user-stats"] })
    },
  })
}

export function useUnblockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await unblockUser(userId)
      if (!result.success) {
        throw new Error(result.error || "Failed to unblock user")
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-user-stats"] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await deleteUser(userId)
      if (!result.success) {
        throw new Error(result.error || "Failed to delete user")
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-user-stats"] })
    },
  })
}

export function useSendPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const result = await sendPasswordResetEmail(email)
      if (!result.success) {
        throw new Error(result.error || "Failed to send password reset email")
      }
      return result
    },
  })
}
