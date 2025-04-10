// checksum.js
function calculateChecksum(buffer, length = 12) {
	let sum = 0
	for (let i = 0; i < length; i++) {
		sum = (sum + (buffer[i] & 0xFF)) & 0xFFFF
	}
	return ((0xFF - (sum & 0xFF)) + 1) & 0xFF // matches real device behavior
}

module.exports = { calculateChecksum }