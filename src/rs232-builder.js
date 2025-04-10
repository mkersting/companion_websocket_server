// rs232-builder.js

const { calculateChecksum } = require('./checksum')

function buildRs232Message({ command, input, output }) {
	const message = Buffer.alloc(13, 0x00)

	message[0] = 0xA5
	message[1] = 0x5B

	if (command === 'switch') {
		message[2] = 0x02 // "switch" command
		message[3] = 0x05 // 05 = output (we are switching output)
		message[4] = output || 0x00
		message[5] = input || 0x00
	}
    else if (command === 'status') {
		message[2] = 0x01          // command: get status
		message[3] = 0x04          // 04 = input? (based on your notes)
		message[4] = output // You said 01 = output 1
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