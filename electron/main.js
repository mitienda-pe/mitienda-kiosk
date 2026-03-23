import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    kiosk: process.env.NODE_ENV === 'production',
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  })

  // Deshabilitar el menú de aplicación
  mainWindow.setMenu(null)

  // Bloquear gestos de navegación
  mainWindow.on('swipe', (e) => {
    e.preventDefault()
  })

  // Prevenir que se abran nuevas ventanas
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })

  // Deshabilitar atajos de teclado peligrosos en modo producción
  if (process.env.NODE_ENV === 'production') {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      const blockedKeys = [
        'F11', 'F12', 'F5', // DevTools y refresh
        'CommandOrControl+R', // Refresh
        'CommandOrControl+Shift+R', // Hard refresh
        'CommandOrControl+W', // Cerrar ventana
        'Alt+F4' // Cerrar aplicación
      ]

      const pressedKey = input.key
      const modifiers = []
      if (input.control) modifiers.push('CommandOrControl')
      if (input.shift) modifiers.push('Shift')
      if (input.alt) modifiers.push('Alt')

      const fullKey = modifiers.length > 0
        ? `${modifiers.join('+')}+${pressedKey}`
        : pressedKey

      if (blockedKeys.includes(fullKey)) {
        event.preventDefault()
      }
    })
  }

  // Cargar la aplicación
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Manejo de errores de carga
  mainWindow.webContents.on('did-fail-load', () => {
    console.error('Failed to load application')
    // En producción, intentar recargar
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        mainWindow.reload()
      }, 2000)
    }
  })
}

// IPC Handlers para comunicación con el renderer process

// Terminal Info
ipcMain.handle('get-terminal-info', async () => {
  return {
    kioskId: process.env.VITE_KIOSK_ID || 'KIOSK_001',
    storeId: process.env.VITE_STORE_ID || '1',
    branchName: process.env.VITE_BRANCH_NAME || 'Default'
  }
})

// Hardware Service Communication
ipcMain.handle('hardware:print', async (event, data) => {
  try {
    // Aquí se comunicaría con el servicio de hardware
    const hardwareServiceUrl = process.env.VITE_HARDWARE_SERVICE_URL || 'http://localhost:3001'

    // Simulación - en producción hacer fetch al servicio
    console.log('Print request:', data)

    return { success: true }
  } catch (error) {
    console.error('Print error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('hardware:process-payment', async (event, paymentData) => {
  try {
    // Aquí se comunicaría con el pinpad
    const hardwareServiceUrl = process.env.VITE_HARDWARE_SERVICE_URL || 'http://localhost:3001'

    // Simulación - en producción hacer fetch al servicio
    console.log('Payment request:', paymentData)

    // Simular procesamiento de pago
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: 'TXN-' + Date.now(),
          authCode: 'AUTH-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        })
      }, 2000)
    })
  } catch (error) {
    console.error('Payment error:', error)
    return { success: false, error: error.message }
  }
})

// Reinicio programado (watchdog)
ipcMain.handle('schedule-restart', async () => {
  // Programar reinicio a las 4 AM
  const now = new Date()
  const scheduledTime = new Date()
  scheduledTime.setHours(4, 0, 0, 0)

  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1)
  }

  const timeUntilRestart = scheduledTime - now

  setTimeout(() => {
    app.relaunch()
    app.exit(0)
  }, timeUntilRestart)

  return { scheduledFor: scheduledTime.toISOString() }
})

// Logs del sistema
ipcMain.handle('log-error', async (event, errorData) => {
  console.error('Renderer error:', errorData)
  // Aquí se podría enviar a un servicio de logging externo
  return { logged: true }
})

// Cuando la aplicación está lista
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Salir cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  // En producción, registrar y continuar
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
