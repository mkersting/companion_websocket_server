// rs232-builder.js

const { calculateChecksum } = require('./checksum')

function buildRs232Message({ command, fromport, toport, port , type}) {
	const message = Buffer.alloc(13, 0x00)

	message[0] = 0xA5
	message[1] = 0x5B

	if (command === 'switch') {
		message[2] = 0x02 // "switch" command
		message[3] = toport // 05 = output (we are switching output)
		message[4] = fromport
	}
    else if (command === 'status') {
		message[2] = 0x01          // command: get status
		message[3] = type === 'input' ? 0x04 : 0x05 // input/output flag
		message[4] = port // You said 01 = output 1
	}

	// Fill bytes 6-11 with 0x00 (already done via Buffer.alloc)
	// Calculate checksum: naive version = 0xFF - sum of bytes 0–11
	let checksum = 0
	for (let i = 0; i < 12; i++) {
		checksum += message[i]
	}

    // Checksum (placeholder)
	message[12] = calculateChecksum(message)

	return message
}

module.exports = { buildRs232Message }