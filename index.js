'user strict';
var config 		= require('./config.js');
var firebase 	= require('firebase');
var rpio 		= require('rpio');

firebase.initializeApp(config.firebase.default);

// GPIO 14 TX 	// PIN 08 Transmit Serial Message
// GPIO 15 RX 	// PIN 10 Read Serial Message
// GPIO 18 Read // PIN 12 Read Status by polling - There are not Interrupts in Raspberry PI
rpio.open(8, rpio.OUTPUT, rpio.LOW);

// SmartDesk Protocols
// Reference: https://nodejs.org/api/buffer.html
const buttonDownBuffer 			= Buffer.from([216, 216, 102, 1, 1]);
const buttonUpBuffer 			= Buffer.from([216, 216, 102, 2, 2]);
const button1Buffer 			= Buffer.from([216, 216, 102, 4, 4]);
const button2Buffer 			= Buffer.from([216, 216, 102, 8, 8]);
const button3Buffer 			= Buffer.from([216, 216, 102, 16, 16]);
const button4Buffer 			= Buffer.from([216, 216, 102, 32, 32]);
const buttonConfigureBuffer 	= Buffer.from([216, 216, 102, 64, 64]);

var smartdeskStateRef = firebase.database().ref('smartdeskState');
smartdeskStateRef.on('value', function(snapshot) {
    console.log(snapshot.val());

    for (var i = 0; i < 5; i++) {
    	rpio.writebuf(8, buttonDownBuffer);
    	rpio.msleep(250);
    }
});