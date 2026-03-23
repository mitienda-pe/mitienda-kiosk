<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '@/stores/catalog'
import { useCartStore } from '@/stores/cart'
import { useTenantStore } from '@/stores/tenant'
import { fetchCatalog } from '@/services/api'

const router = useRouter()
const catalog = useCatalogStore()
const cart = useCartStore()
const tenant = useTenantStore()

// Map category slug → first product image URL
const categoryImages = ref<Record<string, string>>({})

async function loadCategoryImages() {
  const cats = catalog.categories
  if (!cats.length || !tenant.tiendaId) return

  // Fetch first product per category in parallel
  const promises = cats.map(async (cat) => {
    try {
      const data = await fetchCatalog(tenant.tiendaId, { categoria: cat.slug, limit: 1 })
      const firstProduct = data.products[0]
      if (firstProduct?.images?.length) {
        categoryImages.value[cat.slug] = firstProduct.images[0].url || firstProduct.images[0].thumbnail
      }
    } catch {
      // ignore - card will show gradient fallback
    }
  })

  await Promise.all(promises)
}

// Fallback gradient colors
const categoryColors = [
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-rose-400 to-pink-500',
  'from-sky-400 to-blue-500',
  'from-lime-400 to-green-500',
  'from-fuchsia-400 to-pink-600',
  'from-cyan-400 to-teal-600',
]

function getCategoryColor(index: number): string {
  return categoryColors[index % categoryColors.length]
}

function getImage(cat: typeof catalog.categories[0]): string | null {
  // Priority: category's own image → first product image → null
  return cat.image || cat.square_r2_url || cat.cover_r2_url || categoryImages.value[cat.slug] || null
}

function goToCategory(slug: string) {
  router.push({ name: 'menu', params: { categorySlug: slug } })
}

function goBack() {
  router.push('/service')
}

function goToCart() {
  router.push('/cart')
}

function formatPrice(price: number): string {
  return `S/ ${price.toFixed(2)}`
}

onMounted(async () => {
  if (catalog.categories.length === 0) {
    await catalog.loadCategories()
  }
  // Load first product image per category
  await loadCategoryImages()
})
</script>

<template>
  <div class="flex h-full min-h-screen w-full flex-col bg-background-light">
    <!-- Header -->
    <header class="flex items-center justify-between gap-4 px-5 pt-8 pb-4">
      <button
        @click="goBack"
        class="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
      >
        <span class="material-symbols-outlined text-text-main">arrow_back</span>
      </button>

      <div class="flex-1 text-center">
        <h1 class="text-xl font-bold">{{ tenant.storeName }}</h1>
        <p class="text-xs text-subtle-dark">{{ tenant.branchName }}</p>
      </div>

      <button
        @click="goToCart"
        class="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
      >
        <span class="material-symbols-outlined outlined text-text-main">shopping_cart</span>
        <span
          v-if="cart.itemCount > 0"
          class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-text-main"
        >
          {{ cart.itemCount }}
        </span>
      </button>
    </header>

    <!-- Title -->
    <div class="px-5 pb-4">
      <h2 class="text-2xl font-bold">¿Qué te provoca?</h2>
      <p class="text-subtle-dark text-sm mt-1">Elige una categoría</p>
    </div>

    <!-- Loading -->
    <div v-if="catalog.loading && catalog.categories.length === 0" class="flex flex-1 items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p class="text-sm text-subtle-dark">Cargando categorías...</p>
      </div>
    </div>

    <!-- Categories Grid -->
    <div v-else class="flex-1 overflow-y-auto hide-scrollbar px-4 pb-32">
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="(cat, index) in catalog.categories"
          :key="cat.id"
          @click="goToCategory(cat.slug)"
          class="relative flex flex-col items-end justify-end overflow-hidden rounded-2xl shadow-sm active:scale-[0.97] transition-transform aspect-square"
        >
          <!-- Background: product image or gradient fallback -->
          <div v-if="getImage(cat)" class="absolute inset-0">
            <img
              :src="getImage(cat)!"
              :alt="cat.name"
              class="h-full w-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          </div>
          <div v-else class="absolute inset-0 bg-gradient-to-br" :class="getCategoryColor(index)">
            <div class="absolute inset-0 bg-black/10"></div>
          </div>

          <!-- Content (bottom-aligned) -->
          <div class="relative z-10 w-full p-4">
            <h3 class="text-base font-bold text-white drop-shadow-lg leading-tight">
              {{ cat.name }}
            </h3>
            <span v-if="cat.productCount" class="text-xs text-white/70 font-medium">
              {{ cat.productCount }} productos
            </span>
          </div>
        </button>
      </div>

      <!-- View all products link -->
      <button
        @click="router.push({ name: 'menu' })"
        class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 py-4 font-semibold text-subtle-dark active:scale-[0.98] transition-transform"
      >
        <span class="material-symbols-outlined outlined text-[20px]">grid_view</span>
        Ver todos los productos
      </button>
    </div>

    <!-- Floating cart bar -->
    <transition name="slide-up">
      <div
        v-if="cart.itemCount > 0"
        class="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2"
      >
        <button
          @click="goToCart"
          class="flex w-full items-center justify-between rounded-2xl bg-text-main p-4 shadow-2xl active:scale-[0.98] transition-transform"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <span class="material-symbols-outlined text-text-main">shopping_cart</span>
            </div>
            <div class="text-left">
              <p class="text-sm font-bold text-white">Ver mi pedido</p>
              <p class="text-xs text-white/60">{{ cart.itemCount }} {{ cart.itemCount === 1 ? 'producto' : 'productos' }}</p>
            </div>
          </div>
          <span class="text-lg font-bold text-primary">{{ formatPrice(cart.total) }}</span>
        </button>
      </div>
    </transition>
  </div>
</template>
