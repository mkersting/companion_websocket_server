const WebSocket = require('ws');

// Create WebSocket server
const wss = new WebSocket.Server({ port: 15809 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    // Log received message and prepare to send commands to the device
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on ws://localhost:15809');