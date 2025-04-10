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

    const command = commandMap[commandCode] || `unknown_0x${commandCode.toString(16)}`

	const portType = buffer[3] === 0x04 ? 'input' :
	                 buffer[3] === 0x05 ? 'output' : 'unknown'

	const port = buffer[4]
	const statusByte = buffer[6]
	const connected = statusByte !== 0xFF

	return {
		type: portType,
        command,
		port,
		connected,
		rawStatus: statusByte
	}
}

module.exports = {
	parseStatusMessage
}