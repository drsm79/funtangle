var _ = require('underscore');
var launchpad = require('midi-launchpad').connect(1, false);

var cycle = require('../utils').cycle;
var patterns = require('../pattern');
var Layout = require('../layout').Layout;
var Output = require('../output').Output;
var Sequencer = require('../sequencer').Sequencer;

var testTempo = 140;

var sequencer = new Sequencer(testTempo);

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
    'color': launchpad.colors.green.high,
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

var layout = new Layout();

function allOff(){
  _.each(synths, function (value) {
    value.midiOutput.sendMessage([176, 120, 0]);
  });
}
buttons.playpause.callbacks.press = function() {
  var colors = this.layout.launchpad.colors;
  var pausestate = [colors.green.high, 0]; // flash green when paused
  var paused = _.has(layout.blinkers, this.button.toString());
  if (_.isEqual(this.button.getState(), colors.green.high) || paused){
    console.log('play');
    this.layout.stopBlink(this.button, colors.orange.high);
    this.layout.trigger('play');
  } else {
    console.log('pause');
    // Stop the clock without reseting the tick
    this.layout.stopBlink(this.button, colors.green.high);
    this.layout.blink(this.button, pausestate);
    this.layout.trigger('pause');
    allOff();
  }
}

buttons.stop.callbacks.press = function (){
  console.log('stop');
  this.layout.trigger('stop');
  layout.stopBlink(
    this.layout.buttons.playpause.button,
    this.layout.launchpad.colors.green.high
  );
  allOff();
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
var synths = {
  'green': new Output(sequencer, 0, 1, new patterns.ScalePattern()),
  'orange': new Output(sequencer, 0, 1, new patterns.ScalePattern()),
  'yellow': new Output(sequencer, 0, 1, new patterns.ScalePattern()),
  'red': new Output(sequencer, 0, 1, new patterns.ScalePattern())
}
// TODO: determine this from the CLI/UI
var banks = cycle(_.first(_.keys(synths)));

var colors = _.object(
  _.map(_.keys(synths), function(c){return [launchpad.colors[c].high, c]})
);

buttons.bank.callbacks.press = function(){
  this.button.light(launchpad.colors[banks.next()].high);
}

buttons.shift1.callbacks.press = function(){
  this.layout.buttons.shift1.on = true;
  this.layout.trigger('shift1:on');
}

buttons.shift1.callbacks.release = function(){
  this.layout.buttons.shift1.on = false;
  this.layout.trigger('shift1:off');
}

buttons.shift2.callbacks.press = function(){
  this.layout.buttons.shift2.on = true;
  this.layout.trigger('shift2:on');
}

buttons.shift2.callbacks.release = function(){
  this.layout.buttons.shift2.on = false;
  this.layout.trigger('shift2:off');
}

layout.init(launchpad, buttons, true);
allOff();

function lightStep(arg){
  var button = arg.button;
  button.listenTo(sequencer, 'tick', function(tick, microtick){
    if (_.isEqual(tick, button.x)){
      button.light(button.launchpad.colors.yellow.high);
    } else {
      button.dark();
    }
  });
}

function addNote(arg){
  var button = arg.button;
  button.on('press', function(){
    var currentBank = arg.layout.buttons.bank.button.getState();
    var bank = synths[colors[currentBank]];
    if (_.isEqual(0, button.getState())){
      if (arg.layout.buttons.shift1.on) {
        bank.pattern.addnote(this, 0.5  * bank.pattern.baseProbability);
        this.light(launchpad.colors[colors[currentBank]].low);
      } else if (arg.layout.buttons.shift2.on) {
        bank.pattern.addnote(this, 0.75  * bank.pattern.baseProbability);
        this.light(launchpad.colors[colors[currentBank]].medium);
      } else {
        bank.pattern.addnote(this);
        this.light(launchpad.colors[colors[currentBank]].high);
      }
    } else {
      bank.pattern.dropnote(this);
      button.dark();
    }
  });
}

layout.applyToArea(lightStep, 0, 8, 8, 9);
layout.applyToArea(addNote, 0, 8, 0, 8);

sequencer.listenTo(layout, 'play', function(evt){
  console.log('sequencer heard play');
  this.play()
});
sequencer.listenTo(layout, 'pause', function(evt){
  console.log('sequencer heard pause');
  this.pause()
});
sequencer.listenTo(layout, 'stop', function(evt){
  console.log('sequencer heard stop');
  this.stop()
});

