<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTenantStore } from '@/stores/tenant'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'
import { useCatalogStore } from '@/stores/catalog'
import { onDeviceRejected } from '@/services/api'
import { FLOW } from '@/router'

const router = useRouter()
const tenant = useTenantStore()
const cart = useCartStore()
const order = useOrderStore()
const catalog = useCatalogStore()

const transitionName = ref('fade')
const initializing = ref(true)

router.beforeEach((to, from) => {
  const toIndex = FLOW.indexOf(to.name as string)
  const fromIndex = FLOW.indexOf(from.name as string)
  transitionName.value = toIndex >= fromIndex ? 'slide-left' : 'slide-right'
})

// La llave fue revocada o borrada: el kiosko deja de vender hasta reactivarse.
onDeviceRejected(() => {
  tenant.deactivate()
  cart.clear()
  order.reset()
  router.replace({ name: 'activate' })
})

// Inactividad: el siguiente cliente no debe encontrar el pedido del anterior.
let inactivityTimer: ReturnType<typeof setTimeout> | null = null
const INACTIVITY_TIMEOUT = Number(import.meta.env.VITE_INACTIVITY_TIMEOUT) || 90000

function resetInactivity() {
  if (inactivityTimer) clearTimeout(inactivityTimer)
  inactivityTimer = setTimeout(() => {
    const name = router.currentRoute.value.name
    if (name !== 'welcome' && name !== 'activate') {
      cart.clear()
      order.reset()
      router.push('/')
    }
  }, INACTIVITY_TIMEOUT)
}

async function start() {
  initializing.value = true
  if (await tenant.init()) {
    await catalog.load(true)
  }
  initializing.value = false
}

onMounted(async () => {
  await start()

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

  <!-- Sin conexión: nada de datos de ejemplo, solo reintentar -->
  <div
    v-else-if="!tenant.needsActivation && tenant.error"
    class="flex h-screen w-screen flex-col items-center justify-center gap-5 bg-background-light px-8 text-center"
  >
    <span class="material-symbols-outlined text-[56px] text-gray-300">wifi_off</span>
    <p class="text-lg font-semibold">{{ tenant.error }}</p>
    <p class="text-sm text-subtle-dark">Revisa la conexión a internet del kiosko.</p>
    <button
      @click="start"
      class="rounded-full bg-primary px-8 py-3.5 font-semibold text-text-main active:scale-95 transition-transform"
    >
      Reintentar
    </button>
  </div>

  <div v-else class="h-screen w-screen overflow-hidden">
    <router-view v-slot="{ Component }">
      <transition :name="transitionName" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>
