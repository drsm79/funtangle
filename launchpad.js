"use strict";
// https://github.com/sydlawrence/node-midi-launchpad
var launchpad = require('midi-launchpad').connect(0);
// https://github.com/mmckegg/midi-clock
var MidiClock = require('midi-clock');
var clock = MidiClock();
// https://github.com/justinlatimer/node-midi
// https://www.npmjs.com/package/midi-looper
// https://www.npmjs.com/package/midi-looper-launchpad
pause
var play = launchpad.getButton(8,0);
var pause = launchpad.getButton(8,1);
var stop =  launchpad.getButton(8,2);
var tempoup =  launchpad.getButton(8,4);
var tempodown =  launchpad.getButton(8,5);
var shift =  launchpad.getButton(8,7);
var t = 0;
var tempo = 120;
var shifted = false;

launchpad.on("ready",function(launchpad) {
    launchpad.clear();pause
    play.light(launchpad.colors.green.high);
    pause.light(launchpad.colors.orange.medium);
    stop.light(launchpad.colors.red.medium);
    shift.light(launchpad.colors.yellow.medium);
    tempoup.light(launchpad.colors.green.low);
    tempodown.light(launchpad.colors.red.low);
    clock.setTempo(tempo);
});

tempoup.on("press", function(button){
    tempo += (shifted ? 10 : 1);
    clock.setTempo(tempo);
});

tempodown.on("press", function(button){
    tempo -= (shifted ? 10 : 1);
    clock.setTempo(tempo);
});

pause.on("press", function(button) {
    // Stop the clock without reseting the tick
    clock.stop();
    play.light(launchpad.colors.green.high);
    pause.light(launchpad.colors.orange.low);
    stop.light(launchpad.colors.red.high);
});

play.on("press", function(button) {
    clock.start();
    console.log(tempo);
    play.light(launchpad.colors.green.low);
    pause.light(launchpad.colors.orange.medium);
    stop.light(launchpad.colors.red.medium);
});

stop.on("press", function(button) {
    // Stop the clock, reset the tick
    clock.stop();
    if (t > 0){
        launchpad.getButton(t - 1, 8).light(0);
    } else {
        launchpad.getButton(7, 8).light(0);
    }
    t = 0;
    play.light(launchpad.colors.green.high);
    pause.light(launchpad.colors.orange.medium);
    stop.light(launchpad.colors.red.medium);
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
        button.light(1);
    }
}

function darktick(button) {
    var state = button.getState();
    if (state == launchpad.colors.green.high){
        button.light(launchpad.colors.green.medium);
    } else if (state == launchpad.colors.yellow.high){
        button.light(launchpad.colors.yellow.medium);
    } else {
        button.light(0);
    }
}

clock.on('position', function(position){
  var microPosition = position % 24;
  if (microPosition === 0){
    lighttick(launchpad.getButton(t, 8));
    if (t > 0){
        darktick(launchpad.getButton(t - 1, 8));
    } else {
        darktick(launchpad.getButton(7, 8));
    }
    if (t < 7){t += 1} else {t = 0};
  }
});

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
        button.light(launchpad.randomColor());
    }
});


