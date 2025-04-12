// rs232-builder.js

const { calculateChecksum } = require('./checksum')

function buildRs232Message({ command, input, output, port, direction }) {
	const message = Buffer.alloc(13, 0x00)

	message[0] = 0xA5
	message[1] = 0x5B

	if (command === 'switch') {
		message[2] = 0x02        // Command group: Routing
		message[3] = output  // Output port (1–4)
		message[4] = input   // Input port (1–4)
		message[5] = 0x00        // Reserved
		message[6] = 0x01        // Fixed flag/step
		// Bytes 7–11 remain 0
	}
    else if (command === 'status') {
		message[2] = 0x01          // command: get status
		message[3] = direction === 'input' ? 0x04 : 0x05 // input/output flag
		message[4] = port // You said 01 = output 1
	}

    // Calculate checksum: naive version = 0xFF - sum of bytes 0–11
	message[12] = calculateChecksum(message)

	return message
}

module.exports = { buildRs232Message }