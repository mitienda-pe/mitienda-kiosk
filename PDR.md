# Product Design Requirements (PDR) - Kiosko de Autoservicio Retail/Food

**Versión:** 1.0
**Fecha:** 14 de Diciembre, 2025
**Estado:** Draft / Aprobación
**Target:** Windows Kiosk Mode (Vue 3 + Electron)
**Backend:** MiTienda.pe
**Autor:** Product Design & Solutions Architect Team

---

## 1. Visión del Producto

### 1.1 Objetivo del Kiosko
Crear un punto de venta desatendido de alto rendimiento que permita a los clientes realizar pedidos y pagos de forma autónoma en menos de 90 segundos. El sistema debe replicar la eficiencia operativa de los líderes de la industria (McDonald’s/Starbucks) adaptada al ecosistema de **MiTienda.pe**.

### 1.2 Problema que Resuelve
* **Fricción Operativa:** Eliminación de colas en horas pico.
* **Costos:** Reducción de carga operativa en el personal de caja.
* **Revenue:** Aumento del ticket promedio mediante *upselling* programado y visual.

### 1.3 Principios de Diseño
1.  **Velocidad sobre estética:** Si una animación retrasa el flujo 200ms, se elimina. La UI responde instantáneamente.
2.  **Cero Fricción Cognitiva:** El usuario nunca debe preguntarse "¿qué hago ahora?". Un solo camino claro hacia el pago.
3.  **Resiliencia:** El kiosko debe operar 24/7 sin degradación de memoria y recuperarse solo ante fallos.

---

## 2. Usuarios y Escenarios de Uso

### 2.1 Perfil de Usuario
* **General:** Desde nativos digitales hasta adultos mayores.
* **Contexto:** Prisa, hambre/necesidad inmediata, manos ocupadas.
* **Habilidad Tecnológica:** Variable (Asumir nivel bajo/nulo).

### 2.2 Casos de Uso Principales (Happy Path)
1.  **El Explorador:** Navega por el menú visualmente, personaliza un ítem, paga y retira ticket.
2.  **El Habitual:** Busca un producto específico, omite personalización, paga rápido.

### 2.3 Casos de Error (Unhappy Path)
1.  **Abandono:** Usuario deja el kiosko a mitad del pedido -> *Timeout* y reinicio automático.
2.  **Fallo de Pago:** Tarjeta rechazada -> Mensaje claro, opción de reintentar o cambiar método.
3.  **Hardware Error:** Impresora sin papel -> Alerta discreta en UI y log al sistema central.

---

## 3. Flujo Funcional (End-to-End)

### 3.1 Pantalla de Bienvenida (Attract Loop)
* **Contenido:** Video o carrusel de imágenes de alta apetitosidad.
* **Acción:** "Toca para ordenar" (zona táctil 100% pantalla).

### 3.2 Selección de Tipo de Servicio
* Opciones: "Comer aquí" vs "Para llevar".
* Selección rápida de Idioma.

### 3.3 Menú Principal (Grid Layout)
* **Categorías:** Barra lateral o superior fija.
* **Productos:** Cards grandes (mín. 300x400px). Foto protagonista, Nombre, Precio.
* **Acción:** Botón "Agregar" o "Personalizar".

### 3.4 Personalización de Producto
* Interfaz modal.
* Lógica tipo McDonald’s: Quitar ingredientes / Agregar extras (con precio).
* Feedback inmediato en el precio total.

### 3.5 Upselling Inteligente
* **Trigger:** Al pulsar "Pagar".
* **Lógica:** Sugerencia de complementos de bajo costo.
* **UX:** Opción "No, gracias" visible pero secundaria.

### 3.6 Carrito / Resumen
* Lista vertical scrolleable.
* Edición rápida de cantidades (+/-).
* **CTA Principal:** "Pagar S/ XXX.XX" (Alto contraste, zona inferior derecha).

### 3.7 Pago (Integración Pinpad)
1.  Selección de método (Tarjeta, QR, Efectivo).
2.  Instrucción visual (animación de inserción de tarjeta).
3.  Estado de espera (bloqueante).

### 3.8 Pantalla Final y Ticket
* Mensaje de éxito con número de pedido.
* Animación de impresión.
* Cuenta regresiva (5s) para retorno al inicio.

---

## 4. Requerimientos de UX/UI

### 4.1 Ergonomía Táctil
* **Zona de Interacción:** Concentrar botones entre el 30% y 70% de la altura.
* **Touch Targets:** Mínimo 60x60mm físicos. Separación de 20px.

### 4.2 Jerarquía Visual
1.  Fotografía del producto.
2.  Precio.
3.  Nombre.
4.  Descripción.

### 4.3 Feedback
* **Visual:** Estado `active` inmediato al tocar.
* **Sonoro:** Feedback auditivo suave al agregar productos.
* **Bloqueo:** Overlay transparente con loader en peticiones API.

---

## 5. Requerimientos Técnicos

### 5.1 Arquitectura Frontend
* **Stack:** Vue 3 (Composition API) + Vite + Electron.
* **State:** Pinia (Persistencia en `localStorage`).
* **Router:** Vue Router (Hash mode).

### 5.2 Comunicación con MiTienda.pe
* **Proxy Layer:** Electron `main process` actúa como proxy seguro (oculta API Keys).
* **Estrategia:** *Stale-while-revalidate* para catálogo de productos.

### 5.3 Seguridad
* Sin login de usuario final.
* Token de API de "Terminal" autenticado al inicio.

---

## 6. Integración con Hardware

### 6.1 Estrategia: Sidecar Service
* **Arquitectura:** Electron UI <-> HTTP Localhost <-> Microservicio Windows (.NET/Node).
* **Objetivo:** Desacoplar UI de drivers inestables.

### 6.2 Impresión (ESC/POS)
* Comandos RAW directos (no HTML/PDF).
* Librería sugerida: `node-escpos` o servicio .NET intermedio.

### 6.3 Pinpad
* Integración vía DLL propietaria o Serial.
* Modelo asíncrono (Polling de estado).

---

## 7. Modo Kiosko en Windows

### 7.1 Configuración OS
* **Shell Replacement:** Electron reemplaza a `explorer.exe`.
* **Bloqueos:** Deshabilitar gestos de borde, notificaciones y actualizaciones automáticas.

### 7.2 Resiliencia
* **Watchdog:** Script externo que reinicia la app si el proceso muere.

---

## 8. Performance y Estabilidad

### 8.1 Gestión de Memoria
* Reinicio programado diario (ej. 04:00 AM).
* Limpieza estricta de eventos en Vue `onUnmounted`.

### 8.2 Métricas de Rendimiento
* Cambio de pantalla: < 100ms.
* Imágenes: WebP + Lazy Loading.

---

## 9. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| **Pérdida de Internet** | Crítico | Modo "Offline limitado" (informativo) o caché agresivo. |
| **Crash de App** | Alto | Watchdog script (< 5s recuperación). |
| **Usuario bloqueado** | Medio | Timeout de inactividad (45s). |
| **Touch no responde** | Alto | Cursor oculto activo + Acceso remoto (AnyDesk). |

---

## 10. KPIs y Métricas

1.  **Tasa de Conversión:** (Inicios / Pagos).
2.  **Tiempo de Ciclo:** (Inicio -> Ticket).
3.  **Ticket Promedio:** vs Mostrador.
4.  **Uptime:** Disponibilidad operativa.

---

## 11. Roadmap Sugerido

* **Fase 1 (MVP):** Catálogo, Carrito, Pago Pinpad, Ticket simple.
* **Fase 2 (Retail):** Upselling, Personalización avanzada, Optimización imágenes.
* **Fase 3 (Futuro):** Escaneo de lealtad (QR/DNI), Reconocimiento facial.