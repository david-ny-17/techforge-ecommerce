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
  price: string 
  original_price: string 
  discount_percent: number 
  promotion_name: string
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
  original_price?: string // precio de lista, antes de la promoción
  discount_percent?: number // 0 o ausente si no hay oferta
  image: string | null
  stock: number
  quantity: number
}

// ---------- Cotización del carrito (precios vigentes del servidor) ----------
export interface CartQuoteItem {
  product_id: number
  slug: string
  name: string
  quantity: number
  stock: number
  price: string // precio unitario final (con promoción)
  original_price: string // precio unitario de lista
  discount_percent: number
  promotion_name: string
  line_total: string
}

export interface CartQuote {
  items: CartQuoteItem[]
  unavailable: number[] // ids que ya no existen o se desactivaron
  list_total: string
  discount_total: string
  total: string
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
  is_staff: boolean
  must_change_password: boolean
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

export interface PaymentIntentPayload {
  cart_items: { product_id: number; quantity: number }[]
  shipping_address: string
  shipping_city: string
}

export interface PaymentIntentResponse {
  order_id: number
  client_secret: string
}

export interface PaymentConfirmationResponse {
  detail: string
  order: Order
}

export interface SmartBuilderResponse {
  message: string
  products: Product[]
  budget_pen: number | null
}

export interface BuilderTurn {
  id: string
  prompt: string
  message: string
  products: Product[]
  budget_pen: number | null
  saved?: boolean
}

export interface SmartBuilderHistoryTurn {
  prompt: string
  message: string
  product_ids: number[]
  budget_pen: number | null
}

export interface SavedBuild {
  id: number
  name: string
  prompt: string
  budget: string | null
  products: Product[]
  created_at: string
}

export interface SavedBuildPayload {
  name: string
  prompt: string
  budget: number | null
  product_ids: number[]
}

// ---------- Panel de administración ----------
export interface AdminKpis {
  total_sales: number
  sales_today: number
  paid_orders: number
  pending_orders: number
  customers: number
  new_customers_today: number
  pcs_sold: number
  setups_sold: number
  laptops_sold: number
  products_active: number
  out_of_stock: number
}

export interface AdminSalesPoint {
  date: string // "2026-11-16"
  total: number
  orders: number
}

export interface AdminRankedProduct {
  product_id: number
  name: string
  slug: string
  category: string
  units: number
  revenue: number
}

export interface AdminRecentUser {
  id: number
  username: string
  name: string
  email: string
  date_joined: string
}

export interface AdminRecentOrder {
  id: number
  customer: string
  total: number
  status: OrderStatus
  created_at: string
}

export interface AdminLowStockItem {
  id: number
  name: string
  stock: number
  category: string
}

export interface AdminDashboardData {
  generated_at: string
  kpis: AdminKpis
  sales_series: AdminSalesPoint[]
  top_products: AdminRankedProduct[]
  least_sold: AdminRankedProduct | null
  recent_users: AdminRecentUser[]
  recent_orders: AdminRecentOrder[]
  low_stock: AdminLowStockItem[]
}

export interface AdminProduct {
  id: number
  name: string
  slug: string
  category: number // id de la categoría
  category_name: string
  category_slug: string
  description: string
  price: string // DRF devuelve los decimales como texto
  stock: number
  image: string | null // imagen subida
  image_url: string // imagen externa
  specifications: Record<string, string | number | boolean>
  is_active: boolean
  units_sold: number
  has_orders: boolean
  created_at: string
  updated_at: string
}

export interface AdminOrderItem {
  id: number
  product: number
  product_name: string
  product_slug: string
  category: string
  quantity: number
  unit_price: string
  subtotal: string
}

export interface AdminOrderCustomer {
  id: number
  username: string
  name: string
  email: string
}

export interface AdminOrder {
  id: number
  customer: AdminOrderCustomer
  total: string
  status: OrderStatus
  created_at: string
  shipping_address: string
  shipping_city: string
  items_count: number
  items: AdminOrderItem[]
}

export interface AdminCustomer {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  city: string
  date_joined: string
  last_login: string | null
  is_active: boolean
  orders_count: number // pedidos pagados
  total_spent: number // soles gastados en pedidos pagados
}

// ---------- Cuenta ----------
export interface ProfileUpdate {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
  new_password2: string
}

export interface ChangePasswordResponse {
  detail: string
  user: User
}