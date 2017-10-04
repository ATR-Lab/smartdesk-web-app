'user strict';
const config      = require('./config.js');
const desktrigger = require('./desktrigger');
const firebase    = require('firebase');
const SerialPort  = require('serialport');
// const rpio        = require('rpio');

/* Get terminal arguments 
 * --env    :   'dev', 'prod'
 * --action :   'up', 'down' // Only used when --env = dev
 * --val    :   {numeric value, discrete value}
 */
const grab = flag => {
    var index = process.argv.indexOf(flag);
    return (index === -1) ? null : process.argv[index+1];
}
const env = grab('--env');    // Environment: 'dev' 'prod'

/* Convert hex value to decimal */
const hexToDec = hexVal => { return parseInt(hexVal, 16); }

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
// SerialPort event handlers
port.open(function(err) {
    if(err) {
        return console.log('Error opening port: ', err.message);
    } else {
        console.log('Serial port opened');
    }
});
port.on('open', function() { console.log('JUST OPENED PORT'); });
port.on('error', function(err) {
    console.log('LOG Error: ', err.message);
});

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
                console.log(`< ${hexBuf[0]}, ${hexBuf[1]}, ${hexBuf[2]}, ${hexBuf[3]}\
                    , ${hexBuf[4]}, ${hexBuf[5]}, ${hexBuf[6]}, ${hexBuf[7]}\
                    , ${hexBuf[8]}, ${hexBuf[9]}, ${hexBuf[10]}, ${hexBuf[11]}, ${hexBuf[12]} >`);

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

/* Firebase Configuration */
firebase.initializeApp(config.firebase.default);
const smartdeskStateRef = firebase.database().ref('smartdeskState');
smartdeskStateRef.on('value', function(snapshot) {
    console.log(snapshot.val());
    targetStateTop      = 85;
    targetStateBottom   = 75;

    var targetHeight = (grab('action')!=null && grab('val') != null) ? grab('val') : -1;
    for(var i = 0; i < 15; i++) {
        if(deskState[0] < targetHeight) {
            port.write(desktrigger.up, function(err, results) {
                if (err) {
                    return console.log('Error on write: ', err.message);
                }
                deskStatus = 'EXECUTING';
                console.log('RAISING DESK');
            });
        } else {
            port.write(desktrigger.down, function(err, results) {
                if (err) {
                    return console.log('Error on write: ', err.message);
                }
                deskStatus = 'EXECUTING';
                console.log('DECREASING DESK');
            });            
        }
    }
});


