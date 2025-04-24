const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let serverProcess = null
let guiProcess = null

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
    },
  })

  win.loadURL('http://localhost:3000')
}

function launchServers() {
  const serverPath = path.join(__dirname, 'src', 'server.js')
  const guiPath = path.join(__dirname, 'src', 'gui-server.js')

  serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    shell: true,
  })

  guiProcess = spawn('node', [guiPath], {
    stdio: 'inherit',
    shell: true,
  })
  
  console.log('[Electron] gui-server.js launched')
}

app.whenReady().then(() => {
  launchServers()
  setTimeout(createWindow, 1500) // Allow time for GUI server to start
})

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill()
  if (guiProcess) guiProcess.kill()
  if (process.platform !== 'darwin') app.quit()
})