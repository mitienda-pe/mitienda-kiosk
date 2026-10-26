<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTenantStore } from '@/stores/tenant'
import { useCatalogStore } from '@/stores/catalog'
import {
  login,
  fetchUserStores,
  selectStore,
  fetchBranches,
  activateDevice,
  apiErrorMessage,
  type StoreOption,
  type BranchOption,
} from '@/services/api'

/**
 * Activación del kiosko, una sola vez por equipo.
 *
 * Un encargado entra con su usuario del panel, elige tienda y sucursal, y el
 * kiosko recibe su llave de dispositivo. Los tokens del encargado viven solo
 * aquí, en memoria: no se guardan y se pierden al salir de la pantalla. Lo que
 * queda en el equipo es la llave, que solo sirve para el catálogo de esa
 * sucursal y para crear pedidos.
 */

const router = useRouter()
const tenant = useTenantStore()
const catalog = useCatalogStore()

type Step = 'login' | 'store' | 'branch'

const step = ref<Step>('login')
const busy = ref(false)
const error = ref<string | null>(null)

const email = ref('')
const password = ref('')

let userToken = ''
let storeToken = ''

const stores = ref<StoreOption[]>([])
const branches = ref<BranchOption[]>([])
const selectedBranch = ref<number | null>(null)
const kioskName = ref('')

async function run(action: () => Promise<void>, fallback: string) {
  busy.value = true
  error.value = null
  try {
    await action()
  } catch (e) {
    error.value = apiErrorMessage(e, (e as Error)?.message || fallback)
  } finally {
    busy.value = false
  }
}

function submitLogin() {
  if (!email.value || !password.value) return
  run(async () => {
    userToken = await login(email.value.trim(), password.value)
    password.value = ''
    stores.value = await fetchUserStores(userToken)
    if (stores.value.length === 0) {
      throw new Error('Este usuario no administra ninguna tienda')
    }
    if (stores.value.length === 1) {
      await chooseStoreNow(stores.value[0].id)
    } else {
      step.value = 'store'
    }
  }, 'No se pudo iniciar sesión')
}

async function chooseStoreNow(storeId: number) {
  storeToken = await selectStore(userToken, storeId)
  branches.value = await fetchBranches(storeToken)
  if (branches.value.length === 0) {
    throw new Error('La tienda no tiene sucursales registradas')
  }
  selectedBranch.value = branches.value.length === 1 ? branches.value[0].id : null
  step.value = 'branch'
}

function chooseStore(storeId: number) {
  run(() => chooseStoreNow(storeId), 'No se pudo abrir la tienda')
}

function submitActivation() {
  if (!selectedBranch.value) return
  run(async () => {
    const key = await activateDevice(storeToken, selectedBranch.value!, kioskName.value.trim())
    userToken = ''
    storeToken = ''
    tenant.activate(key)
    if (!(await tenant.init())) {
      throw new Error(tenant.error || 'El kiosko se activó pero no pudo conectarse')
    }
    await catalog.load(true)
    router.replace({ name: 'welcome' })
  }, 'No se pudo activar el kiosko')
}

function backToLogin() {
  userToken = ''
  storeToken = ''
  step.value = 'login'
  error.value = null
}
</script>

<template>
  <div class="flex h-full min-h-screen w-full flex-col items-center justify-center bg-background-light px-6 overflow-y-auto">
    <div class="w-full max-w-md py-10">
      <div class="mb-8 flex flex-col items-center text-center">
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <span class="material-symbols-outlined text-text-main text-[32px]">point_of_sale</span>
        </div>
        <h1 class="text-2xl font-bold">Activar kiosko</h1>
        <p class="mt-1 text-sm text-subtle-dark">
          Lo hace un encargado de la tienda, una sola vez por equipo.
        </p>
      </div>

      <div v-if="error" class="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ error }}
      </div>

      <!-- 1. Usuario del panel -->
      <form v-if="step === 'login'" class="space-y-4" @submit.prevent="submitLogin">
        <label class="block">
          <span class="mb-1.5 block text-sm font-semibold">Correo</span>
          <input
            v-model="email"
            type="email"
            autocomplete="username"
            required
            class="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-base outline-none focus:border-text-main"
          />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-semibold">Contraseña</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-base outline-none focus:border-text-main"
          />
        </label>
        <button
          type="submit"
          :disabled="busy"
          class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-bold text-text-main active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {{ busy ? 'Entrando…' : 'Continuar' }}
        </button>
        <p class="text-center text-xs text-subtle-dark">
          Usa tu usuario del panel de administración. Los usuarios de caja no pueden activar kioskos.
        </p>
      </form>

      <!-- 2. Tienda (si administra varias) -->
      <div v-else-if="step === 'store'" class="space-y-3">
        <p class="mb-2 text-sm font-semibold">¿Para qué tienda es este kiosko?</p>
        <button
          v-for="store in stores"
          :key="store.id"
          :disabled="busy"
          @click="chooseStore(store.id)"
          class="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-left shadow-sm active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          <span class="font-semibold">{{ store.name }}</span>
          <span class="material-symbols-outlined text-subtle-dark">chevron_right</span>
        </button>
        <button @click="backToLogin" class="w-full py-3 text-sm font-semibold text-subtle-dark">Volver</button>
      </div>

      <!-- 3. Sucursal y nombre -->
      <form v-else class="space-y-4" @submit.prevent="submitActivation">
        <div>
          <p class="mb-2 text-sm font-semibold">¿En qué sucursal está?</p>
          <p class="mb-3 text-xs text-subtle-dark">Los pedidos se cobran en la caja de esta sucursal.</p>
          <div class="space-y-2">
            <button
              v-for="branch in branches"
              :key="branch.id"
              type="button"
              @click="selectedBranch = branch.id"
              class="flex w-full items-center justify-between rounded-2xl border-2 bg-white px-5 py-4 text-left transition-colors"
              :class="selectedBranch === branch.id ? 'border-text-main' : 'border-transparent shadow-sm'"
            >
              <span class="font-semibold">{{ branch.name }}</span>
              <span v-if="selectedBranch === branch.id" class="material-symbols-outlined">check_circle</span>
            </button>
          </div>
        </div>
        <label class="block">
          <span class="mb-1.5 block text-sm font-semibold">Nombre del kiosko <span class="font-normal text-subtle-dark">(opcional)</span></span>
          <input
            v-model="kioskName"
            type="text"
            maxlength="100"
            placeholder="Ej. Kiosko entrada"
            class="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-base outline-none focus:border-text-main"
          />
        </label>
        <button
          type="submit"
          :disabled="busy || !selectedBranch"
          class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-bold text-text-main active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {{ busy ? 'Activando…' : 'Activar kiosko' }}
        </button>
        <button type="button" @click="backToLogin" class="w-full py-3 text-sm font-semibold text-subtle-dark">Cancelar</button>
      </form>
    </div>
  </div>
</template>
