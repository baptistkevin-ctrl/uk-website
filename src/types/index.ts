/* =========================================
   UK GROCERY STORE — Core Type Definitions
   Solaris Empire Inc
   ========================================= */

export interface Product {
  id:             string;
  slug:           string;
  name:           string;
  description:    string;
  imageUrl:       string;
  images:         string[];
  category:       string;
  subcategory?:   string;
  price:          number;
  originalPrice?: number;
  unit?:          string;
  rating:         number;
  reviewCount:    number;
  onSale:         boolean;
  isNew:          boolean;
  isOrganic:      boolean;
  outOfStock:     boolean;
  inStock:        number;
  brand?:         string;
  nutritional?:   Record<string, string>;
  tags:           string[];
}

export interface CartItem {
  product:  Product;
  quantity: number;
}

export interface Order {
  id:           string;
  status:       OrderStatus;
  items:        CartItem[];
  subtotal:     number;
  deliveryFee:  number;
  discount:     number;
  vat:          number;
  total:        number;
  delivery:     DeliveryDetails;
  email:        string;
  placedAt:     string;
  updatedAt:    string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "dispatched"
  | "delivered"
  | "cancelled";

export interface DeliveryDetails {
  address:       Address;
  slot:          DeliverySlot;
  instructions?: string;
}

export interface Address {
  id?:       string;
  label?:    string;
  line1:     string;
  line2?:    string;
  city:      string;
  postcode:  string;
  country:   string;
  isDefault?: boolean;
}

export interface DeliverySlot {
  date:      string;
  from:      string;
  to:        string;
  price:     number;
  available: boolean;
}

export interface Category {
  id:          string;
  slug:        string;
  name:        string;
  description?: string;
  imageUrl?:   string;
  parentId?:   string;
  itemCount:   number;
  sortOrder:   number;
}

export interface Review {
  id:         string;
  productId:  string;
  userId:     string;
  userName:   string;
  rating:     number;
  title?:     string;
  body?:      string;
  verified:   boolean;
  createdAt:  string;
}

export interface PromoCode {
  id:         string;
  code:       string;
  type:       "percentage" | "fixed";
  value:      number;
  minOrder:   number;
  active:     boolean;
}

export interface Testimonial {
  id:       string;
  name:     string;
  location: string;
  rating:   number;
  quote:    string;
  avatar?:  string;
}

export interface SearchSuggestion {
  id:        string;
  name:      string;
  category:  string;
  imageUrl:  string;
  price:     number;
}

export interface FilterState {
  category?:    string;
  subcategory?: string;
  priceMin?:    number;
  priceMax?:    number;
  brands:       string[];
  dietary:      string[];
  minRating?:   number;
  inStockOnly:  boolean;
  onSaleOnly:   boolean;
  sort:         SortOption;
  page:         number;
}

export type SortOption =
  | "popular"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating";

export interface PaginatedResponse<T> {
  items:      T[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}
