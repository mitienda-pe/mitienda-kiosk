import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchKioskInfo, getDeviceKey, setDeviceKey } from '@/services/api'

/**
 * Identidad del kiosko: a qué tienda y sucursal pertenece. Ya no sale de
 * variables de entorno: el kiosko se activa una vez con el usuario de un
 * encargado y desde ahí el API la deduce de su llave de dispositivo.
 */
export const useTenantStore = defineStore('tenant', () => {
  const tiendaId = ref<number>(0)
  const storeName = ref('')
  const storeLogo = ref('')
  const branchName = ref('')
  const kioskName = ref('')
  const preorderTtlMinutes = ref(120)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)
  const activated = ref(Boolean(getDeviceKey()))

  const needsActivation = computed(() => !activated.value)

  /**
   * Carga la identidad del kiosko. Devuelve false si no se pudo (sin llave,
   * llave revocada o sin conexión); `needsActivation` distingue los casos.
   */
  async function init(): Promise<boolean> {
    if (!getDeviceKey()) {
      activated.value = false
      return false
    }

    loading.value = true
    error.value = null
    try {
      const info = await fetchKioskInfo()
      tiendaId.value = info.tienda.id
      storeName.value = info.tienda.nombre
      branchName.value = info.sucursal.nombre
      kioskName.value = info.kiosk.nombre
      preorderTtlMinutes.value = info.preorder_ttl_minutes
      initialized.value = true
      activated.value = true
      return true
    } catch {
      // El 401 lo atiende deactivate() vía el interceptor; aquí queda la falta de red.
      if (activated.value) error.value = 'No se pudo conectar con la tienda'
      return false
    } finally {
      loading.value = false
    }
  }

  function activate(key: string) {
    setDeviceKey(key)
    activated.value = true
    initialized.value = false
  }

  /** La llave ya no sirve (revocada o borrada): volver a la activación. */
  function deactivate() {
    setDeviceKey(null)
    activated.value = false
    initialized.value = false
    tiendaId.value = 0
  }

  return {
    tiendaId,
    storeName,
    storeLogo,
    branchName,
    kioskName,
    preorderTtlMinutes,
    loading,
    error,
    initialized,
    needsActivation,
    init,
    activate,
    deactivate,
  }
})
