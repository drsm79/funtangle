var patterns = require('./pattern');
var sequencer = require('./sequencer');
var launchpad = require('./launchpad');
var prompt = require('prompt');
var midi = require('midi');
var Launchpad = require('midi-launchpad').Launchpad;

var _ = require('underscore');

// The UI has two commands:
// funtangle list: list midi devices and their ports
// funtangle -l/--launchpad X [--s1 [--s2 [--s3 [--s4]]]]: luand funtanlge
//       connecting to launchpad and synths as specified

exports.Transport = Transport;

var unevenMidi = (masteroutput.getPortCount() != masterinput.getPortCount());


console.log('Pick your launchpad');
_(masteroutput.getPortCount()).times(function(n){
    controllers[masteroutput.getPortName(n)] = n;
    console.log('out', masteroutput.getPortName(n), ': ', n);
});

// Configure the launchpad and set up the banks
prompt.get(
  _.first([
    'launchpad',
    {name: 'synth1', required: false, default: -1, type: 'number'},
    {name: 'synth2', required: false, default: -1, type: 'number'},
    {name: 'synth3', required: false, default: -1, type: 'number'},
    {name: 'synth4', required: false, default: -1, type: 'number'}
  ], masteroutput.getPortCount()),
  function (err, result) {

});

