var ui = require('./ui');

var patterns = require('./pattern');
var Sequencer = require('./sequencer').Sequencer;
var Output = require('./output').Output;
// var launchpad = require('./launchpad');
var getStepEntry = require('./stepentry').getStepEntry;

var _ = require('underscore');
var midi = require('midi');

var args = ui.parseArgs();

if (args._[0] != 'ports'){
  console.log('start funtangle');
  var outputs = _.pick(args, function (value, key){
    return (_.contains(['synth1', 'synth2', 'synth3', 'synth4'], key) && _.isNumber(value))
  });

  var colornames = ['green', 'orange', 'yellow', 'red'];

  var launchpad = require('midi-launchpad').connect(args.launchpad, false);
  var sequencer = new Sequencer(args.bpm);
  var synths = {};

  function allOff(){
    console.log('ssshhhh!');
    _.each(synths, function (value) {
      value.midiOutput.sendMessage([176, 120, 0]);
    });
  }

  function lightStep(arg){
    var button = arg.button;
    button.listenTo(sequencer, 'tick', function(tick, microtick){
      if (_.isEqual(tick, button.x)){
        button.light(button.launchpad.colors.yellow.high);
      } else {
        button.dark();
      }
    });
  }

  var i = 0;
  // iterate through outputs, creating a new Output and building up the synths obj
  _.each(outputs, function(value, key, list){
    console.log(key);
    synths[colornames[i]] = new Output(sequencer, value, 1, new patterns.ScalePattern());
    console.log(synths[colornames[i]].midiOutput.getPortName(value));
    i++;
  });
  console.log(outputs);

  var colorobj = _.object(
    _.map(_.keys(synths), function(c){return [launchpad.colors[c].high, c]})
  );

  function addNote(arg){
    var button = arg.button;
    button.on('press', function(){
      var currentBank = arg.layout.buttons.bank.button.getState();
      var bank = synths[colorobj[currentBank]];
      var color = currentBank;

      if (_.isEqual(0, button.getState())){
        var probability = 1
        if (arg.layout.buttons.shift1.on) {
          probability = 0.5;
          color = button.launchpad.colors[colors[currentBank]].low;
        } else if (arg.layout.buttons.shift2.on) {
          probability = 0.75;
          color = button.launchpad.colors[colors[currentBank]].medium;
        }
        bank.pattern.addnote(button, color, probability);
      } else {
        bank.pattern.dropnote(button);
      }
    });
  }

  var stepentry = getStepEntry(synths, launchpad, sequencer);
  allOff()
  stepentry.applyToArea(lightStep, 0, 8, 8, 9);
  stepentry.applyToArea(addNote, 0, 8, 0, 8);

  sequencer.listenTo(stepentry, 'play', function(evt){
    console.log('sequencer heard play');
    this.play()
  });
  sequencer.listenTo(stepentry, 'pause', function(evt){
    console.log('sequencer heard pause');
    allOff();
    this.pause()
  });
  sequencer.listenTo(stepentry, 'stop', function(evt){
    console.log('sequencer heard stop');
    allOff();
    this.stop()
  });


}
