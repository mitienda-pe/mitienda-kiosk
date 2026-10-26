<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import JsBarcode from 'jsbarcode'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'
import { useTenantStore } from '@/stores/tenant'

/**
 * Pedido registrado: el cliente se lleva el ticket a la caja.
 *
 * El ticket lleva el número del día (K-042, para dictarlo) y un código de
 * barras Code 128 con el id de la pre-orden (MTK…), que la pistola del POS
 * teclea en su buscador. Code 128 y no QR: las pistolas láser de caja solo
 * leen códigos lineales.
 *
 * La impresión es silenciosa si Chrome corre con --kiosk --kiosk-printing.
 */

const router = useRouter()
const cart = useCartStore()
const order = useOrderStore()
const tenant = useTenantStore()

const TOTAL_SECONDS = 25
const countdown = ref(TOTAL_SECONDS)
const progress = ref(0)
const barcodeScreen = ref<SVGSVGElement | null>(null)
const barcodePrint = ref<SVGSVGElement | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

const preorder = computed(() => order.preorder)

const createdAt = computed(() => formatDateTime(preorder.value?.created_at))
const venceHora = computed(() => preorder.value?.vence_at?.slice(11, 16) || '')

function formatDateTime(value?: string | null): string {
  if (!value) return ''
  const [date, time] = value.split(' ')
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y} ${time?.slice(0, 5) || ''}`
}

function formatPrice(price: number): string {
  return `S/ ${price.toFixed(2)}`
}

function drawBarcodes() {
  if (!preorder.value) return
  const options = { format: 'CODE128', displayValue: false, margin: 0 }
  if (barcodeScreen.value) JsBarcode(barcodeScreen.value, preorder.value.scan_code, { ...options, height: 60, width: 2 })
  if (barcodePrint.value) JsBarcode(barcodePrint.value, preorder.value.scan_code, { ...options, height: 50, width: 1.6 })
}

function printTicket() {
  window.print()
}

function goHome() {
  cleanup()
  cart.clear()
  order.reset()
  router.push('/')
}

function cleanup() {
  if (timer) clearInterval(timer)
  timer = null
}

onMounted(async () => {
  if (!preorder.value) {
    router.replace('/')
    return
  }

  // El pedido ya está en el API: el carrito local ya no hace falta.
  cart.clear()

  await nextTick()
  drawBarcodes()
  setTimeout(printTicket, 300)

  timer = setInterval(() => {
    countdown.value--
    progress.value = ((TOTAL_SECONDS - countdown.value) / TOTAL_SECONDS) * 100
    if (countdown.value <= 0) goHome()
  }, 1000)
})

onUnmounted(cleanup)
</script>

<template>
  <div v-if="preorder" class="flex h-full min-h-screen w-full flex-col items-center bg-background-light overflow-y-auto hide-scrollbar">
    <div class="flex flex-1 flex-col items-center justify-center px-6 py-10 w-full max-w-md">
      <div class="mb-5 flex flex-col items-center">
        <div class="flex h-20 w-20 items-center justify-center rounded-full bg-primary mb-4">
          <span class="material-symbols-outlined text-text-main text-[48px]">receipt_long</span>
        </div>
        <h1 class="text-2xl font-bold text-center">¡Pedido registrado!</h1>
        <p class="mt-1 text-center text-subtle-dark">Acércate a caja con tu ticket para pagar</p>
      </div>

      <div class="w-full text-center mb-6">
        <p class="text-sm font-medium text-subtle-dark uppercase tracking-widest mb-1">Tu pedido</p>
        <h2 class="text-[72px] leading-none font-bold tracking-tighter">{{ preorder.codigo }}</h2>
      </div>

      <!-- Ticket en pantalla -->
      <div class="w-full relative mb-6">
        <div class="ticket-edge-top text-white"></div>
        <div class="bg-white px-6 py-5">
          <div class="space-y-2 mb-3">
            <div v-for="item in preorder.items" :key="`${item.product_id}-${item.productoatributo_id}`" class="flex justify-between text-sm">
              <span class="flex-1">{{ item.name }} <span class="text-subtle-dark">x{{ item.quantity }}</span></span>
              <span class="font-medium ml-4">{{ formatPrice(item.price * item.quantity) }}</span>
            </div>
          </div>
          <div class="h-px bg-gray-200 mb-3"></div>
          <div class="flex justify-between font-bold text-base">
            <span>Total a pagar</span>
            <span>{{ formatPrice(preorder.totales.total) }}</span>
          </div>
          <div class="mt-4 flex justify-center">
            <svg ref="barcodeScreen"></svg>
          </div>
          <p class="mt-3 text-center text-xs text-subtle-dark">
            Válido hasta las {{ venceHora }}. Muéstralo en caja.
          </p>
        </div>
        <div class="ticket-edge-bottom text-white"></div>
      </div>

      <button
        @click="printTicket"
        class="mb-6 flex items-center gap-2 text-sm font-semibold text-subtle-dark"
      >
        <span class="material-symbols-outlined">print</span>
        ¿No salió tu ticket? Imprimir otra vez
      </button>

      <div class="w-full max-w-xs flex flex-col items-center gap-3">
        <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full transition-all duration-1000 ease-linear" :style="{ width: `${progress}%` }"></div>
        </div>
        <p class="text-xs text-gray-400">Volviendo al inicio en {{ countdown }}s</p>
      </div>
    </div>

    <div class="px-8 pb-8 w-full max-w-md">
      <button
        @click="goHome"
        class="flex w-full items-center justify-center gap-2 rounded-2xl bg-text-main py-4 font-semibold text-white active:scale-[0.98] transition-transform"
      >
        Listo
      </button>
    </div>

    <!-- Ticket impreso (80 mm). Solo existe para @media print. -->
    <div class="print-ticket">
      <p class="pt-store">{{ tenant.storeName }}</p>
      <p class="pt-muted">{{ tenant.branchName }}</p>
      <p class="pt-muted">{{ createdAt }}</p>
      <hr />
      <p class="pt-label">PEDIDO</p>
      <p class="pt-code">{{ preorder.codigo }}</p>
      <hr />
      <table>
        <tr v-for="item in preorder.items" :key="`p-${item.product_id}-${item.productoatributo_id}`">
          <td>{{ item.quantity }} x {{ item.name }}</td>
          <td class="pt-amount">{{ formatPrice(item.price * item.quantity) }}</td>
        </tr>
      </table>
      <hr />
      <table>
        <tr class="pt-total">
          <td>TOTAL A PAGAR</td>
          <td class="pt-amount">{{ formatPrice(preorder.totales.total) }}</td>
        </tr>
      </table>
      <div class="pt-barcode"><svg ref="barcodePrint"></svg></div>
      <p class="pt-strong">Acércate a caja para pagar</p>
      <p class="pt-muted">Válido hasta las {{ venceHora }}</p>
      <p class="pt-muted">Este ticket no es un comprobante de pago.</p>
    </div>
  </div>
</template>
