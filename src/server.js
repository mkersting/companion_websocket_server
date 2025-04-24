const WebSocket = require('ws');
const parser = require('./parser'); // Import the parser module to parse RS232 Answers from Device
const { buildRs232Message } = require('./rs232-builder') // Import the RS232 message builder 

// Import the simulator module to simulate device responses
const { simulateDeviceResponse } = require('./simulator')

// Save Routing Status
const globalRoutingStatus = {} // Store current input per output port

//For Website configuration
const guiClients = new Set()

// For Companion configuration
const companionClients = new Set()

let isCompanionConnected = false

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function startupSequence() {
console.log('Server Starting...')
  await sleep(500)
  console.log('Server Starting...1')
  await sleep(500)
  console.log('Server Starting...2')
  await sleep(500)
  console.log('Server Starting...3')
  await sleep(500)
  console.log('Server Starting...4')
  //await sleep(500)
  //console.log('Server Starting...5')
}

// Broadcast log messages to connected GUI clients
function broadcastToGUI({ logMessage, logtype = 'log-debug', raw = null }) {
  for (const client of guiClients) {
    if (client.readyState === WebSocket.OPEN) {
      // If you're sending a fully prepared message like status, just send it
      if (raw) {
        client.send(JSON.stringify(raw))
      } else {
        // Otherwise, it's a normal log
        client.send(JSON.stringify({ type: 'log', message: logMessage, logtype }))
      }
    }
  }
}

async function main() {
  await startupSequence()

  console.log('Startup...1')
console.log('Startup...2')
console.log('Startup...3')

// Create WebSocket server
const wss = new WebSocket.Server({ port: 15809 });

wss.on('connection', (ws) => {

  //console.log('Some Client connected');

  ws.on('message', (data) => {
    //console.log(`Received message: ${data}`);
    try {

      const parsed = JSON.parse(data.toString())
      //const parsed = JSON.parse(data)

      if (parsed.msgtype === 'gui') {
        guiClients.add(ws)
        ws.isGUI = true
        console.log('GUI Client connected');
        ws.send(JSON.stringify({ type: 'status', connected: true }))

        //ws.send(JSON.stringify({ raw: { type: 'companion_status', connected: true } }))

        // Send current Companion connection status to GUI
        const isCompanionConnected = companionClients.size > 0
        //console.log(isCompanionConnected);
        broadcastToGUI({ raw: { type: 'companion_status', connected: isCompanionConnected } })

        return
      }
      else if (parsed.msgtype === 'companion') {

        companionClients.add(ws)

        if(parsed.status =='connected'){
          console.log('Companion Client connected');
        }
        
        ws.isGUI = false
        isCompanionConnected = true
        broadcastToGUI({ raw: { type: 'companion_status', connected: isCompanionConnected } })

      }
      else {
        console.log('Unknown Client connected');
      }

      const rs232 = buildRs232Message(parsed)

      // Your normal Companion message handling
      if (parsed.command) {

        // Save routing info directly from the message
        if (parsed.command === 'switch') {
          globalRoutingStatus[parsed.output] = parsed.input
        }

        console.log('Received from Companion:', parsed)
        broadcastToGUI({ logMessage: `Received from Companion: ${JSON.stringify(parsed)}`, logtype: 'log-from-companion' })

        console.log('Constructed RS232 Message:', rs232)

        const hexFormatted = Array.from(rs232)
          .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
          .join(' ')
        broadcastToGUI({ logMessage: `Constructed RS232 Message: ${hexFormatted}`, logtype: 'log-to-rs232' })

        //Log message

        let parsedresponse = null

        const response = simulateDeviceResponse(rs232)
        if (response) {
          parsedresponse = parser.parseStatusMessage(response)

          console.log('Simulated response:', response)

          const hexFormattedresponse = Array.from(response)
            .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
            .join(' ')

          broadcastToGUI({ logMessage: `Simulated response: ${hexFormattedresponse}`, logtype: 'log-from-rs232' })

          console.log('Parsed simulated status reply:', parsedresponse)
          broadcastToGUI({ logMessage: `Parsed simulated status reply: ${JSON.stringify(parsedresponse)}`, logtype: 'log-to-companion' })

          if (parsedresponse && parsedresponse.feedback === 'PortStatus') {

            // Send Answer Back to Companion
            //console.log ('Inside if statement')

            ws.send(JSON.stringify({
              feedback: 'PortStatus',
              direction: parsedresponse.direction,
              port: parsedresponse.port,
              connected: parsedresponse.connected,
            }))
          }

          else if (parsedresponse.feedback === 'switch_ack') {
            console.log('Switch confirmation received.')

            const input = globalRoutingStatus[parsedresponse.output] || 0

            ws.send(JSON.stringify({
              feedback: 'PortRoutingDisplay',
              port: parsedresponse.output,
              input,
            }))

          }
          else {
            console.log(`Unhandled response feedback: ${parsedresponse.feedback}`)
          }
        }

      }
      // Switch TO rs232Builder and Build Message

      // Later, you’ll convert this to an RS232 command
    } catch (e) {
      console.error('Invalid message from Companion:', data, '\nError:', e)
      broadcastToGUI({ message: `Error: ${e.message}`, logtype: `log-debug` })
    }
  });

  ws.on('close', () => {

    if (ws.isGUI) {
      guiClients.delete(ws);
      console.log('GUI Client disconnected')
    }
    else {
      console.log('Companion Client disconnected')
      isCompanionConnected = false
      companionClients.delete(ws)
      //broadcastToGUI({ logMessage: '[Server] Companion Disconnected', logtype: 'log-gui' })
      broadcastToGUI({ raw: { type: 'companion_status', connected: isCompanionConnected } })
    }


  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);


  });
});

console.log('WebSocket server running on ws://localhost:15809');

}

main()