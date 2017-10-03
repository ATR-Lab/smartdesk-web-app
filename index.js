'user strict';
var config      = require('./config.js');
var firebase    = require('firebase');
var rpio        = require('rpio');
var SerialPort  = require('serialport');

firebase.initializeApp(config.firebase.default);
var smartdeskStateRef = firebase.database().ref('smartdeskState');

// GPIO 14 TX   // PIN 08 Transmit Serial Message
// GPIO 15 RX   // PIN 10 Read Serial Message
// GPIO 18 Read // PIN 12 Read Status by polling - There are not Interrupts in Raspberry PI
// rpio.open(8, rpio.OUTPUT, rpio.LOW);
// var txBuff = Buffer.alloc(10);
const pirPin = 12;
var pirBuffer = Buffer.alloc(10);
//rpio.open(pirPin, rpio.INPUT);   // Read-Only Input
//rpio.poll(pirPin, function() {
//    console.log('TEST:::');
//});

// Open port
const ByteLength = SerialPort.parsers.ByteLength;
var port = new SerialPort('/dev/ttyS0', {
    baudRate: 57600
});
const parser = port.pipe(new ByteLength({length: 8}));

/*
port.open(function(err) {
	if(err) {
		return console.log('Error opening port: ', err.message);
	} else {
		console.log('GOOD TO GO!!!!!!!!!!!!!!!!');
	}
});

port.on('open', function() {console.log('JUST OPENED PORT');});
*/

// Set event handler for errors
port.on('error', function(err) {
  console.log('LOG Error: ', err.message);
});
// Read data
var feedbackMsg = port.read(13);

var hexToDec = function(val) {
	return parseInt(val, 16);
	//.toString(10);
} 

var deskState = [];
deskState[0] = 0;
deskState[1] = 0;
var oldState = 0;

var deskStatus = true;

/*
port.on('readable', function () {
	if((header = port.read(1)) != null && header[0] == 189) {
		
		if((feedbackHex = port.read(12)) != null) {
			
			//var feedbackHex = port.read(12);
			console.log('Header: ', header[0]);
			console.log('Val: ', feedbackHex);

			console.log('< %d, %d, %d, %d, %d, %d, %d, %d, %d, %d, %d, %d, %d >'
				, header[0]
				, feedbackHex[0]
				, feedbackHex[1]
				, feedbackHex[2]
				, feedbackHex[3]
				, feedbackHex[4]
				, feedbackHex[5]
				, feedbackHex[6]
				, feedbackHex[7]
				, feedbackHex[8]
				, feedbackHex[9]
				, feedbackHex[10]
				, feedbackHex[11]);

			deskState[0] = feedbackHex[10];
			deskState[1] = feedbackHex[11];
			deskStatus = !deskStatus;
			if(oldState != deskState[0]) {
				
				smartdeskStateRef.set({
					action: 'RAISE',
					height: deskState[0],
					status: deskStatus
				});
				oldState = deskState[0];
			}
			//deskStatus = 'UPDATING_STATUS';
		}
	}
});
*/

var hexBuf = new Buffer(13);
var pointer = 0;
var currentPointer = 0;
var startMsg = false;
port.on('data', function(data) {
	console.log('DATA: ', data);
	console.log('SIZE: ', data.length);

	for(var i = 0; i < data.length; i++) {
		if ( pointer == 0){
			if ( data[i] == 0xbd) {
				hexBuf[pointer] = data[i];
				pointer = 1;
				//console.log("HEX BUF+++++++" , hexBuf);

			}
		}else if ((pointer > 0) && (pointer < 13)){
				hexBuf[pointer] = data[i];
				pointer ++;
				//console.log("HEX BUF------" , hexBuf);
						
		}else{
			if (pointer == 13){
				//console.log("HEX BUF" , hexBuf);

				console.log('< %d, %d, %d, %d, %d, %d, %d, %d, %d, %d, %d, %d, %d >'
					, hexBuf[0]
					, hexBuf[1]
					, hexBuf[2]
					, hexBuf[3]
					, hexBuf[4]
					, hexBuf[5]
					, hexBuf[6]
					, hexBuf[7]
					, hexBuf[8]
					, hexBuf[9]
					, hexBuf[10]
					, hexBuf[11]
					, hexBuf[12]);

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
				//deskStatus = 'UPDATING_STATUS';
			}
		}
		
	}


	/*
	if((header = port.read(1)) != null && header[0] == 189) {
		
		if((feedbackHex = port.read(12)) != null) {
			
			//var feedbackHex = port.read(12);
			console.log('Header: ', header[0]);
			console.log('Val: ', feedbackHex);

			console.log('< %d, %d, %d, %d, %d, %d, %d, %d, %d, %d, %d, %d, %d >'
				, header[0]
				, feedbackHex[0]
				, feedbackHex[1]
				, feedbackHex[2]
				, feedbackHex[3]
				, feedbackHex[4]
				, feedbackHex[5]
				, feedbackHex[6]
				, feedbackHex[7]
				, feedbackHex[8]
				, feedbackHex[9]
				, feedbackHex[10]
				, feedbackHex[11]);

			deskState[0] = feedbackHex[10];
			deskState[1] = feedbackHex[11];
			deskStatus = !deskStatus;
			if(oldState != deskState[0]) {
				
				smartdeskStateRef.set({
					action: 'RAISE',
					height: deskState[0],
					status: deskStatus
				});
				oldState = deskState[0];
			}
			//deskStatus = 'UPDATING_STATUS';
		}
	}
	*/

	deskStatus = !deskStatus;
	smartdeskStateRef.set({
		action: 'RAISE',
		height: deskState[0],
		status: deskStatus
	});
	oldState = deskState[0];
});

// SmartDesk Protocols
// Reference: https://nodejs.org/api/buffer.html
const buttonIdleBuffer          = Buffer.from([216, 216, 102, 0, 0]);
const buttonDownBuffer          = Buffer.from([216, 216, 102, 1, 1]);
const buttonUpBuffer            = Buffer.from([216, 216, 102, 2, 2]);
const button1Buffer             = Buffer.from([216, 216, 102, 4, 4]);
const button2Buffer             = Buffer.from([216, 216, 102, 8, 8]);
const button3Buffer             = Buffer.from([216, 216, 102, 16, 16]);
const button4Buffer             = Buffer.from([216, 216, 102, 32, 32]);
const buttonConfigureBuffer     = Buffer.from([216, 216, 102, 64, 64]);
 
const hex          = Buffer.from([0xD8, 0xD8, 0x66, 0x01, 0x01]);
   
var header = 0;
smartdeskStateRef.on('value', function(snapshot) {
    console.log(snapshot.val());

	targetState = 85;
	console.log('THE STATE: %d, %d', deskState[0], deskState[1]);

	/*
	for (var i = 0; i < 1000; i++) {

		port.write(buttonDownBuffer, function(err) {
			if (err) {
				return console.log('Error on write: ', err.message);
			}
			console.log('Message written');
		});

		if((header = port.read(1)) != null && header[0] == 189) {
			console.log('READ 1');
			if((feedbackHex = port.read(12)) != null) {
				deskState[0] = feedbackHex[10];
				deskState[1] = feedbackHex[11];
				console.log('STATE: %d, %d', deskState[0], deskState[1]);
			}
		}
	}
	*/

	/*
	for(var j = 0; j < 10; j++) {

		setTimeout(function() {
			port.write(buttonUpBuffer, function(err, results) {
				if (err) {
					return console.log('Error on write: ', err.message);
				}
				deskStatus = 'EXECUTING';
			});
		}, 50);
	}
	setTimeout(function() {
		port.drain();
	}, 50);
	*/
			
	if(deskState[0] < targetState) {
		port.write(buttonUpBuffer, function(err, results) {
			if (err) {
				return console.log('Error on write: ', err.message);
			}
			deskStatus = 'EXECUTING';
		});

	}

});
