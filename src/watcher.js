//watcher.js


const chokidar = require('chokidar')
const { spawn } = require('child_process')

let serverProcess = null
let isRestarting = false

function startServer() {
  serverProcess = spawn('node', ['src/server.js'], {
    stdio: 'inherit',
    shell: true,
  })

  serverProcess.on('exit', (code) => {
    console.log(`[Watcher] Server exited with code ${code}`)
  })

  serverProcess = null
  if (isRestarting) {
    isRestarting = false
    //startServer() // Now restart cleanly
    setTimeout(() => {
        console.log('[Watcher] Restarting server after delay...')
        startServer()
      }, 1000) //Give OS time to free the port (1 second)

  }

}

function restartServer() {
  if (serverProcess) {
    console.log('[Watcher] Kill existing server...')
    isRestarting = true
      serverProcess.kill()
}
else {
    startServer()
  }
}

// Watch all source files except GUI files
//const watcher = chokidar.watch(['./src/**/*.js'], {
    const watcher = chokidar.watch(`${__dirname}`, {
  ignored: ['src/gui-server.js', 'src/watcher.js', '/node_modules/'],
  ignoreInitial: true,
})

watcher.on('change', (path) => {
  console.log(`[Watcher] File changed: ${path}`)
  restartServer()
})

console.log('[Watcher] Watching for changes...')
startServer()