var ui = require('./ui');

var patterns = require('./pattern');
var Sequencer = require('./sequencer').Sequencer;
var output = require('./output');
// var launchpad = require('./launchpad');
var getStepEntry = require('./stepentry').getStepEntry;

var _ = require('underscore');
var midi = require('midi');

var args = ui.parseArgs();

if (args._[0] != 'ports'){
  console.log('start funtangle');

  var outputs = _.pick(args, function (value, key){
    return (
      _.contains(['synth1', 'synth2', 'synth3', 'synth4'], key)
      && (_.has(value, 'midiPort') || _.isNumber(value))
    );
  });
  if (outputs.length == 0){
    console.log("No outputs - exiting");
    process.exit();
  }

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
      // red means skipped
      // orange means muted
      var skipOrMute = [
        button.launchpad.colors.red.high),
        button.launchpad.colors.orange.high
      ];
      if (_.contains(skipOrMute, button.getState()){
        console.log('step is muted or skipped');
      } else {
        if (_.isEqual(tick, button.x)){
          button.light(button.launchpad.colors.yellow.high);
        } else {
          button.dark();
        }
      }
    });
  }

  var i = 0;
  // iterate through outputs, creating a new Output and building up the synths obj
  _.each(outputs, function(midi, key, list){
    if (_.isObject(midi)){
      synths[colornames[i]] = output.outputFactory(
        midi,
        sequencer,
        patterns.patternFactory(midi.pattern)
      );
    } else {
      synths[colornames[i]] = new output.Output(
        sequencer,
        midi,
        1,
        new patterns.ScalePattern(100, args.key, args.scale));
    }
    console.log(synths[colornames[i]].name, 'is go!');
    i++;
  });

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
          color = button.launchpad.colors[colorobj[currentBank]].low;
        } else if (arg.layout.buttons.shift2.on) {
          probability = 0.75;
          color = button.launchpad.colors[colorobj[currentBank]].medium;
        }
        bank.pattern.addnote(button, color, probability);
      } else {
        bank.pattern.dropnote(button);
      }
    });
  }

  function render(){
    launchpad.clear();
    console.log('Drawing UI');

    var stepentry = getStepEntry(synths, launchpad, sequencer);
    allOff();
    stepentry.applyToArea(lightStep, 0, 8, 8, 9);
    stepentry.applyToArea(addNote, 0, 8, 0, 8);

    function logStep(arg){
      // {layout: this, button: this.launchpad.getButton(x, y)}
      arg.button.on('press', function(){
        console.log(arg.button);
        console.log(arg.layout.buttons.shift1.on);
        console.log(arg.layout.buttons.shift2.on);
        if (arg.layout.buttons.shift1.on){
          arg.button.light(arg.button.launchpad.colors.red.high);
        } else if (arg.layout.buttons.shift1.on){
          arg.button.light(arg.button.launchpad.colors.orange.high);
        } else{
          arg.button.dark();
        }
      });
    }
    stepentry.applyToArea(logStep, 0, 8, 8, 9);

    sequencer.listenTo(stepentry, 'play', function(evt){
      console.log('sequencer heard play');
      this.play();
    });
    sequencer.listenTo(stepentry, 'pause', function(evt){
      console.log('sequencer heard pause');
      allOff();
      this.pause();
    });
    sequencer.listenTo(stepentry, 'stop', function(evt){
      console.log('sequencer heard stop');
      allOff();
      this.stop();
    });
  }

  launchpad.scrollString('funtangle', 50, launchpad.colors.green.high, render);

  process.on('SIGINT', function() {
    launchpad.clear();
    launchpad.scrollString('bye!', 50, launchpad.colors.green.high, function(){
      launchpad.clear();
      process.exit();
    });
  });
}
