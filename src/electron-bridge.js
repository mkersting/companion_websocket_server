// src/electron-bridge.js
const WebSocket = require('ws')

const electronClients = new Set()

const bridgeWS = new WebSocket.Server({ port: 15999 }, () => {
	console.log('[Bridge] Electron WebSocket bridge listening on ws://localhost:15999')
})

bridgeWS.on('connection', (ws) => {
	electronClients.add(ws)
	console.log('[Bridge] Electron connected')

	// Immediately send current status on new connection
	ws.send(JSON.stringify({ type: 'companion_status', data: global.isCompanionConnected }))
	ws.send(JSON.stringify({ type: 'gui_status', data: global.isGuiConnected }))

	ws.on('close', () => {
		electronClients.delete(ws)
		console.log('[Bridge] Electron disconnected')
	})
})

function notifyElectron(type, data) {
	const payload = JSON.stringify({ type, data })
	for (const client of electronClients) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(payload)
		}
	}
}

module.exports = {
	notifyElectron
}