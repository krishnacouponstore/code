import { useQuery } from "@tanstack/react-query"
import { getActiveStores } from "@/app/actions/stores"

export type StoreTag = {
    value: string
    color: string
    tag_icon?: string
}

export type Store = {
    id: string
    name: string
    slug: string
    category: string
    logo_url: string
    theme_color?: string
    store_tags: StoreTag[]
    slots_aggregate: {
        aggregate: {
            count: number
        }
    }
}

export function useStores() {
    return useQuery({
        queryKey: ["active-stores"],
        queryFn: async () => {
            const result = await getActiveStores()
            if (!result.success) throw new Error(result.error)
            return result.data as Store[]
        },
        staleTime: 5 * 60 * 1000,
    })
}
