var yargs = require('yargs');
var _ = require('underscore');
var midi = require('midi');

// The UI has two commands:
// funtangle ports: list midi devices and their ports
// funtangle -l/--launchpad X [--s1 [--s2 [--s3 [--s4]]]]: launch funtanlge
//       connecting to launchpad and synths as specified

exports.parseArgs = function(){
  return yargs.usage('Usage: $0 <command> [options]')
    .command('ports', 'List the active midi ports and the things attached to them',
    function (yargs) {
      var masteroutput = new midi.output();
      var masterinput = new midi.input();

      var unevenMidi = (masteroutput.getPortCount() != masterinput.getPortCount());

      console.log('==> Midi outputs');
      _(masteroutput.getPortCount()).times(function(n){
          // controllers[masteroutput.getPortName(n)] = n;
          console.log(masteroutput.getPortName(n), ': ', n);
      });
      console.log('==> Midi inputs');
      _(masterinput.getPortCount()).times(function(n){
          // controllers[masteroutput.getPortName(n)] = n;
          console.log(masteroutput.getPortName(n), ': ', n);
      });
      if (unevenMidi){
        console.log('WARNING: uneven midi (more inputs than outputs or vice versa)')
      }
      masteroutput.closePort();
      masterinput.closePort();
    })
    .alias('l', 'launchpad')
    .nargs('l', 1)
    .default('l', 0)
    .config('j')
    .alias('j', 'json')
    .nargs('j', 1)
    .describe('j', 'Load config from a file')
    .alias('b', 'bpm')
    .default('b', 140)
    .nargs('b', 1)
    .alias('k', 'key')
    .default('k', 'D4')
    .nargs('k', 1)
    .alias('s', 'scale')
    .default('s', 'dorian')
    .describe('s', 'Available scales are: aeolian, blues, chromatic, dorian, doubleharmonic, harmonicminor, ionian, locrian, lydian, majorpentatonic, melodicminor, minorpentatonic, mixolydian, phrygian, harmonicchromatic, minor, major, flamenco')
    .nargs('s', 1)
    .describe('synth1', 'pick the midi output for synth1')
    .describe('synth2', 'pick the midi output for synth2')
    .describe('synth3', 'pick the midi output for synth3')
    .describe('synth4', 'pick the midi output for synth4')
  .help('h')
  .alias('h', 'help')
  // .strict()
  .showHelpOnFail()
  .argv;
}
