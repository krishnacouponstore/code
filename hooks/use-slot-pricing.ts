import { useQuery } from "@tanstack/react-query"
import { getGraphQLClient } from "@/lib/graphql-client"
import { GET_SLOT_PRICING, type SlotPricing } from "@/lib/graphql/coupons"

export function useSlotPricing(slotId: string | null) {
  return useQuery({
    queryKey: ["slot-pricing", slotId],
    queryFn: async () => {
      if (!slotId) return null
      const client = getGraphQLClient()
      const result: { slots_by_pk: SlotPricing } = await client.request(GET_SLOT_PRICING, { slotId })
      return result.slots_by_pk
    },
    enabled: !!slotId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })
}
