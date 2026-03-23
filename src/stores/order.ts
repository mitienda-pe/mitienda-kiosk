import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOrderStore = defineStore('order', () => {
  const serviceType = ref<'takeout' | 'dine_in'>('takeout')
  const orderNumber = ref(0)
  const paymentComplete = ref(false)

  function setServiceType(type: 'takeout' | 'dine_in') {
    serviceType.value = type
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
    orderNumber.value = 0
    paymentComplete.value = false
  }

  return {
    serviceType,
    orderNumber,
    paymentComplete,
    setServiceType,
    generateOrderNumber,
    completePayment,
    reset,
  }
})
