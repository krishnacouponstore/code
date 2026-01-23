"use server"

import { getAdminGraphQLClient } from "@/lib/graphql-client-server"
import { GET_USER_FAVORITES, ADD_FAVORITE, REMOVE_FAVORITE } from "@/lib/graphql/favorites"

export async function getUserFavorites(userId: string) {
    const client = getAdminGraphQLClient()
    try {
        const data = await client.request(GET_USER_FAVORITES, { userId })
        // @ts-ignore
        return { success: true, data: data.user_favorite_stores }
    } catch (error) {
        console.error("Failed to fetch favorites:", error)
        return { success: false, error: "Failed to fetch favorites" }
    }
}

export async function addFavorite(userId: string, storeId: string) {
    const client = getAdminGraphQLClient()
    try {
        const data = await client.request(ADD_FAVORITE, { userId, storeId })
        return { success: true, data }
    } catch (error) {
        console.error("Failed to add favorite:", error)
        return { success: false, error: "Failed to add favorite" }
    }
}

export async function removeFavorite(userId: string, storeId: string) {
    const client = getAdminGraphQLClient()
    try {
        const data = await client.request(REMOVE_FAVORITE, { userId, storeId })
        return { success: true, data }
    } catch (error) {
        console.error("Failed to remove favorite:", error)
        return { success: false, error: "Failed to remove favorite" }
    }
}
