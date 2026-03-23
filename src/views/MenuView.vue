<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '@/stores/catalog'
import { useCartStore } from '@/stores/cart'
import { useTenantStore } from '@/stores/tenant'
import type { Product } from '@/services/api'

const props = defineProps<{ categorySlug?: string }>()

const router = useRouter()
const catalog = useCatalogStore()
const cart = useCartStore()
const tenant = useTenantStore()

const poppedId = ref<string | null>(null)

const allCategories = computed(() => [
  { id: '0', name: 'Todos', slug: '' },
  ...catalog.categories,
])

const displayProducts = computed(() => catalog.products)

onMounted(async () => {
  if (props.categorySlug) {
    catalog.selectCategory(props.categorySlug)
  }
  await catalog.loadCatalog(props.categorySlug)
})

function selectCategory(slug: string | null) {
  catalog.selectCategory(slug || null)
  // Always re-fetch from API with the category filter
  catalog.loadCatalog(slug || undefined)
}

function openProduct(product: Product) {
  router.push({ name: 'product', params: { slug: product.slug } })
}

function addToCart(product: Product) {
  if (product.hasVariants) {
    openProduct(product)
    return
  }
  cart.addItem(product)
  poppedId.value = product.id
  setTimeout(() => { poppedId.value = null }, 300)
}

function getProductImage(product: Product): string {
  if (product.images?.length) return product.images[0].url || product.images[0].thumbnail
  return 'https://placehold.co/400x400/f8f8f5/cccccc?text=Sin+imagen'
}

function formatPrice(price: number): string {
  return `S/ ${price.toFixed(2)}`
}

function goBack() {
  router.push('/categories')
}

function goToCart() {
  router.push('/cart')
}
</script>

<template>
  <div class="flex h-full min-h-screen w-full flex-col bg-background-light">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-background-light/95 backdrop-blur-md border-b border-gray-100">
      <div class="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
        <button
          @click="goBack"
          class="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
        >
          <span class="material-symbols-outlined text-text-main">arrow_back</span>
        </button>

        <div class="flex-1 text-center">
          <h1 class="text-lg font-bold leading-tight">{{ tenant.storeName }}</h1>
          <span class="text-xs text-subtle-dark font-medium">{{ tenant.branchName }}</span>
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
      </div>

      <!-- Categories -->
      <div class="flex gap-2.5 overflow-x-auto hide-scrollbar px-5 pb-3">
        <button
          v-for="cat in allCategories"
          :key="cat.id"
          @click="selectCategory(cat.slug || null)"
          class="flex h-10 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold transition-all active:scale-95"
          :class="[
            (cat.slug || null) === catalog.selectedCategory
              ? 'bg-primary text-text-main shadow-sm'
              : 'bg-white text-subtle-dark'
          ]"
        >
          {{ cat.name }}
        </button>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="catalog.loading" class="flex flex-1 items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p class="text-sm text-subtle-dark">Cargando menú...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="catalog.error && displayProducts.length === 0" class="flex flex-1 items-center justify-center px-8">
      <div class="text-center">
        <span class="material-symbols-outlined text-[48px] text-gray-300 mb-3">error_outline</span>
        <p class="text-subtle-dark mb-4">{{ catalog.error }}</p>
        <button
          @click="catalog.loadCatalog()"
          class="rounded-full bg-primary px-6 py-3 font-semibold text-text-main active:scale-95 transition-transform"
        >
          Reintentar
        </button>
      </div>
    </div>

    <!-- Products grid -->
    <div v-else class="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 pb-32">
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="product in displayProducts"
          :key="product.id"
          class="flex flex-col rounded-2xl bg-white shadow-sm overflow-hidden"
          :class="{ 'animate-pop': poppedId === product.id }"
        >
          <!-- Image (tappable → detail) -->
          <div class="relative aspect-square overflow-hidden bg-gray-50 cursor-pointer" @click="openProduct(product)">
            <img
              :src="getProductImage(product)"
              :alt="product.name"
              class="h-full w-full object-cover"
              loading="lazy"
            />
            <!-- Promo badge -->
            <div
              v-if="product.originalPrice && product.originalPrice > product.price"
              class="absolute top-2 left-2 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-bold text-white"
            >
              -{{ Math.round((1 - product.price / product.originalPrice) * 100) }}%
            </div>
            <!-- Variants badge -->
            <div
              v-if="product.hasVariants"
              class="absolute bottom-2 right-2 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-subtle-dark shadow"
            >
              Variantes
            </div>
          </div>

          <!-- Info -->
          <div class="flex flex-1 flex-col p-3">
            <h3 class="text-sm font-semibold leading-tight line-clamp-2 mb-1.5 cursor-pointer" @click="openProduct(product)">
              {{ product.name }}
            </h3>

            <div class="mt-auto flex items-end justify-between gap-2">
              <div>
                <p
                  v-if="product.originalPrice && product.originalPrice > product.price"
                  class="text-xs text-gray-400 line-through"
                >
                  {{ formatPrice(product.originalPrice) }}
                </p>
                <p class="text-base font-bold">{{ formatPrice(product.price) }}</p>
              </div>

              <!-- Add / Qty control -->
              <div v-if="cart.getQuantity(product.id) > 0" class="flex items-center gap-1">
                <button
                  @click="cart.decrement(product.id)"
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 active:scale-90 transition-transform"
                >
                  <span class="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <span class="w-6 text-center text-sm font-bold">{{ cart.getQuantity(product.id) }}</span>
                <button
                  @click="cart.increment(product.id)"
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-primary active:scale-90 transition-transform"
                >
                  <span class="material-symbols-outlined text-[18px] text-text-main">add</span>
                </button>
              </div>
              <button
                v-else
                @click="addToCart(product)"
                class="flex h-9 items-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-text-main active:scale-90 transition-transform shadow-sm"
              >
                <span class="material-symbols-outlined text-[18px]">add</span>
                Agregar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!catalog.loading && displayProducts.length === 0" class="flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined text-[56px] text-gray-200 mb-3">inventory_2</span>
        <p class="text-subtle-dark">No hay productos en esta categoría</p>
      </div>
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
