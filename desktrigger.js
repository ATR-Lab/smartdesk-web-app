/* SmartDesk Communication Protocol */
var desktrigger = {};

desktrigger.idle 	= Buffer.from([216, 216, 102, 0, 0]);
desktrigger.down 	= Buffer.from([216, 216, 102, 1, 1]);
desktrigger.up 		= Buffer.from([216, 216, 102, 2, 2]);
desktrigger.one		= Buffer.from([216, 216, 102, 4, 4]);
desktrigger.two		= Buffer.from([216, 216, 102, 8, 8]);
desktrigger.three	= Buffer.from([216, 216, 102, 16, 16]);
desktrigger.four 	= Buffer.from([216, 216, 102, 32, 32]);
desktrigger.config 	= Buffer.from([216, 216, 102, 64, 64]);

module.exports = desktrigger;