// preload.js

const { contextBridge, ipcRenderer } = require('electron')
// added a comment to test autoRestart

contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.send('close-app'),
  closeWindow: () => ipcRenderer.send('close-window'),
  launchGui: () => ipcRenderer.send('launch-gui'),

  updateStatus: (callback) => ipcRenderer.on('status-update', callback)
})

// Listen for GUI connection status updates
ipcRenderer.on('gui_status', (_event, data) => {
    const el = document.getElementById('gui-status')
    if (el) {
      el.textContent = data.connected ? 'Connected!' : 'Disconnected'
      el.classList.remove('connected', 'disconnected')
      el.classList.add(data.connected ? 'connected' : 'disconnected')
    }
  })