"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserFavorites, addFavorite, removeFavorite } from "@/app/actions/favorites"
import { useAuth } from "@/lib/auth-context"

export function useFavorites() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const { data: favorites = [], isLoading } = useQuery({
        queryKey: ["favorites", user?.id],
        queryFn: async () => {
            if (!user?.id) return []
            const result = await getUserFavorites(user.id)
            if (!result.success) throw new Error(result.error)
            return result.data as { id: string; store_id: string }[]
        },
        enabled: !!user?.id
    })

    const addMutation = useMutation({
        mutationFn: async (storeId: string) => {
            if (!user?.id) throw new Error("User not logged in")
            return await addFavorite(user.id, storeId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["favorites"] })
        }
    })

    const removeMutation = useMutation({
        mutationFn: async (storeId: string) => {
            if (!user?.id) throw new Error("User not logged in")
            return await removeFavorite(user.id, storeId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["favorites"] })
        }
    })

    const isFavorite = (storeId: string) => {
        return favorites.some(f => f.store_id === storeId)
    }

    const toggleFavorite = async (storeId: string) => {
        if (isFavorite(storeId)) {
            await removeMutation.mutateAsync(storeId)
        } else {
            await addMutation.mutateAsync(storeId)
        }
    }

    return {
        favorites,
        isLoading,
        isFavorite,
        toggleFavorite,
        isToggling: addMutation.isPending || removeMutation.isPending
    }
}
