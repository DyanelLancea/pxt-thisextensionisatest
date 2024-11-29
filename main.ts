//% color=#126180 icon="\uf0fb" block="ThisExtensionIsATest"
namespace TelloControl {
    // Initialize the variables
    let telloIP = "192.168.10.1";
    let commandPort = 8889;
    let response = serial.readString();

    // Function to read and display response on the micro:bit
    function readResponse(): void {
        if (response.includes("OK")) {
            basic.showString("Connected");
        } else {
            basic.showString("Failed");
            basic.showString(response); // Display the actual error
        }
    }

    function sendCommandToTello(command: string): void {
        // Assuming you're already connected to Tello WiFi, have set up UDP connection and initialisd the Tello into SDK mode
        sendAT(`AT+CIPSEND=${command.length}`, 500);  // Send command length and command
        serial.writeString(command + "\r\n"); // Send the actual command
        basic.pause(500);
        readResponse(); // Display Tello's response
    }

    function sendAT(command: string, wait: number = 0) {
        serial.writeString(`${command}\u000D\u000A`);
        basic.pause(wait);
    }

    // Function to initialize ESP8266 and redirect serial communication
    //% block="Initialize ESP8266 with TX %tx| RX %rx"
    //% tx.defl=SerialPin.P8
    //% rx.defl=SerialPin.P12
    export function initESP8266(tx: SerialPin, rx: SerialPin): void {
        serial.redirect(tx, rx, BaudRate.BaudRate115200); // Redirect TX and RX
        basic.pause(100);
        serial.setTxBufferSize(128);
        serial.setRxBufferSize(128);

        sendAT("AT+RST", 2000); // Reset the ESP8266
        sendAT("AT+CWMODE=1", 1000); // Set ESP8266 to Station Mode (STA mode)
        sendAT("AT+CWQAP", 1000); // Disconnect from current Wi-Fi
        sendAT("AT", 500); // Check if ESP8266 responds with "OK"
        readResponse()
    }
    //% block="Land"
    export function land(): void {
        sendCommandToTello("land");
    }

    //% block="Takeoff"
    export function takeOff(): void {
        sendCommandToTello("takeoff");
    }
    // Seting up UDP connection (2) and initialise the Tello into SDK mode (3)
    //% block="Initialise ESP and Tello connection"
    export function setupUDPConnection(): void {
        sendAT(`AT+CIPSTART="UDP","${telloIP}",${commandPort}`, 1000);
        sendCommandToTello("command"); //Enter SDK mode
        basic.pause(500); // Allow some time for connection setup
    }

    // Function to connect to Tello Wi-Fi (1)
    //% block="Connect to Tello Wi-Fi SSID %ssid Password %pwd"
    export function connectToWiFi(ssid: string, pwd: string): void {
        sendAT(`AT+CWJAP="${ssid}","${pwd}"`, 5000);
        readResponse(); // Display response on micro:bit
    }
}
