'use strict'

import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

const isDev = process.env.NODE_ENV === 'development'
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'

if (!isDev) {
  global.__static = require('path')
    .join(__dirname, '/static')
    .replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = isDev
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 489,
    useContentSize: true,
    width: isDev ? 1315 : 890,
    resizable: false,
    frame: false,
    transparent: true,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false
    }
  })

  mainWindow.loadURL(winURL)
  if (isDev) mainWindow.webContents.openDevTools()
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */
function sendUpdateStatus(status) {
  mainWindow.webContents.send('update-status', status)
}

autoUpdater.on('update-downloaded', () => autoUpdater.quitAndInstall())

autoUpdater.on('update-available', () => sendUpdateStatus('update-available'))
autoUpdater.on('error', () => sendUpdateStatus('error'))
autoUpdater.on('download-progress', () => sendUpdateStatus('download-progress'))
// autoUpdater.on('checking-for-update', () =>
//   sendUpdateStatus('checking-for-update')
// )
autoUpdater.on('update-not-available', () =>
  sendUpdateStatus('update-not-available')
)

app.on('ready', () => {
  if (!isDev) autoUpdater.checkForUpdates()
})
