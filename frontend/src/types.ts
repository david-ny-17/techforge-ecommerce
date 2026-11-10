export interface Category {
  id: number
  name: string
  slug: string
  description: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: string // DRF devuelve los decimales como texto
  stock: number
  image: string | null
  image_url: string
  specifications: Record<string, string | number | boolean>
  category: Category
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface CartItem {
  id: number
  slug: string
  name: string
  price: string // se guarda como texto, igual que en la API
  image: string | null
  stock: number
  quantity: number
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone: string
  address: string
  city: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface RegisterData {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  password2: string
}

export interface OrderItem {
  id: number
  product: number
  product_name: string
  product_slug: string
  quantity: number
  unit_price: string
  subtotal: string
}

export type OrderStatus = "PENDING" | "PAID" | "FAILED"

export interface Order {
  id: number
  total: string
  status: OrderStatus
  created_at: string
  shipping_address: string
  shipping_city: string
  items: OrderItem[]
}

export interface CheckoutPayload {
  cart_items: { product_id: number; quantity: number }[]
  payment_info: { card_number: string }
  shipping_address: string
  shipping_city: string
}

export interface CheckoutResponse {
  detail: string
  order: Order
}

export interface SmartBuilderResponse {
  message: string
  products: Product[]
}