import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchCategories, fetchProducts, fetchVariants, type Product, type Category, type ProductDetail } from '@/services/api'

/**
 * Catálogo del kiosko = el catálogo POS de su sucursal, filtrado a lo que la
 * tienda puso en una categoría. El POS trae también insumos y artículos
 * internos sin foto; la selección para el público la decide la tienda
 * categorizando. Una categoría sin productos visibles no se muestra.
 */
export const useCatalogStore = defineStore('catalog', () => {
  const categories = ref<Category[]>([])
  const productsByCategory = ref<Record<string, Product[]>>({})
  const selectedCategory = ref<string | null>(null)
  const currentProduct = ref<ProductDetail | null>(null)
  const loading = ref(false)
  const loadingDetail = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false)

  const visibleCategories = computed(() =>
    categories.value
      .filter(c => (productsByCategory.value[c.id] || []).length > 0)
      .map(c => ({
        ...c,
        productCount: productsByCategory.value[c.id].length,
        image: c.image || productsByCategory.value[c.id].find(p => p.images.length)?.images[0].url || null,
      }))
  )

  /** Todos los productos visibles, sin repetir los que están en dos categorías. */
  const allProducts = computed(() => {
    const seen = new Set<string>()
    const list: Product[] = []
    for (const cat of visibleCategories.value) {
      for (const p of productsByCategory.value[cat.id]) {
        if (!seen.has(p.id)) {
          seen.add(p.id)
          list.push(p)
        }
      }
    }
    return list
  })

  const products = computed(() =>
    selectedCategory.value ? (productsByCategory.value[selectedCategory.value] || []) : allProducts.value
  )

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    error.value = null
    try {
      const cats = await fetchCategories()
      const entries = await Promise.all(
        cats.map(async c => [c.id, await fetchProducts(c.id)] as const)
      )
      categories.value = cats
      productsByCategory.value = Object.fromEntries(entries)
      loaded.value = true
    } catch {
      error.value = 'No se pudieron cargar los productos'
    } finally {
      loading.value = false
    }
  }

  function findProduct(id: string): Product | undefined {
    return allProducts.value.find(p => p.id === id)
  }

  async function loadProductDetail(id: string) {
    loadingDetail.value = true
    currentProduct.value = null
    try {
      await load()
      const product = findProduct(id)
      if (!product) return
      currentProduct.value = product.hasVariants
        ? { ...product, variants: await fetchVariants(id) }
        : { ...product }
    } catch {
      error.value = 'No se pudo cargar el producto'
    } finally {
      loadingDetail.value = false
    }
  }

  function selectCategory(id: string | null) {
    selectedCategory.value = id
  }

  return {
    categories,
    visibleCategories,
    products,
    allProducts,
    selectedCategory,
    currentProduct,
    loading,
    loadingDetail,
    error,
    loaded,
    load,
    findProduct,
    loadProductDetail,
    selectCategory,
  }
})
