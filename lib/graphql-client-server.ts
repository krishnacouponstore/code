import { GraphQLClient } from "graphql-request"

const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "tiujfdwdudfhfoqnzhxl"
const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION || "ap-south-1"

const GRAPHQL_ENDPOINT = `https://${NHOST_SUBDOMAIN}.hasura.${NHOST_REGION}.nhost.run/v1/graphql`

// Admin client with admin secret - for server-side operations ONLY
// This file has NO client-side dependencies
export function getAdminGraphQLClient() {
  const adminSecret = process.env.NHOST_ADMIN_SECRET

  if (!adminSecret) {
    throw new Error("Server configuration error: NHOST_ADMIN_SECRET is not set")
  }

  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: {
      "x-hasura-admin-secret": adminSecret,
    },
  })
}

export const getServerGraphQLClient = getAdminGraphQLClient
