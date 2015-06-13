"use strict";
var _ = require('underscore');
var lp = require('midi-launchpad');

var cycle = require('./utils').cycle;

var shifted1 = false;
var shifted2 = false;

var Launchpad = function(outPort, inPort, banks){
    this.launchpad;
    if (inPort){
        this.launchpad = new lp.Launchpad(0, false);
        // Close and delete the ports, remove callback
        this.launchpad.output.closePort();
        delete this.launchpad.output;
        this.launchpad.input.closePort();
        delete this.launchpad.input;

        // then repoen them with the differing ports and readd callback
        this.launchpad.output = new midi.output();
        this.launchpad.output.openPort(outPort);
        this.launchpad.input = new midi.input();
        this.launchpad.input.openPort(inPort);
        this.launchpad.input.on('message', function(deltaTime, message) {
            this.launchpad.receiveMessage(deltaTime, message);
        });
    } else {
        this.launchpad = lp.connect(parseInt(result.launchpad));
    }

    this.banks = banks;
    this.bankCycle = cycle(banks);

    this.callbacks = {
        'both':{},
        'shift1': {},
        'shift2': {},
        'none': {'catchall': {}}
    }

    this.launchpad.on("press", function(button) {
        var shift = 'none'
        if (shifted1 && shifted2){
            shift = 'both';
        } else if (shifted1){
            shift = 'shift1'
        } else if (shifted2){
            shift = 'shift2'
        };
        if (this.callbacks[shift][button.toString()]){
            this.callbacks[shift][button.toString()](button);
        } else {
            console.log(button.toString());
            this.callbacks[shift]['catchall'](button);
        }
    });
}
