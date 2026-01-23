"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllStores, createStore, updateStore, deleteStore, CreateStoreInput, UpdateStoreInput } from "@/app/actions/stores"
import { Store } from "./use-stores"

export interface AdminStore extends Store {
    status: string
    slug: string
    description: string
    created_at: string
}

export function useAdminStores() {
    return useQuery({
        queryKey: ["admin-stores"],
        queryFn: async () => {
            const result = await getAllStores()
            if (!result.success) throw new Error(result.error)
            return result.data as AdminStore[]
        }
    })
}

export function useCreateStore() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (input: CreateStoreInput) => {
            const result = await createStore(input)
            if (!result.success) throw new Error(result.error)
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-stores"] })
            queryClient.invalidateQueries({ queryKey: ["active-stores"] })
        }
    })
}

export function useUpdateStore() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (input: UpdateStoreInput) => {
            const result = await updateStore(input)
            if (!result.success) throw new Error(result.error)
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-stores"] })
            queryClient.invalidateQueries({ queryKey: ["active-stores"] })
        }
    })
}

export function useDeleteStore() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteStore(id)
            if (!result.success) throw new Error(result.error)
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-stores"] })
            queryClient.invalidateQueries({ queryKey: ["active-stores"] })
        }
    })
}