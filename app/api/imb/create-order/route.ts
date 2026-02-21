import { NextRequest, NextResponse } from "next/server"
import { GraphQLClient } from "graphql-request"
import { CREATE_TOPUP } from "@/lib/graphql/topups"
import { generateIMBOrderId, validateAmount, validatePhoneNumber, formatPhoneNumber } from "@/lib/imb-utils"

const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "tiujfdwdudfhfoqnzhxl"
const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION || "ap-south-1"
const GRAPHQL_ENDPOINT = `https://${NHOST_SUBDOMAIN}.hasura.${NHOST_REGION}.nhost.run/v1/graphql`

const IMB_API_TOKEN = process.env.IMB_API_TOKEN
const IMB_BASE_URL = process.env.IMB_BASE_URL || "https://secure-stage.imb.org.in"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://coupx.in"

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

interface CreateOrderRequest {
  userId: string
  amount: number
  customerMobile: string
  customerEmail: string
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!IMB_API_TOKEN) {
      console.error("IMB_API_TOKEN is not configured")
      return NextResponse.json(
        { success: false, error: "Payment gateway is not configured. Please contact support." },
        { status: 500 }
      )
    }

    // Parse request body
    const body: CreateOrderRequest = await request.json()
    const { userId, amount, customerMobile, customerEmail } = body

    // Validate required fields
    if (!userId || !amount || !customerMobile) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate amount
    const amountValidation = validateAmount(amount)
    if (!amountValidation.valid) {
      return NextResponse.json(
        { success: false, error: amountValidation.error },
        { status: 400 }
      )
    }

    // Validate phone number
    if (!validatePhoneNumber(customerMobile)) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number. Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(customerMobile)

    // Generate unique order ID
    const orderId = generateIMBOrderId()

    // Create topup record in database
    const client = getAdminClient()
    try {
      await client.request(CREATE_TOPUP, {
        userId,
        amount,
        transactionId: orderId,
        platform: "website",
      })
    } catch (dbError: any) {
      console.error("Database error creating topup:", dbError)
      return NextResponse.json(
        { success: false, error: "Failed to create payment record. Please try again." },
        { status: 500 }
      )
    }

    // Prepare IMB API request
    const imbPayload = new URLSearchParams({
      customer_mobile: formattedPhone,
      user_token: IMB_API_TOKEN,
      amount: amount.toString(),
      order_id: orderId,
      redirect_url: `${SITE_URL}/payment/processing?order_id=${orderId}`,
      remark1: customerEmail || "",
      remark2: `Wallet topup - CoupX`,
    })

    console.log("Calling IMB API to create order:", orderId)

    // Call IMB Create Order API
    const imbResponse = await fetch(`${IMB_BASE_URL}/api/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: imbPayload.toString(),
    })

    const imbData = await imbResponse.json()

    console.log("IMB API Response:", {
      status: imbResponse.status,
      success: imbData.status,
      message: imbData.message,
    })

    // Check if IMB API call was successful
    if (!imbData.status || imbData.status === "false" || imbData.status === false) {
      console.error("IMB API error:", imbData.message)
      return NextResponse.json(
        {
          success: false,
          error: imbData.message || "Failed to create payment order. Please try again.",
        },
        { status: 400 }
      )
    }

    // Return payment URL to frontend
    return NextResponse.json({
      success: true,
      data: {
        orderId,
        paymentUrl: imbData.result?.payment_url,
        checkLink: imbData.result?.check_link,
      },
    })
  } catch (error: any) {
    console.error("Error in create-order API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    )
  }
}
