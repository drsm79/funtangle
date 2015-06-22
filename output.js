"use strict";
var _ = require('underscore');
var Backbone = require("backbone");
var midi = require('midi');
var patterns = require('./pattern');

var Output = function(sequencer, midiPort, midiChannel, pattern, voices){
  this.midiOutput = new midi.output();
  this.midiPort = midiPort;
  this.midiOutput.openPort(this.midiPort, 'funtangle');
  this.name = this.midiOutput.getPortName(this.midiPort);
  this.midiChannel = midiChannel || 1;
  this.pattern = pattern;
  _.extend(this, Backbone.Events);
  this.listenTo(sequencer, 'tick', function(tick){
    // stop the previous note(s)
    if (tick > 0){
        this.pattern.donotes(tick - 1, 'note_off', this);
    } else {
        this.pattern.donotes(7, 'note_off', this);
    }
    // play the current note(s)
    this.pattern.donotes(tick, 'note_on', this);
  });
  this.toJSON = function(){
    return {
      "midiChannel": this.midiChannel,
      "midiPort": this.midiPort,
      "pattern": this.pattern
    };
  };
}

function outputFactory(obj, sequencer, pattern){
  var obj = obj || {midiChannel: 1, midiPort: 0};
  var pattern = pattern || new patterns.ScalePattern();
  var output = new Output(sequencer, obj.midiPort, obj.midiChannel || 1, pattern);
  // var output = {};
  return output;
}

exports.Output = Output;
exports.outputFactory = outputFactory;
