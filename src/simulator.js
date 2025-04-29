// simulator.js

const { calculateChecksum } = require('./checksum')

function simulateDeviceResponse(requestBuffer) {

	//console.log('Simulate requestBUffer: ', requestBuffer)
	if (requestBuffer.length !== 13 || requestBuffer[0] !== 0xA5 || requestBuffer[1] !== 0x5B) {
		return null // Not a valid RS232 request
	}

	const response = Buffer.alloc(13, 0x00)
    response[0] = 0xA5
	response[1] = 0x5B

	//Connect Handshake
	if (requestBuffer[2] == 0x01 && requestBuffer[3] == 0x0B) {

		response[2] = 0x01 // Echo command
		response[3] = 0x0B //Connect Handshake
		response[4] = 0x00
		response[5] = 0x00
		response[6] = 0xFF // I'm here!
		response[7] = 0x00
		response[8] = 0x00
		response[9] = 0x00
		response[10] = 0x00
		response[11] = 0x00
		response[12] = calculateChecksum(response)

		//console.log('My answer: ', response)
		return response
	}

	// Status request
	else if (requestBuffer[2] === 0x01) {
		const type = requestBuffer[3] // 0x04 = input, 0x05 = output
		const port = requestBuffer[4]

		response[2] = 0x01       // echo the command
		response[3] = type
		response[4] = port
		response[5] = 0x00
		response[6] = 0x00       // Status byte: simulate "Not Connected" 0x00 = Connected

		// Bytes 7–11 are already 0x00

		//Calculate Checksum
		response[12] = calculateChecksum(response)

		return response
	}

	



	else if (requestBuffer[2] === 0x02) {

		response[2] = 0x02 // Echo command
		response[3] = requestBuffer[3] //Echo Output Port
		response[4] = 0x00
		response[5] = 0x00
		response[6] = requestBuffer[6] // Echo Fixed flag/step
		response[7] = 0x00
		response[8] = 0x00
		response[9] = 0x00
		response[10] = 0x00
		response[11] = 0x00
		response[12] = calculateChecksum(response)

		return response
	}

	else {
		return null
	}

}

module.exports = { simulateDeviceResponse }