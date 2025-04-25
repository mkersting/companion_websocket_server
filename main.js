const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let serverProcess = null
let guiProcess = null

//HelperFunction 
function sendStatusToRenderer(win, type, connected) {
    win.webContents.send('status-update', { type, connected })
  }

// Create Electron window   
function createWindow() {
    const win = new BrowserWindow({

        width: 400,
        height: 600,
        resizable: true,
        frame: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        },
    })

    //win.loadURL('http://localhost:3000')
    win.loadFile('launcher.html')


    win.webContents.on('did-finish-load', () => {
        sendStatusToRenderer(win, 'gui', true) // hardcoded for now
        sendStatusToRenderer(win, 'companion', false)
        sendStatusToRenderer(win, 'rs232', false)
      })

}


//function launchServers() {
//    const serverPath = path.join(__dirname, 'src', 'server.js')
//    const guiPath = path.join(__dirname, 'src', 'gui-server.js')
//
//    serverProcess = spawn('node', [serverPath], {
//        stdio: 'inherit',
//        shell: true,
//    })
//
//    guiProcess = spawn('node', [guiPath], {
//        stdio: 'inherit',
//        shell: true,
//    })
//
//    console.log('[Electron] gui-server.js launched')
//}

app.whenReady().then(() => {
    //launchServers()


    setTimeout(createWindow, 1500) // Allow time for GUI server to start

    const { ipcMain } = require('electron')

    ipcMain.on('close-window', (event) => {
        const focused = BrowserWindow.getFocusedWindow()
        if (focused) focused.close()
    })

    ipcMain.on('close-app', () => {
        app.quit()
    })

    ipcMain.on('launch-gui', () => {
        require('electron').shell.openExternal('http://localhost:3000')
    })

    //ipcMain.on('gui-status-request', (event) => {
    //    const win = BrowserWindow.getAllWindows()[0]
    //    if (win) {
    //      win.webContents.send('gui_status', { connected: true }) // or use actual value
    //    }
    //  })

})


app.on('window-all-closed', () => {
    if (serverProcess) serverProcess.kill()
    if (guiProcess) guiProcess.kill()
    if (process.platform !== 'darwin') app.quit()
})