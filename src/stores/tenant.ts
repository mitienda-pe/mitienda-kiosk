import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchTenantInit, setTenantHeader } from '@/services/api'

export const useTenantStore = defineStore('tenant', () => {
  const tenantSlug = import.meta.env.VITE_DEV_TENANT || 'altea.mitienda.pe'
  const branchName = import.meta.env.VITE_BRANCH_NAME || 'Principal'

  const tiendaId = ref<number>(0)
  const storeName = ref('')
  const storeLogo = ref('')
  const storeSlug = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  async function init() {
    if (initialized.value) return
    loading.value = true
    error.value = null

    try {
      const data = await fetchTenantInit(tenantSlug)
      const t = data.tenant
      tiendaId.value = Number(t.tienda_id)
      storeName.value = t.tienda_nombre_comercial || 'MiTienda'
      storeLogo.value = data.appearance?.logotipo_url || data.appearance?.logo_url || ''
      storeSlug.value = t.tienda_nombreurl || ''
      setTenantHeader(t.tienda_id)
      initialized.value = true
    } catch {
      error.value = 'No se pudo conectar con la tienda'
      tiendaId.value = Number(import.meta.env.VITE_TENANT_ID) || 23083
      storeName.value = 'MiTienda Demo'
      setTenantHeader(tiendaId.value)
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  return {
    tiendaId,
    storeName,
    storeLogo,
    storeSlug,
    branchName,
    loading,
    error,
    initialized,
    init,
  }
})
