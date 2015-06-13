"use strict";
var _ = require('underscore');
var Backbone = require("backbone");

// A layout of buttons for the launchpad
var Layout = function(outputs){
  _.extend(this, Backbone.Events);
  this.buttons = {};
  this.outputs = outputs || {};
  this.init = function(launchpad, buttons, reset){
    this.buttons = buttons || this.buttons;
    this.launchpad = launchpad;
    this.blinkers = {};

    if (reset){this.launchpad.clear();}
    _.each(this.buttons, function(button, name){
      this.buttons[name].button = this.launchpad.getButton(
        button.position.x,
        button.position.y
      );
      this.buttons[name].button.light(button.color);
      _.each(button.callbacks, function(callback, event){
        this.layout.buttons[name].button.on(event, callback, this);
      }, {layout: this, name: name, button: this.buttons[name].button});
    }, this);
  };

  this.blinkers = {};
  this.blink = function(button, colors){
    this.blinkers[button.toString()] = colors;
    if (1 == _.keys(this.blinkers).length){
      this._blink();
    }
  };
  this.stopBlink = function(button, color){
    this.blinkers = _.omit(this.blinkers, button.toString());
    button.light(color);
  };
  this.stopAllBlink = function(){
    this.blinkers = [];
  };
  this._blink = function(){
    var duration = 250;
    _.each(this.blinkers, function(colors, button){
      var matches = button.match(/\d+/g);
      var button = this.launchpad.getButton(matches[0], matches[1]);
      _.each(colors, function(color, idx){
        _.delay(_.bind(function(){
          if (_.has(this.blinkers, button.toString())){
            button.light(color);
          }
        }, this), idx * duration, this);
      }, this);
    }, this);
    if (!_.isEmpty(this.blinkers)){
      _.delay(_.bind(this._blink, this), 1000);
    }
  };
  this.drawGrid = function(bank, pattern){
    // Wipe the area
    for(var y = 0; y < 8; y++) {
        for(var x = 0; x < 8; x++) {
            this.launchpad.getButton(x, y).dark();
        }
    };
    _.each(pattern.notes, function(ticknotes) {
      _.each(ticknotes, function(note){
        note.button.light(bank);
      });
    });
  };
  this.clearArea = function(x1, x2, y1, y2) {
    for(var y = y1; y < y2; y++) {
      for(var x = x1; x < x2; x++) {
        this.launchpad.getButton(x, y).dark();
      }
    }
  };
  this.applyToArea = function(fn, x1, x2, y1, y2) {
    // Call fn for all buttons in the area (x1, y1), (x2, y2)
    for(var y = y1; y < y2; y++) {
      for(var x = x1; x < x2; x++) {
        fn({layout: this, button: this.launchpad.getButton(x, y)});
      }
    }
  };
}

exports.Layout = Layout;
