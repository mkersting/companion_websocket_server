// parser.js
//Parse incoming Websocket Messages


// Create RS232 Messages for Device Communication
module.exports = {
    createRS232Message: function (order, inputOutput, port,) {
        // Basic RS232 Message Structure
        const message = [
            0xA5, // First Byte
            0x5B, // Second Byte
            order, // Third Byte: 01 for status, 02 for switch output, etc.
            inputOutput, // Fourth Byte: 04 for input, 05 for output
            port, // Fifth Byte: Port number (01 to 04, or 00 for all ports)
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 // Bytes 6-12 (always 00)
        ];

        // Calculate checksum (13th byte)
        const checksum = this.calculateChecksum(message);
        message.push(checksum); // Add checksum byte

        return message;
    },

    calculateChecksum: function (message) {
        let sum = message.reduce((acc, byte) => acc + byte, 0);
        return 0xFF - (sum & 0xFF); // 13th byte checksum
    },

    parseStatusResponse: function (data) {
        // Example: parse received status message
        const inputStatus = data[6]; // Position of the input status (FF means disconnected)
        const inputPort = data[4]; // Input port (04)
        return {
            inputPort,
            inputStatus
        };
    }
};