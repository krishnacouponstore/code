import { gql } from "graphql-request"

export const GET_ALL_BANNERS = gql`
  query GetAllBanners {
    banners(order_by: {sort_order: asc, created_at: desc}) {
      id
      brand_name
      primary_color
      background_image_url
      is_badge_visible
      badge_text
      badge_icon
      title_line_1
      title_line_2
      description
      button_text
      button_url
      offer_main_text
      offer_sub_text
      icon_mode
      card_icon_class
      icon_url_light
      icon_url_dark
      is_active
      sort_order
    }
  }
`

export const GET_ACTIVE_BANNERS = gql`
  query GetActiveBanners {
    banners(where: {is_active: {_eq: true}}, order_by: {sort_order: asc, created_at: desc}) {
      id
      brand_name
      primary_color
      background_image_url
      is_badge_visible
      badge_text
      badge_icon
      title_line_1
      title_line_2
      description
      button_text
      button_url
      offer_main_text
      offer_sub_text
      icon_mode
      card_icon_class
      icon_url_light
      icon_url_dark
      is_active
      sort_order
    }
  }
`

export const CREATE_BANNER = gql`
  mutation CreateBanner($object: banners_insert_input!) {
    insert_banners_one(object: $object) {
      id
    }
  }
`

export const UPDATE_BANNER = gql`
  mutation UpdateBanner($id: uuid!, $object: banners_set_input!) {
    update_banners_by_pk(pk_columns: {id: $id}, _set: $object) {
      id
    }
  }
`

export const DELETE_BANNER = gql`
  mutation DeleteBanner($id: uuid!) {
    delete_banners_by_pk(id: $id) {
      id
    }
  }
`

export const UPDATE_BANNER_STATUS = gql`
  mutation UpdateBannerStatus($id: uuid!, $is_active: Boolean!) {
    update_banners_by_pk(pk_columns: {id: $id}, _set: {is_active: $is_active}) {
      id
      is_active
    }
  }
`
