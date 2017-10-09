'user strict';
const config      = require('./config.js');
const deskaction  = require('./desk/action');
const desktrigger = require('./desk/trigger');
const firebase    = require('firebase');
const SerialPort  = require('serialport');
// const rpio        = require('rpio');
const colors      = require('colors');

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
const port       = new SerialPort('/dev/ttyS0', { baudRate: 57600 });
const parser     = port.pipe(new ByteLength({length: 8}));
port.open(function(err) {
    if(err) {
        return console.log('PORT: Error when opening: '.red, err.message);
    } else {
        console.log('PORT: Has been openend'.magenta);
        port.flush(null);
    }
});

port.on('open', function() { console.log('PORT: "Open" Event'.bold.white); });

port.on('error', function(err) {
    console.log('PORT: ERROR: '.red, err.message);
});

port.on('close', function(err) {
    if(err) {
        console.log('PORT: ERROR Closed Port: '.red, err.message);
    }
    console.log('PORT: "Close" Event'.bold.white);
});

var deskHeight    = [];
deskHeight[0]     = 0;
deskHeight[1]     = 0;
previousHeight    = -1;

var hexBuf     = new Buffer(13);
var pointer    = 0;
var heartbit   = 1;

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

const executeAction = (command) => {
    port.write(desktrigger[command], function(err, results) {
        if(err) {
            return console.log('PORT: ERROR: On Write: ', err.message);
        }
        console.log('LOG: Action Command: '.cyan + command.white + ' Desk'.white);
    });
};

var raiseFun;
var lowerFun;
const wait = 10000; //10 secs
var waitUntil = new Date(new Date().getTime() + wait);
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

                //heartbit = heartbit^1;    // flip bit
                //deskRef.update({heartbit: heartbit, currentHeight: deskHeight[0]});
                //desk.currentHeight = deskHeight[0];
                if(deskHeight[0] != 0 && deskHeight[0] != previousHeight) {
                    desk.currentHeight = deskHeight[0];
                    deskRef.update({currentHeight: deskHeight[0]});
                    previousHeight = deskHeight[0]
                }

                prevTime = new Date(new Date().getTime() + wait);

                if(desk.state == 'ON') {
                    if ( (desk.action.command == deskaction.command.RAISE && (desk.action.value - desk.currentHeight) <= 0 )
                        || (desk.action.command == deskaction.command.LOWER && (desk.action.value - desk.currentHeight) >= 0 )) {
                        desk.state = 'OFF';
                        deskRef.update({ state: 'OFF' });

                        desk.action.status = deskaction.status.COMPLETED;
                        deskRef.child('action').update({ status: deskaction.status.COMPLETED });

                        port.flush(null);
                        port.close(function(err) {
                            if(err) {
                                console.log('PORT: ERROR: When closing port after action: '.red, err.message)
                            }
                        });
                        console.log('LOG: Action: Completed'.bold.green);
                    }
                }
            }
        }
    }

    currTime = new Date();
    if(currTime > waitUntil) {
        //idleDesk();
        executeAction(deskaction.command.IDLE);
        port.flush(function(err) {
            if(err) {
                console.log('PORT: ERROR: When flushing: '.red, err.message)
            }
        });
        deskRef.update({heartbit: currTime});
        waitUntil = new Date(new Date().getTime() + wait);
    }

    if(desk.action.status === deskaction.status.EXECUTING) {
        if(desk.state == 'OFF') {
            desk.state = 'ON';
            deskRef.update({state: 'ON'});
        }
        console.log(`LOG: Status: ${desk.action.status}; `
            +`Command: ${desk.action.command}; `
            +`Value: ${desk.action.value}; CurrHeight: ${desk.currentHeight}`)
        switch(desk.action.type) {
            case deskaction.type.NUMERIC:
                switch(desk.action.command) {
                    case deskaction.command.RAISE:
                        executeAction(deskaction.command.RAISE);
                        executeAction(deskaction.command.RAISE);
                        executeAction(deskaction.command.RAISE);
                        break;
                    case deskaction.command.LOWER:
                        executeAction(deskaction.command.LOWER);
                        executeAction(deskaction.command.LOWER);
                        break;
                    default:
                        console.log('EXECUTING DEFAULT INNER');
                        break;
                }
                break;
            case deskaction.type.DISCRETE:
                switch(desk.action.command) {
                    case deskaction.command.RAISE:
                        executeAction(deskaction.command.RAISE);
                        executeAction(deskaction.command.RAISE);
                        break;
                    case deskaction.command.LOWER:
                        executeAction(deskaction.command.LOWER);
                        executeAction(deskaction.command.LOWER);
                        break;
                    default:
                        console.log('EXECUTING DEFAULT INNER');
                        break;
                }
                break;
            default:
                console.log(`EXECUTING DEFAULT: ${desk.action.type} ::: ${deskaction.type.QUALITATIVE}`);
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
        port.open();
        desk.action.type = snapshot.val()['type'];  // LOWER, RAISE
        console.log('FIREBASE: ', snapshot.val());
        if(desk.action.type == deskaction.type.NUMERIC) {
            desk.action.command = snapshot.val()['command'];
            desk.action.value   = snapshot.val()['value'];    // A quantitative value
            desk.action.status  = deskaction.status.EXECUTING;
        } else { // QUALITATIVE
            desk.action.command = snapshot.val()['command'];
            desk.action.value   = snapshot.val()['value'];
            var deltaHeight = 0;
            switch(desk.action.value) {
                case deskaction.command.value.SMALL:
                    deltaHeight = 4;
                    break
                case deskaction.command.value.LARGE:
                    deltaHeight = 8;
                    break;
                case deskaction.command.value.TOP:
                    break;
                case deskaction.command.value.MIDDLE:
                    break;
                case deskaction.command.value.BOTTOM:
                    break;
                default:
                    break;
            }
            deltaHeight = (desk.action.command == deskaction.command.LOWER) ? (deltaHeight * -1) : deltaHeight;
            desk.action.value   = desk.currentHeight + deltaHeight;
            desk.action.status  = deskaction.status.EXECUTING;
        }
        console.log(`desk->action->status: ${desk.action.status} ${desk.action.command} `
            + `of type: ${desk.action.type} ${desk.action.value}`);
    } else if(snapshot.val()['status'] === deskaction.status.COMPLETED) {
        // console.log('desk->action->status: DONE')
    } else { // else 'DONE'
        //
    }
});