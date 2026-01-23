"use server"

import { getAdminGraphQLClient } from "@/lib/graphql-client-server"
import { 
    GET_ACTIVE_STORES, 
    GET_ALL_STORES,
    CREATE_STORE,
    UPDATE_STORE,
    DELETE_STORE,
    INSERT_STORE_TAGS,
    DELETE_STORE_TAGS
} from "@/lib/graphql/stores"

export type StoreTagInput = {
    value: string
    color: string
    tag_icon?: string
}

export type CreateStoreInput = {
    name: string
    slug: string
    description: string
    logo_url: string
    theme_color: string
    category: string
    status: string
    store_tags: StoreTagInput[]
}

export type UpdateStoreInput = {
    id: string
    name: string
    slug: string
    description: string
    logo_url: string
    theme_color: string
    category: string
    status: string
    store_tags: StoreTagInput[]
}

export async function getActiveStores() {
    const client = getAdminGraphQLClient()
    try {
        const data = await client.request(GET_ACTIVE_STORES)
        // @ts-ignore
        return { success: true, data: data.stores }
    } catch (error) {
        console.error("Failed to fetch active stores:", error)
        return { success: false, error: "Failed to fetch active stores" }
    }
}

export async function getAllStores() {
    const client = getAdminGraphQLClient()
    try {
        const data = await client.request(GET_ALL_STORES)
        // @ts-ignore
        return { success: true, data: data.stores }
    } catch (error) {
        console.error("Failed to fetch all stores:", error)
        return { success: false, error: "Failed to fetch all stores" }
    }
}

export async function createStore(input: CreateStoreInput) {
    const client = getAdminGraphQLClient()
    try {
        // 1. Create Store
        const storeResult: any = await client.request(CREATE_STORE, {
            object: {
                name: input.name,
                slug: input.slug,
                description: input.description,
                logo_url: input.logo_url,
                theme_color: input.theme_color,
                category: input.category,
                status: input.status
            }
        })
        const storeId = storeResult.insert_stores_one.id

        // 2. Insert Tags
        if (input.store_tags.length > 0) {
            await client.request(INSERT_STORE_TAGS, {
                objects: input.store_tags.map(tag => ({
                    store_id: storeId,
                    value: tag.value,
                    color: tag.color,
                    tag_icon: tag.tag_icon
                }))
            })
        }

        return { success: true, data: storeResult.insert_stores_one }
    } catch (error: any) {
        console.error("Failed to create store:", error)
        return { success: false, error: error.message || "Failed to create store" }
    }
}

export async function updateStore(input: UpdateStoreInput) {
    const client = getAdminGraphQLClient()
    try {
        // 1. Update Store
        const storeResult: any = await client.request(UPDATE_STORE, {
            id: input.id,
            data: {
                name: input.name,
                slug: input.slug,
                description: input.description,
                logo_url: input.logo_url,
                theme_color: input.theme_color,
                category: input.category,
                status: input.status,
                updated_at: new Date().toISOString()
            }
        })

        // 2. Replace Tags (Delete all, then Insert new)
        await client.request(DELETE_STORE_TAGS, { store_id: input.id })

        if (input.store_tags.length > 0) {
            await client.request(INSERT_STORE_TAGS, {
                objects: input.store_tags.map(tag => ({
                    store_id: input.id,
                    value: tag.value,
                    color: tag.color,
                    tag_icon: tag.tag_icon
                }))
            })
        }

        return { success: true, data: storeResult.update_stores_by_pk }
    } catch (error: any) {
        console.error("Failed to update store:", error)
        return { success: false, error: error.message || "Failed to update store" }
    }
}

export async function deleteStore(id: string) {
    const client = getAdminGraphQLClient()
    try {
        await client.request(DELETE_STORE, { id })
        return { success: true }
    } catch (error: any) {
        console.error("Failed to delete store:", error)
        return { success: false, error: error.message || "Failed to delete store" }
    }
}
