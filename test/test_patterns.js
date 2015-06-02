var patterns = require('../pattern');
var _ = require('underscore');
var launchpad = require('midi-launchpad').connect(0, false);
var teoria = require('teoria');

var output = {
  midiOutput: {
    sendMessage: function (argument) {
      console.log(argument);
    }
  },
  midiChannel: 4
}

var p = new patterns.Pattern(false, false, [1,2,3,4,5,6,7,8]);

var button = launchpad.getButton(0,3);

p.addnote(button, 95);
p.donotes(0, 144, output);


var s = new patterns.ScalePattern(10, 0.5);
s.addnote(button, 95);
s.donotes(0, 144, output);
console.log(s.midiMessages);
console.log(s.baseProbability);

var scale = teoria.note("c4").scale('dorian').notes();
scale.push(scale[0].interval('P8'));
scale.reverse();

var s2 = new patterns.ScalePattern(10, 0.5, scale);
console.log('set scale', s2.scale == scale)
s2.addnote(button, 95);
s2.donotes(0, 144, output);
console.log(s2.midiMessages);
console.log(s2.baseProbability);
