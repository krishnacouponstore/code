"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const graphql_request_1 = require("graphql-request");
const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "tiujfdwdudfhfoqnzhxl";
const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION || "ap-south-1";
const GRAPHQL_ENDPOINT = `https://${NHOST_SUBDOMAIN}.hasura.${NHOST_REGION}.nhost.run/v1/graphql`;
// Fetch wrapper that aborts requests after 10 seconds
function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}
class DatabaseService {
    constructor() {
        const adminSecret = process.env.NHOST_ADMIN_SECRET;
        if (!adminSecret) {
            throw new Error("NHOST_ADMIN_SECRET is required for bot");
        }
        this.client = new graphql_request_1.GraphQLClient(GRAPHQL_ENDPOINT, {
            headers: {
                "x-hasura-admin-secret": adminSecret,
            },
            fetch: fetchWithTimeout,
        });
    }
    // ============================================
    // User Management
    // ============================================
    async getUserByTelegramId(telegramId) {
        const query = (0, graphql_request_1.gql) `
      query GetUserByTelegramId($telegramId: String!) {
        user_profiles(where: { telegram_id: { _eq: $telegramId } }) {
          id
          user {
            email
            displayName
          }
          wallet_balance
          total_spent
          telegram_id
        }
      }
    `;
        try {
            const data = await this.client.request(query, {
                telegramId: telegramId.toString(),
            });
            if (data.user_profiles.length === 0)
                return null;
            const profile = data.user_profiles[0];
            return {
                id: profile.id,
                email: profile.user.email,
                name: profile.user.displayName || "User",
                wallet_balance: profile.wallet_balance || 0,
                total_spent: profile.total_spent || 0,
                telegram_id: profile.telegram_id,
            };
        }
        catch (error) {
            console.error("Error fetching user by telegram ID:", error);
            return null;
        }
    }
    async getUserByEmail(email) {
        const query = (0, graphql_request_1.gql) `
      query GetUserByEmail($email: citext!) {
        user_profiles(where: { user: { email: { _eq: $email } } }) {
          id
          user {
            email
            displayName
          }
          wallet_balance
          total_spent
          telegram_id
        }
      }
    `;
        try {
            const data = await this.client.request(query, { email });
            if (data.user_profiles.length === 0)
                return null;
            const profile = data.user_profiles[0];
            return {
                id: profile.id,
                email: profile.user.email,
                name: profile.user.displayName || "User",
                wallet_balance: profile.wallet_balance || 0,
                total_spent: profile.total_spent || 0,
                telegram_id: profile.telegram_id,
            };
        }
        catch (error) {
            console.error("Error fetching user by email:", error);
            return null;
        }
    }
    async getUserById(userId) {
        const query = (0, graphql_request_1.gql) `
      query GetUserById($userId: uuid!) {
        user_profiles_by_pk(id: $userId) {
          id
          user {
            email
            displayName
          }
          wallet_balance
          total_spent
          telegram_id
        }
      }
    `;
        try {
            const data = await this.client.request(query, { userId });
            if (!data.user_profiles_by_pk)
                return null;
            const profile = data.user_profiles_by_pk;
            return {
                id: profile.id,
                email: profile.user.email,
                name: profile.user.displayName || "User",
                wallet_balance: profile.wallet_balance || 0,
                total_spent: profile.total_spent || 0,
                telegram_id: profile.telegram_id,
            };
        }
        catch (error) {
            console.error("Error fetching user by ID:", error);
            return null;
        }
    }
    async linkTelegramAccount(userId, telegramId) {
        const mutation = (0, graphql_request_1.gql) `
      mutation LinkTelegramAccount($userId: uuid!, $telegramId: String!) {
        update_user_profiles_by_pk(pk_columns: { id: $userId }, _set: { telegram_id: $telegramId }) {
          id
          telegram_id
        }
      }
    `;
        try {
            await this.client.request(mutation, { userId, telegramId });
            return true;
        }
        catch (error) {
            console.error("Error linking telegram account:", error);
            return false;
        }
    }
    async updateUserProfile(userId, updates) {
        const mutation = (0, graphql_request_1.gql) `
      mutation UpdateUserProfile($userId: uuid!, $name: String!) {
        updateUser(pk_columns: { id: $userId }, _set: { displayName: $name }) {
          id
          displayName
        }
      }
    `;
        try {
            if (updates.name) {
                await this.client.request(mutation, { userId, name: updates.name });
            }
            return true;
        }
        catch (error) {
            console.error("Error updating user profile:", error);
            return false;
        }
    }
    async createUserProfile(userId) {
        const mutation = (0, graphql_request_1.gql) `
      mutation CreateUserProfile($userId: uuid!) {
        insert_user_profiles_one(object: { id: $userId, wallet_balance: 0, total_spent: 0, total_purchased: 0 }) {
          id
        }
      }
    `;
        try {
            await this.client.request(mutation, { userId });
            console.log("✅ Manually created user_profile for userId:", userId);
            return true;
        }
        catch (error) {
            console.error("❌ Error creating user profile:", error);
            return false;
        }
    }
    /**
     * Look up a Nhost auth user's UUID by email address.
     * Uses Hasura's run_sql endpoint because auth.users is not tracked in GraphQL.
     */
    async getUserIdByEmail(email) {
        const HASURA_ENDPOINT = `https://${NHOST_SUBDOMAIN}.hasura.${NHOST_REGION}.nhost.run`;
        const adminSecret = process.env.NHOST_ADMIN_SECRET;
        try {
            const response = await fetchWithTimeout(`${HASURA_ENDPOINT}/v2/query`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-hasura-admin-secret": adminSecret,
                },
                body: JSON.stringify({
                    type: "run_sql",
                    args: {
                        source: "default",
                        // Parameterised-style: escape single quotes manually (safe — email is from our own data)
                        sql: `SELECT id FROM auth.users WHERE email = '${email.replace(/'/g, "''")}'`,
                        read_only: true,
                    },
                }),
            });
            if (!response.ok) {
                console.error("❌ run_sql failed:", response.status);
                return null;
            }
            const data = await response.json();
            // result is [["id"], ["<uuid>"]] when found, [["id"]] when not found
            if (data.result && data.result.length > 1) {
                return data.result[1][0];
            }
            return null;
        }
        catch (error) {
            console.error("❌ Error in getUserIdByEmail:", error);
            return null;
        }
    }
    // ============================================
    // Stores & Coupons
    // ============================================
    async getActiveStores() {
        const query = (0, graphql_request_1.gql) `
      query GetActiveStores {
        stores(where: { status: { _eq: "active" } }, order_by: { name: asc }) {
          id
          name
          description
          status
          slots_aggregate(where: { available_stock: { _gt: 0 }, is_published: { _eq: true } }) {
            aggregate {
              count
            }
          }
        }
      }
    `;
        try {
            const data = await this.client.request(query);
            return data.stores || [];
        }
        catch (error) {
            console.error("Error fetching stores:", error);
            return [];
        }
    }
    async getStoreCoupons(storeId) {
        const query = (0, graphql_request_1.gql) `
      query GetStoreCoupons($storeId: uuid!) {
        slots(
          where: { store_id: { _eq: $storeId }, available_stock: { _gt: 0 }, is_published: { _eq: true } }
          order_by: { name: asc }
        ) {
          id
          name
          description
          available_stock
          store_id
        }
      }
    `;
        try {
            const data = await this.client.request(query, { storeId });
            // Map available_stock to quantity for compatibility
            const slots = data.slots || [];
            return slots.map((slot) => ({
                ...slot,
                quantity: slot.available_stock,
                price: 0, // Price will be fetched separately from slot_pricing_tiers if needed
            }));
        }
        catch (error) {
            console.error("Error fetching store coupons:", error);
            return [];
        }
    }
    async getSlotWithPrice(slotId) {
        const query = (0, graphql_request_1.gql) `
      query GetSlotWithPricingTiers($slotId: uuid!) {
        slots_by_pk(id: $slotId) {
          id
          name
          description
          available_stock
          store_id
          slot_pricing_tiers(order_by: { min_quantity: asc }) {
            id
            min_quantity
            max_quantity
            unit_price
            label
          }
        }
      }
    `;
        try {
            const data = await this.client.request(query, { slotId });
            const slot = data.slots_by_pk;
            if (!slot)
                return null;
            return {
                id: slot.id,
                name: slot.name,
                description: slot.description,
                quantity: slot.available_stock,
                store_id: slot.store_id,
                pricing_tiers: slot.slot_pricing_tiers,
            };
        }
        catch (error) {
            console.error("Error fetching slot with pricing tiers:", error);
            return null;
        }
    }
    // ============================================
    // Purchases
    // ============================================
    async getUserPurchases(userId, limit = 10) {
        const query = (0, graphql_request_1.gql) `
      query GetUserPurchases($userId: uuid!, $limit: Int!) {
        purchases(
          where: { user_id: { _eq: $userId } }
          order_by: { created_at: desc }
          limit: $limit
        ) {
          id
          total_price
          quantity
          status
          created_at
          order_number
          slot {
            id
            name
            store {
              name
            }
          }
        }
      }
    `;
        try {
            const data = await this.client.request(query, { userId, limit });
            return data.purchases || [];
        }
        catch (error) {
            console.error("Error fetching purchases:", error);
            return [];
        }
    }
    async createPurchase(userId, slotId, quantity, unitPrice) {
        const totalPrice = quantity * unitPrice;
        try {
            // 1. Create purchase record
            const createPurchaseMutation = (0, graphql_request_1.gql) `
        mutation CreatePurchase($userId: uuid!, $slotId: uuid!, $quantity: Int!, $unitPrice: numeric!, $totalPrice: numeric!) {
          insert_purchases_one(
            object: {
              user_id: $userId
              slot_id: $slotId
              quantity: $quantity
              unit_price: $unitPrice
              total_price: $totalPrice
              status: "completed"
            }
          ) {
            id
            order_number
          }
        }
      `;
            const purchaseResult = await this.client.request(createPurchaseMutation, {
                userId,
                slotId,
                quantity,
                unitPrice,
                totalPrice,
            });
            const purchaseId = purchaseResult.insert_purchases_one.id;
            // 2. First, get the available coupon IDs (limited to quantity needed)
            const getAvailableCouponsQuery = (0, graphql_request_1.gql) `
        query GetAvailableCoupons($slotId: uuid!, $quantity: Int!) {
          coupons(
            where: { slot_id: { _eq: $slotId }, is_sold: { _eq: false } }
            limit: $quantity
          ) {
            id
          }
        }
      `;
            const availableCouponsResult = await this.client.request(getAvailableCouponsQuery, {
                slotId,
                quantity,
            });
            const couponIds = availableCouponsResult.coupons.map((c) => c.id);
            if (couponIds.length < quantity) {
                throw new Error(`Not enough coupons available. Found ${couponIds.length}, need ${quantity}`);
            }
            // 3. Mark the specific coupons as sold
            const sellCouponsMutation = (0, graphql_request_1.gql) `
        mutation SellCoupons($couponIds: [uuid!]!, $userId: uuid!, $purchaseId: uuid!) {
          update_coupons(
            where: { id: { _in: $couponIds } }
            _set: { is_sold: true, sold_to: $userId, sold_at: "now()", purchase_id: $purchaseId }
          ) {
            returning {
              id
              code
            }
          }
        }
      `;
            const couponsResult = await this.client.request(sellCouponsMutation, {
                couponIds,
                userId,
                purchaseId,
            });
            // 4. Deduct from wallet
            const updateWalletMutation = (0, graphql_request_1.gql) `
        mutation UpdateWallet($userId: uuid!, $amount: numeric!, $totalPrice: numeric!) {
          update_user_profiles_by_pk(
            pk_columns: { id: $userId }
            _inc: { wallet_balance: $amount, total_spent: $totalPrice }
          ) {
            wallet_balance
          }
        }
      `;
            await this.client.request(updateWalletMutation, {
                userId,
                amount: -totalPrice,
                totalPrice,
            });
            // 5. Decrement stock
            const decrementStockMutation = (0, graphql_request_1.gql) `
        mutation DecrementStock($slotId: uuid!, $quantity: Int!) {
          update_slots_by_pk(
            pk_columns: { id: $slotId }
            _inc: { available_stock: $quantity, total_sold: $quantity }
          ) {
            available_stock
          }
        }
      `;
            await this.client.request(decrementStockMutation, {
                slotId,
                quantity: -quantity,
            });
            // Return purchase details with coupon codes
            return {
                id: purchaseId,
                total_price: totalPrice,
                coupon_codes: couponsResult.update_coupons.returning.map((c) => c.code),
            };
        }
        catch (error) {
            console.error("Error creating purchase:", error);
            throw new Error(error.message || "Failed to create purchase");
        }
    }
    async getPurchaseDetails(purchaseId) {
        const query = (0, graphql_request_1.gql) `
      query GetPurchaseDetails($purchaseId: uuid!) {
        purchases_by_pk(id: $purchaseId) {
          id
          total_price
          quantity
          status
          created_at
          order_number
          slot {
            name
            store {
              name
            }
          }
          coupons {
            code
          }
        }
      }
    `;
        try {
            const data = await this.client.request(query, { purchaseId });
            const purchase = data.purchases_by_pk;
            if (!purchase)
                return null;
            // Extract coupon codes
            const codes = purchase.coupons.map((c) => c.code);
            return {
                ...purchase,
                coupon_codes: codes,
            };
        }
        catch (error) {
            console.error("Error fetching purchase details:", error);
            return null;
        }
    }
    // ============================================
    // User Profile Management
    // ============================================
    async updateUserBalance(userId, amount) {
        const mutation = (0, graphql_request_1.gql) `
      mutation UpdateUserBalance($userId: uuid!, $amount: numeric!) {
        update_user_profiles_by_pk(pk_columns: { id: $userId }, _inc: { wallet_balance: $amount }) {
          id
          wallet_balance
        }
      }
    `;
        try {
            await this.client.request(mutation, { userId, amount });
            return true;
        }
        catch (error) {
            console.error("Error updating balance:", error);
            return false;
        }
    }
    async unlinkTelegramAccount(userId) {
        const mutation = (0, graphql_request_1.gql) `
      mutation UnlinkTelegramAccount($userId: uuid!) {
        update_user_profiles_by_pk(pk_columns: { id: $userId }, _set: { telegram_id: null }) {
          id
        }
      }
    `;
        try {
            await this.client.request(mutation, { userId });
            return true;
        }
        catch (error) {
            console.error("Error unlinking telegram account:", error);
            return false;
        }
    }
    async getUserStats(userId) {
        const query = (0, graphql_request_1.gql) `
      query GetUserStats($userId: uuid!) {
        purchases_aggregate(where: { user_id: { _eq: $userId }, status: { _eq: "completed" } }) {
          aggregate {
            count
          }
        }
      }
    `;
        try {
            const data = await this.client.request(query, { userId });
            return {
                totalCouponsBought: data.purchases_aggregate.aggregate.count || 0,
            };
        }
        catch (error) {
            console.error("Error fetching user stats:", error);
            return { totalCouponsBought: 0 };
        }
    }
    async deleteUser(userId) {
        const deleteProfileMutation = (0, graphql_request_1.gql) `
      mutation DeleteUserProfile($userId: uuid!) {
        delete_user_profiles(where: { id: { _eq: $userId } }) {
          affected_rows
        }
      }
    `;
        const deleteAuthUserMutation = (0, graphql_request_1.gql) `
      mutation DeleteAuthUser($userId: uuid!) {
        deleteUser(id: $userId) {
          id
        }
      }
    `;
        try {
            // First delete the user profile
            await this.client.request(deleteProfileMutation, { userId });
            // Then delete the auth user
            await this.client.request(deleteAuthUserMutation, { userId });
            return true;
        }
        catch (error) {
            console.error("Error deleting user:", error);
            return false;
        }
    }
    async getTopupHistory(userId, limit = 10) {
        const query = (0, graphql_request_1.gql) `
      query GetTopupHistory($userId: uuid!, $limit: Int!) {
        topups(
          where: { user_id: { _eq: $userId } }
          order_by: { created_at: desc }
          limit: $limit
        ) {
          transaction_id
          amount
          status
          created_at
        }
      }
    `;
        try {
            const data = await this.client.request(query, { userId, limit });
            return data.topups || [];
        }
        catch (error) {
            console.error("Error fetching topup history:", error);
            return [];
        }
    }
}
exports.DatabaseService = DatabaseService;
