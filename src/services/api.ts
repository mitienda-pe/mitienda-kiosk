import axios, { AxiosError } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://api2.mitienda.pe/api'
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000

const KEY_STORAGE = 'mitienda-kiosk-key'

// El kiosko no tiene usuario: se identifica con su llave de dispositivo, que el
// API amarra a una tienda y una sucursal. La consigue una sola vez al activarse.
const api = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

export function getDeviceKey(): string | null {
  try {
    return localStorage.getItem(KEY_STORAGE)
  } catch {
    return null
  }
}

export function setDeviceKey(key: string | null) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    // Sin storage el kiosko tendrá que activarse otra vez al recargar.
  }
}

let onUnauthorized: (() => void) | null = null

/** Se llama cuando el API rechaza la llave (revocada o borrada). */
export function onDeviceRejected(handler: () => void) {
  onUnauthorized = handler
}

api.interceptors.request.use((config) => {
  const key = getDeviceKey()
  if (key && config.url?.startsWith('/v1/kiosk/') && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${key}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url || ''
    if (error.response?.status === 401 && url.startsWith('/v1/kiosk/') && !url.startsWith('/v1/kiosk/devices')) {
      onUnauthorized?.()
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as AxiosError<{ message?: string; messages?: Record<string, string> }>)?.response?.data
  if (data?.message) return data.message
  if (data?.messages) return Object.values(data.messages)[0] || fallback
  return fallback
}

// --- Activación (con el usuario del panel de un encargado) ---

export interface StoreOption {
  id: number
  name: string
}

export interface BranchOption {
  id: number
  name: string
}

function bearer(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

/** Token #1: solo sirve para listar las tiendas del usuario. */
export async function login(email: string, password: string): Promise<string> {
  const { data } = await api.post('/v1/auth/login', { email, password })
  const token = data?.data?.access_token
  if (!token) throw new Error(data?.message || 'No se pudo iniciar sesión')
  return token
}

export async function fetchUserStores(token: string): Promise<StoreOption[]> {
  const { data } = await api.get('/v1/user/stores', bearer(token))
  const stores = data?.data?.stores || []
  return stores.map((s: Record<string, string>) => ({
    id: Number(s.tienda_id),
    name: s.tienda_nombre_display || s.tienda_nombre_comercial || `Tienda ${s.tienda_id}`,
  }))
}

/** Token #2: scopeado a la tienda elegida. */
export async function selectStore(token: string, storeId: number): Promise<string> {
  const { data } = await api.post('/v1/user/store/select', { store_id: storeId }, bearer(token))
  const scoped = data?.data?.access_token
  if (!scoped) throw new Error(data?.message || 'No se pudo seleccionar la tienda')
  return scoped
}

export async function fetchBranches(storeToken: string): Promise<BranchOption[]> {
  const { data } = await api.get('/v1/branches', bearer(storeToken))
  const rows = data?.data || []
  return rows.map((b: Record<string, string>) => ({
    id: Number(b.tiendadireccion_id),
    name: b.tiendadireccion_nombresucursal || b.tiendadireccion_direccion || `Sucursal ${b.tiendadireccion_id}`,
  }))
}

/** Registra este kiosko en la sucursal y devuelve su llave (se entrega una vez). */
export async function activateDevice(storeToken: string, branchId: number, nombre: string): Promise<string> {
  const { data } = await api.post(
    '/v1/kiosk/devices',
    { tiendadireccion_id: branchId, nombre },
    bearer(storeToken)
  )
  const key = data?.data?.key
  if (!key) throw new Error('El API no devolvió la llave del kiosko')
  return key
}

// --- Kiosko (con su llave) ---

export interface KioskInfo {
  kiosk: { id: number; nombre: string }
  tienda: { id: number; nombre: string }
  sucursal: { id: number; nombre: string }
  preorder_ttl_minutes: number
}

export async function fetchKioskInfo(): Promise<KioskInfo> {
  const { data } = await api.get('/v1/kiosk/me')
  return data.data
}

export interface Category {
  id: string
  name: string
  image?: string | null
}

export interface ProductImage {
  url: string
  thumbnail: string
}

export interface Product {
  id: string
  slug: string
  name: string
  price: number
  originalPrice?: number | null
  stock?: number
  stockUnlimited?: boolean
  images: ProductImage[]
  category?: { id: string; slug: string; name: string }
  hasVariants?: boolean
}

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
  shortDescription?: string
  brand?: { id: string; slug: string; name: string }
  variants?: {
    attributes: VariantAttribute[]
    combinations: VariantCombination[]
  }
}

interface RawCategory {
  tiendacategoria_id: string
  tiendacategoria_nombre: string
  square_r2_url?: string | null
  cover_r2_url?: string | null
  sub?: RawCategory[]
}

/**
 * Categorías de primer nivel. Las subcategorías se ignoran: un producto de una
 * subcategoría queda vinculado también a la categoría padre.
 */
export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get('/v1/kiosk/categories')
  const rows: RawCategory[] = Array.isArray(data) ? data : (data?.data || [])
  return rows.map(c => ({
    id: String(c.tiendacategoria_id),
    name: c.tiendacategoria_nombre,
    image: c.square_r2_url || c.cover_r2_url || null,
  }))
}

function toImage(raw: unknown): ProductImage | null {
  const url = typeof raw === 'string' ? raw : (raw as { url?: string })?.url
  return url ? { url, thumbnail: url } : null
}

/**
 * Productos de una categoría según el catálogo POS de la sucursal del kiosko
 * (visibilidad, stock y precio de la caja).
 */
export async function fetchProducts(categoryId: string): Promise<Product[]> {
  const { data } = await api.get('/v1/kiosk/products', {
    params: { category_id: categoryId, limit: 100, sort_by: 'name', sort_dir: 'asc' },
  })
  const rows: Record<string, unknown>[] = data?.data || []
  return rows
    // El kiosko no pesa: lo que se vende al peso se pide en caja.
    .filter(p => !p.sold_by_weight)
    .map(p => {
      const price = Number(p.price) || 0
      const original = p.original_price != null ? Number(p.original_price) : null
      return {
        id: String(p.id),
        slug: String(p.id),
        name: String(p.name || ''),
        price,
        originalPrice: original && original > price ? original : null,
        stock: Number(p.stock) || 0,
        stockUnlimited: Boolean(p.unlimited_stock),
        images: ((p.images as unknown[]) || []).map(toImage).filter((i): i is ProductImage => i !== null),
        hasVariants: Boolean(p.has_variants),
      }
    })
}

interface RawVariant {
  id: number
  sku: string
  price: number
  stock: number
  unlimited_stock: boolean
  image_url?: string | null
  details: { store_attribute_id: number; option_id: number; option_text: string }[]
}

export async function fetchVariants(productId: string): Promise<ProductDetail['variants']> {
  const { data } = await api.get(`/v1/kiosk/products/${productId}/variants`)
  const attributes: VariantAttribute[] = data?.data?.attributes || []
  const variants: RawVariant[] = data?.data?.variants || []
  return {
    attributes,
    combinations: variants.map(v => ({
      id: v.id,
      sku: v.sku,
      // Precio de lista de la variante: es el que cotiza el API al crear el pedido.
      price: Number(v.price) || 0,
      offerPrice: 0,
      stock: Number(v.stock) || 0,
      unlimitedStock: Boolean(v.unlimited_stock),
      image: v.image_url || undefined,
      options: (v.details || []).map(d => ({
        attributeId: d.store_attribute_id,
        valueId: d.option_id,
        label: d.option_text,
      })),
    })),
  }
}

// --- Pre-orden (se paga en caja) ---

export interface PreorderItem {
  product_id: number
  productoatributo_id: number | null
  name: string
  quantity: number
  price: number
  price_original: number
}

export interface Preorder {
  id: number
  numero: number
  codigo: string
  scan_code: string
  estado: string
  cliente: string | null
  items: PreorderItem[]
  totales: { subtotal: number; tax: number; total: number }
  vence_at: string | null
  created_at: string | null
}

export interface UnavailableItem {
  product_id: number
  productoatributo_id: number | null
  name: string
  requested: number
  available: number
}

export class PreorderRejected extends Error {
  constructor(message: string, public unavailable: UnavailableItem[] = []) {
    super(message)
  }
}

export async function createPreorder(
  items: { product_id: number; productoatributo_id: number | null; quantity: number }[],
  customerName?: string
): Promise<Preorder> {
  try {
    const { data } = await api.post('/v1/kiosk/orders', { items, customer_name: customerName || undefined })
    return data.data
  } catch (error) {
    const response = (error as AxiosError<{ message?: string; unavailable_items?: UnavailableItem[] }>).response
    if (response && response.status >= 400 && response.status < 500 && response.status !== 401) {
      throw new PreorderRejected(
        response.data?.message || 'No se pudo registrar el pedido',
        response.data?.unavailable_items || []
      )
    }
    throw error
  }
}

export default api
