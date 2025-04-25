//watcher.js
// Includes

const net = require('net')  // Required for checking if a port is free
const chokidar = require('chokidar') // File watcher library
const { spawn } = require('child_process')  // Required for spawning the server process
const path = require('path') // required for __dirname + path.join

const treeKill = require('tree-kill')   // Required for killing the server process and all its child processes

// Init
let serverProcess = null
let guiServerProcess = null
let electronProcess = null
let isRestarting = false

// Electron process
function startElectronApp() {
	if (electronProcess) return

	console.log('[Watcher] Launching Electron app...')
	electronProcess = spawn('npx', ['electron', 'main.js'], {
		stdio: 'inherit',
		shell: true,
	})

	electronProcess.on('exit', (code) => {
		console.log(`[Watcher] Electron exited with code ${code}`)
		electronProcess = null
	})
}

function restartElectronApp() {
    if (!electronProcess) return
  
    console.log('[Watcher] Killing Electron app...')
  
    treeKill(electronProcess.pid, 'SIGTERM', (err) => {
      if (err) {
        console.error('[Watcher] Failed to kill Electron app:', err)
      } else {
        console.log('[Watcher] Electron closed')
        electronProcess = null
  
        console.log('[Watcher] Restarting Electron app...')
        startElectronApp()
      }
    })
  }

// Function to restart the Electron app gracefully
//function restartElectronApp() {
//	if (!electronProcess) return
//
//	console.log('[Watcher] Killing Electron app...')
//
//	isRestarting = true
//
//	electronProcess.once('exit', () => {
//		console.log('[Watcher] Electron closed')
//		isRestarting = false
//
//		setTimeout(() => {
//			console.log('[Watcher] Restarting Electron app...')
//			startElectronApp()
//		}, 1000)
//	})
//
//	electronProcess.kill()
//}


// Function to check if a port is free
// This function tries to create a server on the specified port and if it fails, it means the port is in use
function waitForPortFree(port, callback) {
	const tryPort = () => {
		const tester = net.createServer()
		tester.once('error', () => setTimeout(tryPort, 250))
		tester.once('listening', () => {
			tester.close()
			callback()
		})
		tester.listen(port)
	}
    console.log('[Watcher] Trying port..........')
	tryPort()
}

// Function to start the server
function startServer() {
	if (serverProcess) {
        console.log('[Watcher] Server is already running.\n')
        return
    }

	console.log('[Watcher] Server Starting...')
	serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
        stdio: 'inherit',
        shell: true,
      })
}

// Function to restart the server gracefully
// This function will kill the server process and wait for it to exit before starting a new one
function restartServerGracefully() {
	if (!serverProcess) return

	console.log('[Watcher] Killing server...\n')
	isRestarting = true

	serverProcess.once('exit', (code) => {
		console.log(`[Watcher] Server exited with code ${code}`)
        //console.log(isRestarting)
		isRestarting = false
        serverProcess = null

        waitForPortFree(15809, () => {
            console.log('[Watcher] Port is now free. Restarting server...')
            startServer()
        })
	})

    // Kill the server process and all its child processes
    treeKill(serverProcess.pid, 'SIGTERM', (err) => {
        if (err) {
            console.error('[Watcher] Failed to kill server process:', err.message)
        }
    })
}


// GUISERVER STARTUP

function startGuiServer() {
    if (guiServerProcess) return
  
    console.log('[Watcher] Starting GUI server...')
    guiServerProcess = spawn('node', [path.join(__dirname, 'gui-server.js')], {
      stdio: 'inherit',
      shell: true,
    })
  
    guiServerProcess.on('exit', (code) => {
      console.log(`[Watcher] GUI server exited with code ${code} \n`)
      guiServerProcess = null
    })
  }



// Watchers

// Watch all source files except GUI files
const serverWatcher = chokidar.watch([
	path.join(__dirname, 'server.js'),
	path.join(__dirname, 'parser.js'),
	path.join(__dirname, 'rs232-builder.js'),
	path.join(__dirname, 'simulator.js'),
], {
	ignoreInitial: true,
})

// Event listener for file changes
serverWatcher.on('change', (filePath) => {
	console.log(`[Watcher] Server File changed: ${filePath}`)
	restartServerGracefully()
})


// GUI Watcher (for GUI server + frontend files)
const guiWatcher = chokidar.watch([
	path.join(__dirname, 'gui-server.js'),
    path.join(__dirname, '../main.js'),
	path.join(__dirname, '../launcher.html'),
    path.join(__dirname, '../launcher.css'),
	path.join(__dirname, '../preload.js'),
	path.join(__dirname, '../public'), // optional, if used
], {
	ignoreInitial: true,
})

guiWatcher.on('change', (filePath) => {
	console.log(`[Watcher] GUI File changed: ${filePath}`)
	restartElectronApp()
})


//Start Everything up
console.log('[Watcher] Watching for changes...\n')

// Actually Start the Server
startServer()
// Start the GUI server
startGuiServer()
// Start the Electron app
startElectronApp()