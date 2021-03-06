"use strict";
// A pattern is a series of intervals with probabilities, a scale, and a
// function to play the notes of the scale with the probabilities assigned

var teoria = require('teoria');
var _ = require('underscore');
var utils = require('./utils');

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

var Pattern = function(pattern){
  var defaults = {
    voices: 8,
    scale: _.range(60, 68),
    probability: 100,
    type: "Pattern",
    name: "Pattern"
  }
  this.repr = _.extend(defaults, pattern || {});
  this.stackMe = function(){
    if (this.repr.stack){
      // If a pattern has a stack of other pattern types extend it here, omitting
      // the stack to avoid recursive death.
      _.each(this.repr.stack, function(patternType){
        var stackee = _.omit(this.repr, "stack");
        // the type becomes a list
        var originalType = _.flatten([this.repr.type]);
        stackee.type = patternType;

        var x = _.extend(this, patternFactory(stackee));

        this.repr.type = originalType;
        this.repr.type.push(patternType);
      }, this);
    }
  };

  this.midiMessages = {
    'note_on': 143,
    'note_off': 127
  }
  this.notes = [[], [], [], [], [], [], [], []];

  this._makenote = function(button, color, probability, accented, name){
    return {
      button: button,
      midi: this.repr.scale[button.y],
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
  this.addnote = function(button, color, probability, accented, name){
    // Add a note to the pattern
    if (button.y < this.repr.scale.length){
      var note = this._makenote(
        button,
        color,
        probability * this.repr.probability,
        accented
      );
      if (this.notes[button.x].length == this.repr.voices){
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
    // gets called in the context of the output from the sequencer event
    if (!arg.muted){
      var output = this;
      // stop the previous note(s)
      if (arg.position > 0){
          pattern.sendmidi(arg.position - 1, 'note_off', output);
      } else {
          pattern.sendmidi(7, 'note_off', output);
      }
      // play the current note(s)
      pattern.sendmidi(arg.position, 'note_on', output);
    }
  }
  this.sendmidi = function(beat, message, output){
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
  // Now that everything is initialised, deal with the stacking
  this.stackMe();
};

function createscale(pattern){
  var key = pattern.key || "g4";
  var scale = teoria.note(key).scale(pattern.scale || "dorian").notes();
  // TODO: repeat this to make 8 note scales?
  scale.push(scale[0].interval('P8'));
  // Keeping 'natural' numbering of keypads means reversing the scale so
  // highest note is highest pad
  scale.reverse();
  return _.last(scale, 8);
}

var PingPongPattern = function(pattern){
  var defaults = {name: 'PingPongPattern', type: 'PingPongPattern'};
  _.extend(
    this,
    new Pattern(_.extend(defaults, pattern))
  );
  var pattern = this;
  var normalPlay = this.play;
  this.play = function(arg){
    var output = this;
    var p = _.bind(normalPlay, output);
    p(arg);
    if (arg.position == 7){
      pattern.notes.reverse();
      console.log('flipped');
      // TODO: fire a render event here - to be caught by the layout
    }
  }
};

var ScalePattern = function(pattern){
  var defaults = {name: 'ScalePattern', type: 'ScalePattern'};
  _.extend(
    this,
    new Pattern(_.extend(defaults, pattern))
  );
  this.repr.scale = createscale(this.repr);
  console.log(this.repr.scale.toString());
  this._makenote = function(button, color, probability, accented){
    // Add a note to the pattern
    return {
      button: button,
      midi: this.repr.scale[button.y].midi(),
      accented: accented || false,
      colour: color,
      probability: probability
    };
  };
};

var ChordPattern = function(pattern){
  var defaults = {name: 'ChordPattern', type: 'ChordPattern'};
  _.extend(
    this,
    new Pattern(_.extend(defaults, pattern))
  );
  this.repr.chords = this.repr.chords.reverse();
  this._makenote = function(button, color, probability, accented){
    // Add a chord to the pattern
    if (button.y <= this.repr.chords.length){
      var notes = [];
      if(this.repr.chords[button.y].chord){
        var chord = teoria.chord(
          this.repr.chords[button.y].chord,
          this.repr.chords[button.y].octave
        )
        notes = _.map(
          chord.notes(),
          function(note){return note.midi()}
        );
      } else if (this.repr.chords[button.y].notes){
        notes = _.map(
          this.repr.chords[button.y].notes,
          function(name){
            return teoria.note(name).midi()
          }
        );
      } else if (this.repr.chords[button.y].midi){
        notes = this.repr.chords[button.y].midi;
      }
      return {
        button: button,
        chord: chord,
        midi: notes,
        accented: accented || false,
        colour: color,
        probability: probability
      };
    }
  };
  var pattern = this;
  this.play = function(arg){
    // gets called in the context of the output from the sequencer event
    if (!arg.muted){
      var output = this;
      // stop the previous note(s)
      if (arg.position > 0){
          pattern.sendmidi(arg.position - 1, 'note_off', output);
      } else {
          pattern.sendmidi(7, 'note_off', output);
      }
      // play the current note(s)
      pattern.sendmidi(arg.position, 'note_on', output);
    }
  };
  this.sendmidi = function(beat, message, output){
    var ticknotes = this.notes[beat];
    _.each(ticknotes, function(note, idx, list){
      var play = _.has(this.midiMessages, message);
      var chance = _.random(0, 100);
      if (message == 'note_on' && chance > note.probability){
        play = false
      }
      if (play){
        _.each(note.midi, function(note){
          var packet = [
            this.midiMessages[message] + output.midiChannel,
            note,
            this.velocity(note)
          ];
          output.midiOutput.sendMessage(packet);
        }, this);
      }
    }, this);
  };
};

var VolcaDrumPattern = function(pattern){
  // Midi notes for the drums on the volca, missing out the toms
  // midi implemenation http://media.aadl.org/files/catalog_guides/1445131_chart.pdf
  // http://www.midi.org/techspecs/midimessages.php
  var defaults = {
    name: 'VolcaDrumPattern',
    type: 'VolcaDrumPattern',
    scale:[75, 67, 49, 39, 46, 42, 38, 36]
  }
  _.extend(
    this,
    new Pattern(_.extend(defaults, pattern))
  );
  var pattern = this;
  this.play = function(arg){
    if (!arg.muted){
      // gets called in the context of the output from the sequencer event
      var output = this;
      // don't need to stop previous notes on the volca, so only send note_on
      pattern.sendmidi(arg.position, 'note_on', output);
    }
  }
};

var VolcaSamplePattern = function(pattern){
  // The Sample plays the same sample, regardless of note. It uses midi channels
  // for different notes
  var defaults = {name: 'VolcaSamplePattern', type: 'VolcaSamplePattern'};
  _.extend(
    this,
    new Pattern(_.extend(defaults, pattern))
  );
  var pattern = this;
  this.play = function(arg){
    if (!arg.muted){
      // gets called in the context of the output from the sequencer event
      var output = this;
      // don't need to stop previous notes on the volca, so only send note_on
      pattern.sendmidi(arg.position, 'note_on', output);
    }
  }

  this.sendmidi = function(beat, message, output){
    var ticknotes = this.notes[beat];
    _.each(ticknotes, function(note){
      var play = _.has(this.midiMessages, message);
      var chance = _.random(0, 100);
      if (message == 'note_on' && chance > note.probability){
        play = false
      }
      if (play){
        var packet = [
          this.midiMessages[message] + output.midiChannel + (7 - note.button.y),
          note.midi,
          this.velocity(note)
        ];
        output.midiOutput.sendMessage(packet);
      }
    }, this);
  };
};

var TestPattern = function(pattern){
  var defaults = {name: 'TestPattern', type: 'TestPattern', foo: 'bar'};
  _.extend(
    this,
    new Pattern(_.extend(defaults, pattern || {}))
  );

  this._makenote = 'test pattern makes a note, and loves life';

  this.play = function(arg){
    return 'test pattern plays';
  };
};

var LockingPattern = function(pattern){
  var defaults = {name: 'LockingPattern', type: 'LockingPattern', foo: 'bar'};
  _.extend(
    this,
    new Pattern(_.extend(defaults, pattern || {}))
  );
  this.playing = -1;
  var pattern = this;

  this.play = function(arg){
    // gets called in the context of the output from the sequencer event
    if (!arg.muted){
      var output = this;
      if (pattern.notes[arg.position].length > 0 && pattern.playing >= 0){
        pattern.sendmidi(pattern.playing, 'note_off', output);
      }
      if (pattern.notes[arg.position].length > 0){
        pattern.playing = arg.position;
        // play the current note(s)
        pattern.sendmidi(arg.position, 'note_on', output);
      }
    }
  };
};

function patternFactory(pattern){
  if (_.isUndefined(pattern)){
    return new Pattern({});
  } else if (pattern.type == 'ScalePattern'){
    return new ScalePattern(pattern);
  } else if (pattern.type == 'ChordPattern'){
    return new ChordPattern(pattern);
  } else if (pattern.type == 'PingPongPattern'){
    return new PingPongPattern(pattern);
  } else if (pattern.type == 'LockingPattern'){
    return new LockingPattern(pattern);
  } else if (pattern.type == 'VolcaDrumPattern'){
    return new VolcaDrumPattern(pattern);
  } else if (pattern.type == 'VolcaSamplePattern'){
    return new VolcaSamplePattern(pattern);
  } else if (pattern.type == 'TestPattern'){
    return new TestPattern(pattern);
  } else {
    return new Pattern(pattern);
  };
};

exports.Pattern = Pattern;
exports.ScalePattern = ScalePattern;
exports.ChordPattern = ChordPattern;
exports.PingPongPattern = PingPongPattern;
exports.LockingPattern = LockingPattern;
exports.VolcaDrumPattern = VolcaDrumPattern;
exports.VolcaSamplePattern = VolcaSamplePattern;
exports.TestPattern = TestPattern;
exports.patternFactory = patternFactory;
