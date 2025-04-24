//socket-status.js

const statusEl = document.getElementById('connection-status')
const logOutput = document.getElementById('log-output')


function appendLog(message, type = 'log-debug') {
    const logContainer = document.getElementById('logContainer');
    const logEntry = document.createElement('div');
    logEntry.textContent = message;
    logEntry.className = `log-entry ${type}` // <-- combine classes
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  function updateStatus(isConnected) {
    const statusIndicator = document.getElementById('connection-status');
    statusIndicator.textContent = isConnected ? 'CONNECTION ESTABLISHED' : 'DISCONNECTED';
    //statusIndicator.style.color = isConnected ? 'green' : 'red';
  }

function setStatus(connected) {
  statusEl.textContent = connected ? 'CONNECTION ESTABLISHED' : 'DISCONNECTED'
  statusEl.classList.remove('connected', 'disconnected')
  statusEl.classList.add(connected ? 'connected' : 'disconnected')
}

// Connect to your own WebSocket server (adjust port if needed)

let guiSocket = null;

function connectToServer() {
    if (guiSocket && guiSocket.readyState === WebSocket.OPEN) {
      appendLog(`[${new Date().toLocaleTimeString()}] [GUI] Already connected.`, 'log-gui')
      return
    }



guiSocket = new WebSocket(`ws://${window.location.hostname}:15809`)

guiSocket.onopen = () => {
  setStatus(true)
  appendLog(`[${new Date().toLocaleTimeString()}] [GUI] WebSocket connection opened.`, 'log-gui')
  guiSocket.send(JSON.stringify({ msgtype: 'gui' }));
  statusEl.textContent = 'Connected';

    // Inside guiSocket.onopen
    const addrSpan = document.getElementById('server-address');
    if (addrSpan) {
      addrSpan.textContent = `@ ${guiSocket.url.replace('ws://', '').replace(/\/$/, '')}`;
    }

}

guiSocket.onclose = () => {
  setStatus(false)
  appendLog(`[${new Date().toLocaleTimeString()}] [GUI] WebSocket connection closed.`, 'log-gui')
  statusEl.textContent = 'Disconnected';
}

guiSocket.onerror = (err) => {
  setStatus(false)
  appendLog(`[${new Date().toLocaleTimeString()}] [GUI] WebSocket error: ` + err.message, 'log-gui')
}

guiSocket.onmessage = (event) => {

    //appendLog(`[${new Date().toLocaleTimeString()}] [GUI] Received: ` + event.data, 'log-gui')

    const data = JSON.parse(event.data);
    const time = new Date().toLocaleTimeString()

    //console.log(data)

    if (data.type === 'log') {

      const logType = data.logtype || 'log-debug';
      appendLog(`[${time}] ${data.message}`, data.logtype)
    } else if (data.type === 'status') {
      updateStatus(data.connected);
    }
}
}

function disconnectFromServer() {
    if (guiSocket) {
      guiSocket.close();
      guiSocket = null;
    }
  }

document.getElementById('connect-button').addEventListener('click', connectToServer)
document.getElementById('disconnect-button').addEventListener('click', disconnectFromServer)


const filterButtons = document.querySelectorAll('.filter-btn');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const type = button.dataset.filter;
    button.classList.toggle('disabled');

    // Determine if this filter is ON or OFF
    const isActive = !button.classList.contains('disabled');


     // Toggle visibility for all log entries of this type
     document.querySelectorAll(`.log-entry.${type}`).forEach(entry => {
        entry.style.display = isActive ? '' : 'none'
      });
  });
}); 

document.getElementById('clear-log-button').addEventListener('click', () => {
    const logContainer = document.getElementById('logContainer');
    logContainer.innerHTML = ''; // Clear all logs
  })