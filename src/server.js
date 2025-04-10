const WebSocket = require('ws');
const parser = require('./parser'); // Import the parser module to parse RS232 Answers from Device
const { buildRs232Message } = require('./rs232-builder') // Import the RS232 message builder 

// Import the simulator module to simulate device responses
const { simulateDeviceResponse } = require('./simulator')

// Create WebSocket server
const wss = new WebSocket.Server({ port: 15809 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    //console.log(`Received message: ${data}`);
    // Log received message and prepare to send commands to the device

    try {
    const parsed = JSON.parse(data)
    const rs232 = buildRs232Message(parsed)

    console.log('Received from Companion:', parsed)
    console.log('Constructed RS232 Message:', rs232)
    //Log message

		let parsedresponse = null

    const response = simulateDeviceResponse(rs232)
    if (response) {
      const parsedresponse = parser.parseStatusMessage(response)
      console.log('Simulated response:', response)
      console.log('Parsed simulated status reply:', parsedresponse)

      if (parsedresponse && parsedresponse.command === 'status_reply') {
  
        // Send Answer Back to Companion
      console.log ('Inside if statement')
  
        ws.send(JSON.stringify({
          feedback: 'PortStatus',
          type: parsedresponse.type,
          port: parsedresponse.port,
          connected: parsedresponse.connected,
        }))
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