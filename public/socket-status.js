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
    statusIndicator.textContent = isConnected ? 'GUI CONNECTED' : 'GUI DISCONNECTED';
    //statusIndicator.style.color = isConnected ? 'green' : 'red';
}

function setStatus(connected) {
    statusEl.textContent = connected ? 'GUI CONNECTED' : 'GUI DISCONNECTED'
    statusEl.classList.remove('connected', 'disconnected')
    statusEl.classList.add(connected ? 'connected' : 'disconnected')
}

function updateDeviceStatus(deviceType, connected) {
	const el = document.getElementById(`${deviceType}-status`)
    if (!el) return // Exit if the element doesn't exist

    switch (deviceType)
    {
        case 'companion':
            device = 'Companion'
            el.textContent = device + (connected ? ' Connected' : ' Disconnected')
            break;
        case 'rs232':
            device = 'RS232'
            el.textContent = device + (connected ? ' Connected' : ' Disconnected')
            break;
        case 'input1':
        case 'input2':
        case 'input3':
        case 'input4':
        case 'output1':
        case 'output2':
        case 'output3':
        case 'output4':
            device = deviceType
            break;
        default:
            device = 'unknown'

    }
    
		//el.textContent = device + (connected ? ' Connected' : ' Disconnected')
		el.classList.remove('connected', 'disconnected')
		el.classList.add(connected ? 'connected' : 'disconnected')
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
        statusEl.textContent = 'GUI DISCONNECTED';
        // Update connection status visually
        updateDeviceStatus('companion', false)  
        updateDeviceStatus('rs232', false)
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
        }
        else if (data.type === 'status') {
            updateStatus(data.connected);
        }
        else if (data.type === 'companion_status') {
            updateDeviceStatus('companion', data.connected)

            const time = new Date().toLocaleTimeString();
            appendLog(`[${time}] [Server] Companion ${data.connected ? 'connected' : 'disconnected'}.`, 'log-gui');
        }
        else if (data.type === 'rs232_status') {
            updateDeviceStatus('rs232', data.connected)
        
            const time = new Date().toLocaleTimeString()
            appendLog(`[${time}] [Server] RS232 ${data.connected ? 'connected' : 'disconnected'}.`, 'log-gui')
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