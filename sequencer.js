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
  this.muted = [];
  this.skipped = [];

  var that = this;
  this.clock.on('position', function(position){
    that.trigger('position', {'position': position});
    var microPosition = position % 24;
    if (microPosition === 0){
      var tick = that.ticks.next();
      while (_.contains(that.skipped, tick)){
        tick = that.ticks.next();
      }
      that.trigger('tick', {
        'muted': _.contains(that.muted, tick),
        'position': tick,
        'microtick': microPosition
      });
    }
  });
  this.mute = function(step){
    this.muted.push(step);
  };
  this.skip = function(step){
    this.skipped.push(step);
  };
  this.restore = function(step){
    this.muted = _.without(this.muted, step);
    this.skipped = _.without(this.skipped, step);
  };
  this.changeTempo = function(bpm){
    this.tempo = bpm;
    this.clock.setTempo(this.tempo);
  };
  this.play = function(){
    this.clock.start();
    this.trigger('seq:play');
  };
  this.continue = function(){
    this.clock.start();
    this.trigger('seq:continue');
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
