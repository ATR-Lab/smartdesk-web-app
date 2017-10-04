'user strict';
const config      = require('./config.js');
const deskaction  = require('./desk/action');
const desktrigger = require('./desk/trigger');
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
/* Convert hex value to decimal */
const hexToDec = hexVal => { return parseInt(hexVal, 16); }

const env = grab('--env');    // Environment: 'dev' 'prod'

/*
 * GPIO Configuration
 * GPIO 14 TX   // PIN 08 Transmit Serial Message
 * GPIO 14 TX   // PIN 08 Transmit Serial Message
 * GPIO 15 RX   // PIN 10 Read Serial Message
 * GPIO 18 Read // PIN 12 Read Status by polling - There are not Interrupts in Raspberry PI
 */
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
        port.flush(null);
    }
});
port.on('open', function() { console.log('JUST OPENED PORT');  });
port.on('error', function(err) {
    console.log('LOG Error: ', err.message);
});

var deskHeight = [];
deskHeight[0] = 0;
deskHeight[1] = 0;

var hexBuf = new Buffer(13);
var pointer = 0;
var heartbit = 1;

var desk = {
    action: {
        type: 'NAN',
        value: -1,
        status: 'NAN',
        command: 'NAN'
    },
    currentHeight: -1,
    state: 'OFF'
};

const raiseDesk = () => {
    port.write(desktrigger.up, function(err, results) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
        console.log('RAISING DESK');
    });
};

const lowerDesk = () =>{
    port.write(desktrigger.down, function(err, results) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
        console.log('DECREASING DESK');
    });
};

var raiseFun;
var lowerFun;
const wait = 2000; //half a  second
var prevTime = new Date(new Date().getTime() + wait);
var currTime = new Date();
port.on('data', function(data) {
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
                    console.log(`< ${hexBuf[0]}, ${hexBuf[1]}, ${hexBuf[2]}, ${hexBuf[3]}` +
                        `, ${hexBuf[4]}, ${hexBuf[5]}, ${hexBuf[6]}, ${hexBuf[7]}` +
                        `, ${hexBuf[8]}, ${hexBuf[9]}, ${hexBuf[10]}, ${hexBuf[11]}, ${hexBuf[12]} >`);

                    deskHeight[0] = hexBuf[11];
                    deskHeight[1] = hexBuf[12]
                    pointer = 0;

                    heartbit = heartbit^1;    // flip bit
                    deskRef.update({heartbit: heartbit, currentHeight: deskHeight[0]});
                    desk.currentHeight = deskHeight[0];

                    prevTime = new Date(new Date().getTime() + wait);

                    if(desk.state == 'ON') {
                        if ( (desk.action.command == deskaction.command.RAISE && (desk.action.value - desk.currentHeight) <= 0 )
                            || (desk.action.command == deskaction.command.LOWER && (desk.action.value - desk.currentHeight) >= 0 )) {
                            desk.state = 'OFF';
                            deskRef.update({state: 'OFF'});

                            desk.action.status = deskaction.status.COMPLETED;
                            deskRef.child('action').update({status: deskaction.status.COMPLETED});

                            port.flush(null);
                            console.log('ACTION COMPLETED');
                        }
                    }
                }
            }
        }
    //console.log(`${desk.action.status}, ${desk.action.command}, ${desk.action.value}, ${desk.currentHeight}`)
    //console.log(`11111ACTION STATUS: ${desk.action.status}`);
    if(desk.action.status === deskaction.status.EXECUTING) {
        if(desk.state == 'OFF') {
            desk.state = 'ON';
            deskRef.update({state: 'ON'});
        }

        console.log(`22222ACTION STATUS: ${desk.action.status}`);
        console.log(`COMMAND: ${desk.action.command} VALUE: ${desk.action.value} CURRHEIGHT: ${desk.currentHeight}`)
        switch(desk.action.type) {
            case deskaction.type.NUMERIC:
                //console.log('EXECUTING NUMERIC');
                switch(desk.action.command) {
                    case deskaction.command.RAISE:
                        console.log('RAISE');
                        raiseDesk();
                        raiseDesk();
                        raiseDesk();
                        break;
                    case deskaction.command.LOWER:
                        console.log('LOWER');
                        lowerDesk();
                        lowerDesk();
                        //lowerDesk();
                        break;
                    default:
                        console.log('EXECUTING DEFAULT INNER');
                        break;
                }
                break;
            case deskaction.type.QUALITATIVE:
                break;
            default:
                console.log('EXECUTING DEFAULT');
                //break;
        }
    } else {  // We are done, no need to raise or lower the desk
        //desk.action.status = deskaction.status.COMPLETED;
    }

    currTime = new Date();
});

/* Firebase Configuration */
firebase.initializeApp(config.firebase.default);
const database          = firebase.database();
const smartdeskStateRef = database.ref('smartdeskState');
const deskRef           = database.ref('desk');
const officeRef         = database.ref('office');

/* Listen for changes that take place when USER TALKS TO VOICE INTERFACE */
deskRef.child('action').on('value', function(snapshot) {
    if(snapshot.val()['status'] === deskaction.status.EXECUTE) { // We receive a command from voice interface
        desk.action.command = snapshot.val()['command'];  // LOWER, RAISE
        desk.action.type    = snapshot.val()['type'];     // QUANTITATIVE, QUALITATVE
        desk.action.value   = snapshot.val()['value'];    // A quantitative or qualitative value
        desk.action.status  = deskaction.status.EXECUTING;
        console.log(`desk->action->status: ${desk.action.status} ${desk.action.command} of type: ${desk.action.type} ${desk.action.value}`);
    } else if(snapshot.val()['status'] === deskaction.status.COMPLETED){
        // console.log('desk->action->status: DONE')
    } else { // else 'DONE'
        //
    }
});