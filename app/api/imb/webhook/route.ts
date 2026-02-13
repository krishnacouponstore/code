import { NextRequest, NextResponse } from "next/server"
import { GraphQLClient } from "graphql-request"
import {
  GET_TOPUP_BY_TRANSACTION_ID,
  UPDATE_TOPUP_STATUS,
  UPDATE_USER_WALLET,
} from "@/lib/graphql/topups"
import { mapIMBStatus, getPaymentMethodFromIMB } from "@/lib/imb-utils"

const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "tiujfdwdudfhfoqnzhxl"
const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION || "ap-south-1"
const GRAPHQL_ENDPOINT = `https://${NHOST_SUBDOMAIN}.hasura.${NHOST_REGION}.nhost.run/v1/graphql`

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

interface IMBWebhookPayload {
  status: string
  order_id: string
  message: string
  result: {
    txnStatus: string
    resultInfo: string
    orderId: string
    status: string
    amount: number
    date: string
    utr: string
    customer_mobile: string
    remark1: string
    remark2: string
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== IMB Webhook Received ===")

    // Parse webhook payload
    const contentType = request.headers.get("content-type") || ""

    let webhookData: IMBWebhookPayload

    if (contentType.includes("application/json")) {
      webhookData = await request.json()
    } else {
      // Parse form-encoded data
      const formData = await request.text()
      const params = new URLSearchParams(formData)
      webhookData = {
        status: params.get("status") || "",
        order_id: params.get("order_id") || "",
        message: params.get("message") || "",
        result: {
          txnStatus: params.get("result[txnStatus]") || "",
          resultInfo: params.get("result[resultInfo]") || "",
          orderId: params.get("result[orderId]") || "",
          status: params.get("result[status]") || "",
          amount: parseFloat(params.get("result[amount]") || "0"),
          date: params.get("result[date]") || "",
          utr: params.get("result[utr]") || "",
          customer_mobile: params.get("result[customer_mobile]") || "",
          remark1: params.get("result[remark1]") || "",
          remark2: params.get("result[remark2]") || "",
        },
      }
    }

    console.log("Webhook Data:", {
      orderId: webhookData.order_id,
      status: webhookData.status,
      txnStatus: webhookData.result?.txnStatus,
      amount: webhookData.result?.amount,
    })

    const { order_id, status, result } = webhookData

    if (!order_id) {
      console.error("Missing order_id in webhook")
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 })
    }

    // Get database client
    const client = getAdminClient()

    // Fetch the topup record
    const { topups }: any = await client.request(GET_TOPUP_BY_TRANSACTION_ID, {
      transactionId: order_id,
    })

    if (!topups || topups.length === 0) {
      console.error("Topup not found for order_id:", order_id)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const topup = topups[0]

    // Check if already processed (idempotency)
    if (topup.status === "success" && topup.verified_at) {
      console.log("Transaction already processed:", order_id)
      return NextResponse.json({ message: "Already processed" }, { status: 200 })
    }

    // Map IMB status to our internal status
    const mappedStatus = mapIMBStatus(result.txnStatus || status)
    const paymentMethod = getPaymentMethodFromIMB(null) // IMB doesn't send payment mode in webhook

    console.log("Updating transaction status:", {
      orderId: order_id,
      mappedStatus,
      amount: topup.amount,
    })

    // Update topup status
    await client.request(UPDATE_TOPUP_STATUS, {
      transactionId: order_id,
      status: mappedStatus,
      imbOrderId: result.orderId || order_id,
      imbUtr: result.utr || null,
      imbTxnId: null, // IMB doesn't provide transaction ID in webhook
      paymentMethod,
    })

    // If payment successful, credit wallet
    if (mappedStatus === "success") {
      console.log("Payment successful, crediting wallet:", {
        userId: topup.user_id,
        amount: topup.amount,
      })

      await client.request(UPDATE_USER_WALLET, {
        userId: topup.user_id,
        amount: topup.amount,
      })

      console.log("Wallet credited successfully")
    }

    console.log("=== Webhook Processed Successfully ===")

    // Return success response to IMB
    return NextResponse.json({ message: "Success" }, { status: 200 })
  } catch (error: any) {
    console.error("Error processing IMB webhook:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
