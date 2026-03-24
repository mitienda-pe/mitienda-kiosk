<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTenantStore } from '@/stores/tenant'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'

const router = useRouter()
const tenant = useTenantStore()
const cart = useCartStore()
const order = useOrderStore()

const transitionName = ref('fade')
const initializing = ref(true)

router.beforeEach((to, from) => {
  const routes = ['welcome', 'service', 'categories', 'menu', 'product', 'cart', 'upsell', 'payment-method', 'payment', 'confirmation']
  const toIndex = routes.indexOf(to.name as string)
  const fromIndex = routes.indexOf(from.name as string)
  transitionName.value = toIndex >= fromIndex ? 'slide-left' : 'slide-right'
})

// Inactivity monitor
let inactivityTimer: ReturnType<typeof setTimeout> | null = null
const INACTIVITY_TIMEOUT = 90000

function resetInactivity() {
  if (inactivityTimer) clearTimeout(inactivityTimer)
  inactivityTimer = setTimeout(() => {
    if (router.currentRoute.value.name !== 'welcome') {
      cart.clear()
      order.reset()
      router.push('/')
    }
  }, INACTIVITY_TIMEOUT)
}

onMounted(async () => {
  await tenant.init()
  initializing.value = false

  const events = ['touchstart', 'mousedown', 'scroll', 'keypress']
  events.forEach(event => {
    document.addEventListener(event, resetInactivity, { passive: true })
  })
  resetInactivity()
})
</script>

<template>
  <div v-if="initializing" class="flex h-screen w-screen items-center justify-center bg-background-light">
    <div class="flex flex-col items-center gap-4">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p class="text-sm text-subtle-dark font-medium">Iniciando kiosko...</p>
    </div>
  </div>

  <div v-else class="h-screen w-screen overflow-hidden">
    <router-view v-slot="{ Component }">
      <transition :name="transitionName" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>
