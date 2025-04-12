const ws = new WebSocket('ws://localhost:15809');
const statusSpan = document.getElementById('status');

ws.onopen = () => {
  statusSpan.textContent = 'Connected';
};

ws.onclose = () => {
  statusSpan.textContent = 'Disconnected';
};