var Sequencer = require('../sequencer').Sequencer;
var Output = require('../output').Output;
var midi = require('midi');
var _ = require('underscore');


// One of these
var sequencer = new Sequencer();
// One per bank
var midioutput = new midi.output();
midioutput.openPort(0);
var bank1 = new Output(sequencer, midioutput);

sequencer.play();

_.delay(function() {
  bank1.pattern.addnote(0, 3, 95);
}, 200);

_.delay(function() {
  bank1.pattern.addnote(6, 2, 95);
}, 300);

_.delay(function(){sequencer.stop();}, 10000)
