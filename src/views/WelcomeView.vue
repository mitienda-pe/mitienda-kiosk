<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTenantStore } from '@/stores/tenant'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'
import heroFallback from '@/assets/hero-welcome.jpg'

const router = useRouter()
const tenant = useTenantStore()
const cart = useCartStore()
const order = useOrderStore()

const heroImage = import.meta.env.VITE_HERO_IMAGE || heroFallback

function start() {
  cart.clear()
  order.reset()
  router.push('/service')
}
</script>

<template>
  <div class="relative flex h-full min-h-screen w-full flex-col overflow-hidden" @click="start">
    <!-- Background hero image -->
    <div class="absolute inset-0 z-0">
      <div
        class="h-full w-full bg-cover bg-center transition-transform duration-[20s] ease-linear scale-105"
        :style="{ backgroundImage: `url('${heroImage}')` }"
      ></div>
      <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/80"></div>
    </div>

    <!-- Top bar -->
    <div class="relative z-20 flex items-center justify-between px-8 pt-10">
      <div class="flex items-center gap-3">
        <img
          v-if="tenant.storeLogo"
          :src="tenant.storeLogo"
          :alt="tenant.storeName"
          class="h-10 w-10 rounded-full object-cover bg-white shadow-lg"
        />
        <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg">
          <span class="material-symbols-outlined text-text-main text-xl">storefront</span>
        </div>
        <div>
          <h2 class="text-lg font-bold text-white drop-shadow-lg">{{ tenant.storeName }}</h2>
          <p class="text-xs text-white/70 font-medium">{{ tenant.branchName }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-2">
        <span class="text-xs font-medium text-white/90">Español</span>
      </div>
    </div>

    <!-- Center content -->
    <div class="relative z-20 flex flex-1 flex-col items-center justify-center px-8">
      <!-- Main CTA -->
      <div class="flex flex-col items-center text-center">
        <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-[0_0_40px_rgba(249,245,6,0.4)] animate-breath">
          <span class="material-symbols-outlined text-text-main text-[40px]">touch_app</span>
        </div>
        <h1 class="text-4xl font-bold text-white drop-shadow-lg mb-3">
          Toca para ordenar
        </h1>
        <p class="text-lg text-white/70 font-light">
          Haz tu pedido en segundos
        </p>
      </div>
    </div>

    <!-- Bottom section -->
    <div class="relative z-20 px-8 pb-10">
      <!-- Payment methods decorative -->
      <div class="flex items-center justify-center gap-6 mb-6">
        <div class="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2">
          <span class="text-xs font-medium text-white/80">Yape</span>
        </div>
        <div class="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2">
          <span class="text-xs font-medium text-white/80">Plin</span>
        </div>
        <div class="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2">
          <span class="text-xs font-medium text-white/80">Visa</span>
        </div>
        <div class="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2">
          <span class="text-xs font-medium text-white/80">MC</span>
        </div>
      </div>

      <p class="text-center text-xs text-white/40">
        Powered by MiTienda.pe
      </p>
    </div>
  </div>
</template>
