var testTempo = 140;
var Sequencer = require('../sequencer').Sequencer;
var _ = require('underscore');

var sequencer = new Sequencer(testTempo);

console.log(sequencer.tempo == testTempo)

sequencer.on('tick', function(tick, position) {
  console.log('tick:', tick, position);
  if (position > 192){
    sequencer.stop();
  }
});

sequencer.play();
