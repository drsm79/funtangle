"use strict";
// A pattern is a series of intervals with probabilities, a scale, and a
// function to play the notes of the scale with the probabilities assigned

var teoria = require('teoria');
var _ = require('underscore');

var Pattern = function(probability, scale){
  this.scale = scale || _.range(60, 67);
  this.midiMessages = {
    'note_on': 143,
    'note_off': 127
  }
  this.notes = [[], [], [], [], [], [], [], []];
  this.baseProbability = probability || 100;

  this.addnote = function(button, probability, accented){
    // Add a note to the pattern
    this.notes[button.x].push({
      button: button,
      midi: this.scale[button.y],
      probability: probability || this.baseProbability,
      accented: accented || false
    })
  };
  this.dropnote = function(button){
    this.notes[button.x] = _.filter(
      this.notes[button.x],
      function(note){return note.button != button;}
    );
  };
  this.velocity = function(note){
    return note.accented ? 120 : 90;
  };
  this.donotes = function(beat, message, output){
    var ticknotes = this.notes[beat];
    _.each(ticknotes, function(note){
      var play = true;
      var chance = _.random(0, 100);
      console.log(note.probability, chance);
      if (message == 'note_on' && chance > note.probability){
        play = false
      }
      if (play){
        var packet = [
          this.midiMessages[message] + output.midiChannel,
          note.midi,
          this.velocity(note)
        ];
        console.log(message, packet)
        output.midiOutput.sendMessage(packet);
      }
    }, this);
  };
};

var masterscale = teoria.note("g4").scale('dorian').notes();
masterscale.push(masterscale[0].interval('P8'));
// Keeping 'natural' numbering of keypads means reversing the masterscale so highest
// note is highest pad
masterscale.reverse();

var ScalePattern = function(probability, scale){
  _.extend(this, new Pattern(probability));
  this.scale = scale || masterscale;
  this.addnote = function(button, probability, accented){
    // Add a note to the pattern
    this.notes[button.x].push({
      button: button,
      midi: this.scale[button.y].midi(),
      probability: probability || this.baseProbability,
      accented: accented || false
    });
  }
};

exports.Pattern = Pattern;
exports.ScalePattern = ScalePattern;
