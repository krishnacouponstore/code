import { useQuery } from "@tanstack/react-query"
import { getGraphQLClient } from "@/lib/graphql-client"
import { GET_AVAILABLE_COUPONS, type AvailableCoupon } from "@/lib/graphql/coupons"

export function useAvailableCoupons() {
  return useQuery({
    queryKey: ["available-coupons"],
    queryFn: async () => {
      const client = getGraphQLClient()
      const result: { slots: AvailableCoupon[] } = await client.request(GET_AVAILABLE_COUPONS)
      return result.slots || []
    },
    refetchInterval: 30000,
  })
}
