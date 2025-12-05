import { GraphQLClient } from "graphql-request"
import { nhost } from "./nhost"

const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "tiujfdwdudfhfoqnzhxl"
const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION || "ap-south-1"
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET || "b%$=u(i'FPeG9hGIhasTLkdcYz5c'7vr"

const GRAPHQL_ENDPOINT = `https://${NHOST_SUBDOMAIN}.hasura.${NHOST_REGION}.nhost.run/v1/graphql`

// Client with user's auth token
export function getGraphQLClient() {
  const token = nhost.auth.getAccessToken()
  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}

// Admin client with admin secret - for server-side operations
export function getAdminGraphQLClient() {
  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: {
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
  })
}
