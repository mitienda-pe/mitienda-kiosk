import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product } from '@/services/api'

export interface CartItem {
  id: string          // productId or productId-variantId
  productId: string
  variantId?: number
  name: string
  variantLabel?: string
  price: number
  originalPrice?: number | null
  image?: string
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  const igv = computed(() => subtotal.value * 0.18)

  const total = computed(() => subtotal.value)

  const isEmpty = computed(() => items.value.length === 0)

  function addItem(product: Product, quantity = 1) {
    const existing = items.value.find(i => i.id === product.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images?.[0]?.url || product.images?.[0]?.thumbnail,
        quantity,
      })
    }
  }

  function addItemWithVariant(
    product: { id: string; name: string; images?: { url: string; thumbnail: string }[] },
    variant: { id: number; price: number; offerPrice?: number; label: string; image?: string },
    quantity = 1
  ) {
    const cartId = `${product.id}-${variant.id}`
    const existing = items.value.find(i => i.id === cartId)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({
        id: cartId,
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        variantLabel: variant.label,
        price: variant.offerPrice && variant.offerPrice > 0 ? variant.offerPrice : variant.price,
        image: variant.image || product.images?.[0]?.url || product.images?.[0]?.thumbnail,
        quantity,
      })
    }
  }

  function removeItem(id: string) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function increment(id: string) {
    const item = items.value.find(i => i.id === id)
    if (item) item.quantity++
  }

  function decrement(id: string) {
    const item = items.value.find(i => i.id === id)
    if (item) {
      if (item.quantity <= 1) {
        removeItem(id)
      } else {
        item.quantity--
      }
    }
  }

  function getQuantity(id: string): number {
    return items.value.find(i => i.id === id)?.quantity || 0
  }

  function getProductTotalQuantity(productId: string): number {
    return items.value
      .filter(i => i.productId === productId)
      .reduce((sum, i) => sum + i.quantity, 0)
  }

  function clear() {
    items.value = []
  }

  return {
    items,
    itemCount,
    subtotal,
    igv,
    total,
    isEmpty,
    addItem,
    addItemWithVariant,
    removeItem,
    increment,
    decrement,
    getQuantity,
    getProductTotalQuantity,
    clear,
  }
}, {
  persist: {
    key: 'mitienda-kiosk-cart',
  },
})
