// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators
exports.cycle = function (array){
    var nextIndex = 0;
    return {
       next: function(){
            if (nextIndex == array.length){
                nextIndex = 0
            }
            return  array[nextIndex++];
       }
    }
}
