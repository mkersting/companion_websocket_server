const ws = new WebSocket('ws://localhost:15809');
const statusSpan = document.getElementById('status');

ws.onopen = () => {
  statusSpan.textContent = 'Connected';
};

ws.onclose = () => {
  statusSpan.textContent = 'Disconnected';
};

document.getElementById('reconnect-button').addEventListener('click', () => {
  connectWebSocket(); // reconnect logic
});

document.getElementById('disconnect-button').addEventListener('click', () => {
  connectWebSocket(); // reconnect logic
});

setInterval(() => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ msgtype: 'gui', command: 'statuscheck' }));
  }
}, 30000); // every 30 seconds