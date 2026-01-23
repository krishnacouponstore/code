import { gql } from "graphql-request"

export const GET_USER_FAVORITES = gql`
  query GetUserFavorites($userId: uuid!) {
    user_favorite_stores(where: { user_id: { _eq: $userId } }) {
      id
      store_id
    }
  }
`

export const ADD_FAVORITE = gql`
  mutation AddFavorite($userId: uuid!, $storeId: uuid!) {
    insert_user_favorite_stores_one(object: { user_id: $userId, store_id: $storeId }) {
      id
      store_id
    }
  }
`

export const REMOVE_FAVORITE = gql`
  mutation RemoveFavorite($userId: uuid!, $storeId: uuid!) {
    delete_user_favorite_stores(where: { user_id: { _eq: $userId }, store_id: { _eq: $storeId } }) {
      affected_rows
    }
  }
`
