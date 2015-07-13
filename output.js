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
  this.listenTo(sequencer, 'tick', this.pattern.play);
  // From http://www.midi.org/techspecs/midimessages.php
  // 11111000 [248] Timing Clock. Sent 24 times per quarter note when synchronization is required (see text).
  this.listenTo(sequencer, 'position', function(){
    this.midiOutput.sendMessage([248, 0, 0]);
  });
  // 11111010 [250] Start. Start the current sequence playing. (This message will be followed with Timing Clocks).
  this.listenTo(sequencer, 'seq:play', function(){
    this.midiOutput.sendMessage([250, 0, 0]);
  });
  this.listenTo(sequencer, 'seq:pause', function(){
    this.midiOutput.sendMessage([252, 0, 0])
  });
  // // 11111011 [251] Continue. Continue at the point the sequence was Stopped.
  this.listenTo(sequencer, 'seq:continue', function(){
    this.midiOutput.sendMessage([251, 0, 0])
  });
  // // 11111100 [252] Stop. Stop the current sequence.
  this.listenTo(sequencer, 'seq:stop', function(){
    this.midiOutput.sendMessage([252, 0, 0]);
  });
  // TODO: listen to the sequencers clock and send [248, , ] to sync the clocks
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
