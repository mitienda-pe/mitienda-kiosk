import { createRouter, createWebHashHistory } from 'vue-router'
import { useTenantStore } from '@/stores/tenant'

// Flujo: bienvenida → categorías → productos → pedido → ticket. El pago no
// ocurre aquí: el cliente paga en la caja con el ticket.
export const FLOW = ['welcome', 'categories', 'menu', 'product', 'cart', 'confirmation']

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'welcome', component: () => import('@/views/WelcomeView.vue') },
    { path: '/activar', name: 'activate', component: () => import('@/views/ActivateView.vue') },
    { path: '/categories', name: 'categories', component: () => import('@/views/CategoriesView.vue') },
    { path: '/menu/:categoryId?', name: 'menu', component: () => import('@/views/MenuView.vue'), props: true },
    { path: '/product/:slug', name: 'product', component: () => import('@/views/ProductDetailView.vue'), props: true },
    { path: '/cart', name: 'cart', component: () => import('@/views/CartView.vue') },
    { path: '/confirmation', name: 'confirmation', component: () => import('@/views/ConfirmationView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const tenant = useTenantStore()
  if (tenant.needsActivation && to.name !== 'activate') {
    return { name: 'activate' }
  }
  if (!tenant.needsActivation && to.name === 'activate') {
    return { name: 'welcome' }
  }
})

export default router
