"use strict";
// A pattern is a series of intervals with probabilities, a scale, and a
// function to play the notes of the scale with the probabilities assigned

var teoria = require('teoria');
var _ = require('underscore');

var probabilities = {
  'low': 0.5,
  'medium': 0.75,
  'high': 1
}

var invertedcolors = {};
var colors = _.each(_.filter(_.map(require('midi-launchpad').colors, function(colour){
  if (_.isObject(colour)){
    return _.invert(colour);
  }
})), function(obj){_.extend(this, obj)}, invertedcolors);

var Pattern = function(probability, scale, voices){
  this.voices = voices || 8;

  this.scale = scale || _.range(60, 67);
  this.midiMessages = {
    'note_on': 143,
    'note_off': 127
  }
  this.notes = [[], [], [], [], [], [], [], []];
  this.baseProbability = probability || 100;
  this.repr = {"probability": this.baseProbability, "scale": scale, "voices": voices, "type": "Pattern"};

  this._makenote = function(button, color, probability, accented){
    return {
      button: button,
      midi: this.scale[button.y],
      accented: accented || false,
      colour: color,
      probability: probability
    };
  };
  this.toJSON = function(){
    var jsonMe = {notes: this.notes}
    _.extend(jsonMe, this.repr);
    return jsonMe;
  };
  this.addnote = function(button, color, probability, accented){
    // Add a note to the pattern
    if (button.y < this.scale.length){
      var note = this._makenote(
        button,
        color,
        probability * this.baseProbability,
        accented
      );
      if (this.notes[button.x].length == this.voices){
        // Patterns can only have as many notes as voices
        this.dropnote(this.notes[button.x].shift().button);
      }
      this.notes[button.x].push(note);
      button.light(note.colour);
    }
  };
  this.dropnote = function(button){
    this.notes[button.x] = _.filter(
      this.notes[button.x],
      function(note){return note.button != button;}
    );
    button.dark();
  };
  this.velocity = function(note){
    return note.accented ? 120 : 90;
  };
  var pattern = this;
  this.play = function(arg){
    if (!arg.muted){
      // gets called in the context of the output from the sequencer event
      var output = this;
      // stop the previous note(s)
      if (arg.position > 0){
          pattern.donotes(arg.position - 1, 'note_off', output);
      } else {
          pattern.donotes(7, 'note_off', output);
      }
      // play the current note(s)
      pattern.donotes(arg.position, 'note_on', output);
    }
  }
  this.donotes = function(beat, message, output){
    var ticknotes = this.notes[beat];
    _.each(ticknotes, function(note){
      var play = _.has(this.midiMessages, message);
      var chance = _.random(0, 100);
      if (message == 'note_on' && chance > note.probability){
        play = false
      }
      if (play){
        var packet = [
          this.midiMessages[message] + output.midiChannel,
          note.midi,
          this.velocity(note)
        ];
        output.midiOutput.sendMessage(packet);
      }
    }, this);
  };
};

function createscale(key, scale){
  var key = key || "g4";
  var scale = teoria.note(key).scale(scale || "dorian").notes();
  // TODO: repeat this to make 8 note scales?
  scale.push(scale[0].interval('P8'));
  // Keeping 'natural' numbering of keypads means reversing the scale so
  // highest note is highest pad
  scale.reverse();
  return scale;
}


var ScalePattern = function(probability, key, scale, voices){
  _.extend(this, new Pattern(probability, scale, voices));
  this.scale = createscale(key, scale);
  this.repr.key = key;
  this.repr.type = 'ScalePattern';
  this._makenote = function(button, color, probability, accented){
    // Add a note to the pattern
    return {
      button: button,
      midi: this.scale[button.y].midi(),
      accented: accented || false,
      colour: color,
      probability: probability
    };
  };
};

var VolcaDrumPattern = function(probability){
  // Midi notes for the drums on the volca, missing out the toms
  // midi implemenation http://media.aadl.org/files/catalog_guides/1445131_chart.pdf
  // http://www.midi.org/techspecs/midimessages.php
  _.extend(this, new Pattern(
    probability,
    [75, 67, 49, 39, 46, 42, 38, 36]
  ));
  this.repr.type = 'VolcaDrumPattern';
  var pattern = this;
  this.play = function(tick){
    // gets called in the context of the output from the sequencer event
    var output = this;
    // don't need to stop previous notes on the volca, so only send note_on
    pattern.donotes(tick, 'note_on', output);
  }
};

function patternFactory(pattern){
  if (_.isUndefined(pattern)){
    return new Pattern();
  } else if (pattern.type == 'ScalePattern'){
    return new ScalePattern(
      pattern.probability,
      pattern.key,
      pattern.scale,
      pattern.voices
    );
  } else if (pattern.type == 'VolcaDrumPattern'){
    return new VolcaDrumPattern(pattern.probability);
  } else {
    return new Pattern(pattern.probability, pattern.scale, pattern.voices);
  };
};

exports.Pattern = Pattern;
exports.ScalePattern = ScalePattern;
exports.VolcaDrumPattern = VolcaDrumPattern;
exports.patternFactory = patternFactory;
