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
let isRestarting = false


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
        console.log('[Watcher] Server is already running.')
        return
    }

	console.log('Server Starting...')
	serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
        stdio: 'inherit',
        shell: true,
      })
}

// Function to restart the server gracefully
// This function will kill the server process and wait for it to exit before starting a new one
function restartServerGracefully() {
	if (!serverProcess) return

	console.log('[Watcher] Killing server...')
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
      console.log(`[Watcher] GUI server exited with code ${code}`)
      guiServerProcess = null
    })
  }



//ACTUAL CODE STARTS HERE

// Watch all source files except GUI files
//const watcher = chokidar.watch(['./src/**/*.js'], {
    const watcher = chokidar.watch(`${__dirname}`, {
  ignored: ['src/gui-server.js', 'src/watcher.js', '/node_modules/'],
  ignoreInitial: true,
})

// Event listener for file changes
watcher.on('change', (path) => {
  console.log(`[Watcher] File changed: ${path}`)
  restartServerGracefully()
})




// Event listener for file addition
console.log('[Watcher] Watching for changes...')

// Actually Start the Server
startServer()
// Start the GUI server
startGuiServer()