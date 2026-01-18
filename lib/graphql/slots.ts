import { gql } from "graphql-request"

// Queries
export const GET_ALL_SLOTS = gql`
  query GetAllSlots {
    slots(order_by: { created_at: desc }) {
      id
      name
      description
      is_published
      available_stock
      total_uploaded
      total_sold
      thumbnail_url
      expiry_date
      created_at
      updated_at
      pricing_tiers: slot_pricing_tiers(order_by: { min_quantity: asc }) {
        id
        min_quantity
        max_quantity
        unit_price
        label
      }
      redemption_steps(order_by: { step_number: asc }) {
        id
        step_number
        step_text
      }
      coupons_aggregate(where: { is_sold: { _eq: false } }) {
        aggregate {
          count
        }
      }
    }
  }
`

export const GET_SLOT_BY_ID = gql`
  query GetSlotById($id: uuid!) {
    slots_by_pk(id: $id) {
      id
      name
      description
      is_published
      available_stock
      total_uploaded
      total_sold
      thumbnail_url
      expiry_date
      created_at
      updated_at
      pricing_tiers: slot_pricing_tiers(order_by: { min_quantity: asc }) {
        id
        min_quantity
        max_quantity
        unit_price
        label
      }
      redemption_steps(order_by: { step_number: asc }) {
        id
        step_number
        step_text
      }
    }
  }
`

export const GET_SLOT_COUPONS = gql`
  query GetSlotCoupons($slot_id: uuid!, $limit: Int, $offset: Int) {
    coupons(
      where: { slot_id: { _eq: $slot_id } }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      code
      is_sold
      sold_to
      sold_at
      created_at
      user_profile {
        user {
          email
          displayName
        }
      }
    }
    coupons_aggregate(where: { slot_id: { _eq: $slot_id } }) {
      aggregate {
        count
      }
    }
  }
`

export const GET_SLOT_COUPONS_FILTERED = gql`
  query GetSlotCouponsFiltered(
    $slot_id: uuid!
    $limit: Int!
    $offset: Int!
    $search: String
    $is_sold: Boolean
  ) {
    coupons(
      where: {
        slot_id: { _eq: $slot_id }
        code: { _ilike: $search }
        is_sold: { _eq: $is_sold }
      }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      code
      is_sold
      sold_at
      created_at
      user_profile {
        user {
          email
          displayName
        }
      }
    }
    coupons_aggregate(
      where: {
        slot_id: { _eq: $slot_id }
        code: { _ilike: $search }
        is_sold: { _eq: $is_sold }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`

export const GET_SLOT_SALES = gql`
  query GetSlotSales($slot_id: uuid!) {
    coupons(
      where: { slot_id: { _eq: $slot_id }, is_sold: { _eq: true } }
      order_by: { sold_at: desc }
    ) {
      id
      code
      sold_at
      sold_to
      purchase_id
      user: user_profile {
        id
        user {
          displayName
          email
        }
      }
    }
    coupons_aggregate(where: { slot_id: { _eq: $slot_id }, is_sold: { _eq: true } }) {
      aggregate {
        count
      }
    }
  }
`

// Mutations
export const CREATE_SLOT = gql`
  mutation CreateSlot(
    $name: String!
    $description: String
    $thumbnail_url: String
    $expiry_date: timestamptz
    $is_published: Boolean!
  ) {
    insert_slots_one(
      object: {
        name: $name
        description: $description
        thumbnail_url: $thumbnail_url
        expiry_date: $expiry_date
        is_published: $is_published
      }
    ) {
      id
      name
      description
      is_published
      available_stock
      total_uploaded
      total_sold
      thumbnail_url
      expiry_date
      created_at
    }
  }
`

export const UPDATE_SLOT = gql`
  mutation UpdateSlot(
    $id: uuid!
    $name: String!
    $description: String
    $thumbnail_url: String
    $expiry_date: timestamptz
    $is_published: Boolean!
  ) {
    update_slots_by_pk(
      pk_columns: { id: $id }
      _set: {
        name: $name
        description: $description
        thumbnail_url: $thumbnail_url
        expiry_date: $expiry_date
        is_published: $is_published
        updated_at: "now()"
      }
    ) {
      id
      name
      description
      is_published
      thumbnail_url
      expiry_date
      updated_at
    }
  }
`

export const DELETE_SLOT = gql`
  mutation DeleteSlot($id: uuid!) {
    delete_slot_pricing_tiers(where: { slot_id: { _eq: $id } }) {
      affected_rows
    }
    delete_coupons(where: { slot_id: { _eq: $id } }) {
      affected_rows
    }
    delete_slots_by_pk(id: $id) {
      id
      name
    }
  }
`

export const TOGGLE_SLOT_PUBLISH = gql`
  mutation ToggleSlotPublish($id: uuid!, $is_published: Boolean!) {
    update_slots_by_pk(
      pk_columns: { id: $id }
      _set: { is_published: $is_published, updated_at: "now()" }
    ) {
      id
      is_published
    }
  }
`

export const UPDATE_SLOT_STOCK = gql`
  mutation UpdateSlotStock($id: uuid!, $available_stock: Int!, $total_uploaded: Int!) {
    update_slots_by_pk(
      pk_columns: { id: $id }
      _set: { 
        available_stock: $available_stock
        total_uploaded: $total_uploaded
        updated_at: "now()" 
      }
    ) {
      id
      available_stock
      total_uploaded
    }
  }
`

export const DELETE_COUPON = gql`
  mutation DeleteCoupon($id: uuid!) {
    delete_coupons_by_pk(id: $id) {
      id
      code
      slot_id
      is_sold
    }
  }
`

// Pricing Tiers
export const ADD_PRICING_TIERS = gql`
  mutation AddPricingTiers($tiers: [slot_pricing_tiers_insert_input!]!) {
    insert_slot_pricing_tiers(objects: $tiers) {
      returning {
        id
        slot_id
        min_quantity
        max_quantity
        unit_price
        label
      }
    }
  }
`

export const DELETE_PRICING_TIERS = gql`
  mutation DeletePricingTiers($slot_id: uuid!) {
    delete_slot_pricing_tiers(where: { slot_id: { _eq: $slot_id } }) {
      affected_rows
    }
  }
`

// Coupons
export const UPLOAD_CODES_BULK = gql`
  mutation UploadCodesBulk($codes: [coupons_insert_input!]!) {
    insert_coupons(
      objects: $codes
      on_conflict: { constraint: coupons_code_key, update_columns: [] }
    ) {
      returning {
        id
        code
      }
      affected_rows
    }
  }
`

// Redemption Steps
export const ADD_REDEMPTION_STEPS = gql`
  mutation AddRedemptionSteps($steps: [redemption_steps_insert_input!]!) {
    insert_redemption_steps(objects: $steps) {
      returning {
        id
        slot_id
        step_number
        step_text
      }
    }
  }
`

export const DELETE_REDEMPTION_STEPS = gql`
  mutation DeleteRedemptionSteps($slot_id: uuid!) {
    delete_redemption_steps(where: { slot_id: { _eq: $slot_id } }) {
      affected_rows
    }
  }
`

export const UPDATE_REDEMPTION_STEP = gql`
  mutation UpdateRedemptionStep($id: uuid!, $step_text: String!) {
    update_redemption_steps_by_pk(
      pk_columns: { id: $id }
      _set: { step_text: $step_text, updated_at: "now()" }
    ) {
      id
      step_text
      updated_at
    }
  }
`
