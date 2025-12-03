import { GraphQLClient } from "graphql-request"
import { nhost } from "./nhost"

const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "tiujfdwdudfhfoqnzhxl"
const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION || "ap-south-1"

export function getGraphQLClient() {
  const token = nhost.auth.getAccessToken()
  return new GraphQLClient(`https://${NHOST_SUBDOMAIN}.hasura.${NHOST_REGION}.nhost.run/v1/graphql`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}
