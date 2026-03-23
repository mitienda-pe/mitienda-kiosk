import { contextBridge, ipcRenderer } from 'electron'

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electron', {
  // Terminal Info
  getTerminalInfo: () => ipcRenderer.invoke('get-terminal-info'),

  // Hardware APIs
  hardware: {
    print: (data) => ipcRenderer.invoke('hardware:print', data),
    processPayment: (paymentData) => ipcRenderer.invoke('hardware:process-payment', paymentData)
  },

  // System APIs
  system: {
    scheduleRestart: () => ipcRenderer.invoke('schedule-restart'),
    logError: (errorData) => ipcRenderer.invoke('log-error', errorData)
  }
})

// Información del entorno
contextBridge.exposeInMainWorld('env', {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
})
