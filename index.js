'user strict';

var config = require('./config.js');
var firebase = require('firebase');
// var rpio = require('rpio');

firebase.initializeApp(config.firebase.default);

var smartdeskStateRef = firebase.database().ref('smartdeskState');
smartdeskStateRef.on('value', function(snapshot) {
    console.log(snapshot.val());
});

