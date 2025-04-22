const WebSocket = require('ws');
const parser = require('./parser'); // Import the parser module to parse RS232 Answers from Device
const { buildRs232Message } = require('./rs232-builder') // Import the RS232 message builder 

// Import the simulator module to simulate device responses
const { simulateDeviceResponse } = require('./simulator')

// Save Routing Status
const globalRoutingStatus = {} // Store current input per output port

//For Website configuration
const guiClients = new Set()

// Broadcast log messages to connected GUI clients
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
    try {

      //const messagefromserver = JSON.parse(data)

      //// Identify client type
      //if (messagefromserver.msgtype === 'gui') {
      //  guiClients.add(ws)
      //  ws.isGUI = true
      //  ws.send(JSON.stringify({ type: 'status', connected: true }))
      //  return
      //} }


      //broadcastToGUI(`Received from Companion: ${JSON.stringify(data)}`)
      // Log received message and prepare to send commands to the device

      
        const parsed = JSON.parse(data.toString())
        //const parsed = JSON.parse(data)

        if (parsed.msgtype === 'gui') {
          guiClients.add(ws)
          ws.isGUI = true
          console.log('GUI Client connected');
          ws.send(JSON.stringify({ type: 'status', connected: true }))
          return
        }
        
        console.log('Companion Client connected');

        // Log to GUI
        broadcastToGUI(`Received from Companion: ${JSON.stringify(parsed)}`)


        const rs232 = buildRs232Message(parsed)



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
        console.error('Invalid message from Companion:', data, '\nError:', e)
        broadcastToGUI(`Error: ${e.message}`)
      }
    });

  ws.on('close', () => {

    if (ws.isGUI) {
      guiClients.delete(ws);
      console.log('GUI Client disconnected')
    }
    console.log('Companion Client disconnected');

  });

  ws.on('error', (err) => {
    console.error('⚡ WebSocket error:', err.message);
  });
});

console.log('WebSocket server running on ws://localhost:15809');