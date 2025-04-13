const statusEl = document.getElementById('connection-status')
const logOutput = document.getElementById('log-output')


function appendLog(message) {
    const logContainer = document.getElementById('logContainer');
    const logEntry = document.createElement('div');
    logEntry.textContent = message;
    logContainer.appendChild(logEntry);
  }

  function updateStatus(isConnected) {
    const statusIndicator = document.getElementById('statusIndicator');
    statusIndicator.textContent = isConnected ? 'CONNECTION ESTABLISHED' : 'DISCONNECTED';
    statusIndicator.style.color = isConnected ? 'green' : 'red';
  }

function setStatus(connected) {
  statusEl.textContent = connected ? 'CONNECTION ESTABLISHED' : 'DISCONNECTED'
  statusEl.classList.remove('connected', 'disconnected')
  statusEl.classList.add(connected ? 'connected' : 'disconnected')
}

function log(msg) {
  const time = new Date().toLocaleTimeString()
  logOutput.textContent += `[${time}] ${msg}\n`
  logOutput.scrollTop = logOutput.scrollHeight
}

// Connect to your own WebSocket server (adjust port if needed)
const ws = new WebSocket(`ws://${window.location.hostname}:15809`)

ws.onopen = () => {
  setStatus(true)
  log('WebSocket connection opened.')
  ws.send(JSON.stringify({ msgtype: 'gui' }));
}

ws.onclose = () => {
  setStatus(false)
  log('WebSocket connection closed.')
}

ws.onerror = (err) => {
  setStatus(false)
  log('WebSocket error: ' + err.message)
}

ws.onmessage = (event) => {
  log('Received: ' + event.data)

  const data = JSON.parse(event.data);
    if (data.type === 'log') {
      appendLog(data.message);
    } else if (data.type === 'status') {
      updateStatus(data.connected);
    }
}