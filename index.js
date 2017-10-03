'user strict';
const config      = require('./config.js');
const firebase    = require('firebase');
const rpio        = require('rpio');
const SerialPort  = require('serialport');

/* GPIO Configuration */
// GPIO 14 TX   // PIN 08 Transmit Serial Message
// GPIO 15 RX   // PIN 10 Read Serial Message
// GPIO 18 Read // PIN 12 Read Status by polling - There are not Interrupts in Raspberry PI
const pirPin = 12;
var pirBuffer = Buffer.alloc(10);
//rpio.open(pirPin, rpio.INPUT);   // Read-Only Input
//rpio.poll(pirPin, function() {
//    console.log('TEST:::');
//});

/* RXTX Serial Communication Configuration */
const ByteLength = SerialPort.parsers.ByteLength;
const port = new SerialPort('/dev/ttyS0', { baudRate: 57600 });
const parser = port.pipe(new ByteLength({length: 8}));

port.open(function(err) {
    if(err) {
        return console.log('Error opening port: ', err.message);
    } else {
        console.log('Serial port opened');
    }
});

port.on('open', function() { console.log('JUST OPENED PORT'); });

// Event handler for errors
port.on('error', function(err) {
    console.log('LOG Error: ', err.message);
});

var hexToDec = function(val) {
    return parseInt(val, 16);//.toString(10);
}

var deskState = [];
deskState[0] = 0;
deskState[1] = 0;
var oldState = 0;

var deskStatus = true;
var hexBuf = new Buffer(13);
var pointer = 0;
var currentPointer = 0;
var startMsg = false;

port.on('data', function(data) {
    //console.log('DATA: ', data);
    //console.log('SIZE: ', data.length);
    for(var i = 0; i < data.length; i++) {
        if ( pointer == 0) {
            if ( data[i] == 0xbd) {
                hexBuf[pointer] = data[i];
                pointer = 1;
            }
        } else if ((pointer > 0) && (pointer < 13)) {
            hexBuf[pointer] = data[i];
            pointer ++;
        } else {
            if (pointer == 13) {
                console.log(`< ${hexBuf[0]}, ${hexBuf[1]}, ${hexBuf[2]}, ${hexBuf[3]}, ${hexBuf[4]}, ${hexBuf[5]}, ${hexBuf[6]}, ${hexBuf[7]}, ${hexBuf[8]}, ${hexBuf[9]}, ${hexBuf[10]}, ${hexBuf[11]}, ${hexBuf[12]} >`);
                deskState[0] = hexBuf[11];
                deskState[1] = hexBuf[12]
                pointer = 0;

                if(oldState != deskState[0]) {
                    smartdeskStateRef.set({
                        action: 'RAISE',
                        height: deskState[0],
                        status: deskStatus
                    });
                    oldState = deskState[0];
                }
            }
        }
    }

    /*
    smartdeskStateRef.set({
        action: 'RAISE',
        height: deskState[0],
        status: deskStatus
    });
    oldState = deskState[0];
    */
});

/* SmartDesk Communication Protocol */
// Reference: https://nodejs.org/api/buffer.html
const buttonIdleBuffer          = Buffer.from([216, 216, 102, 0, 0]);
const buttonDownBuffer          = Buffer.from([216, 216, 102, 1, 1]);
const buttonUpBuffer            = Buffer.from([216, 216, 102, 2, 2]);
const button1Buffer             = Buffer.from([216, 216, 102, 4, 4]);
const button2Buffer             = Buffer.from([216, 216, 102, 8, 8]);
const button3Buffer             = Buffer.from([216, 216, 102, 16, 16]);
const button4Buffer             = Buffer.from([216, 216, 102, 32, 32]);
const buttonConfigureBuffer     = Buffer.from([216, 216, 102, 64, 64]);
const hex                       = Buffer.from([0xD8, 0xD8, 0x66, 0x01, 0x01]);

/* Firebase Configuration */
firebase.initializeApp(config.firebase.default);
const smartdeskStateRef = firebase.database().ref('smartdeskState');
smartdeskStateRef.on('value', function(snapshot) {
    console.log(snapshot.val());
    targetStateTop = 85;
    targetStateBottom = 75;
    for(var i = 0; i < 15; i++) {
        if(deskState[0] < targetStateTop) {
            port.write(buttonUpBuffer, function(err, results) {
                if (err) {
                    return console.log('Error on write: ', err.message);
                }
                deskStatus = 'EXECUTING';
            });
        }
    }
});


