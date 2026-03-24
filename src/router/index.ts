import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'welcome', component: () => import('@/views/WelcomeView.vue') },
    { path: '/service', name: 'service', component: () => import('@/views/ServiceView.vue') },
    { path: '/categories', name: 'categories', component: () => import('@/views/CategoriesView.vue') },
    { path: '/menu/:categorySlug?', name: 'menu', component: () => import('@/views/MenuView.vue'), props: true },
    { path: '/product/:slug', name: 'product', component: () => import('@/views/ProductDetailView.vue'), props: true },
    { path: '/cart', name: 'cart', component: () => import('@/views/CartView.vue') },
    { path: '/upsell', name: 'upsell', component: () => import('@/views/UpsellView.vue') },
    { path: '/payment-method', name: 'payment-method', component: () => import('@/views/PaymentMethodView.vue') },
    { path: '/payment', name: 'payment', component: () => import('@/views/PaymentView.vue') },
    { path: '/confirmation', name: 'confirmation', component: () => import('@/views/ConfirmationView.vue') },
  ],
})

export default router
