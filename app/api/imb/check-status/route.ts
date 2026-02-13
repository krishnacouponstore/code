import { NextRequest, NextResponse } from "next/server"
import { GraphQLClient } from "graphql-request"
import { GET_TOPUP_BY_TRANSACTION_ID, UPDATE_TOPUP_STATUS, UPDATE_USER_WALLET } from "@/lib/graphql/topups"
import { mapIMBStatus, getPaymentMethodFromIMB } from "@/lib/imb-utils"

const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "tiujfdwdudfhfoqnzhxl"
const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION || "ap-south-1"
const GRAPHQL_ENDPOINT = `https://${NHOST_SUBDOMAIN}.hasura.${NHOST_REGION}.nhost.run/v1/graphql`

const IMB_API_TOKEN = process.env.IMB_API_TOKEN
const IMB_BASE_URL = process.env.IMB_BASE_URL || "https://secure-stage.imb.org.in"

function getAdminClient() {
  const adminSecret = process.env.NHOST_ADMIN_SECRET
  if (!adminSecret) {
    throw new Error("NHOST_ADMIN_SECRET is not set")
  }
  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: {
      "x-hasura-admin-secret": adminSecret,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    if (!IMB_API_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Payment gateway is not configured" },
        { status: 500 }
      )
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing order_id" }, { status: 400 })
    }

    console.log("Checking status for order:", orderId)

    // Call IMB Check Status API
    const imbPayload = new URLSearchParams({
      user_token: IMB_API_TOKEN,
      order_id: orderId,
    })

    const imbResponse = await fetch(`${IMB_BASE_URL}/api/check-order-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: imbPayload.toString(),
    })

    const imbData = await imbResponse.json()

    console.log("IMB Status Response:", {
      status: imbData.status,
      message: imbData.message,
    })

    // Get database client
    const client = getAdminClient()

    // Fetch the topup record
    const { topups }: any = await client.request(GET_TOPUP_BY_TRANSACTION_ID, {
      transactionId: orderId,
    })

    if (!topups || topups.length === 0) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 })
    }

    const topup = topups[0]

    // Map IMB status
    const mappedStatus = mapIMBStatus(imbData.result?.txnStatus || imbData.status)
    const paymentMethod = getPaymentMethodFromIMB(null)

    // Update topup status in database
    await client.request(UPDATE_TOPUP_STATUS, {
      transactionId: orderId,
      status: mappedStatus,
      imbOrderId: imbData.result?.orderId || orderId,
      imbUtr: imbData.result?.utr || null,
      imbTxnId: null,
      paymentMethod,
    })

    // If payment successful, credit wallet
    if (mappedStatus === "success" && topup.status !== "success") {
      await client.request(UPDATE_USER_WALLET, {
        userId: topup.user_id,
        amount: topup.amount,
      })

      console.log("Wallet credited for order:", orderId)
    }

    return NextResponse.json({
      success: true,
      data: {
        status: mappedStatus,
        amount: imbData.result?.amount || topup.amount,
        utr: imbData.result?.utr,
        message: imbData.message,
      },
    })
  } catch (error: any) {
    console.error("Error checking IMB status:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check status" },
      { status: 500 }
    )
  }
}
