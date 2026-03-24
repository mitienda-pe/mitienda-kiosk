<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useOrderStore, type PaymentMethod } from '@/stores/order'

const router = useRouter()
const cart = useCartStore()
const order = useOrderStore()

const selected = ref<PaymentMethod | null>(null)

interface MethodOption {
  id: PaymentMethod
  icon: string
  title: string
  subtitle: string
  tags?: string[]
}

const methods: MethodOption[] = [
  {
    id: 'qr',
    icon: 'qr_code_2',
    title: 'QR — Billetera digital',
    subtitle: 'Escanea con tu celular y paga al instante',
    tags: ['Yape', 'Plin', 'App bancaria'],
  },
  {
    id: 'card',
    icon: 'credit_card',
    title: 'Tarjeta de crédito o débito',
    subtitle: 'Acerca o inserta tu tarjeta en el lector',
    tags: ['Visa', 'Mastercard', 'AMEX'],
  },
  {
    id: 'link',
    icon: 'link',
    title: 'Link de pago',
    subtitle: 'Recibe un enlace en tu celular para pagar',
    tags: ['SMS', 'WhatsApp'],
  },
]

function select(method: PaymentMethod) {
  selected.value = method
}

function confirm() {
  if (!selected.value) return
  order.setPaymentMethod(selected.value)
  router.push('/payment')
}

function goBack() {
  router.push('/upsell')
}

function formatPrice(price: number): string {
  return `S/ ${price.toFixed(2)}`
}
</script>

<template>
  <div class="flex h-full min-h-screen w-full flex-col bg-background-light">
    <!-- Header -->
    <header class="flex items-center gap-4 px-6 pt-8 pb-4">
      <button
        @click="goBack"
        class="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
      >
        <span class="material-symbols-outlined text-text-main">arrow_back</span>
      </button>
      <h1 class="flex-1 text-center text-xl font-bold">Método de pago</h1>
      <div class="w-11"></div>
    </header>

    <!-- Total -->
    <div class="px-6 pb-5">
      <div class="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm">
        <div>
          <p class="text-xs text-subtle-dark font-medium uppercase tracking-wide">Total a pagar</p>
          <p class="text-2xl font-bold mt-0.5">{{ formatPrice(cart.total) }}</p>
        </div>
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <span class="material-symbols-outlined text-text-main text-[28px]">receipt_long</span>
        </div>
      </div>
    </div>

    <!-- Title -->
    <div class="px-6 pb-4">
      <h2 class="text-lg font-bold">¿Cómo deseas pagar?</h2>
    </div>

    <!-- Payment methods -->
    <div class="flex-1 overflow-y-auto hide-scrollbar px-5 pb-32">
      <div class="space-y-3">
        <button
          v-for="method in methods"
          :key="method.id"
          @click="select(method.id)"
          class="flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all active:scale-[0.98]"
          :class="selected === method.id
            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
            : 'border-gray-100 bg-white shadow-sm'"
        >
          <!-- Icon -->
          <div
            class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl transition-colors"
            :class="selected === method.id ? 'bg-primary' : 'bg-gray-100'"
          >
            <span
              class="material-symbols-outlined text-[28px]"
              :class="selected === method.id ? 'text-text-main' : 'text-subtle-dark'"
            >{{ method.icon }}</span>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold leading-snug">{{ method.title }}</h3>
              <!-- Check -->
              <div
                v-if="selected === method.id"
                class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary"
              >
                <span class="material-symbols-outlined text-text-main text-[16px]">check</span>
              </div>
            </div>
            <p class="text-sm text-subtle-dark mt-0.5 leading-snug">{{ method.subtitle }}</p>
            <!-- Tags -->
            <div v-if="method.tags" class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-for="tag in method.tags"
                :key="tag"
                class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-subtle-dark"
              >{{ tag }}</span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- CTA -->
    <div class="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background-light via-background-light to-transparent px-6 pb-8 pt-4">
      <button
        @click="confirm"
        :disabled="!selected"
        class="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-lg transition-all active:scale-[0.98]"
        :class="selected
          ? 'bg-primary text-text-main shadow-lg shadow-primary/20'
          : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
      >
        <span class="material-symbols-outlined text-[22px]">lock</span>
        Pagar {{ formatPrice(cart.total) }}
      </button>
    </div>
  </div>
</template>
