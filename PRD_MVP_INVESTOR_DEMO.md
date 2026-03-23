# PRD — Kiosko de Autoservicio MiTienda (MVP Investor Demo)

**Versión:** 2.0
**Fecha:** 23 de Marzo, 2026
**Objetivo:** Demo funcional para inversionistas
**Stack:** Vue 3 + TypeScript + Vite + Tailwind CSS (web-only, sin Electron)
**Backend:** API pública de MiTienda (`/api/v1/storefront/*`)
**Duración estimada de demo:** ~60 segundos por pedido

---

## 1. Visión del MVP

Un kiosko de autoservicio tipo McDonald's que se conecta a **cualquier tienda de MiTienda** y permite al usuario navegar el catálogo, armar un pedido y simular el pago con QR — todo en una experiencia visual premium que transmita confianza a inversionistas.

### Lo que INCLUYE este MVP
1. Pantalla de bienvenida (attract loop)
2. Selección de servicio (solo "Para llevar" habilitado)
3. Catálogo real de una tienda (categorías + productos desde la API)
4. Agregar productos al carrito (con cantidad)
5. Resumen del pedido / carrito
6. Pantalla de pago con QR mock
7. Confirmación de éxito + simulación de impresión de ticket
8. Retorno automático al inicio

### Lo que NO incluye
- Electron / modo kiosk nativo
- Personalización de producto (variantes, extras)
- Upselling
- Pago real (pinpad, pasarela)
- Creación de orden en backend
- Autenticación / login de cliente
- Multi-idioma (solo español)
- Integración con hardware (impresora, POS)

---

## 2. Flujo de Pantallas (7 screens)

```
[1. Welcome] → [2. Service Type] → [3. Menu/Catálogo] → [4. Carrito] → [5. Pago QR] → [6. Éxito + Ticket] → [1. Welcome]
                                          ↑                    |
                                          └────────────────────┘
                                          (seguir comprando)
```

---

## 3. Especificación por Pantalla

### 3.1 — Pantalla de Bienvenida (`/`)

**Propósito:** Attract loop. Invitar al usuario a tocar la pantalla.

| Elemento | Detalle |
|----------|---------|
| Background | Imagen hero de alta calidad (comida/retail), gradient overlay oscuro |
| Logo | Logo de la tienda (desde API `tenant/init`) o "MiTienda.pe" |
| CTA | "Toca para ordenar" con animación `breath` (scale pulse) |
| Indicadores | Íconos de métodos de pago: Visa, MC, Yape, Plin (decorativo) |
| Navegación | Tap en cualquier lugar → Pantalla 2 |

**Datos de API:** `GET /api/v1/tenant/init?domain={store_slug}.mitienda.pe`
→ Logo, nombre de tienda, colores, configuración.

**UX:** Animación suave de entrada. Si pasa 60s sin interacción, mantener el attract loop.

---

### 3.2 — Selección de Servicio (`/service`)

**Propósito:** El usuario elige si come ahí o lleva. En MVP solo pickup.

| Elemento | Detalle |
|----------|---------|
| Card 1 | "Comer aquí" — ícono de plato — **deshabilitado** (grayed out, "Próximamente") |
| Card 2 | "Para llevar" — ícono de bolsa — **habilitado**, borde highlight primary |
| Transición | Al seleccionar → navega al menú con slide-left |

**Datos de API:** Ninguno (pantalla estática).

**UX:** Cards grandes (mínimo 200px de alto), touch-friendly. La card habilitada tiene un sutil glow amarillo.

---

### 3.3 — Menú / Catálogo (`/menu`)

**Propósito:** Core de la experiencia. Navegar productos y agregar al carrito.

**Layout:**

```
┌─────────────────────────────────────────┐
│  [←]    Nombre Tienda    [🛒 badge]     │  ← Header sticky
├─────────────────────────────────────────┤
│  [Todos] [Cat1] [Cat2] [Cat3] [...]     │  ← Categorías (scroll horizontal)
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐             │
│  │  imagen   │  │  imagen   │             │
│  │  nombre   │  │  nombre   │             │  ← Grid 2 columnas
│  │  S/29.90  │  │  S/15.00  │             │
│  │ [Agregar] │  │ [Agregar] │             │
│  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐             │
│  │   ...     │  │   ...     │             │
│  └──────────┘  └──────────┘             │
├─────────────────────────────────────────┤
│  [🛒 Ver mi pedido — 3 items — S/74.80] │  ← Floating bottom bar (solo si hay items)
└─────────────────────────────────────────┘
```

| Elemento | Detalle |
|----------|---------|
| Header | Botón back, nombre tienda, botón carrito con badge |
| Categorías | Pills horizontales scrolleables. "Todos" seleccionado por defecto |
| Product Card | Imagen (aspect 1:1, rounded-xl), nombre (max 2 líneas), precio, botón "Agregar" |
| Agregar | Al tocar "Agregar" → incrementa cantidad, muestra toast/micro-animación, actualiza badge carrito |
| Si ya está en carrito | Mostrar control +/- con cantidad actual en lugar de "Agregar" |
| Floating bar | Aparece con slide-up al tener ≥1 item. Muestra items totales y monto. Tap → Carrito |
| Empty state | Si no hay productos, mensaje amigable |

**Datos de API:**
- `GET /api/v1/storefront/categories?t={tienda_id}` → categorías
- `GET /api/v1/storefront/catalog?t={tienda_id}&limit=50&categoria={slug}` → productos

**UX:**
- Scroll suave, sin scrollbar visible
- Imagen de producto con fallback si no hay imagen
- Precio formateado: `S/ 29.90`
- Animación al agregar: la card hace un breve "pop" y el badge del carrito pulsa

---

### 3.4 — Carrito / Resumen (`/cart`)

**Propósito:** Revisar el pedido antes de pagar.

**Layout:**

```
┌─────────────────────────────────────────┐
│  [←]          Mi Pedido                 │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ [img] Hamburguesa Clásica           ││
│  │       S/ 29.90    [-] 2 [+]  S/59.80││
│  │                            [🗑]     ││
│  ├─────────────────────────────────────┤│
│  │ [img] Papas Grandes                 ││
│  │       S/ 15.00    [-] 1 [+]  S/15.00││
│  │                            [🗑]     ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  Subtotal                     S/ 74.80  │
│  IGV (18%)                    S/ 13.46  │
│  ─────────────────────────────────────  │
│  TOTAL                        S/ 74.80  │
├─────────────────────────────────────────┤
│       [ Ir a pagar — S/ 74.80 ]         │  ← CTA principal (primary, full-width)
│       [ Agregar más productos ]         │  ← Secundario (outline, vuelve al menú)
└─────────────────────────────────────────┘
```

| Elemento | Detalle |
|----------|---------|
| Item row | Thumbnail (48x48), nombre, precio unitario, qty control (+/-), subtotal, delete |
| Qty control | Botones redondos, mínimo 1. Al llegar a 0 → eliminar con confirmación |
| Totales | Subtotal, IGV (si la tienda incluye impuesto, solo mostrarlo), Total |
| CTA pagar | Botón grande, color primary, muestra total |
| Agregar más | Link/botón secundario → navega back al menú |
| Empty cart | Si no hay items, mostrar ilustración + "Tu pedido está vacío" + botón "Ver menú" |

**Datos de API:** Ninguno (estado local del carrito en Pinia).

**UX:**
- Swipe-to-delete en items (opcional, nice-to-have)
- Animación de eliminación (fade-out + collapse)
- El total se actualiza instantáneamente al cambiar cantidades

---

### 3.5 — Pantalla de Pago (`/payment`)

**Propósito:** Mostrar QR de pago (mock) y simular la confirmación.

**Layout:**

```
┌─────────────────────────────────────────┐
│  [←]         Pagar                      │
├─────────────────────────────────────────┤
│                                         │
│        Escanea el código QR             │
│        para pagar tu pedido             │
│                                         │
│         ┌─────────────────┐             │
│         │                 │             │
│         │    [QR CODE]    │             │
│         │    (mock)       │             │
│         │                 │             │
│         └─────────────────┘             │
│                                         │
│         Total: S/ 74.80                 │
│                                         │
│    ● ● ● Esperando confirmación...      │  ← Dots animados
│                                         │
│    ─── Progreso visual (6 seg) ───      │  ← Barra de progreso sutil
│                                         │
│       [ Cancelar ]                      │  ← Botón secundario
└─────────────────────────────────────────┘
```

| Elemento | Detalle |
|----------|---------|
| QR Code | Imagen estática de un QR (puede ser un SVG genérico o generado con qrcode lib). Tamaño grande (280x280px) |
| Instrucción | "Escanea el código QR con Yape, Plin o tu app bancaria" |
| Total | Monto total del pedido en grande |
| Espera | Animación de loading dots + texto "Esperando confirmación de pago..." |
| Timer | Barra de progreso circular o lineal que avanza durante 6 segundos |
| Auto-avance | Después de 6 segundos → transición automática a pantalla de éxito |
| Cancelar | Botón texto que vuelve al carrito |

**Datos de API:** Ninguno (mock completo).

**UX:**
- El QR debe verse real y profesional (usar librería `qrcode` para generar uno con el texto "mitienda-demo-payment")
- La espera de 6 segundos crea tensión realista — no debe sentirse como un bug
- La barra de progreso da feedback visual de que algo está pasando
- Transición suave al éxito (fade + scale)

---

### 3.6 — Confirmación + Ticket (`/confirmation`)

**Propósito:** Mostrar éxito, número de pedido y simular ticket impreso.

**Layout:**

```
┌─────────────────────────────────────────┐
│                                         │
│           ✓ (check animado)             │
│         ¡Pago Exitoso!                  │
│                                         │
│        Tu número de pedido              │
│             #45                         │  ← Número grande, bold
│                                         │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  ╎  🧾 TICKET DE COMPRA              ╎  │  ← Efecto papel recortado
│  ╎  ──────────────────────            ╎  │
│  ╎  Hamburguesa Clásica x2   S/59.80 ╎  │
│  ╎  Papas Grandes x1         S/15.00 ╎  │
│  ╎  ──────────────────────            ╎  │
│  ╎  TOTAL                    S/74.80  ╎  │
│  ╎  ──────────────────────            ╎  │
│  ╎  Método: QR / Yape                ╎  │
│  ╎  Fecha: 23/03/2026 14:32          ╎  │
│  ╎  Pedido: #45                       ╎  │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                                         │
│     🖨️ Imprimiendo tu ticket...         │  ← Animación de impresora
│                                         │
│     Volviendo al inicio en 8s           │  ← Countdown
└─────────────────────────────────────────┘
```

| Elemento | Detalle |
|----------|---------|
| Check | Círculo primary con check, animación de entrada (scale + fade) |
| Número de pedido | Generado random (1-99), display gigante `text-[80px]` |
| Ticket virtual | Card con borde jagged (efecto papel recortado, ya existe en stitch). Lista de items, total, fecha, método |
| Imprimiendo | Texto + animación de impresora (dots o ícono animado) |
| Countdown | "Volviendo al inicio en Xs..." (8 segundos) |
| Auto-redirect | Después del countdown → limpiar carrito → ir a Welcome |

**Datos de API:** Ninguno.

**UX:**
- Entrada triunfal: el check aparece con bounce, luego el número de pedido con scale-up
- El ticket aparece con slide-up como si saliera de una impresora
- Sonido de éxito (opcional, nice-to-have: beep corto)
- El countdown no debe presionar al usuario — es informativo

---

## 4. Arquitectura Técnica

### 4.1 Stack

| Layer | Tecnología |
|-------|------------|
| Framework | Vue 3 + Composition API (`<script setup lang="ts">`) |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 con tema custom |
| Estado | Pinia (con persist para carrito) |
| Router | Vue Router 4 (hash mode) |
| HTTP | Axios con interceptors |
| QR | Librería `qrcode` (generación client-side) |
| Icons | Material Symbols Outlined (Google Fonts) |
| Fonts | Spline Sans (display) + Noto Sans (body) |

### 4.2 Tema Visual

```js
colors: {
  primary: "#f9f506",         // Amarillo brillante — CTAs, badges, highlights
  "background-light": "#f8f8f5", // Fondo general
  "text-main": "#181811",        // Texto principal
  "surface-light": "#ffffff",    // Cards, modales
  "subtle": "#8c8b5f",          // Texto secundario
}
```

### 4.3 Stores (Pinia)

| Store | Responsabilidad |
|-------|----------------|
| `tenantStore` | Resuelve tienda por slug/domain, almacena config |
| `catalogStore` | Categorías y productos (fetch desde API) |
| `cartStore` | Items del carrito, cantidades, totales (persist localStorage) |
| `orderStore` | Número de pedido mock, tipo de servicio, estado de pago |

### 4.4 Endpoints a Consumir

```
GET  /api/v1/tenant/init?domain={slug}.mitienda.pe
     → Config de tienda (logo, nombre, colores)

GET  /api/v1/storefront/categories?t={tienda_id}
     → Lista de categorías

GET  /api/v1/storefront/catalog?t={tienda_id}&limit=50
     → Productos con imágenes y precios

GET  /api/v1/storefront/catalog?t={tienda_id}&categoria={slug}
     → Productos filtrados por categoría
```

### 4.5 Resolución de Tenant

Para el demo, el tenant se configura via variable de entorno:
```env
VITE_TENANT_SLUG=altea       # Slug de la tienda demo
VITE_API_URL=https://api2.mitienda.pe/api
```

Al iniciar la app:
1. `tenantStore.init()` llama a `tenant/init?domain=altea.mitienda.pe`
2. Guarda `tienda_id`, logo, nombre, colores
3. Todas las llamadas posteriores usan `?t={tienda_id}`

---

## 5. Consideraciones de Demo

### 5.1 Tienda Demo
Usar una tienda con buen catálogo visual (fotos de calidad, categorías organizadas). Candidatas:
- `altea` — tiene productos con buenas fotos
- Crear una tienda demo específica con productos tipo food court

### 5.2 Modo Presentación
- La app se abre en Chrome fullscreen (F11)
- Resolución óptima: 1080x1920 (vertical, estilo totem) o 1920x1080 (horizontal)
- Touch simulation en Chrome DevTools para la demo

### 5.3 Fallbacks
- Si la API no responde, mostrar productos mock hardcodeados
- Imágenes con lazy loading + placeholder blur

---

## 6. Plan de Implementación

### Fase 1 — Setup y Fundación (1 sesión)
- [ ] Crear proyecto desde cero (Vue 3 + Vite + Tailwind + Pinia + Router)
- [ ] Configurar tema visual (colores, fonts, animations)
- [ ] Crear stores (tenant, catalog, cart, order)
- [ ] Configurar Axios con interceptors para tenant

### Fase 2 — Pantallas Estáticas (1 sesión)
- [ ] Welcome screen con attract loop
- [ ] Service selection (pickup only)
- [ ] Layout base y transiciones entre pantallas

### Fase 3 — Catálogo y Carrito (1-2 sesiones)
- [ ] Integración con API de catálogo
- [ ] Grid de productos con categorías
- [ ] Lógica de agregar al carrito
- [ ] Vista de carrito con +/- y totales
- [ ] Floating cart bar en el menú

### Fase 4 — Pago y Confirmación (1 sesión)
- [ ] Pantalla de QR mock con timer de 6s
- [ ] Pantalla de confirmación con ticket virtual
- [ ] Simulación de impresión
- [ ] Auto-redirect con countdown
- [ ] Limpieza de estado

### Fase 5 — Polish (1 sesión)
- [ ] Transiciones y micro-animaciones
- [ ] Responsive para modo vertical (totem) y horizontal
- [ ] Fallback data si API no responde
- [ ] Testing del flujo completo end-to-end
- [ ] Preparar tienda demo con datos atractivos

---

## 7. Métricas de Éxito del Demo

| Métrica | Target |
|---------|--------|
| Tiempo de pedido completo | < 60 segundos |
| Fluidez (sin jank visual) | 60fps constantes |
| Carga inicial del catálogo | < 2 segundos |
| Impresión general | "Esto se ve real y profesional" |
| Reacción del inversionista | "¿Cuándo lo lanzamos?" |
