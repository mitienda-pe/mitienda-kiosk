<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'
import { useTenantStore } from '@/stores/tenant'

const router = useRouter()
const cart = useCartStore()
const order = useOrderStore()
const tenant = useTenantStore()

const TOTAL_SECONDS = 10
const countdown = ref(TOTAL_SECONDS)
const progress = ref(0)
const showCheck = ref(false)
const showNumber = ref(false)
const showTicket = ref(false)
const showPrinting = ref(false)
const timerRef = ref<ReturnType<typeof setInterval> | null>(null)

const orderItems = ref([...cart.items])
const orderTotal = ref(cart.total)
const orderSubtotal = ref(cart.subtotal)
const orderIgv = ref(cart.igv)

const now = new Date()
const orderDate = computed(() => {
  const d = now
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
})

function formatPrice(price: number): string {
  return `S/ ${price.toFixed(2)}`
}

function goHome() {
  cleanup()
  cart.clear()
  order.reset()
  router.push('/')
}

function cleanup() {
  if (timerRef.value) clearInterval(timerRef.value)
}

onMounted(() => {
  if (!order.paymentComplete) {
    router.push('/')
    return
  }

  // Staggered animations
  setTimeout(() => { showCheck.value = true }, 200)
  setTimeout(() => { showNumber.value = true }, 600)
  setTimeout(() => { showTicket.value = true }, 1000)
  setTimeout(() => { showPrinting.value = true }, 1800)

  // Start countdown after ticket appears
  setTimeout(() => {
    timerRef.value = setInterval(() => {
      countdown.value--
      progress.value = ((TOTAL_SECONDS - countdown.value) / TOTAL_SECONDS) * 100
      if (countdown.value <= 0) {
        goHome()
      }
    }, 1000)
  }, 2000)
})

onUnmounted(cleanup)
</script>

<template>
  <div class="flex h-full min-h-screen w-full flex-col items-center bg-background-light overflow-y-auto hide-scrollbar">
    <div class="flex flex-1 flex-col items-center justify-center px-6 py-10 w-full max-w-md">
      <!-- Success check -->
      <transition name="bounce-in">
        <div v-if="showCheck" class="mb-5 flex flex-col items-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-[0_0_30px_rgba(249,245,6,0.4)] mb-4">
            <span class="material-symbols-outlined text-text-main text-[48px]">check</span>
          </div>
          <h1 class="text-2xl font-bold text-center">¡Pago Exitoso!</h1>
        </div>
      </transition>

      <!-- Order number -->
      <transition name="bounce-in">
        <div v-if="showNumber" class="w-full text-center mb-6">
          <p class="text-sm font-medium text-subtle-dark uppercase tracking-widest mb-1">Tu número de pedido</p>
          <div class="relative inline-block">
            <span class="absolute -inset-3 rounded-xl bg-primary/20 blur-xl"></span>
            <h2 class="relative text-[80px] leading-none font-bold tracking-tighter">
              #{{ order.orderNumber.toString().padStart(2, '0') }}
            </h2>
          </div>
        </div>
      </transition>

      <!-- Virtual ticket -->
      <transition name="ticket-slide">
        <div v-if="showTicket" class="w-full relative mb-6">
          <!-- Ticket top edge -->
          <div class="ticket-edge-top text-white"></div>

          <!-- Ticket body -->
          <div class="bg-white px-6 py-5">
            <!-- Header -->
            <div class="text-center mb-4">
              <h3 class="text-sm font-bold uppercase tracking-wider">{{ tenant.storeName }}</h3>
              <p class="text-xs text-subtle-dark">{{ tenant.branchName }}</p>
            </div>

            <div class="h-px bg-gray-200 mb-3"></div>

            <!-- Items -->
            <div class="space-y-2 mb-3">
              <div
                v-for="item in orderItems"
                :key="item.id"
                class="flex justify-between text-sm"
              >
                <span class="flex-1">{{ item.name }}<template v-if="item.variantLabel"> <span class="text-subtle-dark text-xs">({{ item.variantLabel }})</span></template> <span class="text-subtle-dark">x{{ item.quantity }}</span></span>
                <span class="font-medium ml-4">{{ formatPrice(item.price * item.quantity) }}</span>
              </div>
            </div>

            <div class="h-px bg-gray-200 mb-3"></div>

            <!-- Totals -->
            <div class="space-y-1 mb-3">
              <div class="flex justify-between text-sm">
                <span class="text-subtle-dark">Subtotal</span>
                <span>{{ formatPrice(orderSubtotal) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-subtle-dark">IGV (18%)</span>
                <span>{{ formatPrice(orderIgv) }}</span>
              </div>
              <div class="flex justify-between font-bold text-base pt-1">
                <span>TOTAL</span>
                <span>{{ formatPrice(orderTotal) }}</span>
              </div>
            </div>

            <div class="h-px bg-gray-200 mb-3"></div>

            <!-- Footer -->
            <div class="space-y-1 text-center text-xs text-subtle-dark">
              <p>Método: QR / Billetera digital</p>
              <p>{{ orderDate }}</p>
              <p class="font-medium text-text-main">Pedido #{{ order.orderNumber.toString().padStart(2, '0') }} — Para llevar</p>
            </div>
          </div>

          <!-- Ticket bottom edge -->
          <div class="ticket-edge-bottom text-white"></div>
        </div>
      </transition>

      <!-- Printing simulation -->
      <transition name="fade">
        <div v-if="showPrinting" class="flex items-center gap-3 mb-6">
          <span class="material-symbols-outlined text-subtle-dark animate-pulse">print</span>
          <p class="text-sm text-subtle-dark font-medium">Imprimiendo tu ticket...</p>
        </div>
      </transition>

      <!-- Countdown + progress bar -->
      <transition name="fade">
        <div v-if="showPrinting" class="w-full max-w-xs flex flex-col items-center gap-3">
          <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
          <p class="text-xs text-gray-400">
            Volviendo al inicio en {{ countdown }}s
          </p>
        </div>
      </transition>
    </div>

    <!-- Manual restart button -->
    <div class="px-8 pb-8 w-full max-w-md">
      <button
        @click="goHome"
        class="flex w-full items-center justify-center gap-2 rounded-2xl bg-text-main py-4 font-semibold text-white active:scale-[0.98] transition-transform"
      >
        Nuevo pedido
      </button>
    </div>
  </div>
</template>
