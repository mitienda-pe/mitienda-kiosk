<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/order'
import { useTenantStore } from '@/stores/tenant'

const router = useRouter()
const order = useOrderStore()
const tenant = useTenantStore()

function selectTakeout() {
  order.setServiceType('takeout')
  router.push('/categories')
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="flex h-full min-h-screen w-full flex-col bg-background-light">
    <!-- Header -->
    <header class="flex items-center gap-4 px-6 pt-8 pb-4">
      <button
        @click="goBack"
        class="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
      >
        <span class="material-symbols-outlined text-text-main">arrow_back</span>
      </button>
      <div class="flex-1 text-center">
        <h1 class="text-xl font-bold">{{ tenant.storeName }}</h1>
        <p class="text-xs text-subtle-dark">{{ tenant.branchName }}</p>
      </div>
      <div class="w-12"></div>
    </header>

    <!-- Content -->
    <div class="flex flex-1 flex-col items-center justify-center px-6 pb-10">
      <h2 class="text-2xl font-bold text-center mb-2">¿Dónde vas a comer?</h2>
      <p class="text-subtle-dark text-center mb-10">Selecciona una opción para continuar</p>

      <div class="flex w-full max-w-lg flex-col gap-5">
        <!-- Dine in - disabled -->
        <button
          disabled
          class="relative flex items-center gap-5 rounded-2xl bg-white p-6 shadow-sm opacity-50 cursor-not-allowed"
        >
          <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <span class="material-symbols-outlined text-gray-400 text-[36px]">restaurant</span>
          </div>
          <div class="flex-1 text-left">
            <h3 class="text-lg font-bold text-gray-400">Comer aquí</h3>
            <p class="text-sm text-gray-300">Próximamente</p>
          </div>
          <span class="material-symbols-outlined text-gray-300">lock</span>
        </button>

        <!-- Takeout - enabled -->
        <button
          @click="selectTakeout"
          class="relative flex items-center gap-5 rounded-2xl bg-white p-6 shadow-md ring-2 ring-primary/50 hover:ring-primary hover:shadow-lg active:scale-[0.98] transition-all"
        >
          <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <span class="material-symbols-outlined text-text-main text-[36px]">shopping_bag</span>
          </div>
          <div class="flex-1 text-left">
            <h3 class="text-lg font-bold">Para llevar</h3>
            <p class="text-sm text-subtle-dark">Recoge tu pedido en el mostrador</p>
          </div>
          <span class="material-symbols-outlined text-primary">arrow_forward</span>

          <!-- Glow -->
          <div class="absolute -inset-1 rounded-2xl bg-primary/5 blur-xl -z-10"></div>
        </button>
      </div>
    </div>
  </div>
</template>
