var midi = require('midi');

var midiOutput = new midi.output();
midiOutput.openPort(1);

var notes = [36, 38, 39, 42, 43, 46, 49, 50, 67, 75];

// 36 - kick
// 38 - snare
// 42 - closed hat
// 46 - open hat
// 39 - clap
// 49 - crash
// 67 - agogo
// 75 - claves
// 43 - lo tom
// 50 - hi tom

var i = 0;
function play(note){
  console.log(note);
  midiOutput.sendMessage([144, note, 90]);
  i++;
};
