"use strict";
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators

var _ = require('underscore');

exports.cycle = function (array){
  var nextIndex = 0;
  return {
   next: function(){
    if (nextIndex == array.length){
      nextIndex = 0;
    }
    return array[nextIndex++];
   }
  }
}

exports.notesOff = function (outputs){
  _.each(outputs, function(output){
    output.sendMessage([176, 120, 0])
  });
}

exports.transposePattern = function (adjustment, pattern){
  // Change the scale for the next call
  if (pattern.scale){
    pattern.scale = _.map(pattern.scale, function(n){
      return n.interval(adjustment)
    });
  }
  // Change all the notes in the pattern
  // TODO
}

