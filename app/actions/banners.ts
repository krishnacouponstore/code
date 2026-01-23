"use server"

import { getAdminGraphQLClient } from "@/lib/graphql-client-server"
import { 
    GET_ALL_BANNERS,
    GET_ACTIVE_BANNERS,
    CREATE_BANNER, 
    UPDATE_BANNER,
    DELETE_BANNER, 
    UPDATE_BANNER_STATUS 
} from "@/lib/graphql/banners"
import { revalidatePath } from "next/cache"

export async function getBanners() {
    const client = getAdminGraphQLClient()
    try {
        const data = await client.request(GET_ALL_BANNERS)
        // @ts-ignore - graphQL typings are loose here
        return { success: true, data: data.banners }
    } catch (error) {
        console.error("Failed to fetch banners:", error)
        return { success: false, error: "Failed to fetch banners" }
    }
}

export async function getActiveBanners() {
    const client = getAdminGraphQLClient()
    try {
        const data = await client.request(GET_ACTIVE_BANNERS)
        // @ts-ignore
        return { success: true, data: data.banners }
    } catch (error) {
        console.error("Failed to fetch active banners:", error)
        return { success: false, error: "Failed to fetch active banners" }
    }
}

export async function createBanner(bannerData: any) {
    const client = getAdminGraphQLClient()
    try {
        await client.request(CREATE_BANNER, { object: bannerData })
        revalidatePath('/admin/banner')
        revalidatePath('/banner') // Where the banners are shown
        return { success: true }
    } catch (error) {
        console.error("Failed to create banner:", error)
        return { success: false, error: "Failed to create banner" }
    }
}

export async function updateBanner(id: string, bannerData: any) {
    const client = getAdminGraphQLClient()
    try {
        await client.request(UPDATE_BANNER, { id, object: bannerData })
        revalidatePath('/admin/banner')
        revalidatePath('/banner')
        return { success: true }
    } catch (error) {
        console.error("Failed to update banner:", error)
        return { success: false, error: "Failed to update banner" }
    }
}

export async function deleteBanner(id: string) {
    const client = getAdminGraphQLClient()
    try {
        await client.request(DELETE_BANNER, { id })
        revalidatePath('/admin/banner')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete banner:", error)
        return { success: false, error: "Failed to delete banner" }
    }
}

export async function toggleBannerStatus(id: string, isActive: boolean) {
    const client = getAdminGraphQLClient()
    try {
        await client.request(UPDATE_BANNER_STATUS, { id, is_active: isActive })
        revalidatePath('/admin/banner')
        return { success: true }
    } catch (error) {
        console.error("Failed to update banner status:", error)
        return { success: false, error: "Failed to update banner status" }
    }
}
