# MiTienda Kiosk - Sistema de Autoservicio

Sistema de punto de venta desatendido (kiosko) para MiTienda.pe, construido con Vue 3, TypeScript, Electron y Tailwind CSS.

## Características

- ✨ Interfaz táctil optimizada para pantallas grandes (1920x1080)
- 🎨 Diseño basado en los wireframes de Stitch
- ⚡ Alto rendimiento con Vue 3 Composition API
- 🔒 Modo kiosko seguro con Electron
- 💾 Gestión de estado con Pinia
- 🎯 Sistema de timeout de inactividad (45s)
- 🔄 Cache inteligente para reducir carga de red
- 🖨️ Integración con impresora térmica (ESC/POS)
- 💳 Integración con PinPad para pagos
- 📱 Soporte multiidioma (ES/EN)
- 🌙 Modo claro (modo oscuro deshabilitado para kiosko)

## Tecnologías

- **Frontend**: Vue 3 + TypeScript + Vite
- **UI Framework**: Tailwind CSS
- **State Management**: Pinia con persistencia
- **Routing**: Vue Router
- **Desktop**: Electron
- **HTTP Client**: Axios
- **Fonts**: Google Fonts (Spline Sans, Noto Sans)
- **Icons**: Material Symbols

## Estructura del Proyecto

```
mitienda-kiosk/
├── electron/              # Proceso principal de Electron
│   ├── main.js           # Configuración de ventana y IPC
│   └── preload.js        # Bridge seguro para renderer
├── src/
│   ├── assets/           # Estilos y recursos estáticos
│   ├── components/       # Componentes Vue reutilizables
│   ├── composables/      # Composables de Vue
│   ├── router/           # Configuración de rutas
│   ├── services/         # Servicios de API
│   ├── stores/           # Stores de Pinia
│   ├── types/            # Tipos TypeScript
│   ├── utils/            # Utilidades
│   ├── views/            # Vistas/Páginas
│   ├── App.vue           # Componente raíz
│   └── main.ts           # Punto de entrada
├── stitch/               # Diseños HTML de referencia
└── package.json
```

## Instalación

```bash
# Instalar dependencias
npm install

# O con yarn
yarn install
```

## Desarrollo

```bash
# Modo desarrollo web
npm run dev

# Modo desarrollo Electron (recomendado para kiosko)
npm run electron:dev
```

La aplicación se abrirá en `http://localhost:5173` para modo web, o en una ventana de Electron para modo kiosko.

## Build

```bash
# Build para producción (web)
npm run build

# Build para Electron Windows
npm run electron:build:win
```

## Configuración

Copia `.env.example` a `.env` y ajusta las variables:

```env
# API
VITE_API_URL=https://api2.mitienda.pe
VITE_API_TIMEOUT=30000

# Kiosk
VITE_KIOSK_ID=KIOSK_001
VITE_STORE_ID=1
VITE_BRANCH_NAME=Miraflores

# Timeouts (ms)
VITE_INACTIVITY_TIMEOUT=45000
VITE_PAYMENT_TIMEOUT=120000

# Features
VITE_ENABLE_UPSELLING=true
VITE_ENABLE_MULTI_LANGUAGE=true
```

## Flujo de Usuario

1. **Pantalla de Bienvenida** - Atrae al cliente con imágenes apetitosas
2. **Selección de Servicio** - "Comer aquí" o "Para llevar" + idioma
3. **Menú Principal** - Grid de productos con categorías
4. **Personalización** - Agregar/quitar ingredientes y extras
5. **Carrito** - Resumen del pedido con edición
6. **Upselling** - Sugerencias inteligentes antes de pagar
7. **Pago** - Selección de método y procesamiento
8. **Confirmación** - Número de pedido y ticket

## Integración con Hardware

El kiosko se comunica con hardware a través de un servicio sidecar:

```typescript
// Imprimir ticket
await window.electron.hardware.print({
  type: 'receipt',
  order: orderData,
  order_number: '#45',
  timestamp: new Date().toISOString()
})

// Procesar pago
const result = await window.electron.hardware.processPayment({
  order_id: order.id,
  amount: order.total,
  payment_method: 'card'
})
```

## Timeout de Inactividad

El sistema detecta inactividad y reinicia automáticamente después de 45 segundos:

- Monitoreo de eventos: touch, click, scroll
- Advertencia visual a los 30 segundos
- Reinicio automático con limpieza de estado
- Retorno a pantalla de bienvenida

## Modo Kiosko

En producción, Electron configura:

- Pantalla completa bloqueada
- Navegación deshabilitada
- Teclado físico bloqueado (F keys, Alt+F4, etc.)
- Watchdog para reinicio automático
- Logs de errores centralizados

## API Endpoints

```typescript
// Productos
GET /api/products
GET /api/products/:id
GET /api/categories/:id/products

// Órdenes
POST /api/orders
GET /api/orders/:id
PATCH /api/orders/:id/status

// Pagos
POST /api/payments
GET /api/payments/:id/status
```

## Métricas y KPIs

El sistema registra:

- Tasa de conversión (inicios / pagos completados)
- Tiempo promedio de ciclo
- Valor de ticket promedio
- Efectividad de upselling
- Uptime del kiosko

## Soporte

Para problemas o consultas:
- Email: soporte@mitienda.pe
- Docs: Ver [PDR.md](./PDR.md) para especificaciones completas

## Licencia

Propietario - MiTienda.pe © 2025
