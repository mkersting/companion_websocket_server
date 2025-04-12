const WebSocket = require('ws');
const parser = require('./parser'); // Import the parser module to parse RS232 Answers from Device
const { buildRs232Message } = require('./rs232-builder') // Import the RS232 message builder 

// Import the simulator module to simulate device responses
const { simulateDeviceResponse } = require('./simulator')

// Save Routing Status
const globalRoutingStatus = {} // Store current input per output port

//For Website configuration
const guiClients = new Set()

// ✅ Broadcast log messages to connected GUI clients
function broadcastToGUI(logMessage) {
  for (const client of guiClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'log', message: logMessage }))
    }
  }
}

// Create WebSocket server
const wss = new WebSocket.Server({ port: 15809 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    //console.log(`Received message: ${data}`);

    broadcastToGUI(`Received from Companion: ${JSON.stringify(data)}`)
    // Log received message and prepare to send commands to the device

    try {
      const parsed = JSON.parse(data)
      const rs232 = buildRs232Message(parsed)

       // Identify client type
    if (parsed.msgtype === 'gui') {
      guiClients.add(ws)
      ws.isGUI = true
      ws.send(JSON.stringify({ type: 'status', connected: true }))
      return
    }

    // Your normal Companion message handling
    if (parsed.command) {

      // Save routing info directly from the message
      if (parsed.command === 'switch') {
        //ws.routingStatus = ws.routingStatus || {}
        //ws.routingStatus[parsed.output] = parsed.input
        globalRoutingStatus[parsed.output] = parsed.input
      }

      console.log('Received from Companion:', parsed)
      console.log('Constructed RS232 Message:', rs232)
      //Log message

      let parsedresponse = null

      const response = simulateDeviceResponse(rs232)
      if (response) {
        parsedresponse = parser.parseStatusMessage(response)
        console.log('Simulated response:', response)
        console.log('Parsed simulated status reply:', parsedresponse)

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


          //ws.send(JSON.stringify({
          //  command: 'switch_ack',
          // input: parsed.input,
          // output: parsed.output,
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
      console.error('Invalid message:', data, '\nError:', e)
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on ws://localhost:15809');