import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchCatalog, fetchCategories, fetchProductDetail, type Product, type Category, type ProductDetail } from '@/services/api'
import { useTenantStore } from './tenant'

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref<Product[]>([])
  const categories = ref<Category[]>([])
  const selectedCategory = ref<string | null>(null)
  const currentProduct = ref<ProductDetail | null>(null)
  const loading = ref(false)
  const loadingDetail = ref(false)
  const error = ref<string | null>(null)

  const filteredProducts = computed(() => {
    if (!selectedCategory.value) return products.value
    return products.value.filter(p =>
      p.category?.slug === selectedCategory.value ||
      p.subcategory?.slug === selectedCategory.value
    )
  })

  async function loadCategories() {
    const tenant = useTenantStore()
    if (!tenant.tiendaId) return

    loading.value = true
    error.value = null
    try {
      const data = await fetchCategories(tenant.tiendaId)
      if (data.length > 0) {
        categories.value = data
      }
    } catch {
      if (categories.value.length === 0) {
        categories.value = getMockCategories()
      }
    } finally {
      loading.value = false
    }
  }

  async function loadCatalog(categorySlug?: string) {
    const tenant = useTenantStore()
    if (!tenant.tiendaId) return

    loading.value = true
    error.value = null

    try {
      const params: Record<string, unknown> = {}
      if (categorySlug) params.categoria = categorySlug

      const data = await fetchCatalog(tenant.tiendaId, params)
      products.value = data.products
      if (data.categories.length > 0) {
        categories.value = data.categories
      }
    } catch {
      error.value = 'No se pudieron cargar los productos'
      if (products.value.length === 0) {
        products.value = getMockProducts()
        categories.value = getMockCategories()
      }
    } finally {
      loading.value = false
    }
  }

  async function loadProductDetail(slug: string) {
    const tenant = useTenantStore()
    if (!tenant.tiendaId) return

    loadingDetail.value = true
    currentProduct.value = null
    try {
      currentProduct.value = await fetchProductDetail(slug, tenant.tiendaId)
    } catch {
      error.value = 'No se pudo cargar el producto'
    } finally {
      loadingDetail.value = false
    }
  }

  function selectCategory(slug: string | null) {
    selectedCategory.value = slug
  }

  return {
    products,
    categories,
    selectedCategory,
    currentProduct,
    filteredProducts,
    loading,
    loadingDetail,
    error,
    loadCategories,
    loadCatalog,
    loadProductDetail,
    selectCategory,
  }
})

function getMockProducts(): Product[] {
  return [
    { id: '1', name: 'Hamburguesa Clásica', slug: 'hamburguesa-clasica', price: 29.90, images: [{ url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop', thumbnail: '' }], category: { id: '1', slug: 'hamburguesas', name: 'Hamburguesas' } },
    { id: '2', name: 'Hamburguesa Doble', slug: 'hamburguesa-doble', price: 39.90, images: [{ url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop', thumbnail: '' }], category: { id: '1', slug: 'hamburguesas', name: 'Hamburguesas' } },
    { id: '3', name: 'Papas Grandes', slug: 'papas-grandes', price: 15.00, images: [{ url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop', thumbnail: '' }], category: { id: '2', slug: 'acompañamientos', name: 'Acompañamientos' } },
    { id: '4', name: 'Nuggets x6', slug: 'nuggets-x6', price: 18.90, images: [{ url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=400&fit=crop', thumbnail: '' }], category: { id: '2', slug: 'acompañamientos', name: 'Acompañamientos' } },
    { id: '5', name: 'Coca-Cola 500ml', slug: 'coca-cola-500', price: 8.00, images: [{ url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop', thumbnail: '' }], category: { id: '3', slug: 'bebidas', name: 'Bebidas' } },
    { id: '6', name: 'Limonada Frozen', slug: 'limonada-frozen', price: 12.00, images: [{ url: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=400&fit=crop', thumbnail: '' }], category: { id: '3', slug: 'bebidas', name: 'Bebidas' } },
    { id: '7', name: 'Sundae de Chocolate', slug: 'sundae-chocolate', price: 10.00, images: [{ url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop', thumbnail: '' }], category: { id: '4', slug: 'postres', name: 'Postres' } },
    { id: '8', name: 'Combo Familiar', slug: 'combo-familiar', price: 89.90, originalPrice: 109.90, images: [{ url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=400&fit=crop', thumbnail: '' }], category: { id: '5', slug: 'combos', name: 'Combos' } },
  ]
}

function getMockCategories(): Category[] {
  return [
    { id: '1', name: 'Hamburguesas', slug: 'hamburguesas', productCount: 2 },
    { id: '2', name: 'Acompañamientos', slug: 'acompañamientos', productCount: 2 },
    { id: '3', name: 'Bebidas', slug: 'bebidas', productCount: 2 },
    { id: '4', name: 'Postres', slug: 'postres', productCount: 1 },
    { id: '5', name: 'Combos', slug: 'combos', productCount: 1 },
  ]
}
