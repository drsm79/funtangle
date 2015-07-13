var _ = require('underscore');
var utils = require('./utils');
var Layout = require('./layout').Layout;
var allOff = utils.allOff;
var lightStep = utils.lightStep;
var addNote = utils.addNote;

exports.getStepEntry = function(outputs, launchpad, sequencer){
  var banks = utils.cycle(_.keys(outputs));

  var buttons = {
    'playpause': {
      'position': {x: 8, y: 0},
      'color': launchpad.colors.green.high,
      'callbacks': {},
    },
    'stop': {
      'position': {x: 8, y: 1},
      'color': launchpad.colors.red.medium,
      'callbacks': {}
    },
    'up': {
      'position': {x: 8, y: 3},
      'color': launchpad.colors.yellow.high,
      'callbacks': {}
    },
    'down': {
      'position': {x: 8, y: 4},
      'color': launchpad.colors.orange.high,
      'callbacks': {}
    },
    'bank': {
      'position': {x: 8, y: 5},
      'color': launchpad.colors[banks.next()].high,
      'callbacks': {},
    },
    'shift1': {
      'position': {x: 8, y: 6},
      'color': launchpad.colors.orange.medium,
      'callbacks': {},
      'on': false
    },
    'shift2': {
      'position': {x: 8, y: 7},
      'color': launchpad.colors.orange.medium,
      'callbacks': {},
      'on': false
    }
  }

  buttons.playpause.callbacks.press = function() {
    var colors = this.layout.launchpad.colors;
    var pausestate = [colors.green.high, 0]; // flash green when paused
    var paused = _.has(this.layout.blinkers, this.button.toString());
    if (paused){
      this.layout.stopBlink(this.button, colors.orange.high);
      this.layout.trigger('continue');
    } else if (_.isEqual(this.button.getState(), colors.green.high)){
      this.layout.stopBlink(this.button, colors.orange.high);
      this.layout.trigger('play');
    } else {
      // Stop the clock without resetting the tick
      this.layout.stopBlink(this.button, colors.green.high);
      this.layout.blink(this.button, pausestate);
      this.layout.trigger('pause');
    }
  }

  buttons.stop.callbacks.press = function (){
    this.layout.trigger('stop');
    this.layout.stopBlink(
      this.layout.buttons.playpause.button,
      this.layout.launchpad.colors.green.high
    );
  };

  buttons.up.callbacks.press = function(){
    if (this.layout.buttons.shift1.on && this.layout.buttons.shift2.on){
      console.log('shifted (1 + 2) up');
    } else if (this.layout.buttons.shift1.on){
      console.log('shifted (1) up');
    } else if (this.layout.buttons.shift2.on){
      console.log('shifted (2) up');
    } else {
      console.log('normal up');
    }
  };

  buttons.down.callbacks.press = function(){
    if (this.layout.buttons.shift1.on && this.layout.buttons.shift2.on){
      console.log('shifted (1 + 2) down');
    } else if (this.layout.buttons.shift1.on){
      console.log('shifted (1) down');
    } else if (this.layout.buttons.shift2.on){
      console.log('shifted (2) down');
    } else {
      console.log('normal down');
    }
  };

  buttons.bank.callbacks.press = function(){
    var bank = banks.next();
    console.log(bank, ":", this.layout.outputs[bank].pattern.repr.type);

    this.layout.drawGrid(launchpad.colors[bank].high, this.layout.outputs[bank].pattern);
    this.button.light(launchpad.colors[bank].high);
  };

  buttons.shift1.callbacks.press = function(){
    this.layout.buttons.shift1.on = true;
    this.layout.trigger('shift1:on');
  };

  buttons.shift1.callbacks.release = function(){
    this.layout.buttons.shift1.on = false;
    this.layout.trigger('shift1:off');
  };

  buttons.shift2.callbacks.press = function(){
    this.layout.buttons.shift2.on = true;
    this.layout.trigger('shift2:on');
  };

  buttons.shift2.callbacks.release = function(){
    this.layout.buttons.shift2.on = false;
    this.layout.trigger('shift2:off');
  };

  var stepentry = new Layout(outputs);
  stepentry.init(launchpad, buttons, true);

  return stepentry;
};
