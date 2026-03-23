# Guía de Implementación - MiTienda Kiosk

## ✅ Estado Actual del Proyecto

### Archivos Creados y Configurados

#### Configuración Base
- ✅ `package.json` - Dependencias y scripts
- ✅ `.gitignore` - Exclusiones de git
- ✅ `.env` y `.env.example` - Variables de entorno
- ✅ `tsconfig.json` - Configuración TypeScript
- ✅ `vite.config.ts` - Configuración de Vite
- ✅ `tailwind.config.js` - Configuración de Tailwind CSS
- ✅ `postcss.config.js` - PostCSS para Tailwind

#### Electron
- ✅ `electron/main.js` - Proceso principal configurado con modo kiosk
- ✅ `electron/preload.js` - Bridge seguro para APIs de hardware

#### Estructura de Vue 3
- ✅ `index.html` - Entrada HTML
- ✅ `src/main.ts` - Punto de entrada de Vue
- ✅ `src/App.vue` - Componente raíz
- ✅ `src/assets/main.css` - Estilos globales con Tailwind

#### Tipos TypeScript
- ✅ `src/types/index.ts` - Tipos completos (Product, Order, Cart, Payment, etc.)

#### Servicios de API
- ✅ `src/utils/axios.ts` - Cliente HTTP configurado
- ✅ `src/utils/cache.ts` - Sistema de cache
- ✅ `src/services/productService.ts` - Servicio de productos
- ✅ `src/services/orderService.ts` - Servicio de órdenes
- ✅ `src/services/paymentService.ts` - Servicio de pagos

#### Stores de Pinia
- ✅ `src/stores/app.ts` - Estado global de la aplicación
- ✅ `src/stores/product.ts` - Gestión de productos y categorías
- ✅ `src/stores/cart.ts` - Gestión del carrito con persistencia
- ✅ `src/stores/order.ts` - Gestión de órdenes y pagos

#### Router
- ✅ `src/router/index.ts` - Configuración de rutas

#### Componentes
- ✅ `src/components/InactivityMonitor.vue` - Monitor de timeout (45s)

#### Vistas
- ✅ `src/views/WelcomeView.vue` - Pantalla de bienvenida (COMPLETA)
- ✅ `src/views/ServiceSelectionView.vue` - Selección de servicio e idioma (COMPLETA)
- 🔨 `src/views/MenuView.vue` - Placeholder (NECESITA IMPLEMENTACIÓN)
- 🔨 `src/views/ProductCustomizeView.vue` - Placeholder (NECESITA IMPLEMENTACIÓN)
- 🔨 `src/views/CartView.vue` - Placeholder (NECESITA IMPLEMENTACIÓN)
- 🔨 `src/views/UpsellView.vue` - Placeholder (NECESITA IMPLEMENTACIÓN)
- 🔨 `src/views/PaymentView.vue` - Placeholder (NECESITA IMPLEMENTACIÓN)
- 🔨 `src/views/ConfirmationView.vue` - Placeholder (NECESITA IMPLEMENTACIÓN)

---

## 🔨 Tareas Pendientes

### 1. Implementar Vistas Restantes

Cada vista tiene un diseño HTML de referencia en la carpeta `stitch/`. Debes:

1. Abrir el archivo HTML en `stitch/[nombre-de-pantalla]/code.html`
2. Copiar la estructura HTML dentro del `<template>` de la vista Vue
3. Convertir las clases de Tailwind a sintaxis de Vue
4. Agregar la lógica en el `<script setup>`
5. Conectar con los stores correspondientes

#### Vista del Menú (`src/views/MenuView.vue`)
**Referencia:** `stitch/menú_principal/code.html`

Componentes necesarios:
- Header con categorías horizontales
- Grid de productos
- Floating cart button
- Product cards con imagen, nombre, precio
- Botón "Agregar" por producto

Stores a usar:
```typescript
const productStore = useProductStore()
const cartStore = useCartStore()
const router = useRouter()

// Cargar productos al montar
onMounted(async () => {
  await productStore.fetchProducts()
  await productStore.fetchCategories()
})

// Agregar al carrito
const addToCart = (product: Product) => {
  cartStore.addItem({
    product_id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
    image: product.image
  })
}

// Ir a personalizar producto
const customizeProduct = (productId: number) => {
  router.push(`/product/${productId}`)
}
```

#### Vista de Personalización (`src/views/ProductCustomizeView.vue`)
**Referencia:** `stitch/personalización_de_producto/code.html`

Funcionalidades:
- Mostrar imagen del producto
- Lista de ingredientes (quitar/agregar)
- Extras con precio adicional
- Contador de cantidad
- Botón "Agregar al pedido" con precio total

Stores a usar:
```typescript
const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const cartStore = useCartStore()

const productId = Number(route.params.id)
const customizations = ref<Customization[]>([])
const quantity = ref(1)

onMounted(async () => {
  await productStore.fetchProductById(productId)
})

const addToCart = () => {
  cartStore.addItem({
    product_id: productStore.currentProduct!.id,
    name: productStore.currentProduct!.name,
    price: productStore.currentProduct!.price,
    quantity: quantity.value,
    image: productStore.currentProduct!.image,
    customizations: customizations.value
  })
  router.push('/menu')
}
```

#### Vista del Carrito (`src/views/CartView.vue`)
**Referencia:** `stitch/carrito_/_resumen/code.html`

Funcionalidades:
- Lista de items con foto, nombre, precio
- Botones +/- para cantidad
- Botón eliminar item
- Resumen: Subtotal, IGV, Total
- Botón "Pagar"

Stores a usar:
```typescript
const cartStore = useCartStore()
const router = useRouter()

const goToUpsell = () => {
  if (cartStore.isEmpty) {
    return
  }

  const enableUpselling = import.meta.env.VITE_ENABLE_UPSELLING === 'true'

  if (enableUpselling) {
    router.push('/upsell')
  } else {
    router.push('/payment')
  }
}
```

#### Vista de Upselling (`src/views/UpsellView.vue`)
**Referencia:** `stitch/upselling_inteligente/code.html`

Funcionalidades:
- Modal centrado con overlay
- Producto sugerido con imagen
- Precio con descuento
- Selector de tamaño (opcional)
- Botón "Sí, agregar"
- Botón "No gracias, continuar"
- Countdown visual de 15 segundos

Stores a usar:
```typescript
const router = useRouter()
const cartStore = useCartStore()
const productStore = useProductStore()

const upsellProduct = ref<Product | null>(null)
const countdown = ref(15)

onMounted(async () => {
  // Obtener producto sugerido (simulación)
  const featured = await productService.getFeatured()
  upsellProduct.value = featured[0] || null

  // Iniciar countdown
  const interval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(interval)
      skipUpsell()
    }
  }, 1000)
})

const acceptUpsell = () => {
  if (upsellProduct.value) {
    cartStore.addItem({
      product_id: upsellProduct.value.id,
      name: upsellProduct.value.name,
      price: upsellProduct.value.price * 0.7, // Descuento
      quantity: 1,
      image: upsellProduct.value.image
    })
  }
  router.push('/payment')
}

const skipUpsell = () => {
  router.push('/payment')
}
```

#### Vista de Pago (`src/views/PaymentView.vue`)
**Referencia:** `stitch/pantalla_de_pago/code.html`

Funcionalidades:
- Total a pagar prominente
- Radio buttons para método de pago
- Instrucciones visuales (insertar tarjeta, etc.)
- Botón "Pagar"
- Overlay de procesamiento

Stores a usar:
```typescript
const router = useRouter()
const orderStore = useOrderStore()
const cartStore = useCartStore()

const paymentMethod = ref<PaymentMethod>('card')
const isProcessing = ref(false)

const processPayment = async () => {
  try {
    isProcessing.value = true

    // Crear orden
    const order = await orderStore.createOrder()

    // Procesar pago
    orderStore.setPaymentMethod(paymentMethod.value)
    const paymentResult = await orderStore.processPayment()

    if (paymentResult.success) {
      router.push('/confirmation')
    }
  } catch (error) {
    console.error('Payment failed:', error)
    // Mostrar error al usuario
  } finally {
    isProcessing.value = false
  }
}
```

#### Vista de Confirmación (`src/views/ConfirmationView.vue`)
**Referencia:** `stitch/confirmación_y_ticket/code.html`

Funcionalidades:
- Check icon de éxito
- Número de orden grande
- Ticket virtual con detalles
- Countdown de 5 segundos
- Botón "Iniciar nuevo pedido"
- Auto-redirección a Welcome

Stores a usar:
```typescript
const router = useRouter()
const orderStore = useOrderStore()
const cartStore = useCartStore()

const countdown = ref(5)

onMounted(() => {
  // Imprimir ticket
  orderStore.printReceipt()

  // Countdown
  const interval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(interval)
      resetAndGoHome()
    }
  }, 1000)
})

const resetAndGoHome = () => {
  cartStore.clear()
  orderStore.reset()
  router.push('/')
}
```

---

## 🚀 Comandos para Ejecutar

### Desarrollo Web
```bash
npm run dev
```
Abre en: http://localhost:5173

### Desarrollo Electron (Recomendado)
```bash
npm run electron:dev
```
Abre la ventana de Electron en modo desarrollo con DevTools.

### Build para Producción
```bash
# Build web
npm run build

# Build para Windows
npm run electron:build:win
```

---

## 🔧 Configuración del API

Edita el archivo `.env` para apuntar a tu API de MiTienda:

```env
VITE_API_URL=https://api2.mitienda.pe
```

Si necesitas probar sin backend, puedes crear datos mock:

```typescript
// src/services/mockData.ts
export const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Hamburguesa Royal',
    description: 'Carne angus, huevo frito, queso cheddar',
    price: 18.90,
    stock: 50,
    category_id: 1,
    image: 'URL_DE_IMAGEN',
    is_featured: true,
    is_available: true
  },
  // ... más productos
]
```

---

## 📱 Integración de Hardware

### Impresora Térmica

El servicio de hardware debe escuchar en `http://localhost:3001`:

```javascript
// Ejemplo de servicio Node.js para impresora
const express = require('express')
const escpos = require('escpos')

app.post('/print', (req, res) => {
  const { order, order_number } = req.body

  // Imprimir con ESC/POS
  const device = new escpos.USB()
  const printer = new escpos.Printer(device)

  device.open(() => {
    printer
      .text(`Pedido #${order_number}`)
      .text('-------------------')
      // ... más líneas
      .cut()
      .close()
  })

  res.json({ success: true })
})
```

### PinPad

Similar para el PinPad:

```javascript
app.post('/payment', async (req, res) => {
  const { amount, payment_method } = req.body

  // Comunicación con DLL del PinPad
  // Esto depende del modelo específico

  res.json({
    success: true,
    transaction_id: 'TXN-123',
    auth_code: 'AUTH-ABC'
  })
})
```

---

## 🧪 Testing

1. **Probar flujo completo:**
   - Welcome → Service Selection → Menu → Product Customize → Cart → Upsell → Payment → Confirmation

2. **Probar timeout:**
   - Dejar inactivo 30 segundos
   - Debe mostrar warning
   - A los 45 segundos debe volver a Welcome

3. **Probar carrito:**
   - Agregar productos
   - Modificar cantidades
   - Eliminar items
   - Verificar persistencia (refresh)

---

## 📚 Recursos Adicionales

### Documentación
- [Vue 3](https://vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Electron](https://www.electronjs.org/)

### Diseños de Referencia
Todos los diseños HTML están en la carpeta `stitch/`:
- `pantalla_de_bienvenida/code.html`
- `selección_de_servicio_e_idioma/code.html`
- `menú_principal/code.html`
- `personalización_de_producto/code.html`
- `carrito_/_resumen/code.html`
- `upselling_inteligente/code.html`
- `pantalla_de_pago/code.html`
- `confirmación_y_ticket/code.html`

---

## 🐛 Solución de Problemas Comunes

### Error: Cannot find module '@/...'
Asegúrate que el alias `@` está configurado en `vite.config.ts` y `tsconfig.json`.

### Electron no abre
Verifica que Vite esté corriendo en puerto 5173 antes de abrir Electron.

### Tailwind no funciona
Ejecuta: `npm install -D tailwindcss postcss autoprefixer`

### API CORS error
Configura CORS en tu backend de MiTienda o usa proxy en Vite:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api2.mitienda.pe',
        changeOrigin: true
      }
    }
  }
})
```

---

## ✅ Checklist Final

Antes de producción:

- [ ] Todas las vistas implementadas
- [ ] Flujo completo funciona
- [ ] Timeout de inactividad probado
- [ ] Integración con API real
- [ ] Hardware (impresora + pinpad) conectado
- [ ] Modo kiosk funcionando en Windows
- [ ] Imágenes optimizadas (WebP)
- [ ] Performance < 100ms entre pantallas
- [ ] Watchdog configurado para reinicio diario
- [ ] Logs centralizados
- [ ] Variables de entorno en producción

---

¡Buena suerte con la implementación! 🚀
