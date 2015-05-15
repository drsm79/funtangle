"use strict";
// https://github.com/justinlatimer/node-midi
var _ = require('underscore');
var midi = require('midi');
var output = new midi.output();

var controllers = {};
console.log('Pick your launchpad');
_(output.getPortCount()).times(function(n){
    controllers[output.getPortName(n)] = n;
    console.log(output.getPortName(n), ': ', n);
});

var prompt = require('prompt');

prompt.get(
    _.first([
        'launchpad',
        {name: 'synth1', required: false},
        {name: 'synth2', required: false},
        {name: 'synth3', required: false},
        {name: 'synth4', required: false},
        {name: 'synth5', required: false}
    ], output.getPortCount()),
function (err, result) {
    // https://github.com/sydlawrence/node-midi-launchpad
    var launchpad = require('midi-launchpad').connect(parseInt(result.launchpad));

    var play = launchpad.getButton(8,0);
    var stop = launchpad.getButton(8,1);
    var tempoup = launchpad.getButton(8,4);
    var tempodown = launchpad.getButton(8,5);
    var shift = launchpad.getButton(8,7);
    var bank = launchpad.getButton(8,3);
    var ticks = cycle(_.range(8));
    var t = 0;

    function initcontrols() {
        launchpad.clear();
        play.light(launchpad.colors.green.high);
        stop.light(launchpad.colors.red.medium);
        shift.light(launchpad.colors.yellow.medium);
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
        play.light(launchpad.colors.green.high);
        stop.light(launchpad.colors.red.medium);
    });

    var bankcolours = cycle([
        launchpad.colors.green.high,
        launchpad.colors.yellow.high,
        launchpad.colors.orange.high,
        launchpad.colors.red.high,
        0]);

    bank.on("press", function(button){
        if (shifted){
            initcontrols();
        } else {
            bank.light(bankcolours.next());
        }
    });

    tempoup.on("press", function(button){
        tempo += (shifted ? 10 : 1);
        clock.setTempo(tempo);
    });

    tempodown.on("press", function(button){
        tempo -= (shifted ? 10 : 1);
        clock.setTempo(tempo);
    });

    shift.on("press", function(button) {
        shifted = true;
    });

    shift.on("release", function(button) {
        shifted = false;
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
            button.light(0);
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

    launchpad.on("press", function(button) {
        if (button.y == 8){
            if (!shifted){
                accent(button);
            } else {
                glide(button);
            }
        } else if (button.x != 8) {
            button.light(bank.getState());
        }
    });

    output.openPort(parseInt(result.synth1), "funtangle");

    clock.on('position', function(position){
      var microPosition = position % 24;
      if (microPosition === 0){
        t = ticks.next();
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
var shifted = false;

var notes = [];

var scale = teoria.note("g4").scale('dorian').notes();
scale.push(scale[0].interval('P8'))

function playnotesfor(beat){
    ticknotes = notes[beat];
    for (var i = ticknotes.length - 1; i >= 0; i--) {
        output.sendMessage([144, scale.get(ticknotes[i]).midi(), 90]);
        output.sendMessage([128, scale.get(ticknotes[i]).midi(), 90]);
    };
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

