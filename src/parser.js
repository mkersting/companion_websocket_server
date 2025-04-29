// parser.js
// Parse incoming RS232 responses from the device

function parseStatusMessage(buffer) {
	if (!buffer || buffer.length < 13) return null

	// Validate start bytes: A5 5B
	if (buffer[0] !== 0xA5 || buffer[1] !== 0x5B) {
		return null
	}

	const commandCode = buffer[2] // Byte 3: Command code

	// Map known command codes to labels
	const commandMap = {
		0x01: 'status_reply',
		0x02: 'switch_ack',
		0x03: 'edid_set_ack',
		0x04: 'edid_copy_ack',
		0x05: 'factory_reset_ack',
		// ...expand as you decode more
	}

	const Command = commandMap[commandCode] || `unknown_0x${commandCode.toString(16)}`

	// Special handling for switch_ack
	if (Command === 'switch_ack') {
		const output = buffer[3]

		return {
			feedback: Command,
			output,
		}
	}

	if (buffer[2] == 0x01 && buffer[3] == 0x0B) {
		const handshakeStatus = buffer[6] // Byte 7
		const connected = handshakeStatus !== 0xFF
		return {
			feedback: 'connect_ack',
			connected: connected,
		}
	}

	// Normal status message


	const portType = buffer[3] === 0x04 ? 'input' :
		buffer[3] === 0x05 ? 'output' : 'unknown'

	const statusport = buffer[4]
	const statusByte = buffer[6]
	const statusconnected = statusByte !== 0xFF


	return {
		feedback: 'PortStatus',
		direction: portType,
		port: statusport,
		connected: statusconnected,
		rawStatus: statusByte
	}
}

module.exports = {
	parseStatusMessage
}