export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: 'customer' | 'admin' | 'super_admin' | 'vendor'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          address_line_1: string
          address_line_2: string | null
          city: string
          county: string | null
          postcode: string
          is_default: boolean
          delivery_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label?: string
          address_line_1: string
          address_line_2?: string | null
          city: string
          county?: string | null
          postcode: string
          is_default?: boolean
          delivery_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          county?: string | null
          postcode?: string
          is_default?: boolean
          delivery_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          sku: string | null
          barcode: string | null
          price_pence: number
          compare_at_price_pence: number | null
          cost_price_pence: number | null
          stock_quantity: number
          low_stock_threshold: number
          track_inventory: boolean
          allow_backorder: boolean
          unit: string
          unit_value: number | null
          brand: string | null
          is_vegan: boolean
          is_vegetarian: boolean
          is_gluten_free: boolean
          is_organic: boolean
          allergens: string[] | null
          nutritional_info: Json | null
          image_url: string | null
          images: string[] | null
          is_active: boolean
          is_featured: boolean
          has_offer: boolean
          offer_badge: string | null
          meta_title: string | null
          meta_description: string | null
          avg_rating: number
          review_count: number
          vendor_id: string | null
          approval_status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          sku?: string | null
          barcode?: string | null
          price_pence: number
          compare_at_price_pence?: number | null
          cost_price_pence?: number | null
          stock_quantity?: number
          low_stock_threshold?: number
          track_inventory?: boolean
          allow_backorder?: boolean
          unit?: string
          unit_value?: number | null
          brand?: string | null
          is_vegan?: boolean
          is_vegetarian?: boolean
          is_gluten_free?: boolean
          is_organic?: boolean
          allergens?: string[] | null
          nutritional_info?: Json | null
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          has_offer?: boolean
          offer_badge?: string | null
          meta_title?: string | null
          meta_description?: string | null
          avg_rating?: number
          review_count?: number
          vendor_id?: string | null
          approval_status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          sku?: string | null
          barcode?: string | null
          price_pence?: number
          compare_at_price_pence?: number | null
          cost_price_pence?: number | null
          stock_quantity?: number
          low_stock_threshold?: number
          track_inventory?: boolean
          allow_backorder?: boolean
          unit?: string
          unit_value?: number | null
          brand?: string | null
          is_vegan?: boolean
          is_vegetarian?: boolean
          is_gluten_free?: boolean
          is_organic?: boolean
          allergens?: string[] | null
          nutritional_info?: Json | null
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          has_offer?: boolean
          offer_badge?: string | null
          meta_title?: string | null
          meta_description?: string | null
          avg_rating?: number
          review_count?: number
          vendor_id?: string | null
          approval_status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      product_categories: {
        Row: {
          product_id: string
          category_id: string
        }
        Insert: {
          product_id: string
          category_id: string
        }
        Update: {
          product_id?: string
          category_id?: string
        }
      }
      carts: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cart_id: string
          product_id: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cart_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      delivery_slots: {
        Row: {
          id: string
          date: string
          start_time: string
          end_time: string
          max_orders: number
          current_orders: number
          delivery_fee_pence: number
          is_available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          start_time: string
          end_time: string
          max_orders?: number
          current_orders?: number
          delivery_fee_pence?: number
          is_available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          start_time?: string
          end_time?: string
          max_orders?: number
          current_orders?: number
          delivery_fee_pence?: number
          is_available?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivery_address_line_1: string
          delivery_address_line_2: string | null
          delivery_city: string
          delivery_county: string | null
          delivery_postcode: string
          delivery_instructions: string | null
          delivery_slot_id: string | null
          delivery_date: string | null
          delivery_time_start: string | null
          delivery_time_end: string | null
          subtotal_pence: number
          delivery_fee_pence: number
          discount_pence: number
          total_pence: number
          stripe_payment_intent_id: string | null
          stripe_checkout_session_id: string | null
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
          status: 'pending' | 'confirmed' | 'processing' | 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled'
          paid_at: string | null
          confirmed_at: string | null
          dispatched_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivery_address_line_1: string
          delivery_address_line_2?: string | null
          delivery_city: string
          delivery_county?: string | null
          delivery_postcode: string
          delivery_instructions?: string | null
          delivery_slot_id?: string | null
          delivery_date?: string | null
          delivery_time_start?: string | null
          delivery_time_end?: string | null
          subtotal_pence: number
          delivery_fee_pence?: number
          discount_pence?: number
          total_pence: number
          stripe_payment_intent_id?: string | null
          stripe_checkout_session_id?: string | null
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
          status?: 'pending' | 'confirmed' | 'processing' | 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled'
          paid_at?: string | null
          confirmed_at?: string | null
          dispatched_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_address_line_1?: string
          delivery_address_line_2?: string | null
          delivery_city?: string
          delivery_county?: string | null
          delivery_postcode?: string
          delivery_instructions?: string | null
          delivery_slot_id?: string | null
          delivery_date?: string | null
          delivery_time_start?: string | null
          delivery_time_end?: string | null
          subtotal_pence?: number
          delivery_fee_pence?: number
          discount_pence?: number
          total_pence?: number
          stripe_payment_intent_id?: string | null
          stripe_checkout_session_id?: string | null
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
          status?: 'pending' | 'confirmed' | 'processing' | 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled'
          paid_at?: string | null
          confirmed_at?: string | null
          dispatched_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          product_image_url: string | null
          quantity: number
          unit_price_pence: number
          total_price_pence: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          product_image_url?: string | null
          quantity: number
          unit_price_pence: number
          total_price_pence: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          product_image_url?: string | null
          quantity?: number
          unit_price_pence?: number
          total_price_pence?: number
          created_at?: string
        }
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          order_id: string | null
          rating: number
          title: string | null
          content: string | null
          images: string[]
          is_verified_purchase: boolean
          status: 'pending' | 'approved' | 'rejected'
          helpful_count: number
          not_helpful_count: number
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          order_id?: string | null
          rating: number
          title?: string | null
          content?: string | null
          images?: string[]
          is_verified_purchase?: boolean
          status?: 'pending' | 'approved' | 'rejected'
          helpful_count?: number
          not_helpful_count?: number
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          order_id?: string | null
          rating?: number
          title?: string | null
          content?: string | null
          images?: string[]
          is_verified_purchase?: boolean
          status?: 'pending' | 'approved' | 'rejected'
          helpful_count?: number
          not_helpful_count?: number
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      review_votes: {
        Row: {
          id: string
          review_id: string
          user_id: string
          is_helpful: boolean
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          user_id: string
          is_helpful: boolean
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          user_id?: string
          is_helpful?: boolean
          created_at?: string
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          name: string
          is_public: boolean
          share_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          is_public?: boolean
          share_token?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          is_public?: boolean
          share_token?: string
          created_at?: string
          updated_at?: string
        }
      }
      wishlist_items: {
        Row: {
          id: string
          wishlist_id: string
          product_id: string
          added_price_pence: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wishlist_id: string
          product_id: string
          added_price_pence?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wishlist_id?: string
          product_id?: string
          added_price_pence?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      flash_deals: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          product_id: string
          deal_price_pence: number
          original_price_pence: number
          discount_percentage: number
          starts_at: string
          ends_at: string
          max_quantity: number | null
          claimed_quantity: number
          is_active: boolean
          is_featured: boolean
          banner_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          product_id: string
          deal_price_pence: number
          original_price_pence: number
          starts_at: string
          ends_at: string
          max_quantity?: number | null
          claimed_quantity?: number
          is_active?: boolean
          is_featured?: boolean
          banner_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          product_id?: string
          deal_price_pence?: number
          original_price_pence?: number
          starts_at?: string
          ends_at?: string
          max_quantity?: number | null
          claimed_quantity?: number
          is_active?: boolean
          is_featured?: boolean
          banner_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          user_id: string
          business_name: string
          slug: string
          description: string | null
          logo_url: string | null
          banner_url: string | null
          email: string
          phone: string | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          postcode: string | null
          country: string
          company_number: string | null
          vat_number: string | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          stripe_charges_enabled: boolean
          stripe_payouts_enabled: boolean
          status: 'pending' | 'approved' | 'suspended' | 'rejected'
          is_verified: boolean
          verified_at: string | null
          commission_rate: number
          total_sales_pence: number
          total_orders: number
          rating: number
          review_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          email: string
          phone?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          postcode?: string | null
          country?: string
          company_number?: string | null
          vat_number?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          stripe_charges_enabled?: boolean
          stripe_payouts_enabled?: boolean
          status?: 'pending' | 'approved' | 'suspended' | 'rejected'
          is_verified?: boolean
          verified_at?: string | null
          commission_rate?: number
          total_sales_pence?: number
          total_orders?: number
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          email?: string
          phone?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          postcode?: string | null
          country?: string
          company_number?: string | null
          vat_number?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          stripe_charges_enabled?: boolean
          stripe_payouts_enabled?: boolean
          status?: 'pending' | 'approved' | 'suspended' | 'rejected'
          is_verified?: boolean
          verified_at?: string | null
          commission_rate?: number
          total_sales_pence?: number
          total_orders?: number
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Common types
export type Profile = Tables<'profiles'>
export type Address = Tables<'addresses'>
export type Category = Tables<'categories'>
export type Product = Tables<'products'>
export type Cart = Tables<'carts'>
export type CartItem = Tables<'cart_items'>
export type DeliverySlot = Tables<'delivery_slots'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type ProductReview = Tables<'product_reviews'>
export type ReviewVote = Tables<'review_votes'>
export type Wishlist = Tables<'wishlists'>
export type WishlistItem = Tables<'wishlist_items'>
export type FlashDeal = Tables<'flash_deals'>
export type Vendor = Tables<'vendors'>

// Extended types with relations
export type CartItemWithProduct = CartItem & {
  product: Product
}

export type OrderWithItems = Order & {
  order_items: OrderItem[]
}

export type ProductWithCategories = Product & {
  categories: Category[]
}

export type ProductWithVendor = Product & {
  vendor: Vendor | null
}

export type ReviewWithUser = ProductReview & {
  profiles: Pick<Profile, 'full_name' | 'email'>
}

export type WishlistWithItems = Wishlist & {
  wishlist_items: (WishlistItem & { product: Product })[]
}

export type FlashDealWithProduct = FlashDeal & {
  product: Product
}
