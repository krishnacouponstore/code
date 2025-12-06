"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getRevenueStats,
  getTransactions,
  updateTransactionStatus,
  refundTransaction,
  type Transaction,
  type RevenueStats,
} from "@/app/actions/transactions"

export type { Transaction, RevenueStats }

export function useRevenueStats(dateRange?: string) {
  return useQuery<RevenueStats>({
    queryKey: ["revenue-stats", dateRange],
    queryFn: () => getRevenueStats(dateRange),
    refetchInterval: 30000,
  })
}

export function useTransactions(params: {
  page: number
  pageSize: number
  search?: string
  status?: string
  method?: string
  sortBy?: string
  dateRange?: string
}) {
  return useQuery({
    queryKey: ["admin-transactions", params],
    queryFn: () => getTransactions(params),
    placeholderData: (prev) => prev,
  })
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "success" | "failed" }) => updateTransactionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] })
      queryClient.invalidateQueries({ queryKey: ["revenue-stats"] })
    },
  })
}

export function useRefundTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, userId, amount }: { id: string; userId: string; amount: number }) =>
      refundTransaction(id, userId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] })
      queryClient.invalidateQueries({ queryKey: ["revenue-stats"] })
    },
  })
}
