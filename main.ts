//% color=#126180 icon="\uf0fb" block="ThisExtensionIsATest"
    namespace ESP8266_IoT {
        enum Cmd {
            None,
            ConnectWifi,
        }
    let wifi_connected: boolean = false
    let connectionInitialized = false // to track connection state
    let telloIP = "192.168.10.1"
    let response = ""
    let recvString = ""
    let commandPort = 8889
    let scanWIFIAPFlag = 0
    let currentCmd: Cmd = Cmd.None

        
    const EspEventSource = 3000
    const EspEventValue = {
        None: Cmd.None,
        ConnectWifi: Cmd.ConnectWifi
    }

    // write AT command with CR+LF ending
    function sendAT(command: string, wait: number = 0) {
        serial.writeString(`${command}\u000D\u000A`)
        basic.pause(wait)
        response = serial.readString() // Capture response immediately after sending
    }

// Function to read and display response on the micro:bit
    function readResponse(): boolean {
        if (response && response.includes("OK")) {
            basic.showString("Connected")
            return true
        } else {
            basic.showString("Failed")
            return false
        }
    }
    function sendCommandToTello(command: string): boolean {
        if (!wifi_connected) {
            basic.showString("No WiFi")
            return false
        }
        // Assuming you're already connected to Tello WiFi, have set up UDP connection and initialisd the Tello into SDK mode
        // Send command length first
        sendAT(`AT+CIPSEND=${command.length}`, 500)
        if (!readResponse()) return false

        // Send the actual command
        serial.writeString(command + "\r\n")
        basic.pause(500);
        
        return readResponse(); // Display Tello's response
        }
    function restEsp8266() {
        sendAT("AT+RESTORE", 2000) // restore to factory settings
        sendAT("AT+RST", 2000) // rest
        serial.readString()
        basic.pause(1000)
        sendAT("AT+CWMODE=1", 1000) // set to STA mode
        sendAT(`AT+CIPSNTPCFG=1,8,"ntp1.aliyun.com","0.pool.ntp.org","time.google.com"`, 100)
        basic.pause(3000)
    }

    /**
         * Initialize ESP8266 module
         */
    //% block="set ESP8266|RX %tx|TX %rx|Baud rate %baudrate"
    //% tx.defl=SerialPin.P8
    //% rx.defl=SerialPin.P12
    //% ssid.defl=your_ssid
    //% pw.defl=your_password weight=100
    export function initWIFI(tx: SerialPin, rx: SerialPin, baudrate: BaudRate) {
        serial.redirect(tx, rx, BaudRate.BaudRate115200)
        basic.pause(1000)
        serial.setTxBufferSize(256)
        serial.setRxBufferSize(256)
        restEsp8266()
        connectionInitialized = true
    }

    /**
     * connect to Wifi router
     */
    //% block="connect Wifi SSID = %ssid|KEY = %pw"
    //% ssid.defl=your_ssid
    //% pw.defl=your_pwd weight=95
    export function connectWifi(ssid: string, pw: string) {
        if (!connectionInitialized) {
            basic.showString("Init first!")
            return
        }

        let attempts = 0
        const maxAttempts = 3

        while (attempts < maxAttempts) {
            basic.showNumber(attempts + 1)  // Show attempt number
            sendAT(`AT+CWJAP="${ssid}","${pw}"`, 10000)  // Increased timeout

            if (response.includes("OK") || response.includes("CONNECTED")) {
                wifi_connected = true
                basic.showIcon(IconNames.Yes)
                return
            }

            attempts++
            if (attempts < maxAttempts) {
                restEsp8266()
                basic.pause(2000)  // Wait between attempts
            }
        }

        basic.showIcon(IconNames.No)
        wifi_connected = false
    }

    // Seting up UDP connection (2) and initialise the Tello into SDK mode (3)
    //% block="Initialise ESP and Tello connection"
    export function setupUDPConnection() {
        if (!wifi_connected) {
            basic.showString("No WiFi")
            return
        }

        // Setup UDP connection
        sendAT(`AT+CIPSTART="UDP","${telloIP}",${commandPort}`, 2000)
        if (!readResponse()) return

        // Enter SDK mode
        sendCommandToTello("command")
        }
}