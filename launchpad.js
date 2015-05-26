"use strict";
// https://github.com/justinlatimer/node-midi
var _ = require('underscore');
var midi = require('midi');
var masteroutput = new midi.output();

var controllers = {};
console.log('Pick your launchpad');
_(masteroutput.getPortCount()).times(function(n){
    controllers[masteroutput.getPortName(n)] = n;
    console.log(masteroutput.getPortName(n), ': ', n);
});

var outputs = {};
var prompt = require('prompt');

prompt.get(
    _.first([
        'launchpad',
        {name: 'synth1', required: false, default: -1, type: 'number'},
        {name: 'synth2', required: false, default: -1, type: 'number'},
        {name: 'synth3', required: false, default: -1, type: 'number'},
        {name: 'synth4', required: false, default: -1, type: 'number'}
    ], masteroutput.getPortCount()),
function (err, result) {
    // https://github.com/sydlawrence/node-midi-launchpad
    var launchpad = require('midi-launchpad').connect(parseInt(result.launchpad));

    var play = launchpad.getButton(8,0);
    var stop = launchpad.getButton(8,1);
    var tempoup = launchpad.getButton(8,4);
    var tempodown = launchpad.getButton(8,5);
    var shift1 = launchpad.getButton(8,6);
    var shift2 = launchpad.getButton(8,7);
    var bank = launchpad.getButton(8,3);
    var ticks = cycle(_.range(8));
    var t = 0;

    function initcontrols() {
        launchpad.clear();
        notesOff();
        play.light(launchpad.colors.green.high);
        stop.light(launchpad.colors.red.medium);
        shift1.light(launchpad.colors.orange.medium);
        shift2.light(launchpad.colors.yellow.medium);
        tempoup.light(launchpad.colors.green.low);
        tempodown.light(launchpad.colors.red.low);
    };

    launchpad.on("ready",function(launchpad) {
        initcontrols();
        clock.setTempo(tempo);
    });


    play.on("press", function(button) {
        if (play.getState() == launchpad.colors.orange.high){
            // Stop the clock without reseting the tick
            clock.stop();
            play.light(launchpad.colors.green.high);
            notesOff();
        } else {
            clock.start();
            console.log(tempo);
            play.light(launchpad.colors.orange.high);
        }
        stop.light(launchpad.colors.red.medium);
    });

    stop.on("press", function(button) {
        // Stop the clock, reset the tick
        clock.stop();
        _(8).times(function(n){darktick(launchpad.getButton(n, 8)); });
        ticks = cycle(_.range(8));
        notesOff();
        play.light(launchpad.colors.green.high);
        stop.light(launchpad.colors.red.medium);
    });

    tempoup.on("press", function(button){
        tempo += (shifted2 ? 10 : 1);
        clock.setTempo(tempo);
    });

    tempodown.on("press", function(button){
        tempo -= (shifted2 ? 10 : 1);
        clock.setTempo(tempo);
    });

    shift1.on("press", function(button) {
        shifted1 = true;
    });

    shift1.on("release", function(button) {
        shifted1 = false;
    });

    shift2.on("press", function(button) {
        shifted2 = true;
    });

    shift2.on("release", function(button) {
        shifted2 = false;
    });

    function lighttick(button){
        var state = button.getState();
        if (state == launchpad.colors.green.medium){
            button.light(launchpad.colors.green.high);
        } else if (state == launchpad.colors.yellow.medium){
            button.light(launchpad.colors.yellow.high);
        } else {
            button.light(launchpad.colors.red.high);
        }
    }

    function darktick(button) {
        var state = button.getState();
        if (state == launchpad.colors.green.high){
            button.light(launchpad.colors.green.medium);
        } else if (state == launchpad.colors.yellow.high){
            button.light(launchpad.colors.yellow.medium);
        } else if (state == launchpad.colors.red.high){
            button.dark();
        }
        // there's a no op for green/yellow medium for accents/glides
    }

    function accent (button) {
        var state = button.getState();
        button.light((state == 0 ? launchpad.colors.green.medium : 0));
    }

    function glide (button) {
        var state = button.getState();
        button.light((state == 0 ? launchpad.colors.yellow.medium : 0));
    }

    function addNote(button){
        var current = button.getState();
        if (current == bank.getState()){
            button.dark();
            // TODO: remove from list
            var midimessage = [128, scale[button.y].midi(), 0];
            outputs[current].output.sendMessage(midimessage);
            outputs[current].notes[button.x] = _.without(
                outputs[current].notes[button.x],
                button.y
            );
        } else {
            button.light(bank.getState());
            outputs[bank.getState()].notes[button.x].push(button.y);
        }
    }

    launchpad.on("press", function(button) {
        if (button.y == 8){
            if (!shifted2){
                accent(button);
            } else {
                glide(button);
            }
        } else if (button.x != 8) {
            addNote(button);
        }
    });

    var bankcolours = [
        launchpad.colors.green.high,
        launchpad.colors.yellow.high,
        launchpad.colors.orange.high,
        launchpad.colors.red.high
    ];

    _(masteroutput.getPortCount() - 1).times(function(n){
        var name = 'synth' + (n + 1);
        var synth = parseInt(result['synth' + (n + 1)]);
        if (synth >= 0){
            outputs[bankcolours[n]] = {
                output: new midi.output(),
                notes: [[], [], [], [], [], [], [], []],
                name: masteroutput.getPortName(synth)
            };
            outputs[bankcolours[n]].output.openPort(synth, "funtangle");
        }
    });

    // Want an infinite cycle of elements, the size of all the outputs + 0 element
    var bankcycle = cycle(_.flatten([_.first(bankcolours, _.size(outputs)), 0]));

    bank.on("press", function(button){
        if (shifted2){
            initcontrols();
        } else {
            var b = bankcycle.next();
            if (b > 0) {console.log(outputs[b].name)};
            bank.light(b);
            drawGrid(launchpad, b);
        }
    });
    clock.on('position', function(position){
      var microPosition = position % 24;
      if (microPosition === 0){
        t = ticks.next();
        donotesfor(launchpad, t, 144);
        if (t > 0){
            donotesfor(launchpad, t-1, 128);
        } else {
            donotesfor(launchpad, 7, 128);
        }
        lighttick(launchpad.getButton(t, 8));
        if (t > 0){
            darktick(launchpad.getButton(t - 1, 8));
        } else {
            darktick(launchpad.getButton(7, 8));
        }
      }
    });
});

// https://github.com/mmckegg/midi-clock
var MidiClock = require('midi-clock');
var clock = MidiClock();

// https://www.npmjs.com/package/midi-looper
// https://www.npmjs.com/package/midi-looper-launchpad
// https://github.com/saebekassebil/teoria
var teoria = require('teoria');

var t = 0;
var tempo = 120;
var shifted1 = false;
var shifted2 = false;

var notes = [];

var scale = teoria.note("g4").scale('dorian').notes();
scale.push(scale[0].interval('P8'));
// Keeping 'natural' numbering of keypads means reversing the scale so highest
// note is highest pad
scale.reverse();
// Midi messages:
// 128 = stop note, channel 1 (increase by 1 for each channel)
// 144 = play note, channel 1 (increase by 1 for each channel)
function donotesfor(launchpad, beat, message){
    _.each(outputs, function(value, key, list){
        var ticknotes = value.notes[beat];
        var accented = launchpad.getButton(beat, 8).getState() == launchpad.colors.green.medium;
        var velocity = accented ? 120 : 90;
        for (var i = ticknotes.length - 1; i >= 0; i--) {
            var note = scale[ticknotes[i]].midi();
            value.output.sendMessage([message, note, velocity]);
        };
    });
}

function drawGrid(launchpad, bank){
    // Wipe the area
    for(var y = 0; y < 8; y++) {
        for(var x = 0; x < 8; x++) {
            launchpad.getButton(x, y).dark();
        }
    };
    if(outputs[bank]){
        _.each(outputs[bank].notes, function(element, x) {
            _.each(element, function(y){
                launchpad.getButton(x, y).light(bank);
            });
        });
    }
}

function notesOff(){
    _.each(outputs, function(value, key, list){
        value.output.sendMessage([176, 120, 0])
    });
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators
function cycle(array){
    var nextIndex = 0;
    return {
       next: function(){
            if (nextIndex == array.length){
                nextIndex = 0
            }
            return  array[nextIndex++];
       }
    }
}

