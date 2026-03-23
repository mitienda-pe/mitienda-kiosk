<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '@/stores/catalog'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/services/api'

const router = useRouter()
const catalog = useCatalogStore()
const cart = useCartStore()

const UPSELL_TIMEOUT = 15000
const timeLeft = ref(UPSELL_TIMEOUT / 1000)
const progress = ref(0)
const addedIds = ref<Set<string>>(new Set())
const intervalRef = ref<ReturnType<typeof setInterval> | null>(null)

// Pick upsell products: products NOT in cart, preferring cheap items (sides, drinks, desserts)
const upsellProducts = computed(() => {
  const cartProductIds = new Set(cart.items.map(i => i.productId))
  const available = catalog.products
    .filter(p => !cartProductIds.has(p.id))
    .sort((a, b) => a.price - b.price)

  // Return up to 6 items
  return available.slice(0, 6)
})

const upsellSections = computed(() => {
  const sections: { title: string; icon: string; products: Product[] }[] = []

  if (upsellProducts.value.length === 0) return sections

  // Group by category if possible, otherwise show all
  const byCategory = new Map<string, Product[]>()
  for (const p of upsellProducts.value) {
    const cat = p.category?.name || 'Sugerencias'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(p)
  }

  const icons: Record<string, string> = {
    'Bebidas': 'local_cafe',
    'Acompañamientos': 'restaurant',
    'Postres': 'cake',
    'Combos': 'takeout_dining',
  }

  for (const [name, products] of byCategory) {
    sections.push({
      title: name,
      icon: icons[name] || 'add_circle',
      products,
    })
  }

  return sections
})

function getProductImage(product: Product): string {
  return product.images?.[0]?.url || product.images?.[0]?.thumbnail || 'https://placehold.co/200x200/f8f8f5/ccc?text=...'
}

function formatPrice(price: number): string {
  return `S/ ${price.toFixed(2)}`
}

function addToCart(product: Product) {
  cart.addItem(product)
  addedIds.value.add(product.id)
}

function skip() {
  cleanup()
  router.push('/payment')
}

function continueToPayment() {
  cleanup()
  router.push('/payment')
}

function cleanup() {
  if (intervalRef.value) clearInterval(intervalRef.value)
}

onMounted(() => {
  if (cart.isEmpty) {
    router.push('/menu')
    return
  }

  const startTime = Date.now()
  intervalRef.value = setInterval(() => {
    const elapsed = Date.now() - startTime
    progress.value = Math.min((elapsed / UPSELL_TIMEOUT) * 100, 100)
    timeLeft.value = Math.max(0, Math.ceil((UPSELL_TIMEOUT - elapsed) / 1000))

    if (elapsed >= UPSELL_TIMEOUT) {
      skip()
    }
  }, 100)
})

onUnmounted(cleanup)
</script>

<template>
  <div class="flex h-full min-h-screen w-full flex-col bg-background-light">
    <!-- Header -->
    <header class="flex items-center justify-between gap-4 px-5 pt-8 pb-2">
      <div class="flex-1">
        <h1 class="text-xl font-bold">¿Quieres agregar algo más?</h1>
        <p class="text-sm text-subtle-dark mt-0.5">Completa tu pedido con estas sugerencias</p>
      </div>
      <button
        @click="skip"
        class="flex items-center gap-1 rounded-full border-2 border-gray-200 px-4 py-2 text-sm font-semibold text-subtle-dark active:scale-95 transition-transform"
      >
        Omitir
        <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
      </button>
    </header>

    <!-- Auto-skip progress -->
    <div class="px-5 pb-3">
      <div class="flex items-center gap-2">
        <div class="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-primary/60 rounded-full transition-all duration-100 ease-linear" :style="{ width: `${progress}%` }"></div>
        </div>
        <span class="text-[10px] text-gray-400 font-mono w-6 text-right">{{ timeLeft }}s</span>
      </div>
    </div>

    <!-- Upsell content -->
    <div class="flex-1 overflow-y-auto hide-scrollbar px-4 pb-36">
      <!-- If no upsell products, show message -->
      <div v-if="upsellProducts.length === 0" class="flex flex-1 flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined text-[48px] text-gray-200 mb-3">check_circle</span>
        <p class="text-subtle-dark text-center">¡Tu pedido se ve completo!</p>
        <button
          @click="continueToPayment"
          class="mt-6 rounded-full bg-primary px-8 py-3 font-semibold text-text-main active:scale-95 transition-transform"
        >
          Ir a pagar
        </button>
      </div>

      <!-- Sections -->
      <div v-else class="space-y-5">
        <div v-for="section in upsellSections" :key="section.title">
          <div class="flex items-center gap-2 mb-3 px-1">
            <span class="material-symbols-outlined text-subtle-dark text-[20px]">{{ section.icon }}</span>
            <h2 class="text-base font-bold">{{ section.title }}</h2>
          </div>

          <!-- Horizontal scroll for products -->
          <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            <div
              v-for="product in section.products"
              :key="product.id"
              class="flex shrink-0 w-40 flex-col rounded-2xl bg-white shadow-sm overflow-hidden transition-all"
              :class="{ 'ring-2 ring-emerald-400': addedIds.has(product.id) }"
            >
              <!-- Image -->
              <div class="aspect-square overflow-hidden bg-gray-50">
                <img :src="getProductImage(product)" :alt="product.name" class="h-full w-full object-cover" loading="lazy" />
              </div>
              <!-- Info -->
              <div class="flex flex-col p-3 gap-2">
                <h3 class="text-xs font-semibold leading-tight line-clamp-2">{{ product.name }}</h3>
                <div class="flex items-center justify-between mt-auto">
                  <span class="text-sm font-bold">{{ formatPrice(product.price) }}</span>
                  <button
                    v-if="!addedIds.has(product.id)"
                    @click="addToCart(product)"
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-primary active:scale-90 transition-transform shadow-sm"
                  >
                    <span class="material-symbols-outlined text-[18px] text-text-main">add</span>
                  </button>
                  <div v-else class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
                    <span class="material-symbols-outlined text-[18px] text-white">check</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom CTA -->
    <div class="fixed bottom-0 left-0 right-0 z-50 bg-background-light border-t border-gray-100 px-5 pt-4 pb-8">
      <button
        @click="continueToPayment"
        class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-text-main text-lg shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform"
      >
        <span class="material-symbols-outlined">payment</span>
        Ir a pagar — {{ formatPrice(cart.total) }}
      </button>
    </div>
  </div>
</template>
