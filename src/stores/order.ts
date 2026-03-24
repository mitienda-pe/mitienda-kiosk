import { defineStore } from 'pinia'
import { ref } from 'vue'

export type PaymentMethod = 'qr' | 'card' | 'link'

export const useOrderStore = defineStore('order', () => {
  const serviceType = ref<'takeout' | 'dine_in'>('takeout')
  const paymentMethod = ref<PaymentMethod>('qr')
  const orderNumber = ref(0)
  const paymentComplete = ref(false)

  function setServiceType(type: 'takeout' | 'dine_in') {
    serviceType.value = type
  }

  function setPaymentMethod(method: PaymentMethod) {
    paymentMethod.value = method
  }

  function generateOrderNumber() {
    orderNumber.value = Math.floor(Math.random() * 99) + 1
  }

  function completePayment() {
    paymentComplete.value = true
    generateOrderNumber()
  }

  function reset() {
    serviceType.value = 'takeout'
    paymentMethod.value = 'qr'
    orderNumber.value = 0
    paymentComplete.value = false
  }

  return {
    serviceType,
    paymentMethod,
    orderNumber,
    paymentComplete,
    setServiceType,
    setPaymentMethod,
    generateOrderNumber,
    completePayment,
    reset,
  }
})
