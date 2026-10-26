import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createPreorder, type Preorder } from '@/services/api'
import { useCartStore } from './cart'

/**
 * El pedido que el cliente confirma en el kiosko y paga en caja. El API lo
 * reprecia contra el catálogo de la sucursal: el total del ticket es el suyo,
 * no el que calculó el carrito.
 */
export const useOrderStore = defineStore('order', () => {
  const preorder = ref<Preorder | null>(null)
  const submitting = ref(false)

  async function submit(customerName?: string): Promise<Preorder> {
    const cart = useCartStore()
    submitting.value = true
    try {
      preorder.value = await createPreorder(
        cart.items.map(i => ({
          product_id: Number(i.productId),
          productoatributo_id: i.variantId ?? null,
          quantity: i.quantity,
        })),
        customerName
      )
      return preorder.value
    } finally {
      submitting.value = false
    }
  }

  function reset() {
    preorder.value = null
  }

  return {
    preorder,
    submitting,
    submit,
    reset,
  }
})
