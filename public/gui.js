const ws = new WebSocket('ws://localhost:15809');
const statusSpan = document.getElementById('status');

ws.onopen = () => {
  statusSpan.textContent = 'Connected';
};

ws.onclose = () => {
  statusSpan.textContent = 'Disconnected';
};

document.getElementById('reconnect-button').addEventListener('click', () => {
  appendLog('[GUI] Attempting to reconnect WebSocket...')
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    socket.close()
  }
  setTimeout(initWebSocket, 100)
});

document.getElementById('disconnect-button').addEventListener('click', () => {
  appendLog('[GUI] Disconnecting WebSocket...')
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close()
    updateStatusIndicator(false)
  }
});

setInterval(() => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ msgtype: 'gui', command: 'statuscheck' }));
  }
}, 30000); // every 30 seconds