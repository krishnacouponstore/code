import { gql } from "graphql-request"

export const GET_ACTIVE_STORES = gql`
  query GetActiveStores {
    stores(where: { status: { _eq: "active" } }) {
      id
      name
      slug
      category
      logo_url
      theme_color
      store_tags {
        value
        color
        tag_icon
      }
      slots_aggregate(where: { is_published: { _eq: true } }) {
        aggregate {
          count
        }
      }
    }
  }
`

export const GET_ALL_STORES = gql`
  query GetAllStores {
    stores(order_by: { created_at: desc }) {
      id
      name
      slug
      category
      logo_url
      theme_color
      status
      created_at
      store_tags {
        value
        color
        tag_icon
      }
      slots_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`

export const CREATE_STORE = gql`
  mutation CreateStore($object: stores_insert_input!) {
    insert_stores_one(object: $object) {
      id
      name
    }
  }
`

export const UPDATE_STORE = gql`
  mutation UpdateStore($id: uuid!, $data: stores_set_input!) {
    update_stores_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      name
    }
  }
`

export const DELETE_STORE = gql`
  mutation DeleteStore($id: uuid!) {
    delete_store_tags(where: { store_id: { _eq: $id } }) {
      affected_rows
    }
    delete_user_favorite_stores(where: { store_id: { _eq: $id } }) {
      affected_rows
    }
    delete_stores_by_pk(id: $id) {
      id
      name
    }
  }
`

export const INSERT_STORE_TAGS = gql`
  mutation InsertStoreTags($objects: [store_tags_insert_input!]!) {
    insert_store_tags(objects: $objects) {
      affected_rows
    }
  }
`

export const DELETE_STORE_TAGS = gql`
  mutation DeleteStoreTags($store_id: uuid!) {
    delete_store_tags(where: { store_id: { _eq: $store_id } }) {
      affected_rows
    }
  }
`
