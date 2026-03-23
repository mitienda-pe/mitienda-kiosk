<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '@/stores/catalog'
import { useCartStore } from '@/stores/cart'
import type { VariantCombination } from '@/services/api'

const props = defineProps<{ slug: string }>()

const router = useRouter()
const catalog = useCatalogStore()
const cart = useCartStore()

const quantity = ref(1)
const selectedOptions = ref<Record<number, number>>({}) // attributeId -> valueId
const addedAnimation = ref(false)

onMounted(() => {
  catalog.loadProductDetail(props.slug)
})

const product = computed(() => catalog.currentProduct)

const hasVariants = computed(() => {
  const v = product.value?.variants
  return v && v.attributes?.length > 0 && v.combinations?.length > 0
})

// Get available values for each attribute
const variantAttributes = computed(() => {
  if (!hasVariants.value) return []
  return product.value!.variants!.attributes.sort((a, b) => a.order - b.order)
})

// Find the matching combination based on selected options
const selectedCombination = computed<VariantCombination | null>(() => {
  if (!hasVariants.value) return null
  const combinations = product.value!.variants!.combinations
  const selectedAttrs = Object.entries(selectedOptions.value)

  if (selectedAttrs.length === 0) return combinations[0] || null

  return combinations.find(combo =>
    selectedAttrs.every(([attrId, valId]) =>
      combo.options.some(o => o.attributeId === Number(attrId) && o.valueId === valId)
    )
  ) || null
})

// Get available values for an attribute considering other selections
function getValuesForAttribute(attrId: number) {
  if (!hasVariants.value) return []
  const combinations = product.value!.variants!.combinations

  // Get unique values for this attribute from all valid combinations
  const values = new Map<number, { id: number; label: string; available: boolean }>()

  for (const combo of combinations) {
    const option = combo.options.find(o => o.attributeId === attrId)
    if (!option) continue

    // Check if this combination is compatible with other selections
    const otherSelections = Object.entries(selectedOptions.value)
      .filter(([id]) => Number(id) !== attrId)

    const isCompatible = otherSelections.every(([otherId, otherVal]) =>
      combo.options.some(o => o.attributeId === Number(otherId) && o.valueId === otherVal)
    )

    if (!values.has(option.valueId)) {
      values.set(option.valueId, {
        id: option.valueId,
        label: option.label,
        available: isCompatible && (combo.stock > 0 || combo.unlimitedStock),
      })
    } else if (isCompatible) {
      values.get(option.valueId)!.available = true
    }
  }

  return Array.from(values.values())
}

const finalPrice = computed(() => {
  if (selectedCombination.value) {
    const c = selectedCombination.value
    return (c.offerPrice && c.offerPrice > 0) ? c.offerPrice : c.price
  }
  return product.value?.price || 0
})

const totalPrice = computed(() => finalPrice.value * quantity.value)

const productImage = computed(() => {
  if (selectedCombination.value?.image) return selectedCombination.value.image
  return product.value?.images?.[0]?.url || product.value?.images?.[0]?.thumbnail || ''
})

// Auto-select first value for each attribute
watch(product, (p) => {
  if (p?.variants?.attributes && p.variants.combinations.length > 0) {
    const first = p.variants.combinations[0]
    for (const opt of first.options) {
      selectedOptions.value[opt.attributeId] = opt.valueId
    }
  }
}, { immediate: true })

function selectOption(attrId: number, valueId: number) {
  selectedOptions.value[attrId] = valueId
}

function incrementQty() {
  quantity.value++
}

function decrementQty() {
  if (quantity.value > 1) quantity.value--
}

function addToCart() {
  if (!product.value) return

  if (hasVariants.value && selectedCombination.value) {
    const combo = selectedCombination.value
    const label = combo.options.map(o => o.label).join(' / ')
    cart.addItemWithVariant(
      { id: product.value.id, name: product.value.name, images: product.value.images },
      { id: combo.id, price: combo.price, offerPrice: combo.offerPrice, label, image: combo.image },
      quantity.value
    )
  } else {
    cart.addItem(product.value, quantity.value)
  }

  addedAnimation.value = true
  setTimeout(() => {
    addedAnimation.value = false
    router.back()
  }, 600)
}

function formatPrice(price: number): string {
  return `S/ ${price.toFixed(2)}`
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="flex h-full min-h-screen w-full flex-col bg-background-light">
    <!-- Loading -->
    <div v-if="catalog.loadingDetail" class="flex flex-1 items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p class="text-sm text-subtle-dark">Cargando producto...</p>
      </div>
    </div>

    <template v-else-if="product">
      <!-- Product Image -->
      <div class="relative">
        <div class="aspect-square w-full overflow-hidden bg-gray-50">
          <img
            :src="productImage"
            :alt="product.name"
            class="h-full w-full object-cover transition-all duration-300"
          />
        </div>

        <!-- Back button overlay -->
        <button
          @click="goBack"
          class="absolute top-6 left-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg active:scale-95 transition-transform"
        >
          <span class="material-symbols-outlined text-text-main">arrow_back</span>
        </button>

        <!-- Category badge -->
        <div v-if="product.category" class="absolute top-6 right-5 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow-lg">
          <span class="text-xs font-semibold text-subtle-dark">{{ product.category.name }}</span>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto hide-scrollbar -mt-6 relative z-10">
        <div class="rounded-t-3xl bg-background-light px-5 pt-6 pb-40">
          <!-- Name & Price -->
          <div class="flex items-start justify-between gap-4 mb-4">
            <h1 class="text-2xl font-bold leading-tight flex-1">{{ product.name }}</h1>
            <div class="text-right shrink-0">
              <p v-if="product.originalPrice && product.originalPrice > finalPrice" class="text-sm text-gray-400 line-through">
                {{ formatPrice(product.originalPrice) }}
              </p>
              <p class="text-2xl font-bold">{{ formatPrice(finalPrice) }}</p>
            </div>
          </div>

          <!-- Brand -->
          <div v-if="product.brand" class="mb-4">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-subtle-dark">
              <span class="material-symbols-outlined text-[14px]">verified</span>
              {{ product.brand.name }}
            </span>
          </div>

          <!-- Description -->
          <p v-if="product.shortDescription" class="text-sm text-subtle-dark leading-relaxed mb-6 line-clamp-3"
            v-html="product.shortDescription.replace(/<[^>]*>/g, '')">
          </p>

          <!-- Variant selectors -->
          <div v-if="hasVariants" class="space-y-5 mb-6">
            <div v-for="attr in variantAttributes" :key="attr.id">
              <h3 class="text-sm font-bold mb-3">{{ attr.name }}</h3>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="val in getValuesForAttribute(attr.id)"
                  :key="val.id"
                  @click="val.available && selectOption(attr.id, val.id)"
                  class="flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-all active:scale-95 border-2"
                  :class="[
                    selectedOptions[attr.id] === val.id
                      ? 'border-primary bg-primary/10 text-text-main'
                      : val.available
                        ? 'border-gray-200 bg-white text-text-main hover:border-gray-300'
                        : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                  ]"
                  :disabled="!val.available"
                >
                  {{ val.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Quantity selector -->
          <div class="mb-6">
            <h3 class="text-sm font-bold mb-3">Cantidad</h3>
            <div class="inline-flex items-center gap-3 rounded-xl bg-white p-1 shadow-sm">
              <button
                @click="decrementQty"
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 active:scale-90 transition-transform"
                :class="{ 'opacity-40': quantity <= 1 }"
              >
                <span class="material-symbols-outlined text-[20px]">remove</span>
              </button>
              <span class="w-8 text-center text-lg font-bold">{{ quantity }}</span>
              <button
                @click="incrementQty"
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary active:scale-90 transition-transform"
              >
                <span class="material-symbols-outlined text-[20px] text-text-main">add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Fixed bottom CTA -->
      <div class="fixed bottom-0 left-0 right-0 z-50 bg-background-light border-t border-gray-100 px-5 pt-4 pb-8">
        <button
          @click="addToCart"
          class="flex w-full items-center justify-center gap-3 rounded-2xl py-4 font-bold text-lg shadow-lg active:scale-[0.98] transition-transform"
          :class="addedAnimation ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-primary text-text-main shadow-primary/30'"
        >
          <span class="material-symbols-outlined text-[22px]">
            {{ addedAnimation ? 'check' : 'add_shopping_cart' }}
          </span>
          {{ addedAnimation ? '¡Agregado!' : `Agregar al pedido — ${formatPrice(totalPrice)}` }}
        </button>
      </div>
    </template>

    <!-- Error state -->
    <div v-else class="flex flex-1 flex-col items-center justify-center px-8">
      <span class="material-symbols-outlined text-[48px] text-gray-300 mb-3">error_outline</span>
      <p class="text-subtle-dark mb-4">No se pudo cargar el producto</p>
      <button @click="goBack" class="rounded-full bg-primary px-6 py-3 font-semibold text-text-main">
        Volver
      </button>
    </div>
  </div>
</template>
