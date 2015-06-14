"use strict";
var MidiClock = require('midi-clock');
var _ = require('underscore');
var Backbone = require("backbone");
var cycle = require('./utils').cycle;

var Sequencer = function(bpm){
  _.extend(this, Backbone.Events);
  this.ticks = cycle(_.range(8));
  this.tempo = bpm || 94;
  this.clock = MidiClock();
  this.clock.setTempo(this.tempo);

  var that = this;
  this.clock.on('position', function(position){
    var microPosition = position % 24;
    if (microPosition === 0){
      that.trigger('tick', that.ticks.next(), position);
    }
  });
  this.changeTempo = function(bpm){
    this.tempo = bpm;
    this.clock.setTempo(this.tempo);
  };
  this.play = function(){
    this.clock.start();
    this.trigger('seq:play');
  };
  this.pause = function(){
    this.clock.stop();
    this.trigger('seq:pause');
  };
  this.stop = function(){
    this.clock.stop();
    this.ticks = cycle(_.range(8));
    this.trigger('seq:stop');
  };
}

exports.Sequencer = Sequencer;
