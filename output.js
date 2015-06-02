"use strict";
var _ = require('underscore');
var Backbone = require("backbone");
var midi = require('midi');
var patterns = require('./pattern');

var Output = function(sequencer, midiOutput, midiChannel, pattern){
  this.midiOutput = new midi.output();
  this.midiOutput.openPort(midiOutput, 'funtangle');
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
}

exports.Output = Output;
