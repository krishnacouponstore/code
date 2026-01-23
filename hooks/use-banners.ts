import { useQuery } from "@tanstack/react-query"
import { getActiveBanners } from "@/app/actions/banners"

export type Banner = {
  id: string
  brand_name: string
  primary_color: string
  background_image_url?: string
  is_badge_visible: boolean
  badge_text?: string
  badge_icon?: string
  title_line_1: string
  title_line_2: string
  description: string
  button_text: string
  button_url?: string
  offer_main_text: string
  offer_sub_text: string
  icon_mode: "icon" | "image"
  card_icon_class?: string
  icon_url_light?: string
  icon_url_dark?: string
  is_active: boolean
  sort_order: number
}

export function useBanners() {
  return useQuery({
    queryKey: ["banners", "active"],
    queryFn: async () => {
      const response = await getActiveBanners()
      if (response.success) {
        return response.data as Banner[]
      }
      return []
    },
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000, 
  })
}
