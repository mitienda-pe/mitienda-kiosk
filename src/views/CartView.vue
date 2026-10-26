<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'
import { PreorderRejected } from '@/services/api'

const router = useRouter()
const cart = useCartStore()
const order = useOrderStore()

const error = ref<string | null>(null)
const unavailable = ref<string[]>([])

function formatPrice(price: number): string {
  return `S/ ${price.toFixed(2)}`
}

function goBack() {
  router.push('/menu')
}

/**
 * Registra el pedido. Si algo se agotó mientras el cliente elegía, se ajusta
 * el carrito a lo disponible y se le avisa antes de reintentar.
 */
async function confirmOrder() {
  if (cart.isEmpty || order.submitting) return
  error.value = null
  unavailable.value = []

  try {
    await order.submit()
    router.push('/confirmation')
  } catch (e) {
    if (e instanceof PreorderRejected) {
      if (e.unavailable.length) {
        for (const item of e.unavailable) {
          const id = item.productoatributo_id ? `${item.product_id}-${item.productoatributo_id}` : String(item.product_id)
          if (item.available > 0) {
            const line = cart.items.find(i => i.id === id)
            if (line) line.quantity = item.available
          } else {
            cart.removeItem(id)
          }
          unavailable.value.push(item.available > 0 ? `${item.name}: solo quedan ${item.available}` : `${item.name}: agotado`)
        }
        error.value = 'Ajustamos tu pedido porque algunos productos ya no tienen stock.'
      } else {
        error.value = e.message
      }
    } else {
      error.value = 'No pudimos registrar tu pedido. Inténtalo otra vez o acércate a caja.'
    }
  }
}
</script>

<template>
  <div class="flex h-full min-h-screen w-full flex-col bg-background-light">
    <!-- Header -->
    <header class="flex items-center gap-4 px-6 pt-8 pb-4 border-b border-gray-100">
      <button
        @click="goBack"
        class="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
      >
        <span class="material-symbols-outlined text-text-main">arrow_back</span>
      </button>
      <div class="flex-1">
        <h1 class="text-xl font-bold">Mi Pedido</h1>
        <p class="text-xs text-subtle-dark">{{ cart.itemCount }} {{ cart.itemCount === 1 ? 'producto' : 'productos' }}</p>
      </div>
    </header>

    <!-- Empty cart -->
    <div v-if="cart.isEmpty" class="flex flex-1 flex-col items-center justify-center px-8">
      <div class="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 mb-5">
        <span class="material-symbols-outlined text-[48px] text-gray-300">shopping_cart</span>
      </div>
      <h2 class="text-xl font-bold mb-2">Tu pedido está vacío</h2>
      <p class="text-subtle-dark text-center mb-8">Agrega productos para comenzar</p>
      <button
        @click="goBack"
        class="rounded-full bg-primary px-8 py-3.5 font-semibold text-text-main active:scale-95 transition-transform shadow-sm"
      >
        Ver productos
      </button>
    </div>

    <!-- Cart items -->
    <div v-else class="flex flex-1 flex-col">
      <div class="flex-1 overflow-y-auto hide-scrollbar px-5 py-4">
        <TransitionGroup name="fade" tag="div" class="flex flex-col gap-3">
          <div
            v-for="item in cart.items"
            :key="item.id"
            class="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm"
          >
            <!-- Thumbnail -->
            <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50">
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.name"
                class="h-full w-full object-cover"
              />
              <div v-else class="flex h-full w-full items-center justify-center">
                <span class="material-symbols-outlined text-gray-300">image</span>
              </div>
            </div>

            <!-- Info -->
            <div class="flex flex-1 flex-col gap-2">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h3 class="text-sm font-semibold leading-tight line-clamp-2">{{ item.name }}</h3>
                  <p v-if="item.variantLabel" class="text-xs text-subtle-dark mt-0.5">{{ item.variantLabel }}</p>
                </div>
                <button
                  @click="cart.removeItem(item.id)"
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-red-50 active:scale-90 transition-all"
                >
                  <span class="material-symbols-outlined text-[18px] text-gray-400">delete</span>
                </button>
              </div>

              <div class="flex items-center justify-between">
                <p class="text-sm font-bold">{{ formatPrice(item.price * item.quantity) }}</p>

                <!-- Qty control -->
                <div class="flex items-center gap-2">
                  <button
                    @click="cart.decrement(item.id)"
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 active:scale-90 transition-transform"
                  >
                    <span class="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                  <span class="w-6 text-center text-sm font-bold">{{ item.quantity }}</span>
                  <button
                    @click="cart.increment(item.id)"
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-primary active:scale-90 transition-transform"
                  >
                    <span class="material-symbols-outlined text-[18px] text-text-main">add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Totals & CTA -->
      <div class="border-t border-gray-100 bg-white px-6 pt-5 pb-8">
        <div class="mb-5">
          <div class="flex justify-between">
            <span class="text-base font-bold">Total</span>
            <span class="text-lg font-bold">{{ formatPrice(cart.total) }}</span>
          </div>
          <p class="mt-1 text-xs text-subtle-dark">Pagas en caja con el ticket que vas a recibir.</p>
        </div>

        <div v-if="error" class="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <p class="font-semibold">{{ error }}</p>
          <ul v-if="unavailable.length" class="mt-1 list-disc pl-5">
            <li v-for="line in unavailable" :key="line">{{ line }}</li>
          </ul>
        </div>

        <button
          @click="confirmOrder"
          :disabled="order.submitting || cart.isEmpty"
          class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-text-main text-lg shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          <span class="material-symbols-outlined">{{ order.submitting ? 'hourglass_top' : 'receipt_long' }}</span>
          {{ order.submitting ? 'Registrando pedido…' : `Confirmar pedido — ${formatPrice(cart.total)}` }}
        </button>

        <button
          @click="goBack"
          class="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 py-3.5 font-semibold text-subtle-dark active:scale-[0.98] transition-transform"
        >
          <span class="material-symbols-outlined outlined text-[18px]">add</span>
          Agregar más productos
        </button>
      </div>
    </div>
  </div>
</template>
