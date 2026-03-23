<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTenantStore } from '@/stores/tenant'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'

const router = useRouter()
const route = useRoute()
const tenant = useTenantStore()
const cart = useCartStore()
const order = useOrderStore()

const transitionName = ref('fade')
const initializing = ref(true)

// Demo mode: ?demo=true in URL shows the kiosk inside a device frame
const demoMode = computed(() => route.query.demo === 'true')

router.beforeEach((to, from) => {
  const routes = ['welcome', 'service', 'categories', 'menu', 'product', 'cart', 'upsell', 'payment', 'confirmation']
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
  <!-- DEMO MODE: kiosk inside a device frame -->
  <div v-if="demoMode" class="demo-backdrop">
    <div class="demo-device">
      <!-- Device bezel top -->
      <div class="demo-bezel-top">
        <div class="demo-camera"></div>
      </div>

      <!-- Screen -->
      <div class="demo-screen">
        <div v-if="initializing" class="flex h-full w-full items-center justify-center bg-background-light">
          <div class="flex flex-col items-center gap-4">
            <div class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p class="text-sm text-subtle-dark font-medium">Iniciando kiosko...</p>
          </div>
        </div>
        <div v-else class="h-full w-full overflow-hidden">
          <router-view v-slot="{ Component }">
            <transition :name="transitionName" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>

      <!-- Device bezel bottom -->
      <div class="demo-bezel-bottom">
        <div class="demo-home-indicator"></div>
      </div>
    </div>

    <!-- Label -->
    <div class="demo-label">
      <p class="text-sm font-bold text-white/90">MiTienda Kiosk</p>
      <p class="text-xs text-white/50">Totem de autoservicio — Demo interactiva</p>
    </div>
  </div>

  <!-- NORMAL MODE: fullscreen -->
  <template v-else>
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
</template>

<style>
/* Demo mode styles */
.demo-backdrop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 1.5rem;
  overflow: hidden;
}

.demo-device {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  height: calc(100vh - 8rem);
  height: calc(100dvh - 8rem);
  max-height: 780px;
  border-radius: 2.5rem;
  overflow: hidden;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.1),
    0 25px 60px rgba(0, 0, 0, 0.5),
    0 0 120px rgba(249, 245, 6, 0.05);
  background: #111;
}

.demo-bezel-top {
  flex-shrink: 0;
  height: 2rem;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
}

.demo-camera {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #333;
  box-shadow: inset 0 0 2px rgba(0,0,0,0.5);
}

.demo-screen {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: #f8f8f5;
}

.demo-screen > div {
  position: absolute;
  inset: 0;
}

.demo-bezel-bottom {
  flex-shrink: 0;
  height: 1.5rem;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
}

.demo-home-indicator {
  width: 36%;
  height: 4px;
  border-radius: 2px;
  background: #444;
}

.demo-label {
  text-align: center;
}
</style>
