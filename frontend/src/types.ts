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