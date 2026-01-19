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
          role: 'customer' | 'admin'
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
          meta_title: string | null
          meta_description: string | null
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
          meta_title?: string | null
          meta_description?: string | null
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
          meta_title?: string | null
          meta_description?: string | null
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
