// simulator.js

const { calculateChecksum } = require('./checksum')

function simulateDeviceResponse(requestBuffer) {
	if (requestBuffer.length !== 13 || requestBuffer[0] !== 0xA5 || requestBuffer[1] !== 0x5B) {
		return null // Not a valid RS232 request
	}

	const response = Buffer.alloc(13, 0x00)
    response[0] = 0xA5
	response[1] = 0x5B

	// Status request
	if (requestBuffer[2] === 0x01) {
		const type = requestBuffer[3] // 0x04 = input, 0x05 = output
		const port = requestBuffer[4]

		response[2] = 0x01       // echo the command
		response[3] = type
		response[4] = port
		response[5] = 0x00
		response[6] = 0x00       // Status byte: simulate "Not Connected" 0x00 = Connected

		// Bytes 7–11 are already 0x00

		// Checksum over bytes 0–11
		let sum = 0
		for (let i = 0; i < 12; i++) {
			sum += response[i]
		}
		response[12] = calculateChecksum(response)

		return response
	}

	return null
}

module.exports = { simulateDeviceResponse }