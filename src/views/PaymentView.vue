<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'

const router = useRouter()
const cart = useCartStore()
const order = useOrderStore()

const progress = ref(0)
const PAYMENT_DURATION = 6000
const intervalRef = ref<ReturnType<typeof setInterval> | null>(null)
const timerRef = ref<ReturnType<typeof setTimeout> | null>(null)

function formatPrice(price: number): string {
  return `S/ ${price.toFixed(2)}`
}

function cancel() {
  cleanup()
  router.push('/payment-method')
}

function cleanup() {
  if (intervalRef.value) clearInterval(intervalRef.value)
  if (timerRef.value) clearTimeout(timerRef.value)
}

onMounted(() => {
  if (cart.isEmpty) {
    router.push('/menu')
    return
  }

  const startTime = Date.now()

  intervalRef.value = setInterval(() => {
    const elapsed = Date.now() - startTime
    progress.value = Math.min((elapsed / PAYMENT_DURATION) * 100, 100)
  }, 50)

  timerRef.value = setTimeout(() => {
    cleanup()
    order.completePayment()
    router.push('/confirmation')
  }, PAYMENT_DURATION)
})

onUnmounted(cleanup)
</script>

<template>
  <div class="flex h-full min-h-screen w-full flex-col bg-background-light">
    <!-- Header -->
    <header class="flex items-center gap-4 px-6 pt-8 pb-4">
      <button
        @click="cancel"
        class="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
      >
        <span class="material-symbols-outlined text-text-main">arrow_back</span>
      </button>
      <h1 class="flex-1 text-center text-xl font-bold">Pagar</h1>
      <div class="w-11"></div>
    </header>

    <!-- Content -->
    <div class="flex flex-1 flex-col items-center justify-center px-8">
      <!-- Instruction -->
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold mb-2">Escanea el código QR</h2>
        <p class="text-subtle-dark">para pagar tu pedido con Yape, Plin o tu app bancaria</p>
      </div>

      <!-- QR Code -->
      <div class="relative mb-8">
        <div class="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl"></div>
        <div class="relative rounded-2xl bg-white p-6 shadow-xl">
          <!-- Mock QR using inline SVG pattern -->
          <svg viewBox="0 0 200 200" class="h-64 w-64" xmlns="http://www.w3.org/2000/svg">
            <!-- Outer frame -->
            <rect x="10" y="10" width="50" height="50" rx="5" fill="#181811"/>
            <rect x="15" y="15" width="40" height="40" rx="3" fill="white"/>
            <rect x="22" y="22" width="26" height="26" rx="2" fill="#181811"/>

            <rect x="140" y="10" width="50" height="50" rx="5" fill="#181811"/>
            <rect x="145" y="15" width="40" height="40" rx="3" fill="white"/>
            <rect x="152" y="22" width="26" height="26" rx="2" fill="#181811"/>

            <rect x="10" y="140" width="50" height="50" rx="5" fill="#181811"/>
            <rect x="15" y="145" width="40" height="40" rx="3" fill="white"/>
            <rect x="22" y="152" width="26" height="26" rx="2" fill="#181811"/>

            <!-- Data modules (decorative pattern) -->
            <rect x="70" y="10" width="8" height="8" fill="#181811"/>
            <rect x="86" y="10" width="8" height="8" fill="#181811"/>
            <rect x="102" y="10" width="8" height="8" fill="#181811"/>
            <rect x="118" y="10" width="8" height="8" fill="#181811"/>

            <rect x="70" y="26" width="8" height="8" fill="#181811"/>
            <rect x="86" y="26" width="8" height="8" fill="#181811"/>
            <rect x="110" y="26" width="8" height="8" fill="#181811"/>
            <rect x="126" y="26" width="8" height="8" fill="#181811"/>

            <rect x="70" y="42" width="8" height="8" fill="#181811"/>
            <rect x="94" y="42" width="8" height="8" fill="#181811"/>
            <rect x="118" y="42" width="8" height="8" fill="#181811"/>

            <rect x="10" y="70" width="8" height="8" fill="#181811"/>
            <rect x="26" y="70" width="8" height="8" fill="#181811"/>
            <rect x="42" y="70" width="8" height="8" fill="#181811"/>
            <rect x="70" y="70" width="8" height="8" fill="#181811"/>
            <rect x="86" y="70" width="8" height="8" fill="#181811"/>
            <rect x="102" y="70" width="8" height="8" fill="#181811"/>
            <rect x="118" y="70" width="8" height="8" fill="#181811"/>
            <rect x="150" y="70" width="8" height="8" fill="#181811"/>
            <rect x="166" y="70" width="8" height="8" fill="#181811"/>
            <rect x="182" y="70" width="8" height="8" fill="#181811"/>

            <rect x="10" y="86" width="8" height="8" fill="#181811"/>
            <rect x="34" y="86" width="8" height="8" fill="#181811"/>
            <rect x="58" y="86" width="8" height="8" fill="#181811"/>
            <rect x="78" y="86" width="8" height="8" fill="#181811"/>
            <rect x="94" y="86" width="8" height="8" fill="#181811"/>
            <rect x="118" y="86" width="8" height="8" fill="#181811"/>
            <rect x="142" y="86" width="8" height="8" fill="#181811"/>
            <rect x="166" y="86" width="8" height="8" fill="#181811"/>

            <rect x="10" y="102" width="8" height="8" fill="#181811"/>
            <rect x="26" y="102" width="8" height="8" fill="#181811"/>
            <rect x="50" y="102" width="8" height="8" fill="#181811"/>
            <rect x="70" y="102" width="8" height="8" fill="#181811"/>
            <rect x="86" y="102" width="8" height="8" fill="#181811"/>
            <rect x="110" y="102" width="8" height="8" fill="#181811"/>
            <rect x="134" y="102" width="8" height="8" fill="#181811"/>
            <rect x="150" y="102" width="8" height="8" fill="#181811"/>
            <rect x="174" y="102" width="8" height="8" fill="#181811"/>

            <rect x="10" y="118" width="8" height="8" fill="#181811"/>
            <rect x="42" y="118" width="8" height="8" fill="#181811"/>
            <rect x="58" y="118" width="8" height="8" fill="#181811"/>
            <rect x="86" y="118" width="8" height="8" fill="#181811"/>
            <rect x="102" y="118" width="8" height="8" fill="#181811"/>
            <rect x="126" y="118" width="8" height="8" fill="#181811"/>
            <rect x="158" y="118" width="8" height="8" fill="#181811"/>
            <rect x="182" y="118" width="8" height="8" fill="#181811"/>

            <!-- Bottom right data -->
            <rect x="70" y="142" width="8" height="8" fill="#181811"/>
            <rect x="94" y="142" width="8" height="8" fill="#181811"/>
            <rect x="118" y="142" width="8" height="8" fill="#181811"/>
            <rect x="142" y="142" width="8" height="8" fill="#181811"/>
            <rect x="166" y="142" width="8" height="8" fill="#181811"/>

            <rect x="70" y="158" width="8" height="8" fill="#181811"/>
            <rect x="86" y="158" width="8" height="8" fill="#181811"/>
            <rect x="110" y="158" width="8" height="8" fill="#181811"/>
            <rect x="134" y="158" width="8" height="8" fill="#181811"/>
            <rect x="158" y="158" width="8" height="8" fill="#181811"/>
            <rect x="182" y="158" width="8" height="8" fill="#181811"/>

            <rect x="70" y="174" width="8" height="8" fill="#181811"/>
            <rect x="102" y="174" width="8" height="8" fill="#181811"/>
            <rect x="126" y="174" width="8" height="8" fill="#181811"/>
            <rect x="150" y="174" width="8" height="8" fill="#181811"/>
            <rect x="174" y="174" width="8" height="8" fill="#181811"/>

            <rect x="86" y="182" width="8" height="8" fill="#181811"/>
            <rect x="110" y="182" width="8" height="8" fill="#181811"/>
            <rect x="142" y="182" width="8" height="8" fill="#181811"/>
            <rect x="166" y="182" width="8" height="8" fill="#181811"/>
          </svg>
        </div>
      </div>

      <!-- Total -->
      <div class="text-center mb-8">
        <p class="text-sm text-subtle-dark mb-1">Total a pagar</p>
        <p class="text-3xl font-bold">{{ formatPrice(cart.total) }}</p>
      </div>

      <!-- Waiting indicator -->
      <div class="flex items-center gap-3 mb-6">
        <div class="flex gap-1.5">
          <div class="h-2.5 w-2.5 rounded-full bg-primary" style="animation: pulse-dot 1.4s infinite ease-in-out both; animation-delay: 0s;"></div>
          <div class="h-2.5 w-2.5 rounded-full bg-primary" style="animation: pulse-dot 1.4s infinite ease-in-out both; animation-delay: 0.2s;"></div>
          <div class="h-2.5 w-2.5 rounded-full bg-primary" style="animation: pulse-dot 1.4s infinite ease-in-out both; animation-delay: 0.4s;"></div>
        </div>
        <p class="text-sm text-subtle-dark font-medium">Esperando confirmación de pago...</p>
      </div>

      <!-- Progress bar -->
      <div class="w-full max-w-xs h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-primary rounded-full transition-all duration-100 ease-linear"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>

    <!-- Cancel -->
    <div class="px-8 pb-10 pt-4">
      <button
        @click="cancel"
        class="flex w-full items-center justify-center rounded-2xl border-2 border-gray-200 py-3.5 font-semibold text-subtle-dark active:scale-[0.98] transition-transform"
      >
        Cancelar
      </button>
    </div>
  </div>
</template>
