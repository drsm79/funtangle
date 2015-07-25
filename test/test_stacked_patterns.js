var _ = require('underscore');
var patterns = require('../pattern');
var Pattern = patterns.Pattern;
var TestPattern = patterns.TestPattern;

var TestStackedPattern = function(pattern){
  var defaults = {
    name: 'TestStackedPattern',
    type: 'TestStackedPattern',
    stack: ['TestPattern']
  };

  _.extend(
    this,
    new Pattern(_.extend(defaults, pattern || {}))
  );

  this.play = function(arg){
    return 'stacked test pattern plays';
  };
};

t1 = new TestPattern();

t2 = new TestStackedPattern();
console.log(t2.play() == 'stacked test pattern plays');
console.log(t2._makenote == t1._makenote);
console.log(t2.repr.type);
