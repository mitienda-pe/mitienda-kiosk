import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://api2.mitienda.pe/api'
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000

const api = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

export function setTenantHeader(tenantId: string | number) {
  api.defaults.headers.common['X-Tenant-ID'] = String(tenantId)
}

// --- Tenant ---

export interface TenantData {
  tienda_id: string
  tienda_nombre_comercial: string
  tienda_nombreurl: string
  tienda_dominio: string
  tienda_usar_logotipo: string
}

export interface TenantInitResponse {
  tenant: TenantData
  appearance?: {
    logotipo_url?: string
    logo_url?: string
  }
}

export async function fetchTenantInit(domain: string): Promise<TenantInitResponse> {
  const { data } = await api.get(`/v1/tenant/init`, { params: { domain } })
  return data.data || data
}

// --- Catalog ---

export interface Category {
  id: string
  slug: string
  name: string
  image?: string | null
  square_r2_url?: string | null
  cover_r2_url?: string | null
  productCount?: number
  children?: Category[]
}

export interface ProductImage {
  url: string
  thumbnail: string
  sizes?: Record<string, string>
}

export interface Product {
  id: string
  slug: string
  name: string
  price: number
  originalPrice?: number | null
  promotion?: { descuento: number; precio_final: number } | null
  currency?: string
  stock?: number
  stockUnlimited?: boolean
  images: ProductImage[]
  category?: { id: string; slug: string; name: string }
  subcategory?: { id: string; slug: string; name: string }
  brand?: { id: string; slug: string; name: string }
  isFeatured?: boolean
  hasVariants?: boolean
  swatches?: ProductSwatch[]
}

export interface ProductSwatch {
  attributeId: number
  attributeName: string
  type: number
  style: number
  values: { id: number; text: string; image?: string }[]
}

// --- Product Detail ---

export interface VariantOption {
  attributeId: number
  valueId: number
  label: string
}

export interface VariantCombination {
  id: number
  sku: string
  price: number
  offerPrice: number
  stock: number
  unlimitedStock: boolean
  image?: string
  options: VariantOption[]
}

export interface VariantAttribute {
  id: number
  name: string
  slug: string
  type: number
  style: number
  order: number
}

export interface ProductDetail extends Product {
  description?: string
  shortDescription?: string
  weight?: number
  dimensions?: Record<string, unknown>
  variants?: {
    attributes: VariantAttribute[]
    combinations: VariantCombination[]
  }
  relatedProducts?: Product[]
}

export interface CatalogResponse {
  products: Product[]
  categories: Category[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export async function fetchCategories(tiendaId: number): Promise<Category[]> {
  const { data } = await api.get(`/v1/storefront/categories`, { params: { t: tiendaId } })
  return data.data || []
}

export async function fetchCatalog(tiendaId: number, params: Record<string, unknown> = {}): Promise<CatalogResponse> {
  const { data } = await api.get(`/v1/storefront/catalog`, {
    params: { t: tiendaId, limit: 100, ...params }
  })
  return {
    products: data.data?.products || [],
    categories: data.data?.categories || [],
    pagination: data.data?.pagination || { page: 1, limit: 50, total: 0, pages: 0 },
  }
}

export async function fetchProductDetail(slug: string, tiendaId: number): Promise<ProductDetail> {
  const { data } = await api.get(`/v1/storefront/products/${slug}`, { params: { t: tiendaId } })
  return data.data || data
}

export default api
