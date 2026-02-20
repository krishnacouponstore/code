"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const graphql_request_1 = require("graphql-request");
const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "tiujfdwdudfhfoqnzhxl";
const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION || "ap-south-1";
const GRAPHQL_ENDPOINT = `https://${NHOST_SUBDOMAIN}.hasura.${NHOST_REGION}.nhost.run/v1/graphql`;
const CREATE_TOPUP = `
  mutation CreateTopup($userId: uuid!, $amount: numeric!, $transactionId: String!) {
    insert_topups_one(object: {
      user_id: $userId,
      amount: $amount,
      transaction_id: $transactionId,
      status: "pending",
      payment_method: "UPI",
      platform: "telegrambot"
    }) {
      id
      transaction_id
    }
  }
`;
const CHECK_TOPUP_STATUS = `
  query CheckTopupStatus($transactionId: String!) {
    topups(where: { transaction_id: { _eq: $transactionId } }) {
      id
      status
      amount
      user_id
    }
  }
`;
function getGraphQLClient() {
    const adminSecret = process.env.NHOST_ADMIN_SECRET;
    if (!adminSecret)
        throw new Error("NHOST_ADMIN_SECRET is not set");
    return new graphql_request_1.GraphQLClient(GRAPHQL_ENDPOINT, {
        headers: { "x-hasura-admin-secret": adminSecret },
    });
}
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `COUPXBOT${timestamp}${random}`;
}
class PaymentService {
    /**
     * Create IMB payment order - calls IMB API directly (no Next.js middleware needed)
     */
    async createPaymentOrder(userId, amount, customerMobile, customerEmail) {
        try {
            const IMB_API_TOKEN = process.env.IMB_API_TOKEN;
            const IMB_BASE_URL = (process.env.IMB_BASE_URL || "https://secure-stage.imb.org.in").replace(/\/$/, "");
            if (!IMB_API_TOKEN) {
                return { success: false, error: "Payment gateway not configured" };
            }
            const orderId = generateOrderId();
            // Save topup record in Nhost database
            try {
                const client = getGraphQLClient();
                await client.request(CREATE_TOPUP, {
                    userId,
                    amount,
                    transactionId: orderId,
                });
            }
            catch (dbError) {
                console.error("Failed to create topup record:", dbError);
                return { success: false, error: "Failed to create payment record" };
            }
            // Call IMB API directly
            const payload = new URLSearchParams({
                customer_mobile: customerMobile,
                user_token: IMB_API_TOKEN,
                amount: amount.toString(),
                order_id: orderId,
                redirect_url: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME || 'coupxbot'}?start=paid_${orderId}`,
                remark1: customerEmail || "",
                remark2: "Wallet topup - CoupX Bot",
            });
            const imbResponse = await fetch(`${IMB_BASE_URL}/api/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: payload.toString(),
            });
            const imbData = await imbResponse.json();
            if (!imbData.status || imbData.status === "false" || imbData.status === false) {
                console.error("IMB API error:", imbData.message);
                return { success: false, error: imbData.message || "Failed to create payment order" };
            }
            console.log(` Payment order created: ${orderId} for ₹${amount}`);
            return {
                success: true,
                data: {
                    orderId,
                    paymentUrl: imbData.result?.payment_url,
                },
            };
        }
        catch (error) {
            console.error("Error creating payment order:", error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Check payment status via IMB API directly
     */
    async checkPaymentStatus(orderId) {
        try {
            const IMB_API_TOKEN = process.env.IMB_API_TOKEN;
            const IMB_BASE_URL = (process.env.IMB_BASE_URL || "https://secure-stage.imb.org.in").replace(/\/$/, "");
            if (!IMB_API_TOKEN) {
                return { success: false, error: "Payment gateway not configured" };
            }
            const payload = new URLSearchParams({
                user_token: IMB_API_TOKEN,
                order_id: orderId,
            });
            const response = await fetch(`${IMB_BASE_URL}/api/check-order-status`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: payload.toString(),
            });
            const data = await response.json();
            const txnStatus = data.status || data.result?.txnStatus || "";
            const isSuccess = ["COMPLETED", "SUCCESS", "success"].includes(txnStatus);
            const isFailed = ["FAILED", "ERROR", "FAILD"].includes(txnStatus);
            return {
                success: true,
                status: isSuccess ? "success" : isFailed ? "failed" : "pending",
                utr: data.result?.utr?.toString(),
            };
        }
        catch (error) {
            console.error("Error checking payment status:", error);
            return { success: false, error: error.message };
        }
    }
}
exports.PaymentService = PaymentService;
